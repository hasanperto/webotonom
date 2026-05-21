# XAMPP MySQL tam onarim - ib_log + global_priv + teknoprojes hayalet DB
# Yonetici: cd D:\Sonver\tekno\backend\scripts ; .\fix-mysql-xampp-full.ps1

$ErrorActionPreference = "Continue"
$Xampp = "D:\xampp"
$Bin = "$Xampp\mysql\bin"
$Data = "$Xampp\mysql\data"
$MysqlSys = "$Data\mysql"
$MyIni = "$Bin\my.ini"
$Log = "$Data\mysql_error.log"
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$Snap = "$Xampp\mysql\snap_$ts"

Write-Host "=== MySQL tam onarim ($ts) ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Path $Snap -Force | Out-Null

Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
foreach ($pidName in @("mysql.pid", "mysql.pid.lock")) {
    $p = Join-Path $Data $pidName
    if (Test-Path $p) { Remove-Item $p -Force }
}

Write-Host "[1] InnoDB log dosyalari geri yukleniyor..."
$logSrc = @(
    "$Xampp\mysql\backup_repair_20260521-205344",
    "$Xampp\mysql\backup_before_repair_20260521-192421",
    "$Xampp\mysql\backup"
) | Where-Object { Test-Path (Join-Path $_ "ib_logfile0") } | Select-Object -First 1

if ($logSrc) {
    foreach ($f in @("ib_logfile0", "ib_logfile1", "ib_buffer_pool")) {
        $cur = Join-Path $Data $f
        if (Test-Path $cur) { Copy-Item $cur (Join-Path $Snap $f) -Force }
        $srcFile = Join-Path $logSrc $f
        if (Test-Path $srcFile) { Copy-Item $srcFile $Data -Force }
    }
    Write-Host "    Kaynak: $logSrc"
} else {
    Write-Host "    UYARI: Eski ib_logfile bulunamadi" -ForegroundColor Yellow
}

Write-Host "[2] mysql.global_priv ve db onariliyor..."
$def = "$Xampp\mysql\backup\mysql"
foreach ($base in @("global_priv", "db", "plugin")) {
    foreach ($ext in @("MAD", "MAI")) {
        $src = Join-Path $def "$base.$ext"
        $dst = Join-Path $MysqlSys "$base.$ext"
        if (Test-Path $src) {
            if (Test-Path $dst) { Copy-Item $dst (Join-Path $Snap "$base.$ext") -Force }
            Copy-Item $src $dst -Force
        }
    }
}
Push-Location $Data
foreach ($t in @("mysql\global_priv", "mysql\db", "mysql\plugin")) {
    & "$Bin\aria_chk.exe" -r $t 2>&1 | Out-Host
}
Pop-Location

Write-Host "[3] my.ini force_recovery=1..."
$ini = Get-Content $MyIni -Raw
Copy-Item $MyIni (Join-Path $Snap "my.ini.bak") -Force
$ini = $ini -replace '#?\s*innodb_force_recovery\s*=\s*\d+[^\r\n]*', 'innodb_force_recovery = 1'
if ($ini -notmatch 'innodb_force_recovery\s*=\s*1') {
    $ini = $ini -replace '(log_error="mysql_error.log")', "`$1`r`ninnodb_force_recovery = 1"
}
Set-Content $MyIni $ini -NoNewline

Write-Host "[4] MySQL baslatiliyor..."
Start-Process -FilePath "$Bin\mysqld.exe" -ArgumentList "--defaults-file=$MyIni" -WindowStyle Hidden
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1
    $tail = Get-Content $Log -Tail 5 -ErrorAction SilentlyContinue
    if ($tail -match "ready for connections") { $ready = $true; break }
    $listen = netstat -ano 2>$null | Select-String "LISTENING" | Select-String ":3306 "
    if ($listen -and $i -gt 15) { $ready = $true; break }
}
if (-not $ready) {
    Write-Host "Baslatilamadi. Son log:" -ForegroundColor Red
    Get-Content $Log -Tail 15
    exit 1
}
Write-Host "    OK" -ForegroundColor Green

Write-Host "[5] DROP DATABASE teknoprojes..."
& "$Bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root --protocol=TCP -e "DROP DATABASE IF EXISTS teknoprojes;" 2>&1 | Out-Host

Write-Host "[6] force_recovery kapat..."
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
$ini2 = Get-Content $MyIni -Raw
$ini2 = $ini2 -replace 'innodb_force_recovery\s*=\s*1', '# innodb_force_recovery = 1'
Set-Content $MyIni $ini2 -NoNewline
Start-Process -FilePath "$Bin\mysqld.exe" -ArgumentList "--defaults-file=$MyIni" -WindowStyle Hidden
Start-Sleep -Seconds 6
$listen2 = netstat -ano 2>$null | Select-String "LISTENING" | Select-String ":3306 "
if ($listen2) {
    Write-Host "    Normal mod OK" -ForegroundColor Green
} else {
    Write-Host "    Normal mod basarisiz - force_recovery acik birakin" -ForegroundColor Yellow
}

Write-Host "[7] Odeme tablolari..."
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:DB_HOST = "127.0.0.1"
node scripts/setup-payment-integrations.js

Write-Host "Snap: $Snap"
Write-Host "Bitti."
