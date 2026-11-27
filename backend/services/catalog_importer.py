"""
Pharmacy A and Pharmacy B PDF Catalog Importer.

Strictly preserves only fields present in the two provided PDFs:
- Pharmacy A (pharamacy a.pdf): 58 entries across 6 categories (A-F).
- Pharmacy B (pharamacy b.pdf): 138 entries (58 base entries + 80 expanded entries across 8 categories).

Does NOT invent missing strengths, batch numbers, quantities, prices, or expiry dates.
Records missing fields explicitly in `missing_fields` and prevents duplicate imports.
"""

import json
from models import db
from models.medicine import Medicine
from models.inventory import Inventory
from models.pharmacy import Pharmacy
from utils.medicine_images import resolve_medicine_image


def _is_rx_required(status_text):
    if not status_text:
        return False
    s = status_text.strip().lower()
    if s.startswith('rx') or s.startswith('usually rx') or s.startswith('clinician-directed'):
        return True
    if 'tablet usually rx' in s:
        return True
    return False


# Pharmacy A PDF (pages 1-8): 58 entries
PHARMACY_A_ENTRIES = [
    # A. General medicines and syrups (20)
    ("PA-A-01", "Paracetamol", None, "Tablet", "General medicines and syrups", "Fever and mild pain", "OTC status varies"),
    ("PA-A-02", "Cetirizine", None, "Tablet", "General medicines and syrups", "Allergy symptoms such as sneezing and itching", "OTC status varies"),
    ("PA-A-03", "Loratadine", None, "Tablet", "General medicines and syrups", "Allergic rhinitis and hives", "OTC status varies"),
    ("PA-A-04", "Calcium carbonate", None, "Tablet", "General medicines and syrups", "Calcium supplementation; some products relieve acidity", "OTC status varies"),
    ("PA-A-05", "Ferrous sulfate", None, "Tablet", "General medicines and syrups", "Iron-deficiency anaemia", "Usually Rx / pharmacist guidance"),
    ("PA-A-06", "Vitamin B-complex", None, "Tablet", "General medicines and syrups", "Vitamin B deficiency prevention or treatment", "Product-dependent"),
    ("PA-A-07", "Vitamin C (ascorbic acid)", None, "Tablet", "General medicines and syrups", "Vitamin C supplementation", "Product-dependent"),
    ("PA-A-08", "Pantoprazole", None, "Tablet", "General medicines and syrups", "Acid reflux and stomach-ulcer conditions", "Usually Rx"),
    ("PA-A-09", "Famotidine", None, "Tablet", "General medicines and syrups", "Acidity and acid-related indigestion", "Product-dependent"),
    ("PA-A-10", "Loperamide", None, "Tablet/capsule", "General medicines and syrups", "Short-term control of diarrhoea in selected cases", "OTC status varies"),
    ("PA-A-11", "Dextromethorphan", None, "Syrup", "General medicines and syrups", "Dry cough symptom relief", "Age/product restrictions apply"),
    ("PA-A-12", "Guaifenesin", None, "Syrup", "General medicines and syrups", "Helps loosen mucus in chesty cough", "Product-dependent"),
    ("PA-A-13", "Ambroxol", None, "Syrup", "General medicines and syrups", "Mucus-thinning medicine for productive cough", "Usually Rx / varies"),
    ("PA-A-14", "Cetirizine", None, "Syrup", "General medicines and syrups", "Allergy symptoms", "OTC status varies"),
    ("PA-A-15", "Paracetamol", None, "Syrup/suspension", "General medicines and syrups", "Fever and mild pain", "OTC status varies"),
    ("PA-A-16", "Antacid combination (aluminium hydroxide + magnesium hydroxide)", None, "Suspension", "General medicines and syrups", "Acidity and heartburn symptoms", "OTC status varies"),
    ("PA-A-17", "Lactulose", None, "Syrup", "General medicines and syrups", "Constipation", "Usually Rx / pharmacist guidance"),
    ("PA-A-18", "ORS (oral rehydration salts)", None, "Oral solution/sachet", "General medicines and syrups", "Prevention and treatment of dehydration from fluid loss", "Non-prescription product"),
    ("PA-A-19", "Zinc sulfate", None, "Syrup", "General medicines and syrups", "Zinc supplementation; used in some diarrhoea care plans", "Product-dependent"),
    ("PA-A-20", "Calamine", None, "Lotion", "General medicines and syrups", "Itchy skin irritation", "Non-prescription product"),

    # B. Diabetes medicines (10)
    ("PA-B-01", "Metformin", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),
    ("PA-B-02", "Glimepiride", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),
    ("PA-B-03", "Gliclazide", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),
    ("PA-B-04", "Glipizide", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),
    ("PA-B-05", "Sitagliptin", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),
    ("PA-B-06", "Linagliptin", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),
    ("PA-B-07", "Vildagliptin", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),
    ("PA-B-08", "Empagliflozin", None, "Tablet", "Diabetes medicines", "Type 2 diabetes; may also be prescribed for selected heart/kidney conditions", "Rx"),
    ("PA-B-09", "Dapagliflozin", None, "Tablet", "Diabetes medicines", "Type 2 diabetes; may also be prescribed for selected heart/kidney conditions", "Rx"),
    ("PA-B-10", "Pioglitazone", None, "Tablet", "Diabetes medicines", "Type 2 diabetes", "Rx"),

    # C. Blood-pressure medicines (10)
    ("PA-C-01", "Amlodipine", None, "Tablet", "Blood-pressure medicines", "High blood pressure; some forms also treat angina", "Rx"),
    ("PA-C-02", "Telmisartan", None, "Tablet", "Blood-pressure medicines", "High blood pressure", "Rx"),
    ("PA-C-03", "Losartan", None, "Tablet", "Blood-pressure medicines", "High blood pressure; selected kidney/heart indications", "Rx"),
    ("PA-C-04", "Olmesartan", None, "Tablet", "Blood-pressure medicines", "High blood pressure", "Rx"),
    ("PA-C-05", "Enalapril", None, "Tablet", "Blood-pressure medicines", "High blood pressure and some heart conditions", "Rx"),
    ("PA-C-06", "Ramipril", None, "Tablet/capsule", "Blood-pressure medicines", "High blood pressure and selected heart/kidney conditions", "Rx"),
    ("PA-C-07", "Atenolol", None, "Tablet", "Blood-pressure medicines", "High blood pressure and selected heart conditions", "Rx"),
    ("PA-C-08", "Metoprolol", None, "Tablet", "Blood-pressure medicines", "High blood pressure and selected heart conditions", "Rx"),
    ("PA-C-09", "Hydrochlorothiazide", None, "Tablet", "Blood-pressure medicines", "High blood pressure and fluid retention", "Rx"),
    ("PA-C-10", "Chlorthalidone", None, "Tablet", "Blood-pressure medicines", "High blood pressure and fluid retention", "Rx"),

    # D. Thyroid medicines (10 inventory SKUs)
    ("PA-D-01", "Levothyroxine", "25 microgram", "Tablet", "Thyroid medicines", "Underactive thyroid (hypothyroidism)", "Rx"),
    ("PA-D-02", "Levothyroxine", "50 microgram", "Tablet", "Thyroid medicines", "Underactive thyroid (hypothyroidism)", "Rx"),
    ("PA-D-03", "Levothyroxine", "75 microgram", "Tablet", "Thyroid medicines", "Underactive thyroid (hypothyroidism)", "Rx"),
    ("PA-D-04", "Levothyroxine", "100 microgram", "Tablet", "Thyroid medicines", "Underactive thyroid (hypothyroidism)", "Rx"),
    ("PA-D-05", "Levothyroxine", "125 microgram", "Tablet", "Thyroid medicines", "Underactive thyroid (hypothyroidism)", "Rx"),
    ("PA-D-06", "Levothyroxine", "150 microgram", "Tablet", "Thyroid medicines", "Underactive thyroid (hypothyroidism)", "Rx"),
    ("PA-D-07", "Carbimazole", "5 mg", "Tablet", "Thyroid medicines", "Overactive thyroid (hyperthyroidism)", "Rx"),
    ("PA-D-08", "Carbimazole", "10 mg", "Tablet", "Thyroid medicines", "Overactive thyroid (hyperthyroidism)", "Rx"),
    ("PA-D-09", "Methimazole", None, "Tablet", "Thyroid medicines", "Overactive thyroid (hyperthyroidism)", "Rx; availability varies"),
    ("PA-D-10", "Propylthiouracil (PTU)", None, "Tablet", "Thyroid medicines", "Overactive thyroid in selected situations", "Rx"),

    # E. Period-cramp medicines (5)
    ("PA-E-01", "Paracetamol", None, "Tablet", "Period-cramp medicines", "Period pain (menstrual cramps)", "OTC status varies"),
    ("PA-E-02", "Ibuprofen", None, "Tablet", "Period-cramp medicines", "Period pain and inflammation", "OTC status varies; safety screening needed"),
    ("PA-E-03", "Naproxen", None, "Tablet", "Period-cramp medicines", "Period pain and inflammation", "Usually Rx / varies"),
    ("PA-E-04", "Mefenamic acid", None, "Tablet/capsule", "Period-cramp medicines", "Period pain", "Usually Rx"),
    ("PA-E-05", "Hyoscine butylbromide", None, "Tablet", "Period-cramp medicines", "Abdominal cramping/spasm; not a specific treatment for every cause of period pain", "Product-dependent"),

    # F. Eye and ear drops (3)
    ("PA-F-01", "Carboxymethylcellulose", None, "Eye drops", "Eye and ear drops", "Dry-eye symptoms / lubrication", "Product-dependent"),
    ("PA-F-02", "Olopatadine", None, "Eye drops", "Eye and ear drops", "Allergic eye itching", "Usually Rx / varies"),
    ("PA-F-03", "Carbamide peroxide", None, "Ear drops", "Eye and ear drops", "Softening and removal of earwax", "Product-dependent; pharmacist guidance"),
]

