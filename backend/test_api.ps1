$baseUrl = "http://localhost:5000/api"

Write-Host "1. Login olunuyor..."
try {
    $loginBody = @{
        email = "zeynep@example.com"
        password = "123456"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login başarılı."
} catch {
    Write-Host "Login hatası: $_" -ForegroundColor Red
    exit
}

Write-Host "2. Ödeme talepleri alınıyor..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/users/payment-requests" -Method Get -Headers $headers
    $requests = $listResponse.payment_requests

    if ($requests.Count -eq 0) {
        Write-Host "Ödeme talebi bulunamadı."
        exit
    }

    $firstId = $requests[0].id
    Write-Host "İlk talep ID: $firstId"
} catch {
    Write-Host "Liste alma hatası: $_" -ForegroundColor Red
    exit
}

Write-Host "3. Not güncelleniyor (ID: $firstId)..."
try {
    $noteBody = @{
        note = "PowerShell Test Notu $(Get-Date)"
    } | ConvertTo-Json

    # UTF-8 encoding sorunu olmaması için
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/payment-requests/$firstId/note" -Method Put -Body $noteBody -ContentType "application/json" -Headers $headers
    Write-Host "Update Sonucu:" -ForegroundColor Green
    $updateResponse | Format-List
} catch {
    Write-Host "Update hatası: $_" -ForegroundColor Red
    # Hata detayını göster
    $_.Exception.Response.GetResponseStream()
    exit
}
