# 🏥 Hospital Management System

A full-stack Hospital Management System built with **Django REST Framework** (backend) and **React + Tailwind CSS** (frontend), using **MySQL** as the database.

---

## 📁 Project Structure

```
Hospital-management/
├── backend/                  Django project settings & URLs
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                     Main Django app (models, views, serializers)
│   ├── models.py             9 database models
│   ├── serializers.py        DRF serializers
│   ├── views.py              All API views + AI engine
│   ├── urls.py               API URL routing
│   └── migrations/           Django migrations
├── frontend/                 React + Vite + Tailwind frontend
│   └── src/
│       ├── pages/            All 10 dashboard/auth pages
│       ├── api.ts            All API calls (Axios + TypeScript)
│       └── App.tsx           Routes + Layout
├── hms_database.sql          ★ Complete MySQL schema (single file)
├── .env                      Secret config (DB credentials)
├── .gitignore
├── requirements.txt          Python dependencies
├── manage.py
├── setup-database.ps1        One-time DB + migration setup
├── start-backend.ps1         Start Django dev server
└── start-frontend.ps1        Start Vite dev server
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+  |  Node.js 18+  |  MySQL 8.0

### 1 — Set up Python environment
```powershell
cd "C:\Users\User\OneDrive\Desktop\Hospital-management"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2 — Create MySQL Database (Single SQL File)

**Option A — Import the single schema file:**
```powershell
mysql -u root -p < hms_database.sql
```
This creates the `hms_db` database with all 9 application tables + Django system tables.

**Option B — Use the automated setup script:**
```powershell
.\setup-database.ps1
```

### 3 — Configure `.env`
Edit `.env` and fill in your MySQL root password:
```
DB_PASSWORD=your_actual_mysql_password
```

### 4 — Run Django Migrations
```powershell
python manage.py migrate
```

### 5 — Start the servers (two terminals)
```powershell
.\start-backend.ps1     # http://127.0.0.1:8000
.\start-frontend.ps1    # http://localhost:5173
```

---

## 🗄️ MySQL Database Schema (`hms_database.sql`)

The entire database is defined in a **single file**: `hms_database.sql`

| Table | Description |
|---|---|
| `core_patient` | Patient records + hashed password + token number |
| `core_doctor` | Doctor records with consultation fee |
| `core_doctorprofile` | Doctor login + approval status (pending/approved/rejected) |
| `core_appointment` | Appointments linking patients and doctors |
| `core_consultationnote` | Doctor consultation notes per patient |
| `core_prescription` | Prescribed medicines + AI drug recommendation |
| `core_diagnostictest` | Lab test orders, results, report_sent flag |
| `core_pharmacydispense` | Medicines dispensed by pharmacy |
| `core_billingrecord` | Consolidated patient bills (auto-calculated) |

---

## 🖥️ System Dashboards (6 Dashboards + 4 Auth Pages)

| Dashboard | Route | Key Features |
|---|---|---|
| **Patient** | `/` | Medical history, Book appointments, AI chatbot |
| **Doctor** | `/doctor` | Patient lookup, Add notes/prescriptions/tests, AI drug assistant |
| **Pharmacy** | `/pharmacy` | Dispense medicines, track costs |
| **Diagnosis** | `/diagnosis` | Enter lab results, Send reports to patient & doctor |
| **Billing** | `/billing` | Generate consolidated bills |
| **Admin** | `/admin` | Stats, Approve/reject doctor registrations, Add doctors |

| Auth Page | Route | Description |
|---|---|---|
| Patient Login | `/login` | Login with Patient ID + password |
| Patient Register | `/register` | New patient registration |
| Doctor Login | `/doctor-login` | Login with email + password (after admin approval) |
| Doctor Register | `/doctor-register` | Doctor self-registration (requires admin approval) |

---

## 🔐 Authentication Flow

```
Patient : /register (ID + password) → /login → localStorage hms_patient
Doctor  : /doctor-register → Admin approves → /doctor-login → localStorage hms_doctor
Lab     : Enter result → "Send Report" → report_sent=True → visible to patient & doctor
```

---

## 🤖 AI Features (No API Key Required)

| Feature | Endpoint | Description |
|---|---|---|
| Hospital Chatbot | `POST /api/ai-chatbot/` | Rule-based assistant for patient queries (appointments, departments, pharmacy, timings, emergency) |
| Drug Recommendation | `POST /api/ai-drug-assistant/` | Evidence-based drug suggestions for 10+ conditions with dosages, precautions, and age-specific warnings |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Axios, React Router v7 |
| Backend | Django 6, Django REST Framework, PyMySQL |
| Database | **MySQL 8.0** (schema in `hms_database.sql`) |
| Auth | Custom hashed passwords (Django `make_password` / `check_password`) |
| AI | Local rule-based engine (no API key required) |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/patients/` | List/create patients |
| GET/POST | `/api/doctors/` | List/create doctors |
| GET/POST | `/api/appointments/` | List/create appointments |
| GET/POST | `/api/consultations/` | List/create consultation notes |
| GET/POST | `/api/prescriptions/` | List/create prescriptions |
| GET/POST | `/api/diagnostics/` | List/create diagnostic tests |
| GET/POST | `/api/pharmacy/` | List/create pharmacy dispenses |
| GET/POST | `/api/billing/` | List/create billing records |
| GET | `/api/admin-summary/` | Admin dashboard summary |
| POST | `/api/generate-bill/` | Auto-calculate patient bill |
| POST | `/api/patient-login/` | Patient authentication |
| POST | `/api/doctor-register/` | Doctor self-registration |
| POST | `/api/doctor-login/` | Doctor authentication |
| GET | `/api/pending-doctors/` | List doctor registrations |
| PATCH | `/api/approve-doctor/<id>/` | Approve/reject doctor |
| PATCH | `/api/send-lab-report/<id>/` | Mark lab report as sent |
| POST | `/api/ai-chatbot/` | Hospital AI chatbot |
| POST | `/api/ai-drug-assistant/` | AI drug recommendation |
