import React, { useState, useEffect } from 'react';
import {
  resolveMedicineImageUrl,
  getFormFallbackUrl,
  getDefaultFallbackUrl
} from '../../utils/medicineImage';

const SIZE_CLASSES = {
  xs: 'w-8 h-8 rounded-lg',
  sm: 'w-10 h-10 rounded-xl',
  md: 'w-12 h-12 rounded-xl',
  lg: 'w-24 h-24 rounded-2xl',
  xl: 'w-28 h-28 rounded-2xl'
};

export function MedicineImage({
  imageUrl,
  name,
  strength,
  form,
  size = 'sm',
  onClick,
  className = ''
}) {
  const primarySrc = resolveMedicineImageUrl(imageUrl, name, strength, form);
  const formFallback = getFormFallbackUrl(form);
  const universalFallback = getDefaultFallbackUrl();

  const [src, setSrc] = useState(primarySrc);
  const [fallbackTier, setFallbackTier] = useState(0);

  useEffect(() => {
    setSrc(primarySrc);
    setFallbackTier(0);
  }, [primarySrc]);

  const handleError = () => {
    if (fallbackTier === 0 && src !== formFallback) {
      setFallbackTier(1);
      setSrc(formFallback);
    } else if (fallbackTier <= 1 && src !== universalFallback) {
      setFallbackTier(2);
      setSrc(universalFallback);
    }
  };

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
  const altText = [name, strength, form].filter(Boolean).join(' ') || 'Medicine image';

  const imgEl = (
    <img
      src={src}
      alt={altText}
      onError={handleError}
      loading="lazy"
      className={`${sizeClass} object-cover bg-slate-50 border border-slate-200/80 shadow-2xs shrink-0 ${className}`}
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`View details for ${name || 'medicine'}`}
        className="group relative inline-flex shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {imgEl}
        <span className="sr-only">View medicine details</span>
      </button>
    );
  }

  return imgEl;
}
