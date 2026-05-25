param(
  [ValidateSet("prod","local")]
  [string]$Env = "prod",
  [string]$IdToken = ""
)

$BASE = if ($Env -eq "local") { "http://localhost:3001" } else { "https://web-production-b5922.up.railway.app" }
$HEADERS = @{ "Content-Type" = "application/json" }
if ($IdToken) { $HEADERS["Authorization"] = "Bearer $IdToken" }

$global:pass = 0
$global:fail = 0
$global:warn = 0

function Show-Result($label, $ok, $detail = "", $isWarn = $false) {
  if ($ok) {
    Write-Host "  [PASS] $label" -ForegroundColor Green
    if ($detail) { Write-Host "         $detail" -ForegroundColor DarkGray }
    $global:pass++
  } elseif ($isWarn) {
    Write-Host "  [WARN] $label" -ForegroundColor Yellow
    if ($detail) { Write-Host "         $detail" -ForegroundColor DarkYellow }
    $global:warn++
  } else {
    Write-Host "  [FAIL] $label" -ForegroundColor Red
    if ($detail) { Write-Host "         $detail" -ForegroundColor DarkRed }
    $global:fail++
  }
}

function Invoke-Safe($uri, $method = "GET", $body = $null, $timeoutSec = 20) {
  try {
    $params = @{ Uri = $uri; Method = $method; TimeoutSec = $timeoutSec; Headers = $HEADERS; ErrorAction = "Stop" }
    if ($body) { $params["Body"] = ($body | ConvertTo-Json -Depth 5); $params["ContentType"] = "application/json" }
    $resp = Invoke-WebRequest @params
    return @{ ok = $true; status = [int]$resp.StatusCode; body = ($resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue) }
  } catch {
    $code = 0
    try { $code = [int]$_.Exception.Response.StatusCode } catch {}
    return @{ ok = $false; status = $code; error = $_.Exception.Message }
  }
}

Write-Host ""
Write-Host "  Studio Agents - Pre-Demo Check ($Env)" -ForegroundColor Cyan
Write-Host "  Target: $BASE" -ForegroundColor DarkGray
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host ""

Write-Host "[ Backend ]" -ForegroundColor White
$r = Invoke-Safe "$BASE/api/health"
$detail = if ($r.ok) { "firebase=$($r.body.services.firebase)  gemini=$($r.body.services.gemini)" } else { $r.error }
Show-Result "Health endpoint" $r.ok $detail

Write-Host ""
Write-Host "[ AI Endpoints ]" -ForegroundColor White

$r = Invoke-Safe "$BASE/api/generate" "POST" @{ prompt = "Write one rap line."; agentId = "lyrics" }
$ok = $r.ok -or $r.status -eq 401 -or $r.status -eq 403
$detail = if ($r.status -eq 401 -or $r.status -eq 403) { "Auth required (expected) - Gemini endpoint reachable" }
          elseif ($r.ok -and $r.body.text) { "OK - $($r.body.text.Substring(0,[Math]::Min(60,$r.body.text.Length)))..." }
          else { "HTTP $($r.status) - $($r.error)" }
Show-Result "Text / Lyrics (Gemini)" $ok $detail

$r = Invoke-Safe "$BASE/api/generate-image" "POST" @{ prompt = "Abstract album art purple neon"; agentId = "visual" }
$ok = $r.ok -or $r.status -eq 401 -or $r.status -eq 403
$detail = if ($r.status -eq 401 -or $r.status -eq 403) { "Auth required (expected) - Image endpoint reachable" }
          elseif ($r.ok -and $r.body.imageUrl) { "Image URL received" }
          else { "HTTP $($r.status) - $($r.error)" }
Show-Result "Image generation (Flux/Replicate)" $ok $detail

$r = Invoke-Safe "$BASE/api/generate-audio" "POST" @{ prompt = "hip hop trap beat 90 bpm"; duration = 15 }
$ok = $r.ok -or $r.status -eq 401 -or $r.status -eq 403
$detail = if ($r.status -eq 401 -or $r.status -eq 403) { "Auth required (expected) - Beat endpoint reachable" }
          elseif ($r.ok) { "Beat endpoint responded" }
          else { "HTTP $($r.status) - $($r.error)" }
Show-Result "Beat / Audio generation" $ok $detail

$r = Invoke-Safe "$BASE/api/generate-speech" "POST" @{ text = "Hello world"; voice = "rachel" }
$ok = $r.ok -or $r.status -eq 401 -or $r.status -eq 403
$detail = if ($r.status -eq 401 -or $r.status -eq 403) { "Auth required (expected) - Vocal endpoint reachable" }
          elseif ($r.ok) { "Vocal endpoint responded" }
          else { "HTTP $($r.status) - $($r.error)" }
