# 🚀 Deployment Guide — Render (Free Tier)

This guide deploys the **HMS backend** as a Render Web Service and the **HMS frontend** as a Render Static Site.

> **Note on SQLite:** Render's free tier uses an ephemeral filesystem — data resets on every deploy. For persistent data, upgrade to a paid Render plan with a Disk, or use [Render PostgreSQL](https://render.com/docs/databases). SQLite is fine for demos and interviews.

---

## Prerequisites

- A [Render account](https://render.com) (free)
- Your code pushed to a **GitHub** repository

---

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "chore: prepare for Render deployment"
git push origin main
```

---

## Step 2 — Deploy via Render Blueprint (Easiest)

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New → Blueprint**
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically
5. Click **Apply** — both services deploy in ~5 minutes

---

## Step 3 — Update URLs After First Deploy

After both services finish deploying, you'll have two URLs, e.g.:

| Service | URL |
|---------|-----|
| Backend | `https://hms-backend.onrender.com` |
| Frontend | `https://hms-frontend.onrender.com` |

### Update Backend env vars (Render Dashboard → hms-backend → Environment)

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://hms-frontend.onrender.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://hms-backend.onrender.com,https://hms-frontend.onrender.com` |

### Update Frontend env vars (Render Dashboard → hms-frontend → Environment)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://hms-backend.onrender.com/api` |

After updating, click **Manual Deploy → Deploy latest commit** on both services.

---

## Step 4 — Create a Django Superuser (Optional)

The admin panel at `/admin/` requires a Django superuser.  
Open the **Shell** tab on the `hms-backend` service and run:

```bash
python manage.py createsuperuser
```

---

## Step 5 — Verify

| Check | URL |
|-------|-----|
| Backend health | `https://hms-backend.onrender.com/` |
| API root | `https://hms-backend.onrender.com/api/patients/` |
| Frontend | `https://hms-frontend.onrender.com` |

---

## Alternative: Manual Deploy (Without Blueprint)

### Backend (Web Service)

| Setting | Value |
|---------|-------|
| **Runtime** | Python 3 |
| **Build Command** | `./build.sh` |
| **Start Command** | `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2` |
| **Root Directory** | *(leave empty)* |

Set these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | *(click "Generate")* |
| `DEBUG` | `False` |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://your-backend.onrender.com,https://your-frontend.onrender.com` |

### Frontend (Static Site)

| Setting | Value |
|---------|-------|
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

Set these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

Add this **Redirect/Rewrite Rule**:

| Source | Destination | Action |
|--------|-------------|--------|
| `/*` | `/index.html` | Rewrite |

---

## Local Development (unchanged)

```powershell
# Terminal 1 — Backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The frontend `.env` is already pre-configured with `VITE_API_URL=http://127.0.0.1:8000/api`.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `CORS blocked` | Ensure `FRONTEND_URL` is set correctly on the backend service |
| `403 Forbidden` on POST | Add both domains to `CSRF_TRUSTED_ORIGINS` |
| `No module named gunicorn` | Check `requirements.txt` includes `gunicorn` |
| `Static files 404` | Re-run deploy; `build.sh` runs `collectstatic` automatically |
| Frontend shows blank page | Check `VITE_API_URL` is set and backend is running |
| Data lost after deploy | Expected on free tier SQLite — use Render Disk for persistence |
