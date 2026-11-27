# MediFind AI – AI-Based Medical Inventory Management System

**MediFind AI** is a full-stack medical inventory management and multi-pharmacy comparison web application featuring **Prescription OCR extraction**, **Medicine Image & Detail Previews**, **Role-Based Access Control**, and **Pharmacy A vs. Pharmacy B Price & Stock Comparison**.

---

## 🌟 Key Features

### 1. Two Dedicated Roles (Strict Access Control)
- **Main Admin**:
  - Manages both **Pharmacy A** and **Pharmacy B** from one central dashboard.
  - 4 summary metrics: Total Medicines, Pending Prescriptions, Low Stock, and Near Expiry.
  - Dedicated views for **Pharmacy A Inventory** and **Pharmacy B Inventory** with inline stock & price editing.
  - **Add Medicine Modal**: Live additions to Pharmacy A, Pharmacy B, or Both simultaneously with batch, price, and expiry validation.
  - **Prescription Verification**: Review uploaded JPG/PNG/PDF scans and OCR-extracted clinical details, manually confirm/edit uncertain medicine entries, Approve/Verify, or Reject with reason.
  - **Order Tracking Management**: Advance orders across 5 fulfillment stages (`Order Placed` ➔ `Verification` ➔ `Preparing` ➔ `Dispatched` ➔ `Delivered`) or cancel before dispatch.
  - **Expiry & Low Stock Alerts**: Automatic quarantine of expired batches, <= 90-day near-expiry warnings, and < 20-unit low-stock alerts.

- **User / Patient**:
  - Register with full credentials (name, email, phone, password) and manage profile/delivery address.
  - **Prescription Upload & OCR**: Upload JPG, JPEG, PNG, or PDF files (validated on server, max 10 MB) or test with built-in sample prescriptions.
  - **Clinical OCR Extraction**: Extracts Medicine Name, Strength, Dosage, Frequency, and Duration; unclear scans safely return *"Unable to detect – manual confirmation required."* without guessing.
  - **Multi-Pharmacy Price Comparison**: Live side-by-side comparison of Pharmacy A vs. Pharmacy B (exact strength matching; expired batches excluded).
  - **Rx Safety Guard**: Prescription-required (Rx) medicines cannot be ordered without a verified prescription covering those medicines.
  - **Dummy PhonePe UPI QR Checkout**: Clearly labeled simulated PhonePe UPI QR modal supporting success, failure/retry, and cancellation flows with idempotent single-time stock deduction.
  - **5-Stage Order Tracking**: Live visual order progress and cancellation with automatic stock restoration prior to dispatch.

---

## 🔑 Demo Credentials

| Role | Email | Password | Pre-fill Button |
|---|---|---|---|
| **Main Admin** | `admin@medifind.ai` | `admin123` | Click **"⚡ Fill Demo Admin"** on Login page |
| **User (Patient)** | `rahul.verma@example.com` | `user123` | Click **"⚡ Fill Demo User Credentials"** on Login page |

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Vite 6, Tailwind CSS 3, React Router DOM 6, Lucide React, Framer Motion
- **Backend**: Python 3.12, Flask 3.0, Flask-SQLAlchemy, Flask-Cors, PyJWT, Werkzeug, Gunicorn
- **Database**: MySQL (`DB_*` env vars), PostgreSQL/MySQL via `DATABASE_URL`, or automatic SQLite fallback (`USE_SQLITE_FALLBACK=True`)
- **OCR & Document Processing**: `pypdf` (PDF text extraction), `Pillow` + `pytesseract` (Tesseract OCR when installed + PNG metadata support)

---

## 📁 Project Architecture

```
inventory/
├── .env.example                        # Frontend environment template (VITE_API_URL)
├── DEPLOYMENT.md                       # Production deployment guide (Render/Railway + Vercel)
├── vercel.json                         # SPA rewrite config for Vercel
├── package.json
├── public/
│   └── images/
│       ├── medicines/                  # Medicine & form-fallback SVG illustrations
│       └── prescriptions/              # Sample prescription SVG previews
├── src/
│   ├── components/
│   │   ├── admin/AddMedicineModal.jsx
│   │   ├── common/
│   │   │   ├── Badge.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── MedicineDetailsModal.jsx
│   │   │   ├── MedicineImage.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── StatCard.jsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx
│   │   │   └── UserLayout.jsx
│   │   └── payment/PhonePeModal.jsx
│   ├── context/AppContext.jsx          # JWT-authenticated API state & cart management
│   ├── data/mockData.js                # Sample prescription cards
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── admin/                      # AdminDashboard, Medicines, Pharmacy A/B, Prescriptions, Orders, Alerts
│   │   └── user/                       # UserDashboard, UploadRx, Compare, Checkout, Prescriptions, Orders, Profile
│   ├── routes/AppRoutes.jsx
│   ├── services/api.js                 # REST API client with Bearer JWT injection
│   └── utils/                          # dateUtils.js, medicineImage.js
└── backend/
    ├── .env.example                    # Backend environment template
    ├── Procfile                        # Gunicorn process definition
    ├── requirements.txt
    ├── app.py                          # Flask app factory, CORS, error handlers, DB init & seeding
    ├── wsgi.py                         # WSGI entrypoint for Gunicorn
    ├── config.py
    ├── test_backend.py                 # 33-test comprehensive backend test suite
    ├── models/                         # user, pharmacy, medicine, inventory, prescription, order
    ├── routes/                         # auth, user, medicine, inventory, pharmacy, prescription, order, admin, alert
    ├── services/                       # ocr_service, seeder_service, catalog_importer, backup_service
    └── utils/                          # auth_middleware, helpers, medicine_images
```

---

## 🚀 Running the Project Locally

### 1. Start the Backend API (`http://localhost:5000`)
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```
> By default (`USE_SQLITE_FALLBACK=True`), if local MySQL is not running, the backend automatically initializes `backend/medifind.db` with Pharmacy A & B, demo accounts, and catalog medicines.

### 2. Start the Frontend (`http://localhost:3000`)
```bash
# From project root
cp .env.example .env
npm install
npm run dev
```

### 3. Run the Backend Test Suite (33 Checks)
```bash
python backend/test_backend.py
```

### 4. Production Build & Deployment
```bash
npm run build
```
See [DEPLOYMENT.md](./DEPLOYMENT.md) for environment variables, Gunicorn backend deployment, and Vercel/Netlify frontend deployment instructions.
