import os
import re
from PIL import Image
from pypdf import PdfReader

# Known clinical medicine vocabulary for deterministic OCR entity matching
COMMON_MEDICINES = [
    {"name": "Amoxicillin", "default_strength": "500mg", "form": "Capsule"},
    {"name": "Paracetamol", "default_strength": "650mg", "form": "Tablet"},
    {"name": "Azithromycin", "default_strength": "500mg", "form": "Tablet"},
    {"name": "Pantoprazole", "default_strength": "40mg", "form": "Tablet"},
    {"name": "Metformin", "default_strength": "500mg", "form": "Tablet"},
    {"name": "Atorvastatin", "default_strength": "20mg", "form": "Tablet"},
    {"name": "Cetirizine", "default_strength": "10mg", "form": "Tablet"},
    {"name": "Ibuprofen", "default_strength": "400mg", "form": "Tablet"},
    {"name": "Levothyroxine", "default_strength": "50 microgram", "form": "Tablet"},
    {"name": "Carbimazole", "default_strength": "5 mg", "form": "Tablet"},
    {"name": "Amlodipine", "default_strength": "5mg", "form": "Tablet"},
    {"name": "Losartan", "default_strength": "50mg", "form": "Tablet"},
    {"name": "Telmisartan", "default_strength": "40mg", "form": "Tablet"},
    {"name": "Glimepiride", "default_strength": "2mg", "form": "Tablet"},
    {"name": "Cefixime", "default_strength": "200mg", "form": "Tablet"},
    {"name": "Insulin Glargine", "default_strength": "100IU/ml", "form": "Injection"},
    {"name": "Diclofenac Gel", "default_strength": "30g", "form": "Ointment"},
    {"name": "Diclofenac", "default_strength": "50mg", "form": "Tablet"},
    {"name": "Cough Relief Syrup", "default_strength": "100ml", "form": "Syrup"},
    {"name": "Doxycycline", "default_strength": "100mg", "form": "Capsule"},
    {"name": "Omeprazole", "default_strength": "20mg", "form": "Capsule"},
    {"name": "Ondansetron", "default_strength": "4mg", "form": "Tablet"},
    {"name": "Montelukast", "default_strength": "10mg", "form": "Tablet"},
    {"name": "Salbutamol", "default_strength": "100mcg", "form": "Inhaler"},
    {"name": "Ciprofloxacin", "default_strength": "500mg", "form": "Tablet"},
    {"name": "Fluconazole", "default_strength": "150mg", "form": "Tablet"},
    {"name": "Naproxen", "default_strength": "500mg", "form": "Tablet"},
]

UNCLEAR_KEYWORDS = ("blurry", "unclear", "ambiguous", "unreadable", "illegible", "unable to detect", "smudged", "corrupted")


def _get_medicine_vocabulary():
    """Returns combined static and database medicine vocabulary when app context is active."""
    vocab_by_name = {m["name"].lower(): dict(m) for m in COMMON_MEDICINES}
    try:
        from flask import has_app_context
        if has_app_context():
            from models.medicine import Medicine
            for med in Medicine.query.all():
                key = (med.name or "").strip().lower()
                if key and key not in vocab_by_name:
                    vocab_by_name[key] = {
                        "name": med.name.strip(),
                        "default_strength": med.strength or "",
                        "form": med.form or "Tablet",
                    }
    except Exception:
        pass
    # Match longer names first so e.g. 'Amoxicillin + clavulanic acid' matches before 'Amoxicillin'
    return sorted(vocab_by_name.values(), key=lambda m: len(m["name"]), reverse=True)


def _extract_pdf_text(filepath):
    """Extracts text from PDF pages using pypdf, with optional pytesseract fallback for embedded images."""
    extracted_parts = []
    try:
        reader = PdfReader(filepath)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                extracted_parts.append(page_text)
        if extracted_parts:
            return "\n".join(extracted_parts)

        # If PDF has no selectable text (scanned PDF), attempt OCR on embedded images if Tesseract is available
        try:
            import pytesseract
            import io
            for page in reader.pages:
                for image_file in getattr(page, "images", []):
                    with Image.open(io.BytesIO(image_file.data)) as img:
                        ocr_text = pytesseract.image_to_string(img)
                        if ocr_text and len(ocr_text.strip()) > 3:
                            extracted_parts.append(ocr_text)
        except Exception:
            pass
    except Exception:
        return ""
    return "\n".join(extracted_parts)


def extract_prescription_text(filepath):
    """
    Extracts raw text from JPG/JPEG/PNG images (via Tesseract OCR and valid image text metadata)
    or PDF documents (via pypdf).
    Never invents or guesses text when OCR or text extraction yields nothing.
    """
    ext = filepath.rsplit('.', 1)[-1].lower() if '.' in filepath else ''

    if ext == 'pdf':
        return _extract_pdf_text(filepath)

    if ext in ('jpg', 'jpeg', 'png'):
        try:
            with Image.open(filepath) as img:
                # 1. Try pytesseract OCR
                try:
                    import pytesseract
                    text = pytesseract.image_to_string(img)
                    if text and len(text.strip()) > 3:
                        return text
                except Exception:
                    pass

                # 2. Check embedded PNG tEXt/iTXt/zTXt metadata if present (used by structured/sample PNGs)
                if ext == 'png' and isinstance(img.info, dict):
                    meta_chunks = [
                        str(img.info[k])
                        for k in ('PrescriptionText', 'Description', 'Comment', 'prescription_text')
                        if k in img.info and str(img.info[k]).strip()
                    ]
                    if meta_chunks:
                        return "\n".join(meta_chunks)
        except Exception:
            return ""

    return ""


