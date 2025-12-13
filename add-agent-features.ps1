# PowerShell script to add info buttons and TTS to remaining AI agents
# This script adds showInfo state, speechSynthesis hook, info buttons, and info modals

$filePath = "c:\Users\jari5\whip-montez-live\frontend\src\App.jsx"
$content = Get-Content $filePath -Raw

Write-Host "Adding features to remaining AI agents..." -ForegroundColor Cyan

# The changes will be done via the AI agent tools
# This script just documents the remaining work needed

Write-Host @"
Remaining agents to update:
1. CrateDigger (line ~3358)
2. ARSuite (line ~3447)
3. AlbumArtGenerator (line ~3553)
4. TrendHunter (line ~3740) - ALREADY HAS MIC
5. ViralVideoAgent (line ~3728)

For each agent, add:
- const [showInfo, setShowInfo] = useState(false);
- const { speak, stop, isSpeaking, isSupported: speechSupported } = useSpeechSynthesis();
- Info button in header (next to X button)
- Speak button in output areas
- Info modal with capabilities/features/tips
"@ -ForegroundColor Yellow

Write-Host "`nUse AI tools to complete these updates." -ForegroundColor Green
