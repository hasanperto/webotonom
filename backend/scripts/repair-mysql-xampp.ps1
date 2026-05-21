# XAMPP MySQL onarimi — bozuk teknoprojes + Aria log
# Yonetici PowerShell:  cd D:\Sonver\tekno\backend\scripts
#                       .\repair-mysql-xampp.ps1

$ErrorActionPreference = "Continue"
$Xampp = "D:\xampp"
$MysqlBin = "$Xampp\mysql\bin"
$Data = "$Xampp\mysql\data"
$MyIni = "$MysqlBin\my.ini"
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = "$Xampp\mysql\backup_repair_$ts"

Write-Host "=== XAMPP MySQL Onarim ($ts) ===" -ForegroundColor Cyan

New-Item -ItemType Directory -Path $Backup -Force | Out-Null

# 1) MySQL durdur
Write-Host "[1] MySQL durduruluyor..."
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
if (Test-Path "$Data\mysql.pid") { Remove-Item "$Data\mysql.pid" -Force }

# 2) Aria log temizligi (plugin tablosu icin)
Write-Host "[2] Aria log yedekleniyor..."
foreach ($f in @("aria_log.00000001", "aria_log_control")) {
    $p = Join-Path $Data $f
    if (Test-Path $p) { Move-Item $p (Join-Path $Backup $f) -Force }
}
Push-Location $Data
& "$MysqlBin\aria_chk.exe" -r "mysql\plugin" 2>&1 | Out-Host
Pop-Location

# 3) InnoDB log yedekle (uyumsuzluk icin yeniden olusturulur)
Write-Host "[3] InnoDB log dosyalari yedekleniyor..."
foreach ($f in @("ib_logfile0", "ib_logfile1", "ib_buffer_pool")) {
    $p = Join-Path $Data $f
    if (Test-Path $p) { Move-Item $p (Join-Path $Backup $f) -Force }
}

# 4) my.ini: force_recovery gecici ac, max_allowed_packet artir
Write-Host "[4] my.ini guncelleniyor..."
$ini = Get-Content $MyIni -Raw
Copy-Item $MyIni (Join-Path $Backup "my.ini.bak") -Force
if ($ini -notmatch 'innodb_force_recovery') {
    $ini = $ini -replace '(log_error="mysql_error.log")', "`$1`r`ninnodb_force_recovery = 1"
} else {
    $ini = $ini -replace '#?\s*innodb_force_recovery\s*=\s*\d+', 'innodb_force_recovery = 1'
}
$ini = $ini -replace 'max_allowed_packet=\d+M', 'max_allowed_packet=64M'
if ($ini -notmatch 'max_allowed_packet=64M') {
    $ini = $ini -replace 'max_allowed_packet=1M', 'max_allowed_packet=64M'
}
Set-Content $MyIni $ini -NoNewline

# 5) MySQL baslat
Write-Host "[5] MySQL baslatiliyor..."
$startBat = "$Xampp\mysql_start.bat"
if (Test-Path $startBat) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$startBat`"" -WindowStyle Hidden
} else {
    Start-Process -FilePath "$MysqlBin\mysqld.exe" -ArgumentList "--defaults-file=$MyIni" -WindowStyle Hidden
}

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    $listen = netstat -ano 2>$null | Select-String "LISTENING" | Select-String ":3306"
    if ($listen) { $ready = $true; break }
}
if (-not $ready) {
    Write-Host "HATA: MySQL 30 sn icinde acilmadi. XAMPP'ten manuel Start deneyin." -ForegroundColor Red
    exit 1
}
Write-Host "    MySQL acildi." -ForegroundColor Green

# 6) Hayalet DB kaldir (ana neden: eksik .ibd dosyalari)
Write-Host "[6] Bozuk teknoprojes veritabani kaldiriliyor..."
& "$MysqlBin\mysql.exe" -h 127.0.0.1 -P 3306 -u root --protocol=TCP -e "DROP DATABASE IF EXISTS teknoprojes;" 2>&1 | Out-Host
if (Test-Path "$Data\teknoprojes") {
    Move-Item "$Data\teknoprojes" (Join-Path $Backup "teknoprojes_folder") -Force -ErrorAction SilentlyContinue
}

# 7) DROP basarili mi kontrol
$dropOk = $false
try {
    $dbs = & "$MysqlBin\mysql.exe" -h 127.0.0.1 -P 3306 -u root --protocol=TCP -N -e "SHOW DATABASES LIKE 'teknoprojes';" 2>$null
    if (-not $dbs) { $dropOk = $true }
} catch { }
if (-not $dropOk) {
    Write-Host "UYARI: teknoprojes hala var. Once: .\fix-mysql-ghost-db.ps1" -ForegroundColor Yellow
    exit 1
}

# 8) force_recovery kapat + MySQL yeniden baslat
Write-Host "[8] my.ini force_recovery kapatiliyor..."
$ini2 = Get-Content $MyIni -Raw
$ini2 = $ini2 -replace 'innodb_force_recovery\s*=\s*1', '# innodb_force_recovery = 1'
Set-Content $MyIni $ini2 -NoNewline

# 9) MySQL yeniden baslat
Write-Host "[9] MySQL yeniden baslatiliyor..."
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
if (Test-Path $startBat) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$startBat`"" -WindowStyle Hidden
} else {
    Start-Process -FilePath "$MysqlBin\mysqld.exe" -ArgumentList "--defaults-file=$MyIni" -WindowStyle Hidden
}
Start-Sleep -Seconds 4

# 10) Odeme tablolari
Write-Host "[10] Odeme entegrasyonu kuruluyor..."
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:DB_HOST = "127.0.0.1"
node scripts/setup-payment-integrations.js

Write-Host ""
Write-Host "=== Tamamlandi ===" -ForegroundColor Green
Write-Host "Yedek: $Backup"
Write-Host "Projede DB: teknopro (.env DB_NAME=teknopro)"