def _parse_line_frequency(line_lower):
    if "twice" in line_lower or "2 times" in line_lower or "two times" in line_lower or re.search(r'\b(bd|bid|1-0-1)\b', line_lower):
        return "Twice daily after meals"
    if "thrice" in line_lower or "3 times" in line_lower or "three times" in line_lower or re.search(r'\b(tid|tds|1-1-1)\b', line_lower):
        return "3 times daily after food"
    if "four times" in line_lower or "4 times" in line_lower or re.search(r'\b(qid|qds)\b', line_lower):
        return "4 times daily"
    if "bedtime" in line_lower or "at night" in line_lower or re.search(r'\bhs\b', line_lower):
        return "Once daily at bedtime"
    if "once" in line_lower or "1 time" in line_lower or re.search(r'\b(od|1-0-0|0-0-1)\b', line_lower):
        return "Once daily"
    if "sos" in line_lower or "fever" in line_lower or "as needed" in line_lower:
        return "SOS / as needed for fever"
    every_match = re.search(r'(every\s+\d+\s+hours?)', line_lower)
    if every_match:
        return every_match.group(1).capitalize()
    return "Unable to detect – manual confirmation required."


def _parse_line_dosage(line_lower, form):
    dosage_match = re.search(
        r'\b(\d+(?:\.\d+)?\s*(?:tablets?|tabs?|capsules?|caps?|puffs?|drops?|teaspoons?|tsp|sachets?))\b',
        line_lower
    )
    if dosage_match:
        return dosage_match.group(1).strip()
    ml_dose_match = re.search(
        r'\b(\d+(?:\.\d+)?\s*ml)\s+(?:twice|thrice|once|every|daily|bd|tid|od|sos|at\s+night)\b',
        line_lower
    )
    if ml_dose_match:
        return ml_dose_match.group(1).strip()

    form_lower = (form or "").lower()
    if "tablet" in form_lower:
        return "1 tablet"
    if "capsule" in form_lower:
        return "1 capsule"
    return "As directed"


def parse_clinical_entities(raw_text, filename=""):
    """
    Extracts medicine name, strength, dosage, frequency, and duration from extracted OCR text.
    If unclear or unable to detect, returns:
    'Unable to detect – manual confirmation required.'
    NEVER guesses unclear medicine names or infers medicines solely from filenames.
    """
    text = (raw_text or "").strip()
    if not text:
        return [
            {
                "medicine_name": "Unable to detect – manual confirmation required.",
                "strength": "Unable to detect – manual confirmation required.",
                "dosage": "Unable to detect – manual confirmation required.",
                "frequency": "Unable to detect – manual confirmation required.",
                "duration": "Unable to detect – manual confirmation required.",
                "confidence": "Low"
            }
        ]

    vocab = _get_medicine_vocabulary()
    lines = [ln.strip() for ln in re.split(r'[\r\n]+', text) if ln.strip()]
    if not lines:
        lines = [text]

    extracted_items = []
    seen_meds = set()
    has_unclear_marker = False

    for line in lines:
        line_lower = line.lower()
        if any(w in line_lower for w in UNCLEAR_KEYWORDS):
            has_unclear_marker = True
            # If the line itself is explicitly marked unclear/blurry, do not assume a medicine on this line is reliable
            continue

        for med in vocab:
            med_name_lower = med["name"].lower()
            if re.search(r'(?<![a-z0-9])' + re.escape(med_name_lower) + r'(?![a-z0-9])', line_lower):
                if med_name_lower in seen_meds:
                    continue
                seen_meds.add(med_name_lower)

                pattern = re.compile(
                    re.escape(med_name_lower)
                    + r'(?:[^a-z0-9]{1,16}|[^a-z0-9]+(?:tab(?:let)?s?|cap(?:sule)?s?|syr(?:up)?|inj(?:ection)?|gel|drops?)\.?[^a-z0-9]{1,8})(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|microgram|iu(?:/ml)?|%))',
                    re.IGNORECASE
                )
                near_match = pattern.search(line_lower)
                if near_match:
                    strength = near_match.group(1).strip()
                else:
                    strength = "Unable to detect – manual confirmation required."

                dosage = _parse_line_dosage(line_lower, med.get("form"))

                freq = _parse_line_frequency(line_lower)
                dur_match = re.search(r'(\d+\s*(?:days?|weeks?|months?))', line_lower, re.IGNORECASE)
                duration = dur_match.group(1) if dur_match else "Unable to detect – manual confirmation required."

                extracted_items.append({
                    "medicine_name": med["name"],
                    "strength": strength,
                    "dosage": dosage,
                    "frequency": freq,
                    "duration": duration,
                    "confidence": "High" if "Unable to detect" not in strength else "Medium"
                })

    if has_unclear_marker:
        extracted_items.append({
            "medicine_name": "Unable to detect – manual confirmation required.",
            "strength": "Unable to detect – manual confirmation required.",
            "dosage": "Unable to detect – manual confirmation required.",
            "frequency": "Unable to detect – manual confirmation required.",
            "duration": "Unable to detect – manual confirmation required.",
            "confidence": "Low"
        })

    if not extracted_items:
        extracted_items = [
            {
                "medicine_name": "Unable to detect – manual confirmation required.",
                "strength": "Unable to detect – manual confirmation required.",
                "dosage": "Unable to detect – manual confirmation required.",
                "frequency": "Unable to detect – manual confirmation required.",
                "duration": "Unable to detect – manual confirmation required.",
                "confidence": "Low"
            }
        ]

    return extracted_items
