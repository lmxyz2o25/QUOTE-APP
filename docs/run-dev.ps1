$ProjectRoot = "D:\QUOTE-APP"
$WebPath = "$ProjectRoot\apps\web"
$ApiPath = "$ProjectRoot\apps\api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QUOTE-APP | Run Web + API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $WebPath)) {
    Write-Host "Folder web tidak ditemukan: $WebPath" -ForegroundColor Red
    pause
    exit 1
}

if (!(Test-Path $ApiPath)) {
    Write-Host "Folder api tidak ditemukan: $ApiPath" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Menjalankan API di port 4000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$ApiPath`"; pnpm run start:dev"

Start-Sleep -Seconds 2

Write-Host "Menjalankan Web di port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$WebPath`"; pnpm dev"

Write-Host ""
Write-Host "API dan Web sudah dijalankan di window PowerShell terpisah." -ForegroundColor Green
Write-Host "API : http://localhost:4000/api"
Write-Host "WEB : http://localhost:3000"
Write-Host ""

pause
