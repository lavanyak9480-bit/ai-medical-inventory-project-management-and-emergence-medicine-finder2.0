/**
 * Mock Data for MediFind AI
 * Contains realistic medicines across Pharmacy A and Pharmacy B,
 * sample prescriptions with OCR data, demo users, and initial orders.
 */

export const INITIAL_MEDICINES = [
  {
    id: "med-1",
    name: "Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    strength: "500mg",
    form: "Capsule",
    prescriptionRequired: true,
    pharmacy: "Pharmacy A",
    batchNumber: "AMX-2026-A1",
    quantity: 85,
    price: 95.0,
    mfgDate: "2026-01-10",
    expiryDate: "2027-06-30",
  },
  {
    id: "med-2",
    name: "Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    strength: "500mg",
    form: "Capsule",
    prescriptionRequired: true,
    pharmacy: "Pharmacy B",
    batchNumber: "AMX-2026-B4",
    quantity: 120,
    price: 88.5,
    mfgDate: "2026-02-15",
    expiryDate: "2027-08-20",
  },
  {
    id: "med-3",
    name: "Paracetamol",
    genericName: "Acetaminophen",
    strength: "650mg",
    form: "Tablet",
    prescriptionRequired: false,
    pharmacy: "Pharmacy A",
    batchNumber: "PCM-2026-A8",
    quantity: 210,
    price: 32.0,
    mfgDate: "2026-03-01",
    expiryDate: "2028-02-28",
  },
  {
    id: "med-4",
    name: "Paracetamol",
    genericName: "Acetaminophen",
    strength: "650mg",
    form: "Tablet",
    prescriptionRequired: false,
    pharmacy: "Pharmacy B",
    batchNumber: "PCM-2026-B2",
    quantity: 15, // Low stock test
    price: 30.0,
    mfgDate: "2026-01-20",
    expiryDate: "2028-01-15",
  },
  {
    id: "med-5",
    name: "Azithromycin",
    genericName: "Azithromycin Dihydrate",
    strength: "500mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy A",
    batchNumber: "AZI-2026-A3",
    quantity: 8, // Low stock test
    price: 135.0,
    mfgDate: "2025-11-05",
    expiryDate: "2026-12-15", // Near expiry test (< 30 days)
  },
  {
    id: "med-6",
    name: "Azithromycin",
    genericName: "Azithromycin Dihydrate",
    strength: "500mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy B",
    batchNumber: "AZI-2026-B9",
    quantity: 65,
    price: 128.0,
    mfgDate: "2026-02-10",
    expiryDate: "2027-09-15",
  },
  {
    id: "med-7",
    name: "Pantoprazole",
    genericName: "Pantoprazole Sodium",
    strength: "40mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy A",
    batchNumber: "PAN-2026-A5",
    quantity: 140,
    price: 78.0,
    mfgDate: "2026-04-12",
    expiryDate: "2027-11-30",
  },
  {
    id: "med-8",
    name: "Pantoprazole",
    genericName: "Pantoprazole Sodium",
    strength: "40mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy B",
    batchNumber: "PAN-2026-B1",
    quantity: 0, // Out of stock test in Pharmacy B
    price: 75.0,
    mfgDate: "2025-10-01",
    expiryDate: "2027-04-30",
  },
  {
    id: "med-9",
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    strength: "500mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy A",
    batchNumber: "MET-2026-A2",
    quantity: 320,
    price: 45.0,
    mfgDate: "2026-01-05",
    expiryDate: "2028-04-20",
  },
  {
    id: "med-10",
    name: "Metformin",
    genericName: "Metformin Hydrochloride",
    strength: "500mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy B",
    batchNumber: "MET-2026-B7",
    quantity: 280,
    price: 42.0,
    mfgDate: "2026-02-18",
    expiryDate: "2028-06-10",
  },
  {
    id: "med-11",
    name: "Atorvastatin",
    genericName: "Atorvastatin Calcium",
    strength: "20mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy A",
    batchNumber: "ATV-2026-A9",
    quantity: 90,
    price: 110.0,
    mfgDate: "2026-03-10",
    expiryDate: "2027-12-31",
  },
  {
    id: "med-12",
    name: "Atorvastatin",
    genericName: "Atorvastatin Calcium",
    strength: "20mg",
    form: "Tablet",
    prescriptionRequired: true,
    pharmacy: "Pharmacy B",
    batchNumber: "ATV-2026-B3",
    quantity: 115,
    price: 105.0,
    mfgDate: "2026-01-14",
    expiryDate: "2027-10-25",
  },
  {
    id: "med-13",
    name: "Cetirizine",
    genericName: "Cetirizine Dihydrochloride",
    strength: "10mg",
    form: "Tablet",
    prescriptionRequired: false,
    pharmacy: "Pharmacy A",
    batchNumber: "CTZ-2026-A6",
    quantity: 175,
    price: 25.0,
    mfgDate: "2026-02-01",
    expiryDate: "2028-01-31",
  },
  {
    id: "med-14",
    name: "Cetirizine",
    genericName: "Cetirizine Dihydrochloride",
    strength: "10mg",
    form: "Tablet",
    prescriptionRequired: false,
    pharmacy: "Pharmacy B",
    batchNumber: "CTZ-2026-B8",
    quantity: 190,
    price: 24.5,
    mfgDate: "2026-03-15",
    expiryDate: "2028-03-31",
  },
  {
    id: "med-15",
    name: "Cough Relief Syrup",
    genericName: "Dextromethorphan HBr",
    strength: "100ml",
    form: "Syrup",
    prescriptionRequired: false,
    pharmacy: "Pharmacy A",
    batchNumber: "CRS-2025-A1",
    quantity: 12,
    price: 85.0,
    mfgDate: "2025-05-10",
    expiryDate: "2026-10-15", // Expired batch test! Expired date (2026-10-15 < 2026-11-23)
  },
  {
    id: "med-16",
    name: "Insulin Glargine",
    genericName: "Insulin Glargine recombinant",
    strength: "100IU/ml",
    form: "Injection",
    prescriptionRequired: true,
    pharmacy: "Pharmacy B",
    batchNumber: "INS-2026-B5",
    quantity: 24,
    price: 590.0,
    mfgDate: "2026-04-01",
    expiryDate: "2027-01-15", // Near expiry test (< 60 days)
  },
  {
    id: "med-17",
    name: "Diclofenac Gel",
    genericName: "Diclofenac Diethylamine",
    strength: "30g",
    form: "Ointment",
    prescriptionRequired: false,
    pharmacy: "Pharmacy A",
    batchNumber: "DIC-2026-A4",
    quantity: 5, // Low stock test
    price: 65.0,
    mfgDate: "2025-12-10",
    expiryDate: "2027-05-20",
  }
];

