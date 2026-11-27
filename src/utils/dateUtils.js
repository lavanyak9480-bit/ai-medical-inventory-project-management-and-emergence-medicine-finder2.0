// Date and Status helper utilities

function parseLocalDate(dateString) {
  if (!dateString) return null;
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
    const [y, m, d] = dateString.trim().split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Checks if a given date string (YYYY-MM-DD) is expired compared to current date
 */
export function isExpired(dateString) {
  const expiry = parseLocalDate(dateString);
  if (!expiry) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry < today;
}

/**
 * Checks if a given date string is near expiry (within specified days, default 90 days)
 */
export function isNearExpiry(dateString, daysThreshold = 90) {
  const expiry = parseLocalDate(dateString);
  if (!expiry) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry < today) return false;

  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold;
}

/**
 * Returns days remaining until expiry
 */
export function getDaysUntilExpiry(dateString) {
  const expiry = parseLocalDate(dateString);
  if (!expiry) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a date string into readable format (e.g. Nov 24, 2026)
 */
export function formatDate(dateString) {
  if (!dateString) return 'Not provided';
  try {
    const d = parseLocalDate(dateString);
    if (!d) return dateString;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats currency in Indian Rupees
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return 'Not provided';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
}
