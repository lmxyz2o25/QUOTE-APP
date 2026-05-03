$ProjectRoot = "D:\QUOTE-APP"
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QUOTE-APP | Git Pull" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path ".git")) {
    Write-Host "Folder ini belum menjadi Git repository." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Ambil update terbaru dari GitHub..." -ForegroundColor Yellow
git pull

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Berhasil ambil update terbaru dari GitHub." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Git pull gagal. Cek pesan error di atas." -ForegroundColor Red
}

pause
