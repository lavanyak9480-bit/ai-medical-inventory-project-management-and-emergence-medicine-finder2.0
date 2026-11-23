// Date and Status helper utilities

/**
 * Checks if a given date string (YYYY-MM-DD) is expired compared to current date
 */
export function isExpired(dateString) {
  if (!dateString) return false;
  const expiry = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry < today;
}

/**
 * Checks if a given date string is near expiry (within specified days, default 90 days)
 */
export function isNearExpiry(dateString, daysThreshold = 90) {
  if (!dateString) return false;
  const expiry = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (expiry < today) return false; // already expired
  
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold;
}

/**
 * Returns days remaining until expiry
 */
export function getDaysUntilExpiry(dateString) {
  if (!dateString) return 0;
  const expiry = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats a date string into readable format (e.g. Nov 24, 2026)
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
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
  if (amount === undefined || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
}
