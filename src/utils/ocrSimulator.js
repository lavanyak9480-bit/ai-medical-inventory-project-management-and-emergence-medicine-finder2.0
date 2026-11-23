/**
 * Realistic OCR Simulation Utility
 * Simulates analyzing prescription document image or PDF,
 * performing multi-stage image processing and text extraction.
 */

export const OCR_STAGES = [
  { step: 1, label: "Scanning document geometry & contrast..." },
  { step: 2, label: "Detecting handwritten & printed text regions..." },
  { step: 3, label: "Extracting medicine names, dosage, frequency & duration..." },
  { step: 4, label: "Formatting extracted clinical data table..." }
];

/**
 * Simulates OCR extraction on a file or sample prescription.
 * Returns parsed medicines array with realistic fallback if unreadable.
 */
export async function simulateOcrProcessing(fileOrSample, onProgress) {
  // Report progress through 4 stages
  for (let i = 0; i < OCR_STAGES.length; i++) {
    if (onProgress) {
      onProgress({
        stage: i + 1,
        totalStages: OCR_STAGES.length,
        percentage: Math.round(((i + 1) / OCR_STAGES.length) * 100),
        message: OCR_STAGES[i].label
      });
    }
    // Simulate slight processing delay for each step
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  // If a sample was selected that already has extractedMedicines, use them
  if (fileOrSample && fileOrSample.extractedMedicines) {
    return fileOrSample.extractedMedicines;
  }

  // Otherwise, default fallback or realistic extraction from custom file upload:
  return [
    {
      id: "ext-custom-1",
      name: "Amoxicillin",
      strength: "500mg",
      dosage: "1 capsule",
      frequency: "3 times daily after food",
      duration: "5 days",
      confidence: "High"
    },
    {
      id: "ext-custom-2",
      name: "Pantoprazole",
      strength: "40mg",
      dosage: "1 tablet",
      frequency: "Once daily before breakfast",
      duration: "7 days",
      confidence: "High"
    },
    {
      id: "ext-custom-3",
      name: "Paracetamol",
      strength: "650mg",
      dosage: "1 tablet",
      frequency: "SOS / as needed for fever",
      duration: "3 days",
      confidence: "High"
    }
  ];
}
