/**
 * Sample Prescriptions for MediFind AI OCR Quick Testing
 * Aligned with the verified Pharmacy A & Pharmacy B 50+50 Medicine Inventory Dataset.
 */

export const SAMPLE_PRESCRIPTIONS = [
  {
    id: "sample-rx-1",
    title: "General Physician Rx - Respiratory & Fever",
    doctorName: "Dr. Arvind Sharma, MBBS, MD",
    clinic: "City Life Care Hospital, OPD-14",
    date: "2026-11-20",
    previewUrl: "/images/prescriptions/sample-rx-1.svg",
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
        strength: "500mg",
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
    previewUrl: "/images/prescriptions/sample-rx-2.svg",
    extractedMedicines: [
      {
        id: "ext-4",
        name: "Atorvastatin",
        strength: "10mg",
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
    previewUrl: "/images/prescriptions/sample-rx-3.svg",
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
