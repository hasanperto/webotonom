# Sunucu kontrol listesi

## Yerel (yayin oncesi)

- [ ] `.\scripts\build-release.ps1` hatasiz biter
- [ ] `backend\.env` repoya gitmez
- [ ] API anahtarlari production `.env` icinde (yerel .env degil)

## Sunucu ilk kurulum

- [ ] Node 20+ (`node -v`)
- [ ] MySQL/MariaDB — veritabani `teknopro` (veya `.env` DB_NAME)
- [ ] `backend/.env` ← `deploy/.env.production.example` kopyala, doldur
- [ ] `./deploy/scripts/sunucu-kurulum.sh /path/to/tekno`
- [ ] Nginx → `127.0.0.1:5000` (`deploy/nginx-tekno.example.conf`)
- [ ] SSL (Let's Encrypt / aaPanel)
- [ ] `https://DOMAIN/api/health` → `"database":"connected"`
- [ ] `public/uploads` yazilabilir (775, www kullanicisi)

## Odeme (checkout)

- [ ] Admin → Sanal Poslar → **Demo odeme modu** acik (test)
- [ ] Test kart: `4242 4242 4242 4242` / PayPal: `demo@teknopro.com` / `demo1234`
- [ ] Canlida demo kapat + Stripe/PayPal API anahtarlari

## Guncelleme

```bash
./deploy/scripts/sunucu-guncelle.sh /www/wwwroot/alanadiniz.com
```

- [ ] Once DB yedegi
- [ ] `.env` ve `uploads` silinmedi

## PM2

```bash
pm2 list
pm2 logs tekno --lines 50
pm2 restart tekno
```
