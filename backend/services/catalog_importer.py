"""
Pharmacy A and Pharmacy B Verified Dataset Importer (50 + 50 Medicines).

Replaces the previous legacy catalog dataset with the verified 50-medicine
Pharmacy A inventory and 50-medicine Pharmacy B inventory, preserving exact
batch numbers, stock quantities, INR prices, manufacture dates, and expiry dates.
"""

import json
from datetime import date
from models import db
from models.medicine import Medicine
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from utils.medicine_images import resolve_medicine_image

OLD_DATA_SOURCES = ('Seeded Sample', 'Pharmacy A PDF', 'Pharmacy B PDF')
OLD_SAMPLE_BATCHES = {
    'AMX-2026-A1', 'AMX-2026-B4', 'PCM-2026-A8', 'PCM-2026-B2',
    'AZI-2026-A3', 'AZI-2026-B9', 'PAN-2026-A5', 'PAN-2026-B1',
    'MET-2026-A2', 'MET-2026-B7', 'ATV-2026-A9', 'ATV-2026-B3',
    'CTZ-2026-A6', 'CTZ-2026-B8', 'CRS-2025-A1', 'INS-2026-B5',
    'DIC-2026-A4',
}

# Canonical metadata for all 54 unique medicines across Pharmacy A & Pharmacy B:
# key -> (name, generic_name, strength, form, category, indication, rx_required, rx_status)
MEDICINE_CATALOG = {
    "Paracetamol 500mg": ("Paracetamol", "Acetaminophen", "500mg", "Tablet", "Pain & Fever Relief", "Fever and mild to moderate pain", False, "Non-prescription (OTC)"),
    "Ibuprofen 400mg": ("Ibuprofen", "Ibuprofen", "400mg", "Tablet", "Pain & Inflammation", "Pain, fever, and inflammation", False, "Non-prescription (OTC)"),
    "Amoxicillin 500mg": ("Amoxicillin", "Amoxicillin Trihydrate", "500mg", "Capsule", "Antibiotics", "Susceptible bacterial infections", True, "Rx"),
    "Cetirizine 10mg": ("Cetirizine", "Cetirizine Dihydrochloride", "10mg", "Tablet", "Allergy & Antihistamine", "Allergic rhinitis, sneezing, and itching", False, "Non-prescription (OTC)"),
    "Omeprazole 20mg": ("Omeprazole", "Omeprazole Magnesium", "20mg", "Capsule", "Digestive & Acid Care", "Acid reflux, GERD, and peptic ulcer", True, "Rx"),
    "ORS Powder": ("ORS", "Oral Rehydration Salts", None, "Powder", "Hydration & Electrolytes", "Rehydration and electrolyte replacement", False, "Non-prescription (OTC)"),
    "Cough Syrup 100ml": ("Cough Syrup", "Dextromethorphan + Chlorpheniramine", "100ml", "Syrup", "Respiratory & Cough", "Dry and productive cough relief", False, "Non-prescription (OTC)"),
    "Azithromycin 500mg": ("Azithromycin", "Azithromycin Dihydrate", "500mg", "Tablet", "Antibiotics", "Respiratory and bacterial infections", True, "Rx"),
    "Vitamin C 500mg": ("Vitamin C", "Ascorbic Acid", "500mg", "Tablet", "Vitamins & Supplements", "Vitamin C supplementation and immunity", False, "Non-prescription (OTC)"),
    "Antacid Gel 170ml": ("Antacid Gel", "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone", "170ml", "Gel", "Digestive & Acid Care", "Acidity, heartburn, and gas relief", False, "Non-prescription (OTC)"),
    "Diclofenac 50mg": ("Diclofenac", "Diclofenac Sodium", "50mg", "Tablet", "Pain & Inflammation", "Acute pain and inflammatory conditions", True, "Rx"),
    "Pantoprazole 40mg": ("Pantoprazole", "Pantoprazole Sodium", "40mg", "Tablet", "Digestive & Acid Care", "Acid reflux and gastric ulcer care", True, "Rx"),
    "Metformin 500mg": ("Metformin", "Metformin Hydrochloride", "500mg", "Tablet", "Diabetes Care", "Type 2 diabetes management", True, "Rx"),
    "Amlodipine 5mg": ("Amlodipine", "Amlodipine Besylate", "5mg", "Tablet", "Blood Pressure & Cardio", "Hypertension and angina", True, "Rx"),
    "Atorvastatin 10mg": ("Atorvastatin", "Atorvastatin Calcium", "10mg", "Tablet", "Blood Pressure & Cardio", "Cholesterol management and cardioprotection", True, "Rx"),
    "Losartan 50mg": ("Losartan", "Losartan Potassium", "50mg", "Tablet", "Blood Pressure & Cardio", "High blood pressure and kidney protection", True, "Rx"),
    "Levocetirizine 5mg": ("Levocetirizine", "Levocetirizine Dihydrochloride", "5mg", "Tablet", "Allergy & Antihistamine", "Allergic rhinitis and chronic urticaria", True, "Rx"),
    "Montelukast 10mg": ("Montelukast", "Montelukast Sodium", "10mg", "Tablet", "Respiratory & Cough", "Asthma prophylaxis and allergic rhinitis", True, "Rx"),
    "Domperidone 10mg": ("Domperidone", "Domperidone Maleate", "10mg", "Tablet", "Digestive & Acid Care", "Nausea, vomiting, and gastric motility", True, "Rx"),
    "Ranitidine 150mg": ("Ranitidine", "Ranitidine Hydrochloride", "150mg", "Tablet", "Digestive & Acid Care", "Gastric acid reduction", True, "Rx"),
    "Ciprofloxacin 500mg": ("Ciprofloxacin", "Ciprofloxacin Hydrochloride", "500mg", "Tablet", "Antibiotics", "Urinary tract and bacterial infections", True, "Rx"),
    "Doxycycline 100mg": ("Doxycycline", "Doxycycline Hyclate", "100mg", "Capsule", "Antibiotics", "Bacterial respiratory and skin infections", True, "Rx"),
    "Cefixime 200mg": ("Cefixime", "Cefixime Trihydrate", "200mg", "Tablet", "Antibiotics", "Susceptible bacterial infections", True, "Rx"),
    "Metronidazole 400mg": ("Metronidazole", "Metronidazole", "400mg", "Tablet", "Antibiotics", "Anaerobic bacterial and protozoal infections", True, "Rx"),
    "Fluconazole 150mg": ("Fluconazole", "Fluconazole", "150mg", "Tablet", "Antifungal", "Fungal and candidal infections", True, "Rx"),
    "Aspirin 75mg": ("Aspirin", "Acetylsalicylic Acid", "75mg", "Tablet", "Blood Pressure & Cardio", "Low-dose antiplatelet cardioprotection", True, "Rx"),
    "Clopidogrel 75mg": ("Clopidogrel", "Clopidogrel Bisulfate", "75mg", "Tablet", "Blood Pressure & Cardio", "Antiplatelet prevention of thrombosis", True, "Rx"),
    "Telmisartan 40mg": ("Telmisartan", "Telmisartan", "40mg", "Tablet", "Blood Pressure & Cardio", "Hypertension and cardiovascular risk reduction", True, "Rx"),
    "Glimepiride 2mg": ("Glimepiride", "Glimepiride", "2mg", "Tablet", "Diabetes Care", "Type 2 diabetes glycemic control", True, "Rx"),
    "Folic Acid 5mg": ("Folic Acid", "Folic Acid (Vitamin B9)", "5mg", "Tablet", "Vitamins & Supplements", "Folate deficiency and anaemia support", False, "Non-prescription (OTC)"),
    "Vitamin B12 Tablet": ("Vitamin B12", "Cyanocobalamin / Methylcobalamin", None, "Tablet", "Vitamins & Supplements", "Vitamin B12 deficiency and nerve support", False, "Non-prescription (OTC)"),
    "Calcium + D3": ("Calcium + D3", "Calcium Carbonate + Cholecalciferol", None, "Tablet", "Vitamins & Supplements", "Bone strength and calcium/vitamin D supplementation", False, "Non-prescription (OTC)"),
    "Zinc 50mg": ("Zinc", "Zinc Sulfate", "50mg", "Tablet", "Vitamins & Supplements", "Zinc supplementation and recovery support", False, "Non-prescription (OTC)"),
    "Multivitamin Capsule": ("Multivitamin", "Multivitamin & Mineral Complex", None, "Capsule", "Vitamins & Supplements", "Daily nutritional supplementation", False, "Non-prescription (OTC)"),
    "Iron + Folic Acid": ("Iron + Folic Acid", "Ferrous Ascorbate + Folic Acid", None, "Tablet", "Vitamins & Supplements", "Iron-deficiency anaemia management", False, "Non-prescription (OTC)"),
    "Loperamide 2mg": ("Loperamide", "Loperamide Hydrochloride", "2mg", "Capsule", "Digestive & Acid Care", "Acute non-infectious diarrhoea control", False, "Non-prescription (OTC)"),
    "Ondansetron 4mg": ("Ondansetron", "Ondansetron Hydrochloride", "4mg", "Tablet", "Digestive & Acid Care", "Prevention and control of nausea and vomiting", True, "Rx"),
    "Salbutamol Syrup": ("Salbutamol", "Salbutamol Sulfate", None, "Syrup", "Respiratory & Cough", "Bronchodilation in bronchospasm and asthma", True, "Rx"),
    "Ambroxol Syrup": ("Ambroxol", "Ambroxol Hydrochloride", None, "Syrup", "Respiratory & Cough", "Mucolytic relief for productive cough", False, "Non-prescription (OTC)"),
    "Paracetamol Syrup 60ml": ("Paracetamol Syrup", "Acetaminophen Paediatric Suspension", "60ml", "Syrup", "Pain & Fever Relief", "Paediatric fever and pain relief", False, "Non-prescription (OTC)"),
    "Lactulose Solution": ("Lactulose", "Lactulose Oral Solution", None, "Solution", "Digestive & Acid Care", "Constipation and hepatic encephalopathy", False, "Non-prescription (OTC)"),
    "Digene Antacid Syrup": ("Digene Antacid", "Magnesium Hydroxide + Simethicone + Sodium Carboxymethylcellulose", None, "Syrup", "Digestive & Acid Care", "Acidity, indigestion, and bloating", False, "Non-prescription (OTC)"),
    "Dextromethorphan Syrup": ("Dextromethorphan", "Dextromethorphan Hydrobromide", None, "Syrup", "Respiratory & Cough", "Dry cough suppression", False, "Non-prescription (OTC)"),
    "Budecort 1mg Inhaler": ("Budecort", "Budesonide", "1mg", "Inhaler", "Respiratory & Cough", "Airway inflammation control in asthma", True, "Rx"),
    "Glucose D Powder": ("Glucose D", "Dextrose Monohydrate + Vitamin D", None, "Powder", "Hydration & Electrolytes", "Instant energy and hydration replenishment", False, "Non-prescription (OTC)"),
    "Electral ORS": ("Electral ORS", "WHO Oral Rehydration Salts", None, "Powder", "Hydration & Electrolytes", "Electrolyte and fluid replacement", False, "Non-prescription (OTC)"),
    "Pantoprazole Sachet": ("Pantoprazole Sachet", "Pantoprazole Sodium Granules", None, "Sachet", "Digestive & Acid Care", "Rapid acid reflux relief", True, "Rx"),
    "Levothyroxine 50mcg": ("Levothyroxine", "Levothyroxine Sodium", "50mcg", "Tablet", "Thyroid Care", "Hypothyroidism hormone replacement", True, "Rx"),
    "Dolo 650mg": ("Dolo", "Paracetamol 650mg", "650mg", "Tablet", "Pain & Fever Relief", "Fever and body ache relief", False, "Non-prescription (OTC)"),
    "Doxoflow M": ("Doxoflow M", "Doxofylline + Montelukast", None, "Tablet", "Respiratory & Cough", "Asthma and chronic airway obstruction", True, "Rx"),
    "Crocin Advance": ("Crocin Advance", "Paracetamol Fast-Release", None, "Tablet", "Pain & Fever Relief", "Fast fever and headache relief", False, "Non-prescription (OTC)"),
    "Povidone Iodine Solution": ("Povidone Iodine", "Povidone-Iodine 5% / 10%", None, "Solution", "Antiseptic & Wound Care", "Topical antiseptic wound cleansing", False, "Non-prescription (OTC)"),
    "Becosules Capsule": ("Becosules", "Vitamin B-Complex + Vitamin C", None, "Capsule", "Vitamins & Supplements", "B-complex and vitamin C deficiency", False, "Non-prescription (OTC)"),
    "Rabeprazole 20mg": ("Rabeprazole", "Rabeprazole Sodium", "20mg", "Tablet", "Digestive & Acid Care", "Acid reflux and peptic ulcer disease", True, "Rx"),
}

