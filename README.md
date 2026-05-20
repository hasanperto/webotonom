# Webotonom (Tekno)

Full-stack proje: React (Vite) + Node (Express) + MySQL.

- **Frontend:** `frontend/`
- **Backend API:** `backend/`
- **Sunucu kurulum / güncelleme:** [deploy/SUNUCU.md](deploy/SUNUCU.md)
- **Release zip (Windows):** `.\scripts\build-release.ps1` → `dist/tekno-release-*.zip`

Production’da API ve statik site aynı origin’den servis edilir (`NODE_ENV=production`, `server.js` → `frontend/dist`).
