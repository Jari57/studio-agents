# 🚀 Studio Agents - Development Deployment Script
# Starts both backend and frontend in development mode

Write-Host "Starting Studio Agents Development Environment" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""

# Check if backend directory exists
if (-Not (Test-Path "backend")) {
    Write-Host "Error: backend directory not found" -ForegroundColor Red
    exit 1
}

# Check if frontend directory exists
if (-Not (Test-Path "frontend")) {
    Write-Host "Error: frontend directory not found" -ForegroundColor Red
    exit 1
}

# Start backend in background
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    $env:NODE_ENV = "development"
    npm run dev
}
Write-Host "   Backend starting (Job ID: $($backendJob.Id))" -ForegroundColor Green
Start-Sleep -Seconds 3

# Start frontend in background
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    npm run dev
}
Write-Host "   Frontend starting (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Start-Sleep -Seconds 2

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Development Environment Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:     http://localhost:3001" -ForegroundColor White
Write-Host "   Dashboard:   http://localhost:3001/dashboard" -ForegroundColor White
Write-Host "   Health:      http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "Monitor Logs:" -ForegroundColor Yellow
Write-Host "   Backend:  Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor Gray
Write-Host "   Frontend: Receive-Job -Id $($frontendJob.Id) -Keep" -ForegroundColor Gray
Write-Host ""
Write-Host "To Stop:" -ForegroundColor Yellow
Write-Host "   Stop-Job -Id $($backendJob.Id),$($frontendJob.Id); Remove-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host ""
Write-Host "Waiting for servers to initialize... (10 seconds)" -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Show initial logs
Write-Host ""
Write-Host "Backend Output:" -ForegroundColor Yellow
Receive-Job -Id $backendJob.Id -Keep | Select-Object -Last 5

Write-Host ""
Write-Host "Frontend Output:" -ForegroundColor Yellow
Receive-Job -Id $frontendJob.Id -Keep | Select-Object -Last 5

Write-Host ""
Write-Host "Development environment is running!" -ForegroundColor Green
Write-Host "   Press Ctrl+C to keep jobs running in background" -ForegroundColor Gray
Write-Host "   Or wait here to monitor output..." -ForegroundColor Gray
Write-Host ""

# Keep script running and show live logs
try {
    while ($true) {
        Start-Sleep -Seconds 5
        $backendOutput = Receive-Job -Id $backendJob.Id -Keep
        $frontendOutput = Receive-Job -Id $frontendJob.Id -Keep
        
        if ($backendOutput) {
            Write-Host "[BACKEND] $($backendOutput | Select-Object -Last 1)" -ForegroundColor Cyan
        }
        if ($frontendOutput) {
            Write-Host "[FRONTEND] $($frontendOutput | Select-Object -Last 1)" -ForegroundColor Magenta
        }
    }
} finally {
    Write-Host ""
    Write-Host "Keeping jobs running in background" -ForegroundColor Yellow
    Write-Host "   To stop: Stop-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor Gray
}