export const SAMPLE_PRESCRIPTIONS = [
  {
    id: "sample-rx-1",
    title: "General Physician Rx - Respiratory & Fever",
    doctorName: "Dr. Arvind Sharma, MBBS, MD",
    clinic: "City Life Care Hospital, OPD-14",
    date: "2026-11-20",
    previewUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80",
    extractedMedicines: [
      {
        id: "ext-1",
        name: "Amoxicillin",
        strength: "500mg",
        dosage: "1 capsule",
        frequency: "3 times daily after food",
        duration: "5 days",
        confidence: "High",
      },
      {
        id: "ext-2",
        name: "Paracetamol",
        strength: "650mg",
        dosage: "1 tablet",
        frequency: "SOS / every 6 hours if fever",
        duration: "3 days",
        confidence: "High",
      },
      {
        id: "ext-3",
        name: "Cetirizine",
        strength: "10mg",
        dosage: "1 tablet",
        frequency: "Once daily at bedtime",
        duration: "5 days",
        confidence: "High",
      }
    ]
  },
  {
    id: "sample-rx-2",
    title: "Cardiologist Rx - Chronic Care Management",
    doctorName: "Dr. Sunita Patel, MD, DM (Cardio)",
    clinic: "Apex Heart & Vascular Institute",
    date: "2026-11-18",
    previewUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
    extractedMedicines: [
      {
        id: "ext-4",
        name: "Atorvastatin",
        strength: "20mg",
        dosage: "1 tablet",
        frequency: "Once daily at night",
        duration: "30 days",
        confidence: "High",
      },
      {
        id: "ext-5",
        name: "Metformin",
        strength: "500mg",
        dosage: "1 tablet",
        frequency: "Twice daily after meals",
        duration: "30 days",
        confidence: "High",
      },
      {
        id: "ext-6",
        name: "Pantoprazole",
        strength: "40mg",
        dosage: "1 tablet",
        frequency: "Once daily before breakfast",
        duration: "15 days",
        confidence: "High",
      }
    ]
  },
  {
    id: "sample-rx-3",
    title: "Handwritten Rx with Ambiguous Notation (Test Fallback)",
    doctorName: "Dr. K. N. Verma, General Physician",
    clinic: "Verma Polyclinic",
    date: "2026-11-21",
    previewUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80",
    extractedMedicines: [
      {
        id: "ext-7",
        name: "Azithromycin",
        strength: "500mg",
        dosage: "1 tablet",
        frequency: "Once daily 1 hr before meal",
        duration: "3 days",
        confidence: "High",
      },
      {
        id: "ext-8",
        name: "Unable to detect – manual confirmation required.",
        strength: "Unable to detect – manual confirmation required.",
        dosage: "1 tablet",
        frequency: "Twice daily",
        duration: "Unable to detect – manual confirmation required.",
        confidence: "Low",
      }
    ]
  }
];

