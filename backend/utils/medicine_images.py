import os
import re

PUBLIC_IMAGES_SUBDIR = "/images/medicines"

# Category color themes (primary, secondary, background tint)
CATEGORY_PALETTES = {
    "antibiotic": ("#0ea5e9", "#0284c7", "#e0f2fe"),
    "diabetes": ("#10b981", "#059669", "#d1fae5"),
    "blood-pressure": ("#6366f1", "#4f46e5", "#e0e7ff"),
    "cardio": ("#ef4444", "#dc2626", "#fee2e2"),
    "thyroid": ("#8b5cf6", "#7c3aed", "#ede9fe"),
    "period": ("#ec4899", "#db2777", "#fce7f3"),
    "pain": ("#f97316", "#ea580c", "#ffedd5"),
    "respiratory": ("#06b6d4", "#0891b2", "#cffafe"),
    "allergy": ("#14b8a6", "#0d9488", "#ccfbf1"),
    "digestive": ("#84cc16", "#65a30d", "#ecfccb"),
    "skin": ("#f59e0b", "#d97706", "#fef3c7"),
    "eye": ("#3b82f6", "#2563eb", "#dbeafe"),
    "vitamin": ("#eab308", "#ca8a04", "#fef9c3"),
    "antifungal": ("#a855f7", "#9333ea", "#f3e8ff"),
    "default": ("#10b981", "#0ea5e9", "#f0fdf7"),
}


def slugify_medicine(name, strength=None, form=None):
    """Generates a deterministic, filesystem-safe slug for (name, strength, form)."""
    parts = [name or "medicine"]
    if strength:
        parts.append(str(strength))
    if form:
        parts.append(str(form))
    raw = "-".join(parts).lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return slug or "medicine"


def get_form_fallback_key(form):
    """Maps any dosage form string to one of the canonical fallback image keys."""
    f = (form or "").strip().lower()
    if "capsule" in f and "tablet" not in f:
        return "capsule"
    if "inhaler" in f or "nasal" in f or "nebule" in f:
        return "inhaler"
    if "drop" in f:
        return "drops"
    if "injection" in f:
        return "injection"
    if "syrup" in f or "suspension" in f or "solution" in f:
        return "syrup"
    if "ointment" in f or "cream" in f or "gel" in f or "lotion" in f:
        return "ointment"
    if "powder" in f or "sachet" in f:
        return "powder"
    if "tablet" in f:
        return "tablet"
    return "medicine"


def resolve_palette(name, category=None):
    """Picks an appropriate medical color palette based on medicine category or name."""
    text = f"{category or ''} {name or ''}".lower()
    if any(k in text for k in ("antibiotic", "antibacterial", "amoxicillin", "azithromycin", "cefixime", "cefuroxime", "cephalexin", "doxycycline", "metronidazole", "nitrofurantoin", "clarithromycin", "ciprofloxacin")):
        return CATEGORY_PALETTES["antibiotic"]
    if any(k in text for k in ("diabetes", "metformin", "glimepiride", "gliclazide", "glipizide", "sitagliptin", "linagliptin", "vildagliptin", "empagliflozin", "dapagliflozin", "pioglitazone", "insulin")):
        return CATEGORY_PALETTES["diabetes"]
    if any(k in text for k in ("blood-pressure", "blood pressure", "amlodipine", "telmisartan", "losartan", "olmesartan", "enalapril", "ramipril", "atenolol", "metoprolol", "hydrochlorothiazide", "chlorthalidone", "aspirin", "clopidogrel")):
        return CATEGORY_PALETTES["blood-pressure"]
    if any(k in text for k in ("atorvastatin", "cardio")):
        return CATEGORY_PALETTES["cardio"]
    if any(k in text for k in ("thyroid", "levothyroxine", "carbimazole", "methimazole", "propylthiouracil")):
        return CATEGORY_PALETTES["thyroid"]
    if any(k in text for k in ("period", "mefenamic", "hyoscine")):
        return CATEGORY_PALETTES["period"]
    if any(k in text for k in ("respiratory", "salbutamol", "budesonide", "budecort", "doxoflow", "beclometasone", "montelukast", "ipratropium", "bromhexine", "acetylcysteine", "cough", "dextromethorphan", "guaifenesin", "ambroxol")):
        return CATEGORY_PALETTES["respiratory"]
    if any(k in text for k in ("allergy", "cetirizine", "loratadine", "fexofenadine", "levocetirizine", "chlorpheniramine")):
        return CATEGORY_PALETTES["allergy"]
    if any(k in text for k in ("digestive", "pantoprazole", "omeprazole", "rabeprazole", "esomeprazole", "famotidine", "antacid", "digene", "sucralfate", "ranitidine", "loperamide", "domperidone", "ondansetron", "lactulose", "dicyclomine", "simethicone", "bisacodyl", "psyllium", "racecadotril", "mesalazine", "ursodeoxycholic")):
        return CATEGORY_PALETTES["digestive"]
    if any(k in text for k in ("antifungal", "antiviral", "fluconazole", "clotrimazole", "terbinafine", "miconazole", "nystatin", "acyclovir", "valacyclovir", "oseltamivir", "ketoconazole", "luliconazole")):
        return CATEGORY_PALETTES["antifungal"]
    if any(k in text for k in ("skin", "topical", "antiseptic", "wound", "hydrocortisone", "betamethasone", "clobetasol", "permethrin", "benzoyl", "adapalene", "silver sulfadiazine", "zinc oxide", "calamine", "povidone", "mupirocin")):
        return CATEGORY_PALETTES["skin"]
    if any(k in text for k in ("eye", "ear", "timolol", "latanoprost", "tobramycin", "moxifloxacin", "ketotifen", "dexamethasone", "carboxymethylcellulose", "olopatadine", "carbamide", "ofloxacin", "glycerin")):
        return CATEGORY_PALETTES["eye"]
    if any(k in text for k in ("vitamin", "hydration", "electrolyte", "calcium", "ferrous", "iron", "folic", "zinc", "magnesium", "potassium", "thiamine", "pyridoxine", "multivitamin", "becosules", "ors", "electral", "glucose")):
        return CATEGORY_PALETTES["vitamin"]
    if any(k in text for k in ("paracetamol", "dolo", "crocin", "ibuprofen", "naproxen", "diclofenac", "pain", "fever")):
        return CATEGORY_PALETTES["pain"]
    return CATEGORY_PALETTES["default"]


def _get_public_images_dir():
    backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    project_root = os.path.dirname(backend_dir)
    return os.path.join(project_root, "public", "images", "medicines")


def resolve_medicine_image(name, strength=None, form=None):
    """
    Returns the matching static image URL for a medicine based on name, strength, and form.
    Falls back to form-specific fallback image if a medicine-specific asset does not exist.
    """
    slug = slugify_medicine(name, strength, form)
    images_dir = _get_public_images_dir()
    specific_file = os.path.join(images_dir, f"{slug}.svg")
    if os.path.exists(specific_file):
        return f"{PUBLIC_IMAGES_SUBDIR}/{slug}.svg"

    # Try matching without strength if strength was custom/edited
    if strength:
        no_strength_slug = slugify_medicine(name, None, form)
        if os.path.exists(os.path.join(images_dir, f"{no_strength_slug}.svg")):
            return f"{PUBLIC_IMAGES_SUBDIR}/{no_strength_slug}.svg"

    fallback_key = get_form_fallback_key(form)
    return f"{PUBLIC_IMAGES_SUBDIR}/fallback-{fallback_key}.svg"
