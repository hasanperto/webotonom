# XAMPP MySQL kapanma — neden ve cozum

## Neden kapaniyordu?

1. **Hayalet `teknoprojes` veritabani** — Klasor silinmisti ama InnoDB sozlugunde yuzlerce tablo kaldi; her acilista eksik `.ibd` hatalari.
2. **`ib_logfile0/1` silinmesi** — Log dosyalari yeniden olusturulunca `ibdata1` ile LSN uyumsuzlugu (`log sequence in the future`).
3. **Bozuk sistem tablolari** — `mysql.global_priv` / `mysql.db` (Aria CRC hatasi) → yetki tablolari acilmiyor, MySQL `Aborting`.
4. **`setup-payment-integrations.js` bos cikti** — MySQL kapali veya `localhost` baglanti reddi (1130).

## Yapilan onarim

- `mysql.global_priv`, `db`, `plugin` XAMPP yedeginden + `aria_chk -r`
- Eski `ib_logfile` geri yuklendi (`backup_before_repair_*`)
- `DROP DATABASE teknoprojes`
- `.env` → `DB_HOST=127.0.0.1`
- Odeme tablolari kuruldu

## Tekrar bozulursa

Yonetici PowerShell:

```powershell
cd D:\Sonver\tekno\backend\scripts
.\fix-mysql-xampp-full.ps1
```

Veya sadece hayalet DB:

```powershell
.\fix-mysql-ghost-db.ps1
```

## Onemli

- Projede kullanilan DB: **`teknopro`** (`DB_NAME=teknopro`)
- **`teknoprojes` kullanmayin** — eski/bozuk kopya