# Pharmacy B PDF (pages 9-18 expanded 80 entries; pages 1-8 match PHARMACY_A_ENTRIES)
PHARMACY_B_EXPANDED_ENTRIES = [
    # 1. Additional general medicines (10)
    ("PB-1-01", "Ibuprofen", None, "Tablet", "Additional general medicines", "Pain, fever and inflammation", "OTC status varies; pharmacist screening"),
    ("PB-1-02", "Diclofenac", None, "Tablet/gel", "Additional general medicines", "Pain and inflammation", "Usually Rx / product-dependent"),
    ("PB-1-03", "Aspirin", None, "Tablet", "Additional general medicines", "Pain relief; some low-dose products have cardiovascular uses", "Use only as directed; age restrictions apply"),
    ("PB-1-04", "Domperidone", None, "Tablet", "Additional general medicines", "Nausea and vomiting in selected cases", "Rx; safety restrictions apply"),
    ("PB-1-05", "Ondansetron", None, "Tablet", "Additional general medicines", "Nausea and vomiting", "Rx"),
    ("PB-1-06", "Dicyclomine", None, "Tablet", "Additional general medicines", "Abdominal cramps caused by intestinal spasm", "Rx / product-dependent"),
    ("PB-1-07", "Simethicone", None, "Drops/tablet", "Additional general medicines", "Gas and bloating symptoms", "Product-dependent"),
    ("PB-1-08", "Bisacodyl", None, "Tablet", "Additional general medicines", "Constipation", "OTC status varies"),
    ("PB-1-09", "Psyllium husk", None, "Powder", "Additional general medicines", "Constipation / fibre supplementation", "Non-prescription product; label guidance"),
    ("PB-1-10", "Multivitamin", None, "Tablet", "Additional general medicines", "Vitamin/mineral supplementation", "Product-dependent"),

    # 2. Antibiotics and antibacterial medicines (10)
    ("PB-2-01", "Amoxicillin", None, "Capsule/suspension", "Antibiotics and antibacterial medicines", "Certain susceptible bacterial infections", "Rx"),
    ("PB-2-02", "Amoxicillin + clavulanic acid", None, "Tablet/suspension", "Antibiotics and antibacterial medicines", "Certain susceptible bacterial infections", "Rx"),
    ("PB-2-03", "Azithromycin", None, "Tablet/suspension", "Antibiotics and antibacterial medicines", "Certain susceptible bacterial infections", "Rx"),
    ("PB-2-04", "Cefixime", None, "Tablet/suspension", "Antibiotics and antibacterial medicines", "Certain susceptible bacterial infections", "Rx"),
    ("PB-2-05", "Cefuroxime", None, "Tablet", "Antibiotics and antibacterial medicines", "Certain susceptible bacterial infections", "Rx"),
    ("PB-2-06", "Cephalexin", None, "Capsule/suspension", "Antibiotics and antibacterial medicines", "Certain susceptible bacterial infections", "Rx"),
    ("PB-2-07", "Doxycycline", None, "Capsule/tablet", "Antibiotics and antibacterial medicines", "Certain bacterial infections; selected other indications", "Rx"),
    ("PB-2-08", "Metronidazole", None, "Tablet/suspension", "Antibiotics and antibacterial medicines", "Certain anaerobic bacterial and protozoal infections", "Rx"),
    ("PB-2-09", "Nitrofurantoin", None, "Capsule/tablet", "Antibiotics and antibacterial medicines", "Certain urinary tract infections", "Rx"),
    ("PB-2-10", "Clarithromycin", None, "Tablet/suspension", "Antibiotics and antibacterial medicines", "Certain susceptible bacterial infections", "Rx"),

    # 3. Antifungal and antiviral medicines (10)
    ("PB-3-01", "Fluconazole", None, "Capsule/tablet", "Antifungal and antiviral medicines", "Certain fungal infections", "Rx"),
    ("PB-3-02", "Clotrimazole", None, "Cream", "Antifungal and antiviral medicines", "Fungal skin infections", "Product-dependent"),
    ("PB-3-03", "Terbinafine", None, "Cream/tablet", "Antifungal and antiviral medicines", "Fungal skin or nail infections", "Tablet usually Rx"),
    ("PB-3-04", "Miconazole", None, "Cream", "Antifungal and antiviral medicines", "Fungal skin infections", "Product-dependent"),
    ("PB-3-05", "Nystatin", None, "Oral suspension/cream", "Antifungal and antiviral medicines", "Certain yeast infections", "Rx / product-dependent"),
    ("PB-3-06", "Acyclovir", None, "Tablet/cream", "Antifungal and antiviral medicines", "Herpes virus infections", "Rx / product-dependent"),
    ("PB-3-07", "Valacyclovir", None, "Tablet", "Antifungal and antiviral medicines", "Certain herpes virus infections", "Rx"),
    ("PB-3-08", "Oseltamivir", None, "Capsule/suspension", "Antifungal and antiviral medicines", "Influenza in selected cases", "Rx"),
    ("PB-3-09", "Povidone-iodine", None, "Solution/ointment", "Antifungal and antiviral medicines", "Topical antiseptic use", "Product-dependent"),
    ("PB-3-10", "Mupirocin", None, "Ointment", "Antifungal and antiviral medicines", "Certain localized bacterial skin infections", "Usually Rx"),

    # 4. Respiratory and allergy medicines (10)
    ("PB-4-01", "Salbutamol", None, "Inhaler/respirator solution", "Respiratory and allergy medicines", "Relief of bronchospasm in asthma and other airway conditions", "Rx / product-dependent"),
    ("PB-4-02", "Budesonide", None, "Inhaler/respirator solution", "Respiratory and allergy medicines", "Prevention/control of airway inflammation", "Rx"),
    ("PB-4-03", "Beclometasone", None, "Inhaler/nasal spray", "Respiratory and allergy medicines", "Airway or nasal inflammation, depending on product", "Rx / product-dependent"),
    ("PB-4-04", "Montelukast", None, "Tablet", "Respiratory and allergy medicines", "Asthma/allergic rhinitis in selected patients", "Rx"),
    ("PB-4-05", "Fexofenadine", None, "Tablet/suspension", "Respiratory and allergy medicines", "Allergy symptoms", "Product-dependent"),
    ("PB-4-06", "Levocetirizine", None, "Tablet/syrup", "Respiratory and allergy medicines", "Allergy symptoms", "Product-dependent"),
    ("PB-4-07", "Chlorpheniramine", None, "Tablet/syrup", "Respiratory and allergy medicines", "Allergy symptoms", "Product-dependent; may cause drowsiness"),
    ("PB-4-08", "Ipratropium", None, "Inhaler/nebule", "Respiratory and allergy medicines", "Bronchodilation in selected airway conditions", "Rx"),
    ("PB-4-09", "Bromhexine", None, "Syrup/tablet", "Respiratory and allergy medicines", "Mucus-thinning for productive cough", "Product-dependent"),
    ("PB-4-10", "N-acetylcysteine", None, "Syrup/tablet", "Respiratory and allergy medicines", "Mucus-thinning in selected respiratory conditions", "Product-dependent"),

    # 5. Digestive-system medicines (10)
    ("PB-5-01", "Rabeprazole", None, "Tablet", "Digestive-system medicines", "Acid reflux and acid-related disorders", "Usually Rx"),
    ("PB-5-02", "Esomeprazole", None, "Capsule/tablet", "Digestive-system medicines", "Acid reflux and acid-related disorders", "Usually Rx"),
    ("PB-5-03", "Omeprazole", None, "Capsule/tablet", "Digestive-system medicines", "Acid reflux and acid-related disorders", "Product-dependent"),
    ("PB-5-04", "Sucralfate", None, "Suspension/tablet", "Digestive-system medicines", "Certain ulcer-related conditions", "Rx"),
    ("PB-5-05", "Ranitidine", None, "Tablet/syrup", "Digestive-system medicines", "Acid-related disorders; availability/regulatory status varies", "Verify current local status"),
    ("PB-5-06", "Racecadotril", None, "Capsule/sachet", "Digestive-system medicines", "Diarrhoea symptom management in selected cases", "Product-dependent"),
    ("PB-5-07", "Polyethylene glycol", None, "Powder", "Digestive-system medicines", "Constipation", "Product-dependent"),
    ("PB-5-08", "Sodium picosulfate", None, "Drops/tablet", "Digestive-system medicines", "Constipation", "Product-dependent"),
    ("PB-5-09", "Mesalazine", None, "Tablet/suppository", "Digestive-system medicines", "Inflammatory bowel disease", "Rx"),
    ("PB-5-10", "Ursodeoxycholic acid", None, "Tablet/capsule", "Digestive-system medicines", "Selected bile/liver conditions", "Rx"),

    # 6. Skin and topical products (10)
    ("PB-6-01", "Hydrocortisone", None, "Cream/ointment", "Skin and topical products", "Mild inflammatory skin conditions", "Strength/status varies"),
    ("PB-6-02", "Betamethasone", None, "Cream/ointment", "Skin and topical products", "Inflammatory skin conditions", "Rx / product-dependent"),
    ("PB-6-03", "Clobetasol", None, "Cream/ointment", "Skin and topical products", "Selected inflammatory skin conditions", "Rx"),
    ("PB-6-04", "Ketoconazole", None, "Cream/shampoo", "Skin and topical products", "Fungal skin conditions and dandruff", "Product-dependent"),
    ("PB-6-05", "Permethrin", None, "Cream/lotion", "Skin and topical products", "Scabies or lice, depending on formulation", "Product-dependent"),
    ("PB-6-06", "Benzoyl peroxide", None, "Gel/wash", "Skin and topical products", "Acne", "Product-dependent"),
    ("PB-6-07", "Adapalene", None, "Gel/cream", "Skin and topical products", "Acne", "Product-dependent / Rx status varies"),
    ("PB-6-08", "Silver sulfadiazine", None, "Cream", "Skin and topical products", "Selected burn-wound care", "Rx / clinician-directed"),
    ("PB-6-09", "Zinc oxide", None, "Cream/ointment", "Skin and topical products", "Skin barrier protection and irritation", "Non-prescription product"),
    ("PB-6-10", "Luliconazole", None, "Cream", "Skin and topical products", "Fungal skin infections", "Usually Rx / product-dependent"),

    # 7. Additional eye and ear products (10)
    ("PB-7-01", "Timolol", None, "Eye drops", "Additional eye and ear products", "Glaucoma / raised eye pressure", "Rx"),
    ("PB-7-02", "Latanoprost", None, "Eye drops", "Additional eye and ear products", "Glaucoma / raised eye pressure", "Rx"),
    ("PB-7-03", "Tobramycin", None, "Eye drops/ointment", "Additional eye and ear products", "Certain bacterial eye infections", "Rx"),
    ("PB-7-04", "Moxifloxacin", None, "Eye drops", "Additional eye and ear products", "Certain bacterial eye infections", "Rx"),
    ("PB-7-05", "Ketotifen", None, "Eye drops", "Additional eye and ear products", "Allergic eye itching", "Product-dependent"),
    ("PB-7-06", "Dexamethasone", None, "Eye drops", "Additional eye and ear products", "Eye inflammation in selected cases", "Rx; specialist supervision"),
    ("PB-7-07", "Ciprofloxacin", None, "Ear drops", "Additional eye and ear products", "Certain bacterial ear infections", "Rx / product-dependent"),
    ("PB-7-08", "Ofloxacin", None, "Ear drops", "Additional eye and ear products", "Certain bacterial ear infections", "Rx / product-dependent"),
    ("PB-7-09", "Clotrimazole", None, "Ear drops/solution", "Additional eye and ear products", "Selected fungal ear infections", "Clinician-directed"),
    ("PB-7-10", "Glycerin", None, "Ear drops", "Additional eye and ear products", "Earwax softening in selected products", "Product-dependent"),

    # 8. Additional vitamins and supplements (10)
    ("PB-8-01", "Vitamin D3 (cholecalciferol)", None, "Tablet/drop", "Additional vitamins and supplements", "Vitamin D supplementation", "Product-dependent"),
    ("PB-8-02", "Vitamin B12 (cyanocobalamin)", None, "Tablet/injection", "Additional vitamins and supplements", "Vitamin B12 deficiency", "Product-dependent"),
    ("PB-8-03", "Folic acid", None, "Tablet", "Additional vitamins and supplements", "Folate deficiency and selected preventive uses", "Product-dependent"),
    ("PB-8-04", "Iron + folic acid", None, "Tablet/syrup", "Additional vitamins and supplements", "Iron/folate supplementation", "Product-dependent"),
    ("PB-8-05", "Calcium + vitamin D3", None, "Tablet/suspension", "Additional vitamins and supplements", "Calcium and vitamin D supplementation", "Product-dependent"),
    ("PB-8-06", "Magnesium supplement", None, "Tablet/powder", "Additional vitamins and supplements", "Magnesium supplementation", "Product-dependent"),
    ("PB-8-07", "Potassium chloride", None, "Tablet/solution", "Additional vitamins and supplements", "Potassium replacement when prescribed", "Rx / careful monitoring"),
    ("PB-8-08", "Thiamine (vitamin B1)", None, "Tablet/injection", "Additional vitamins and supplements", "Thiamine deficiency", "Product-dependent"),
    ("PB-8-09", "Pyridoxine (vitamin B6)", None, "Tablet", "Additional vitamins and supplements", "Vitamin B6 supplementation or selected prescribed uses", "Product-dependent"),
    ("PB-8-10", "Zinc", None, "Tablet/syrup", "Additional vitamins and supplements", "Zinc supplementation", "Product-dependent"),
]


