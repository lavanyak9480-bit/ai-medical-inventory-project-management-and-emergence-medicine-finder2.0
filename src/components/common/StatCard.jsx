import React from 'react';

export function StatCard({ title, value, icon: Icon, description, trend, color = 'mint' }) {
  const colorMap = {
    mint: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-700',
      border: 'border-emerald-100'
    },
    blue: {
      bg: 'bg-sky-50',
      iconBg: 'bg-sky-500',
      text: 'text-sky-700',
      border: 'border-sky-100'
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-500',
      text: 'text-amber-700',
      border: 'border-amber-100'
    },
    rose: {
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-500',
      text: 'text-rose-700',
      border: 'border-rose-100'
    }
  };

  const scheme = colorMap[color] || colorMap.mint;

  return (
    <div className={`p-5 rounded-xl bg-white border ${scheme.border} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg text-white ${scheme.iconBg}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-3 flex items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {description}
        </div>
      )}
    </div>
  );
}
