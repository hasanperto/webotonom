# Tekno: production zip paketi (frontend build + backend kaynak, node_modules haric)
# Kullanim: PowerShell'de proje kokunden: .\scripts\build-release.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Stamp = Get-Date -Format "yyyyMMdd-HHmm"
$ReleaseName = "tekno-release-$Stamp"
$Stage = Join-Path $Root "dist\$ReleaseName"
$ZipPath = Join-Path $Root "dist\$ReleaseName.zip"

Write-Host "==> Kok: $Root"
Write-Host "==> Asama klasoru: $Stage"

# Frontend build
Push-Location (Join-Path $Root "frontend")
Write-Host "==> frontend: npm ci --legacy-peer-deps"
npm ci --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { Write-Error "frontend npm ci basarisiz." }
Write-Host "==> frontend: npm run build"
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "frontend build basarisiz." }
Pop-Location

if (-not (Test-Path (Join-Path $Root "frontend\dist\index.html"))) {
    Write-Error "frontend/dist olusmadi."
}

# Temizle ve kopyala
if (Test-Path $Stage) { Remove-Item -Recurse -Force $Stage }
New-Item -ItemType Directory -Path (Join-Path $Stage "frontend\dist") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $Stage "backend") -Force | Out-Null

Write-Host "==> frontend/dist -> paket"
Copy-Item -Path (Join-Path $Root "frontend\dist\*") -Destination (Join-Path $Stage "frontend\dist") -Recurse -Force

Write-Host "==> backend (node_modules ve .env haric) -> paket"
$backendSrc = Join-Path $Root "backend"
Get-ChildItem -Path $backendSrc -Force | Where-Object {
    $_.Name -ne "node_modules" -and $_.Name -ne ".env" -and $_.Name -ne ".git"
} | ForEach-Object {
    $dest = Join-Path (Join-Path $Stage "backend") $_.Name
    Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
}

# Bos uploads klasoru (sunucuda yazma izni verin)
$uploads = Join-Path $Stage "backend\public\uploads"
New-Item -ItemType Directory -Path $uploads -Force | Out-Null
Set-Content -Path (Join-Path $uploads ".gitkeep") -Value ""

# Dokumantasyon
Copy-Item -Path (Join-Path $Root "deploy\SUNUCU.md") -Destination (Join-Path $Stage "SUNUCU.md") -Force

# Zip
if (-not (Test-Path (Split-Path $ZipPath))) {
    New-Item -ItemType Directory -Path (Split-Path $ZipPath) -Force | Out-Null
}
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
Compress-Archive -Path $Stage -DestinationPath $ZipPath -CompressionLevel Optimal

Write-Host ""
Write-Host "Tamam. Paket: $ZipPath"
Write-Host "Sunucuda acip SUNUCU.md dosyasini izleyin; backend icinde: npm ci --omit=dev && NODE_ENV=production node server.js"