def _import_entries_for_pharmacy(pharmacy_obj, entries, data_source):
    """
    Imports catalog entries into a specific pharmacy without inventing missing fields
    and without duplicating existing records.
    """
    inserted = 0
    skipped_duplicates = 0

    for item_no, name, strength, form, category, indication, rx_status in entries:
        # Find or create Medicine matched accurately by (name, strength, form)
        med = Medicine.query.filter_by(name=name, strength=strength, form=form).first()
        if not med:
            med = Medicine(
                name=name,
                generic_name=name,
                category=category,
                strength=strength,
                form=form,
                indication=indication,
                prescription_status=rx_status,
                prescription_required=_is_rx_required(rx_status),
                image_url=resolve_medicine_image(name, strength, form),
            )
            db.session.add(med)
            db.session.flush()
        else:
            # Enrich missing metadata if medicine appeared under an additional section
            if not med.category and category:
                med.category = category
            elif med.category and category and category not in med.category:
                med.category = f"{med.category}; {category}"
            if not med.indication and indication:
                med.indication = indication
            elif med.indication and indication and indication not in med.indication:
                med.indication = f"{med.indication}; {indication}"
            if not med.prescription_status and rx_status:
                med.prescription_status = rx_status

        # Check duplicate for this pharmacy & medicine & data_source (or catalog_item_no)
        existing_inv = Inventory.query.filter_by(
            pharmacy_id=pharmacy_obj.id,
            medicine_id=med.id,
            data_source=data_source
        ).first()

        if existing_inv:
            skipped_duplicates += 1
            continue

        missing = []
        if not strength:
            missing.append('strength')
        missing.extend(['batch_number', 'quantity', 'price', 'expiry_date'])

        inv = Inventory(
            medicine_id=med.id,
            pharmacy_id=pharmacy_obj.id,
            catalog_item_no=item_no,
            batch_number=None,
            quantity=None,
            price=None,
            mfg_date=None,
            expiry_date=None,
            data_source=data_source,
            missing_fields=json.dumps(missing),
        )
        db.session.add(inv)
        inserted += 1

    return {'inserted': inserted, 'skipped_duplicates': skipped_duplicates}


