# Deployment Guide – MediFind AI 2.0

## 1. Architecture Overview
- **Frontend**: React 18 + Vite 6 + Tailwind CSS (`npm run build` outputs to `dist/`)
- **Backend**: Flask 3 REST API (`backend/wsgi.py` exposes `app` for WSGI servers like `gunicorn`)
- **Database**: MySQL (`DB_*` env vars), `DATABASE_URL` (PostgreSQL/MySQL for managed hosting), or SQLite (`USE_SQLITE_FALLBACK=True` for local/demo use)

---

## 2. Environment Variables

### Frontend (`.env` / hosting provider env)
- `VITE_API_URL`: Full URL to the deployed backend API, e.g. `https://api.yourdomain.com/api`

### Backend (`backend/.env` / hosting provider env)
Copy `backend/.env.example` and set secure values:
- `FLASK_ENV=production`
- `FLASK_DEBUG=0`
- `SECRET_KEY=<random-64-char-hex-string>`
- `JWT_SECRET_KEY=<random-64-char-hex-string>`
- `CORS_ORIGINS=https://your-frontend-domain.vercel.app`
- `DATABASE_URL=<production-mysql-or-postgres-uri>` (or `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, and `USE_SQLITE_FALLBACK=False`)
- `UPLOAD_FOLDER=uploads`
- `MAX_CONTENT_LENGTH=10485760`

> Note: Production startup (`FLASK_ENV=production`) rejects default secret keys. Also ensure **Tesseract OCR** (`tesseract-ocr`) is installed on the host container/OS if you want server-side OCR on scanned JPG/PNG images; text-based PDFs are parsed directly via `pypdf`.

---

## 3. Backend Deployment (Render / Railway / VPS)
1. Set root directory to `backend` (or run from `backend/`).
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start production server:
   ```bash
   gunicorn --bind 0.0.0.0:$PORT --workers 2 wsgi:app
   ```
4. Verify health endpoint: `GET /api/health` returns `200 OK`.

---

## 4. Frontend Deployment (Vercel / Netlify / Static Host)
1. Set `VITE_API_URL` to your deployed backend `/api` URL.
2. Build command:
   ```bash
   npm install && npm run build
   ```
3. Output directory: `dist`
4. `vercel.json` is included so client-side React Router routes rewrite cleanly to `/index.html`.