# Pharmacy A - Medicine Inventory (50 Medicines: 3 expired, 5 near expiry, 42 safe)
PHARMACY_A_DATASET = [
    ("PA-01", "Paracetamol 500mg",      "BN12827", 194,  17.85, "2026-02-26", "2028-02-26"),
    ("PA-02", "Ibuprofen 400mg",        "BN53496", 164,  33.02, "2024-07-02", "2027-07-02"),
    ("PA-03", "Amoxicillin 500mg",      "BN98858", 183,  81.31, "2025-12-28", "2028-12-27"),
    ("PA-04", "Cetirizine 10mg",        "BN51391", 104,  24.95, "2026-09-01", "2028-08-31"),
    ("PA-05", "Omeprazole 20mg",        "BN43578",  21,  47.02, "2025-06-24", "2027-06-24"),
    ("PA-06", "ORS Powder",             "BN81967", 224,  21.71, "2025-05-15", "2027-05-15"),
    ("PA-07", "Cough Syrup 100ml",      "BN16124", 102,  78.96, "2026-08-03", "2028-08-02"),
    ("PA-08", "Azithromycin 500mg",     "BN70582", 186, 110.14, "2025-01-03", "2028-01-03"),
    ("PA-09", "Vitamin C 500mg",        "BN70666",  65,  30.27, "2026-01-08", "2028-01-08"),
    ("PA-10", "Antacid Gel 170ml",      "BN14801", 231,  99.24, "2025-02-23", "2028-02-23"),
    ("PA-11", "Diclofenac 50mg",        "BN77224", 195,  29.17, "2025-04-10", "2028-04-09"),
    ("PA-12", "Pantoprazole 40mg",      "BN81453",  57,  58.87, "2026-04-16", "2029-04-15"),
    ("PA-13", "Metformin 500mg",        "BN20249",  86,  22.49, "2025-10-25", "2027-10-25"),
    ("PA-14", "Amlodipine 5mg",         "BN16363",  51,  31.46, "2024-10-09", "2027-10-09"),
    ("PA-15", "Atorvastatin 10mg",      "BN41108", 186,  72.28, "2025-05-29", "2027-05-29"),
    ("PA-16", "Losartan 50mg",          "BN17301",  26,  49.45, "2025-09-23", "2027-09-23"),
    ("PA-17", "Levocetirizine 5mg",     "BN83930",  77,  35.46, "2024-09-07", "2027-09-07"),
    ("PA-18", "Montelukast 10mg",       "BN32127", 232, 118.48, "2025-08-14", "2027-08-14"),
    ("PA-19", "Domperidone 10mg",       "BN28507", 242,  27.10, "2025-02-22", "2028-02-22"),
    ("PA-20", "Ranitidine 150mg",       "BN69446", 259,  20.38, "2025-10-13", "2028-10-12"),
    ("PA-21", "Ciprofloxacin 500mg",    "BN48144", 250,  64.37, "2025-01-02", "2027-01-02"),  # Near expiry
    ("PA-22", "Doxycycline 100mg",      "BN79697", 101,  55.70, "2024-11-05", "2026-11-05"),  # Expired
    ("PA-23", "Cefixime 200mg",         "BN21683", 261, 102.61, "2025-10-28", "2027-10-28"),
    ("PA-24", "Metronidazole 400mg",    "BN57359",  42,  16.46, "2025-09-23", "2028-09-22"),
    ("PA-25", "Fluconazole 150mg",      "BN87002",  27,  41.04, "2026-04-08", "2029-04-07"),
    ("PA-26", "Aspirin 75mg",           "BN97596", 153,  12.40, "2025-01-07", "2027-01-07"),  # Near expiry
    ("PA-27", "Clopidogrel 75mg",       "BN95156", 101,  58.47, "2025-04-10", "2028-04-09"),
    ("PA-28", "Telmisartan 40mg",       "BN42858", 176,  63.06, "2025-11-08", "2028-11-07"),
    ("PA-29", "Glimepiride 2mg",        "BN94860", 192,  37.42, "2025-09-21", "2028-09-20"),
    ("PA-30", "Folic Acid 5mg",         "BN55881",  98,  14.52, "2025-06-19", "2028-06-18"),
    ("PA-31", "Vitamin B12 Tablet",     "BN53822", 275,  40.50, "2023-08-28", "2026-08-27"),  # Expired
    ("PA-32", "Calcium + D3",           "BN72552", 154,  89.68, "2026-05-02", "2028-05-01"),
    ("PA-33", "Zinc 50mg",              "BN90842", 274,  36.60, "2023-12-30", "2026-12-29"),  # Near expiry
    ("PA-34", "Multivitamin Capsule",   "BN82510", 148,  76.65, "2026-01-25", "2029-01-24"),
    ("PA-35", "Iron + Folic Acid",      "BN86866", 235,  34.42, "2024-10-07", "2027-10-07"),
    ("PA-36", "Loperamide 2mg",         "BN33662",  31,  25.17, "2026-03-30", "2029-03-29"),
    ("PA-37", "Ondansetron 4mg",        "BN27501",  66,  45.16, "2024-06-21", "2027-06-21"),
    ("PA-38", "Salbutamol Syrup",       "BN81869",  28,  51.56, "2024-01-03", "2027-01-02"),  # Near expiry
    ("PA-39", "Ambroxol Syrup",         "BN90189",  46,  68.61, "2026-03-06", "2029-03-05"),
    ("PA-40", "Paracetamol Syrup 60ml", "BN55943", 217,  45.99, "2023-12-27", "2026-12-26"),  # Near expiry
    ("PA-41", "Lactulose Solution",     "BN81728", 201, 120.34, "2025-08-22", "2027-08-22"),
    ("PA-42", "Digene Antacid Syrup",   "BN22428", 161,  82.37, "2025-03-01", "2028-02-29"),
    ("PA-43", "Dextromethorphan Syrup", "BN56087",  76,  71.42, "2024-10-11", "2026-10-11"),  # Expired
    ("PA-44", "Budecort 1mg Inhaler",   "BN80567", 199, 159.48, "2026-02-13", "2029-02-12"),
    ("PA-45", "Glucose D Powder",       "BN83906", 254,  47.06, "2026-05-23", "2028-05-22"),
    ("PA-46", "Electral ORS",           "BN56021",  10,  23.72, "2025-07-29", "2027-07-29"),  # Low stock
    ("PA-47", "Pantoprazole Sachet",    "BN80703",  82,  29.48, "2026-01-16", "2029-01-15"),
    ("PA-48", "Levothyroxine 50mcg",    "BN66256", 231,  47.15, "2026-05-16", "2028-05-15"),
    ("PA-49", "Dolo 650mg",             "BN59778", 206,  33.48, "2025-08-31", "2028-08-30"),
    ("PA-50", "Doxoflow M",             "BN44055", 164, 129.95, "2025-12-26", "2028-12-25"),
]