export const INITIAL_PRESCRIPTIONS = [
  {
    id: "rx-101",
    userId: "usr-1",
    userName: "Rahul Verma",
    fileName: "prescription_nov20_chest_fever.jpg",
    fileType: "image/jpeg",
    fileSize: "1.4 MB",
    uploadedAt: "2026-11-20T10:30:00Z",
    status: "Verified",
    reviewedBy: "Admin",
    reviewNotes: "All medicines validated against prescription scan.",
    medicines: [
      { name: "Amoxicillin", strength: "500mg", dosage: "1 cap", frequency: "Thrice daily", duration: "5 days" },
      { name: "Paracetamol", strength: "650mg", dosage: "1 tab", frequency: "SOS", duration: "3 days" }
    ]
  },
  {
    id: "rx-102",
    userId: "usr-1",
    userName: "Rahul Verma",
    fileName: "rx_cardio_followup.png",
    fileType: "image/png",
    fileSize: "850 KB",
    uploadedAt: "2026-11-22T14:15:00Z",
    status: "Pending Verification",
    reviewedBy: null,
    reviewNotes: null,
    medicines: [
      { name: "Atorvastatin", strength: "20mg", dosage: "1 tab", frequency: "Once daily at bedtime", duration: "30 days" },
      { name: "Metformin", strength: "500mg", dosage: "1 tab", frequency: "Twice daily", duration: "30 days" }
    ]
  },
  {
    id: "rx-103",
    userId: "usr-2",
    userName: "Priya Nair",
    fileName: "dr_mehta_prescription_blurry.jpg",
    fileType: "image/jpeg",
    fileSize: "2.1 MB",
    uploadedAt: "2026-11-21T09:00:00Z",
    status: "Rejected",
    reviewedBy: "Admin",
    reviewNotes: "Doctor seal and signature unreadable. Please upload a clear photo or hospital bill copy.",
    medicines: [
      { name: "Unable to detect – manual confirmation required.", strength: "Unable to detect – manual confirmation required.", dosage: "Unknown", frequency: "Unknown", duration: "Unknown" }
    ]
  }
];

export const INITIAL_ORDERS = [
  {
    id: "ORD-9481A",
    userId: "usr-1",
    userName: "Rahul Verma",
    userPhone: "+91 98765 43210",
    userAddress: "Flat 402, Green Valley Apts, Indiranagar, Bengaluru - 560038",
    pharmacy: "Pharmacy A",
    createdAt: "2026-11-21T11:20:00Z",
    medicines: [
      { name: "Amoxicillin 500mg", quantity: 2, price: 95.0, subtotal: 190.0 },
      { name: "Paracetamol 650mg", quantity: 1, price: 32.0, subtotal: 32.0 }
    ],
    totalAmount: 222.0,
    paymentStatus: "Paid",
    paymentMethod: "PhonePe UPI (Demo)",
    orderStatus: "Dispatched", // Stages: Order Placed -> Verification -> Preparing -> Dispatched -> Delivered
    trackingUpdates: [
      { stage: "Order Placed", time: "Nov 21, 11:20 AM", done: true },
      { stage: "Verification", time: "Nov 21, 11:45 AM", done: true },
      { stage: "Preparing", time: "Nov 21, 01:10 PM", done: true },
      { stage: "Dispatched", time: "Nov 22, 09:30 AM", done: true },
      { stage: "Delivered", time: "Expected by Nov 24, 05:00 PM", done: false }
    ]
  },
  {
    id: "ORD-9482B",
    userId: "usr-1",
    userName: "Rahul Verma",
    userPhone: "+91 98765 43210",
    userAddress: "Flat 402, Green Valley Apts, Indiranagar, Bengaluru - 560038",
    pharmacy: "Pharmacy B",
    createdAt: "2026-11-22T16:05:00Z",
    medicines: [
      { name: "Atorvastatin 20mg", quantity: 1, price: 105.0, subtotal: 105.0 },
      { name: "Metformin 500mg", quantity: 2, price: 42.0, subtotal: 84.0 }
    ],
    totalAmount: 189.0,
    paymentStatus: "Paid",
    paymentMethod: "PhonePe UPI (Demo)",
    orderStatus: "Preparing",
    trackingUpdates: [
      { stage: "Order Placed", time: "Nov 22, 04:05 PM", done: true },
      { stage: "Verification", time: "Nov 22, 04:30 PM", done: true },
      { stage: "Preparing", time: "Nov 23, 10:00 AM", done: true },
      { stage: "Dispatched", time: "Pending dispatch", done: false },
      { stage: "Delivered", time: "Pending", done: false }
    ]
  }
];

export const DEMO_ADMIN = {
  id: "admin-1",
  name: "Dr. Rajeshwar Rao (Main Admin)",
  email: "admin@medifind.ai",
  role: "admin",
  phone: "+91 94400 12345",
  managedPharmacies: ["Pharmacy A", "Pharmacy B"]
};

export const DEMO_USER = {
  id: "usr-1",
  name: "Rahul Verma",
  email: "rahul.verma@example.com",
  role: "user",
  phone: "+91 98765 43210",
  address: "Flat 402, Green Valley Apts, Indiranagar, Bengaluru - 560038"
};
