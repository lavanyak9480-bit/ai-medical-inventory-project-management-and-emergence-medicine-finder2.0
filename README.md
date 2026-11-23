# MediFind AI – AI-Based Medical Inventory Management System

**MediFind AI** is a complete, modern, and user-friendly medical inventory management frontend featuring **Prescription OCR extraction** and **Multi-Pharmacy Price & Stock Comparison** across two managed units: **Pharmacy A** and **Pharmacy B**.

---

## 🌟 Key Features

### 1. Two Dedicated Roles (Strict Access Control)
- **Main Admin**:
  - Manages both **Pharmacy A** and **Pharmacy B** from one central dashboard.
  - Exactly 4 summary metrics: Total Medicines, Pending Prescriptions, Low Stock, Near Expiry.
  - Dedicated shortcuts to **Pharmacy A Inventory** and **Pharmacy B Inventory**.
  - **Add Medicine Modal**: Live additions to Pharmacy A, Pharmacy B, or Both simultaneously with full validation.
  - **Prescription Verification**: Review OCR-extracted clinical details, Approve/Verify or Reject with reason.
  - **Order Tracking Management**: Advance orders across 5 fulfillment stages (Order Placed ➔ Verification ➔ Preparing ➔ Dispatched ➔ Delivered).
  - **Expiry & Low Stock Alerts**: Automatic quarantine and identification of expired batches (&le; 90-day near-expiry & low stock).

- **User / Patient**:
  - Register with full credentials (name, email, phone, password).
  - **Prescription Upload & OCR**: Upload JPG, PNG, or PDF files or pick demo clinical prescriptions.
  - **Readable OCR Extraction**: Clinical table with Medicine Name, Strength, Dosage, Frequency, and Duration.
  - **Uncertainty Fallback**: Flagged as *"Unable to detect – manual confirmation required"* without guessing.
  - **Multi-Pharmacy Price Comparison**: Live side-by-side comparison of Pharmacy A vs Pharmacy B.
  - **Separate Orders**: Order medicines separately from Pharmacy A and Pharmacy B with stock limit controls.
  - **Dummy PhonePe UPI QR Checkout**: Clean PhonePe purple UI with demo QR code, instant payment simulation, and auto-dispatch status.
  - **5-Stage Order Tracking**: Real-time visual progress of dispatched packages.
  - **User Profile**: Edit personal information and delivery address.

---

## 🔑 Demo Credentials

| Role | Email | Password | Pre-fill Button |
|---|---|---|---|
| **Main Admin** | `admin@medifind.ai` | `admin123` | Click **"⚡ Fill Demo Admin"** on Login page |
| **User (Patient)** | `rahul.verma@example.com` | `user123` | Click **"⚡ Fill Demo User"** on Login page |

---

## 🛠️ Technology Stack
- **React.js 18**
- **Vite 6**
- **Tailwind CSS 3** (Custom mint green `#10b981`, medical blue `#0ea5e9`, and PhonePe purple `#5f259f`)
- **React Router DOM 6**
- **Lucide React** (Medical and clinical icons)
- **Framer Motion** (Smooth capsule animations, scanning beam, and modal transitions)

---

## 📁 Project Architecture

```
src/
├── components/
│   ├── admin/
│   │   └── AddMedicineModal.jsx        # Working modal to add medicines to A, B, or both
│   ├── common/
│   │   ├── Badge.jsx                   # Color-coded badges for stock, status, pharmacies
│   │   ├── Footer.jsx                  # Clean medical footer
│   │   ├── Modal.jsx                   # Reusable accessible dialog
│   │   ├── Navbar.jsx                  # Header with role badge, cart count, navigation
│   │   └── StatCard.jsx                # Clean metric card
│   ├── layout/
│   │   ├── AdminLayout.jsx             # 8-item sidebar + quick action header
│   │   └── UserLayout.jsx              # Responsive patient navigation layout
│   └── payment/
│       └── PhonePeModal.jsx            # PhonePe purple dummy QR UI with simulation
├── context/
│   └── AppContext.jsx                  # Central state & localStorage persistence
├── data/
│   └── mockData.js                     # Realistic initial medicines, prescriptions, orders
├── pages/
│   ├── LandingPage.jsx                 # Hero, capsule animation, "How It Works" 4 steps
│   ├── LoginPage.jsx                   # Admin vs User tabbed authentication
│   ├── RegisterPage.jsx                # Full user registration form
│   ├── admin/
│   │   ├── AdminDashboard.jsx          # 4 stats, shortcuts, recent orders
│   │   ├── ExpiryAlertsPage.jsx        # Expired, near-expiry, low-stock quarantine
│   │   ├── MedicinesManagementPage.jsx # Full inventory table with Add/Edit/Delete
│   │   ├── OrdersManagementPage.jsx    # Orders review & 5-stage status updater
│   │   ├── PharmacyAInventoryPage.jsx  # Pharmacy A dedicated stock & price
│   │   ├── PharmacyBInventoryPage.jsx  # Pharmacy B dedicated stock & price
│   │   └── PrescriptionsManagementPage.jsx # OCR review & verify/reject workflow
│   └── user/
│       ├── CheckoutPage.jsx            # Separate orders for Pharmacy A & B + PhonePe launch
│       ├── MedicineComparePage.jsx     # Side-by-side price & stock comparison
│       ├── MyOrdersPage.jsx            # 5-stage stepper order tracker
│       ├── PrescriptionsListPage.jsx   # Patient prescription history
│       ├── UploadPrescriptionPage.jsx  # Upload JPG/PNG/PDF, OCR scan simulation
│       ├── UserDashboard.jsx           # 4 action cards, summary
│       └── UserProfilePage.jsx         # Profile & delivery address editor
├── routes/
│   └── AppRoutes.jsx                   # Role-based route protection
├── utils/
│   ├── dateUtils.js                    # Expiry, near-expiry, currency formatting
│   └── ocrSimulator.js                 # Multi-stage OCR scanner simulation
├── App.jsx
├── index.css
└── main.jsx
```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
Development server runs at `http://localhost:3000/`.