# Pharmacy B - Medicine Inventory (50 Medicines: 3 expired, 5 near expiry, 42 safe)
PHARMACY_B_DATASET = [
    ("PB-01", "Azithromycin 500mg",       "PB28830", 161, 106.42, "2024-12-09", "2026-12-09"),  # Near expiry
    ("PB-02", "Antacid Gel 170ml",        "PB37207", 297,  93.28, "2025-09-23", "2027-09-23"),
    ("PB-03", "Montelukast 10mg",         "PB25363", 195, 116.23, "2026-01-15", "2028-01-15"),
    ("PB-04", "Ibuprofen 400mg",          "PB11461",  34,  31.48, "2026-02-15", "2028-02-15"),
    ("PB-05", "Electral ORS",             "PB62351", 207,  23.79, "2025-04-06", "2028-04-05"),
    ("PB-06", "Loperamide 2mg",           "PB33753",  29,  25.02, "2024-07-30", "2027-07-30"),
    ("PB-07", "Folic Acid 5mg",           "PB40174", 169,  14.50, "2025-07-25", "2028-07-24"),
    ("PB-08", "Cefixime 200mg",           "PB51147", 121, 107.77, "2024-08-13", "2027-08-13"),
    ("PB-09", "Cetirizine 10mg",          "PB48846", 234,  25.63, "2026-05-24", "2028-05-23"),
    ("PB-10", "Paracetamol Syrup 60ml",   "PB43582",  45,  44.01, "2025-07-02", "2028-07-01"),
    ("PB-11", "Zinc 50mg",                "PB79893",  75,  37.55, "2026-08-28", "2028-08-27"),
    ("PB-12", "Dextromethorphan Syrup",   "PB63652",  91,  70.43, "2026-02-18", "2028-02-18"),
    ("PB-13", "Crocin Advance",           "PB97396", 235,  27.14, "2026-01-20", "2029-01-19"),
    ("PB-14", "Paracetamol 500mg",        "PB10565", 191,  18.35, "2025-04-15", "2028-04-14"),
    ("PB-15", "Vitamin B12 Tablet",       "PB97532",  97,  43.22, "2026-03-08", "2029-03-07"),
    ("PB-16", "Ciprofloxacin 500mg",      "PB40308", 219,  67.34, "2026-04-20", "2029-04-19"),
    ("PB-17", "Povidone Iodine Solution", "PB24723", 266,  60.19, "2024-04-30", "2027-04-30"),
    ("PB-18", "Ranitidine 150mg",         "PB98119",  95,  20.02, "2026-03-10", "2028-03-09"),
    ("PB-19", "Lactulose Solution",       "PB44590", 223, 114.63, "2024-11-23", "2027-11-23"),
    ("PB-20", "Amoxicillin 500mg",        "PB92797", 157,  82.45, "2024-01-13", "2027-01-12"),  # Near expiry
    ("PB-21", "Diclofenac 50mg",          "PB19905",  26,  29.29, "2026-03-07", "2028-03-06"),
    ("PB-22", "Domperidone 10mg",         "PB83037", 161,  25.20, "2026-05-10", "2028-05-09"),
    ("PB-23", "Ondansetron 4mg",          "PB32577", 145,  45.82, "2025-06-09", "2028-06-08"),
    ("PB-24", "Glimepiride 2mg",          "PB60989", 224,  38.24, "2025-07-28", "2028-07-27"),
    ("PB-25", "Glucose D Powder",         "PB42789", 116,  43.98, "2026-04-30", "2028-04-29"),
    ("PB-26", "Omeprazole 20mg",          "PB72806", 253,  45.74, "2023-09-12", "2026-09-11"),  # Expired
    ("PB-27", "Cough Syrup 100ml",        "PB70276", 277,  74.22, "2024-12-28", "2027-12-28"),
    ("PB-28", "Doxycycline 100mg",        "PB54007",  12,  55.38, "2024-07-09", "2027-07-09"),  # Low stock
    ("PB-29", "Telmisartan 40mg",         "PB11573", 173,  61.47, "2024-12-20", "2026-12-20"),  # Near expiry
    ("PB-30", "Salbutamol Syrup",         "PB16224", 213,  49.59, "2025-12-20", "2028-12-19"),
    ("PB-31", "Pantoprazole Sachet",      "PB82779", 159,  28.98, "2025-12-18", "2027-12-18"),
    ("PB-32", "Metronidazole 400mg",      "PB64751", 127,  16.49, "2026-04-09", "2029-04-08"),
    ("PB-33", "Amlodipine 5mg",           "PB45756", 151,  39.61, "2024-10-19", "2027-10-19"),
    ("PB-34", "Clopidogrel 75mg",         "PB83269",  98,  59.17, "2025-11-15", "2027-11-15"),
    ("PB-35", "Becosules Capsule",        "PB98850",  68,  51.12, "2025-07-19", "2027-07-19"),
    ("PB-36", "Calcium + D3",             "PB81476",  54,  83.89, "2024-09-27", "2027-09-27"),
    ("PB-37", "Digene Antacid Syrup",     "PB56387", 128,  82.94, "2023-09-20", "2026-09-19"),  # Expired
    ("PB-38", "Iron + Folic Acid",        "PB54576",  37,  35.34, "2025-01-11", "2027-01-11"),  # Near expiry
    ("PB-39", "Multivitamin Capsule",     "PB34640", 167,  72.60, "2023-08-13", "2026-08-12"),  # Expired
    ("PB-40", "Dolo 650mg",               "PB94266", 276,  32.74, "2026-09-17", "2028-09-16"),
    ("PB-41", "Levocetirizine 5mg",       "PB99407",  59,  35.99, "2026-05-17", "2028-05-16"),
    ("PB-42", "ORS Powder",               "PB88965",  51,  22.83, "2025-07-25", "2028-07-24"),
    ("PB-43", "Vitamin C 500mg",          "PB58905", 139,  29.44, "2026-07-25", "2028-07-24"),
    ("PB-44", "Losartan 50mg",            "PB12671", 163,  50.15, "2025-06-07", "2028-06-06"),
    ("PB-45", "Atorvastatin 10mg",        "PB82876", 161,  89.09, "2025-02-13", "2028-02-13"),
    ("PB-46", "Rabeprazole 20mg",         "PB15281", 191,  57.98, "2025-07-10", "2027-07-10"),
    ("PB-47", "Ambroxol Syrup",           "PB97030", 177,  70.08, "2025-04-04", "2028-04-03"),
    ("PB-48", "Metformin 500mg",          "PB89989", 126,  28.74, "2026-01-29", "2028-01-29"),
    ("PB-49", "Fluconazole 150mg",        "PB62369", 224,  40.05, "2025-02-16", "2028-02-16"),
    ("PB-50", "Aspirin 75mg",             "PB78697", 218,  12.59, "2023-12-18", "2026-12-17"),  # Near expiry
]


