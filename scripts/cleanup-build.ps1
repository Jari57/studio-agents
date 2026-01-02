#!/usr/bin/env pwsh

# Build Cleanup Script - Remove unnecessary build artifacts and caches
# Usage: .\scripts\cleanup-build.ps1

Write-Host "🧹 Cleaning up build artifacts and caches..." -ForegroundColor Cyan

$itemsToClean = @(
    "frontend/.vite/cache",
    "frontend/dist",
    "backend/public/assets",
    "frontend/playwright-report",
    "frontend/test-results",
    ".turbo",
    ".eslintcache"
)

$totalFreed = 0

foreach ($item in $itemsToClean) {
    if (Test-Path $item) {
        try {
            $size = (Get-ChildItem -Path $item -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
            Remove-Item -Path $item -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Removed $item (~$([Math]::Round($size, 2))MB)" -ForegroundColor Green
            $totalFreed += $size
        }
        catch {
            Write-Host "  ✗ Failed to remove $item" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ Cleanup complete! Freed ~$([Math]::Round($totalFreed, 2))MB of space" -ForegroundColor Green
Write-Host ""
Write-Host "Optional: Run 'npm ci' to reinstall dependencies freshly" -ForegroundColor Cyan
