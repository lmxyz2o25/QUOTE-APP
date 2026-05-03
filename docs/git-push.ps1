$ProjectRoot = "D:\QUOTE-APP"
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QUOTE-APP | Git Status, Commit, Push" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path ".git")) {
    Write-Host "Folder ini belum menjadi Git repository." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Cek file rahasia dari .gitignore..." -ForegroundColor Yellow
git check-ignore -v apps/api/.env
git check-ignore -v apps/web/.env.local

Write-Host ""
Write-Host "Git status saat ini:" -ForegroundColor Yellow
git status

Write-Host ""
$Changes = git status --porcelain

if ([string]::IsNullOrWhiteSpace($Changes)) {
    Write-Host "Tidak ada perubahan file untuk di-commit." -ForegroundColor Green
    pause
    exit 0
}

Write-Host ""
$CommitMessage = Read-Host "Masukkan pesan commit, atau Enter untuk default"

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = "Update dashboard and customers page"
}

Write-Host ""
Write-Host "Menambahkan semua perubahan..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Status setelah git add:" -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "Membuat commit: $CommitMessage" -ForegroundColor Yellow
git commit -m "$CommitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Commit gagal. Cek pesan error di atas." -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Push ke GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Berhasil push ke GitHub." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Push gagal. Cek pesan error di atas." -ForegroundColor Red
}

pause
