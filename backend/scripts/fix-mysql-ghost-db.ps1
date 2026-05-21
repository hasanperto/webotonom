# Hayalet teknoprojes DB + MySQL stabil baslatma
# Yonetici: .\fix-mysql-ghost-db.ps1

$ErrorActionPreference = "Continue"
$Xampp = "D:\xampp"
$Bin = "$Xampp\mysql\bin"
$Data = "$Xampp\mysql\data"
$Log = "$Data\mysql_error.log"
$MyIni = "$Bin\my.ini"

function Wait-MySqlReady {
    param([int]$MaxSec = 45)
    for ($i = 0; $i -lt $MaxSec; $i++) {
        Start-Sleep -Seconds 1
        $listen = netstat -ano 2>$null | Select-String "LISTENING" | Select-String ":3306 "
        if ($listen) {
            $tail = Get-Content $Log -Tail 5 -ErrorAction SilentlyContinue
            if ($tail -match "ready for connections") { return $true }
            if ($i -gt 8) { return $true }
        }
    }
    return $false
}

function Invoke-MySql {
    param([string]$Sql)
    & "$Bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root --protocol=TCP -e $Sql 2>&1
}

Write-Host "=== Hayalet DB temizligi ===" -ForegroundColor Cyan

Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
if (Test-Path "$Data\mysql.pid") { Remove-Item "$Data\mysql.pid" -Force }

$ini = Get-Content $MyIni -Raw
if ($ini -notmatch '^\s*innodb_force_recovery\s*=\s*1') {
    $ini = $ini -replace '#?\s*innodb_force_recovery\s*=\s*\d+.*', 'innodb_force_recovery = 1'
    Set-Content $MyIni $ini -NoNewline
}

$bp = Join-Path $Data "ib_buffer_pool"
if (Test-Path $bp) { Remove-Item $bp -Force }

Start-Process -FilePath "$Bin\mysqld.exe" -ArgumentList "--defaults-file=$MyIni" -WindowStyle Hidden
if (-not (Wait-MySqlReady)) {
    Write-Host "MySQL acilmadi. Log:" -ForegroundColor Red
    Get-Content $Log -Tail 20
    exit 1
}

Write-Host "DROP DATABASE teknoprojes..."
$r = Invoke-MySql "DROP DATABASE IF EXISTS teknoprojes;"
$r | Out-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "DROP basarisiz, force_recovery=3 deneniyor..." -ForegroundColor Yellow
    $ini = Get-Content $MyIni -Raw
    $ini = $ini -replace 'innodb_force_recovery\s*=\s*1', 'innodb_force_recovery = 3'
    Set-Content $MyIni $ini -NoNewline
    Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    Start-Process -FilePath "$Bin\mysqld.exe" -ArgumentList "--defaults-file=$MyIni" -WindowStyle Hidden
    Wait-MySqlReady | Out-Null
    Invoke-MySql "DROP DATABASE IF EXISTS teknoprojes;" | Out-Host
}

Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

$ini2 = Get-Content $MyIni -Raw
$ini2 = $ini2 -replace 'innodb_force_recovery\s*=\s*[13]', '# innodb_force_recovery = 1'
Set-Content $MyIni $ini2 -NoNewline

Start-Process -FilePath "$Bin\mysqld.exe" -ArgumentList "--defaults-file=$MyIni" -WindowStyle Hidden
if (-not (Wait-MySqlReady)) {
    Write-Host "Normal modda MySQL acilmadi." -ForegroundColor Red
    exit 1
}

$check = Invoke-MySql "SHOW DATABASES LIKE 'teknoprojes';"
Write-Host $check
$cnt = (Select-String -Path $Log -Pattern "teknoprojes" -SimpleMatch | Measure-Object).Count
Write-Host "Logda teknoprojes satir sayisi (toplam): $cnt"

Set-Location (Split-Path $PSScriptRoot -Parent)
$env:DB_HOST = "127.0.0.1"
node scripts/setup-payment-integrations.js

Write-Host "Bitti." -ForegroundColor Green
