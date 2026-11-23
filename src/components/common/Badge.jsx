import React from 'react';

export function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    // Stock Availability
    'available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'low-stock': 'bg-amber-50 text-amber-700 border-amber-200',
    'out-of-stock': 'bg-rose-50 text-rose-700 border-rose-200',
    
    // Prescription Status
    'Uploaded': 'bg-sky-50 text-sky-700 border-sky-200',
    'Processing': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Pending Verification': 'bg-amber-50 text-amber-700 border-amber-200',
    'Verified': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',

    // Order Stages
    'Order Placed': 'bg-blue-50 text-blue-700 border-blue-200',
    'Verification': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Preparing': 'bg-amber-50 text-amber-700 border-amber-200',
    'Dispatched': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200',

    // Payment Status
    'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Failed': 'bg-rose-50 text-rose-700 border-rose-200',

    // Pharmacies
    'Pharmacy A': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
    'Pharmacy B': 'bg-sky-100 text-sky-800 border-sky-300 font-semibold',
    
    // Default
    'default': 'bg-slate-100 text-slate-700 border-slate-200',
    'info': 'bg-blue-50 text-blue-700 border-blue-200',
    'warning': 'bg-amber-50 text-amber-700 border-amber-200',
    'danger': 'bg-rose-50 text-rose-700 border-rose-200',
    'success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const currentStyle = variants[variant] || variants['default'];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle} ${className}`}>
      {children}
    </span>
  );
}

export function StockBadge({ quantity }) {
  if (quantity <= 0) {
    return <Badge variant="out-of-stock">Out of Stock</Badge>;
  }
  if (quantity < 20) {
    return <Badge variant="low-stock">Low Stock ({quantity})</Badge>;
  }
  return <Badge variant="available">Available ({quantity})</Badge>;
}