def _purge_legacy_dataset():
    """Removes any records belonging to the superseded legacy dataset."""
    old_batches = Inventory.query.filter(
        (Inventory.data_source.in_(OLD_DATA_SOURCES)) |
        (Inventory.batch_number.in_(OLD_SAMPLE_BATCHES))
    ).all()

    if not old_batches:
        return 0

    removed = 0
    for inv in old_batches:
        db.session.delete(inv)
        removed += 1
    db.session.flush()

    # Delete Medicine records that no longer have any inventory batches
    orphans = Medicine.query.filter(~Medicine.inventory_batches.any()).all()
    for med in orphans:
        db.session.delete(med)
    db.session.commit()
    return removed


def _import_dataset_for_pharmacy(pharmacy_obj, rows, data_source):
    inserted = 0
    skipped_duplicates = 0

    for item_no, label, batch_number, qty, price, mfg_str, exp_str in rows:
        name, generic_name, strength, form, category, indication, rx_required, rx_status = MEDICINE_CATALOG[label]

        med = Medicine.query.filter_by(name=name, strength=strength, form=form).first()
        if not med:
            med = Medicine(
                name=name,
                generic_name=generic_name,
                category=category,
                strength=strength,
                form=form,
                indication=indication,
                prescription_status=rx_status,
                prescription_required=rx_required,
                image_url=resolve_medicine_image(name, strength, form),
            )
            db.session.add(med)
            db.session.flush()
        else:
            med.generic_name = generic_name
            med.category = category
            med.indication = indication
            med.prescription_status = rx_status
            med.prescription_required = rx_required
            med.image_url = resolve_medicine_image(name, strength, form)

        existing_inv = Inventory.query.filter_by(
            pharmacy_id=pharmacy_obj.id,
            medicine_id=med.id,
            batch_number=batch_number,
        ).first()
        if existing_inv:
            skipped_duplicates += 1
            continue

        inv = Inventory(
            medicine_id=med.id,
            pharmacy_id=pharmacy_obj.id,
            catalog_item_no=item_no,
            batch_number=batch_number,
            quantity=int(qty),
            price=float(price),
            mfg_date=date.fromisoformat(mfg_str) if mfg_str else None,
            expiry_date=date.fromisoformat(exp_str),
            data_source=data_source,
            missing_fields=json.dumps([]),
        )
        db.session.add(inv)
        inserted += 1

    return {'inserted': inserted, 'skipped_duplicates': skipped_duplicates}


def import_pharmacy_catalogs():
    """
    Replaces any legacy dataset and idempotently imports the verified
    50-medicine Pharmacy A and 50-medicine Pharmacy B inventories.
    """
    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    if not pharma_a or not pharma_b:
        raise RuntimeError("Pharmacy A and Pharmacy B must exist before importing catalogs.")

    purged = _purge_legacy_dataset()
    res_a = _import_dataset_for_pharmacy(pharma_a, PHARMACY_A_DATASET, 'Pharmacy A Inventory v2')
    res_b = _import_dataset_for_pharmacy(pharma_b, PHARMACY_B_DATASET, 'Pharmacy B Inventory v2')
    db.session.commit()

    return {
        'purged_legacy': purged,
        'pharmacy_a': res_a,
        'pharmacy_b': res_b,
    }