Show-Result "Vocals / Speech (ElevenLabs)" $ok $detail

$r = Invoke-Safe "$BASE/api/generate-video" "POST" @{ prompt = "music video abstract visuals" } 10
$ok = $r.ok -or $r.status -eq 401 -or $r.status -eq 403
$detail = if ($r.status -eq 401 -or $r.status -eq 403) { "Auth required (expected) - Video endpoint reachable" }
          elseif ($r.ok) { "Video endpoint responded" }
          else { "HTTP $($r.status)" }
Show-Result "Video generation" $ok $detail

Write-Host ""
Write-Host "[ Firebase ]" -ForegroundColor White
$r = Invoke-Safe "$BASE/api/health"
$fbOk = $r.ok -and $r.body.services.firebase -eq "connected"
Show-Result "Firebase Admin connected" $fbOk ($r.body.services.firebase)

$r = Invoke-Safe "$BASE/api/credits" 5
$detail = if ($r.status -eq 401) { "Returns 401 without token - auth middleware working" }
          elseif ($r.ok) { "Open endpoint" }
          else { "HTTP $($r.status)" }
Show-Result "Auth middleware" ($r.status -eq 401 -or $r.ok) $detail

Write-Host ""
Write-Host "[ Frontend (Vercel) ]" -ForegroundColor White
$fr = Invoke-Safe "https://studio-agents.vercel.app" "GET" $null 15
Show-Result "Vercel deployment live" $fr.ok "HTTP $($fr.status)"

$fr2 = Invoke-Safe "https://studio-agents-cn8o.vercel.app" "GET" $null 10
$cn8oOk = $fr2.ok -or $fr2.status -eq 301 -or $fr2.status -eq 302
Show-Result "Vercel (cn8o) live" $cn8oOk "HTTP $($fr2.status)" (-not $fr2.ok)

Write-Host ""
Write-Host "[ .env Key Check ]" -ForegroundColor White
$envFile = Join-Path $PSScriptRoot "..\backend\.env"
if (Test-Path $envFile) {
  $envContent = Get-Content $envFile -Raw
  $keys = [ordered]@{
    "GEMINI_API_KEY"                  = "Gemini (text/lyrics)"
    "REPLICATE_API_KEY"               = "Replicate (beats/images/video)"
    "ELEVENLABS_API_KEY"              = "ElevenLabs (vocals)"
    "FIREBASE_SERVICE_ACCOUNT_BASE64" = "Firebase Admin"
    "STRIPE_SECRET_KEY"               = "Stripe (payments)"
    "FAL_KEY"                         = "Fal.ai (image fallback)"
    "STABILITY_API_KEY"               = "Stability AI"
    "EMAIL_PASS"                      = "Email (notifications)"
  }
  $placeholders = @("your_","YOUR_","placeholder","REPLACE","HERE","xxx")
  foreach ($key in $keys.Keys) {
    if ($envContent -match "(?m)^$key=(.+)$") {
      $val = $matches[1].Trim()
      $isPlaceholder = ($placeholders | Where-Object { $val -like "*$_*" }).Count -gt 0
      if ($isPlaceholder) {
        Show-Result "$($keys[$key])" $false "Placeholder value - update before demo" $true
      } elseif ($val -eq "") {
        Show-Result "$($keys[$key])" $false "Empty value" $true
      } else {
        Show-Result "$($keys[$key])" $true "$($val.Substring(0,[Math]::Min(8,$val.Length)))..."
      }
    } else {
      Show-Result "$($keys[$key])" $false "Not found in .env" $true
    }
  }
} else {
  Show-Result "backend/.env found" $false "File not at $envFile"
}

Write-Host ""
Write-Host "----------------------------------------------" -ForegroundColor DarkGray
$total = $global:pass + $global:fail + $global:warn
$color = if ($global:fail -gt 0) { "Red" } elseif ($global:warn -gt 0) { "Yellow" } else { "Green" }
Write-Host "  $($global:pass) passed  |  $($global:warn) warnings  |  $($global:fail) failed  (of $total)" -ForegroundColor $color
if ($global:fail -gt 0) {
  Write-Host "  Fix failures before the demo!" -ForegroundColor Red
} elseif ($global:warn -gt 0) {
  Write-Host "  Warnings are non-critical but worth reviewing." -ForegroundColor Yellow
} else {
  Write-Host "  All clear - go ship it!" -ForegroundColor Green
}
Write-Host ""
Write-Host "  REMINDER: Check Railway Dashboard > Variables tab for:" -ForegroundColor DarkYellow
Write-Host "  GEMINI_API_KEY, REPLICATE_API_KEY, ELEVENLABS_API_KEY, FIREBASE_SERVICE_ACCOUNT_BASE64, FAL_KEY" -ForegroundColor DarkYellow
Write-Host ""