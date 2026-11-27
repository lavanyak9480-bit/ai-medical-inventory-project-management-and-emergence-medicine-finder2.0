const MED_IMAGE_BASE = '/images/medicines';

export function getFormFallbackKey(form) {
  const f = (form || '').trim().toLowerCase();
  if (f.includes('capsule') && !f.includes('tablet')) return 'capsule';
  if (f.includes('inhaler') || f.includes('nasal') || f.includes('nebule')) return 'inhaler';
  if (f.includes('drop')) return 'drops';
  if (f.includes('injection')) return 'injection';
  if (f.includes('syrup') || f.includes('suspension') || f.includes('solution')) return 'syrup';
  if (f.includes('ointment') || f.includes('cream') || f.includes('gel') || f.includes('lotion')) return 'ointment';
  if (f.includes('powder') || f.includes('sachet')) return 'powder';
  if (f.includes('tablet')) return 'tablet';
  return 'medicine';
}

export function getFormFallbackUrl(form) {
  return `${MED_IMAGE_BASE}/fallback-${getFormFallbackKey(form)}.svg`;
}

export function getDefaultFallbackUrl() {
  return `${MED_IMAGE_BASE}/fallback-medicine.svg`;
}

export function slugifyMedicine(name, strength, form) {
  const parts = [name || 'medicine'];
  if (strength) parts.push(String(strength));
  if (form) parts.push(String(form));
  return (
    parts
      .join('-')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'medicine'
  );
}

export function resolveMedicineImageUrl(imageUrl, name, strength, form) {
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
    return imageUrl.trim();
  }
  if (name) {
    return `${MED_IMAGE_BASE}/${slugifyMedicine(name, strength, form)}.svg`;
  }
  return getFormFallbackUrl(form);
}