def import_pharmacy_catalogs():
    """
    Imports Pharmacy A (58 PDF entries) and Pharmacy B (138 PDF entries: 58 base + 80 expanded)
    separately into MySQL/SQLite. Idempotent: prevents duplicate imports.
    """
    pharma_a = Pharmacy.query.filter_by(name='Pharmacy A').first()
    pharma_b = Pharmacy.query.filter_by(name='Pharmacy B').first()

    if not pharma_a or not pharma_b:
        raise RuntimeError("Pharmacy A and Pharmacy B must exist before importing catalogs.")

    res_a = _import_entries_for_pharmacy(pharma_a, PHARMACY_A_ENTRIES, 'Pharmacy A PDF')

    # Pharmacy B PDF contains pages 1-8 (same 58 base items) + pages 9-18 (80 expanded items)
    pharmacy_b_all = [
        (f"PB-BASE-{idx+1:02d}", e[1], e[2], e[3], e[4], e[5], e[6])
        for idx, e in enumerate(PHARMACY_A_ENTRIES)
    ] + PHARMACY_B_EXPANDED_ENTRIES

    res_b = _import_entries_for_pharmacy(pharma_b, pharmacy_b_all, 'Pharmacy B PDF')
    db.session.commit()

    return {
        'pharmacy_a': res_a,
        'pharmacy_b': res_b
    }
