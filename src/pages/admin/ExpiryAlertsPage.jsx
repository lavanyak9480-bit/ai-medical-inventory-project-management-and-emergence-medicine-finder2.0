import React, { useState } from 'react';
import { AlertTriangle, Clock, ShieldAlert, AlertCircle, Building2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { MedicineImage } from '../../components/common/MedicineImage';
import { MedicineDetailsModal } from '../../components/common/MedicineDetailsModal';
import { formatDate, isExpired, isNearExpiry, getDaysUntilExpiry } from '../../utils/dateUtils';

export function ExpiryAlertsPage() {
  const { alertsData, medicines } = useApp();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'EXPIRED' | 'NEAR_EXPIRY' | 'LOW_STOCK'
  const [detailsMedicine, setDetailsMedicine] = useState(null);

  // Use backend /api/alerts/all lists when available
  const hasServerAlerts = Boolean(alertsData && alertsData.counts && Object.keys(alertsData.counts).length > 0);
  const expiredList = hasServerAlerts
    ? (alertsData.expired || [])
    : medicines.filter(m => m.expiryDate && isExpired(m.expiryDate));
  const nearExpiryList = hasServerAlerts
    ? (alertsData.near_expiry || [])
    : medicines.filter(m => m.expiryDate && isNearExpiry(m.expiryDate) && !isExpired(m.expiryDate));
  const lowStockList = hasServerAlerts
    ? (alertsData.low_stock || [])
    : medicines.filter(m => m.quantity !== null && m.quantity !== undefined && m.quantity < 20);

  // Filtered view
  const displayList = React.useMemo(() => {
    if (activeTab === 'EXPIRED') return expiredList;
    if (activeTab === 'NEAR_EXPIRY') return nearExpiryList;
    if (activeTab === 'LOW_STOCK') return lowStockList;
    // Combine unique medicines with any alert
    const set = new Set();
    const result = [];
    [...expiredList, ...nearExpiryList, ...lowStockList].forEach(m => {
      if (!set.has(m.id)) {
        set.add(m.id);
        result.push(m);
      }
    });
    return result;
  }, [activeTab, expiredList, nearExpiryList, lowStockList]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Expiry & Low Stock Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated safety alerts for expired batches, upcoming expiries (within 90 days), and low inventory units.
        </p>
      </div>

      {/* Critical Rule Banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start space-x-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm">Regulatory Safety Mandate:</p>
          <p className="mt-0.5">
            Expired batches are strictly excluded from patient search, price comparison, and checkout cart dispensing. They are flagged here for administrative quarantine and vendor disposal.
          </p>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('EXPIRED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'EXPIRED'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Expired Batches</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{expiredList.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Blocked from dispensing</p>
        </button>

        <button
          onClick={() => setActiveTab('NEAR_EXPIRY')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'NEAR_EXPIRY'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Near Expiry (&le;90d)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{nearExpiryList.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Prioritize stock clearance</p>
        </button>

        <button
          onClick={() => setActiveTab('LOW_STOCK')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeTab === 'LOW_STOCK'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200'
              : 'bg-white border-slate-200 hover:border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Low Stock (&lt;20 units)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">{lowStockList.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Restock requisition recommended</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 text-xs font-semibold gap-x-4 gap-y-2">
        {[
          { key: 'ALL', label: `All Alerts (${expiredList.length + nearExpiryList.length + lowStockList.length})` },
          { key: 'EXPIRED', label: `Expired (${expiredList.length})` },
          { key: 'NEAR_EXPIRY', label: `Near Expiry (${nearExpiryList.length})` },
          { key: 'LOW_STOCK', label: `Low Stock (${lowStockList.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Table: Medicine name | Pharmacy | Batch number | Stock quantity | Expiry date */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Medicine Name</th>
                <th className="px-4 py-3.5">Pharmacy</th>
                <th className="px-4 py-3.5">Batch Number</th>
                <th className="px-4 py-3.5">Stock Quantity</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.map((med) => {
                const expired = isExpired(med.expiryDate);
                const nearExp = isNearExpiry(med.expiryDate) && !expired;
                const low = med.quantity !== null && med.quantity !== undefined && med.quantity < 20;
                const daysRemaining = getDaysUntilExpiry(med.expiryDate);

                return (
                  <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <MedicineImage
                          imageUrl={med.imageUrl}
                          name={med.name}
                          strength={med.strength}
                          form={med.form}
                          size="sm"
                          onClick={() => setDetailsMedicine(med)}
                        />
                        <div>
                          <button
                            type="button"
                            onClick={() => setDetailsMedicine(med)}
                            className="font-bold text-slate-800 text-sm hover:text-emerald-700 text-left transition-colors"
                          >
                            {med.name}
                          </button>
                          <p className="text-slate-400 text-[11px]">{med.strength || 'Strength not specified'} • {med.form}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={med.pharmacy}>{med.pharmacy}</Badge>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                      {med.batchNumber}
                    </td>
                    <td className="px-4 py-3.5 font-bold">
                      <span className={med.quantity === 0 ? 'text-rose-600' : med.quantity < 20 ? 'text-amber-600' : 'text-slate-700'}>
                        {med.quantity} units
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={expired ? 'text-rose-600 font-bold' : nearExp ? 'text-amber-600 font-bold' : 'text-slate-700'}>
                        {formatDate(med.expiryDate)}
                      </span>
                      {expired ? (
                        <span className="block text-[10px] text-rose-500 font-medium">Expired ({Math.abs(daysRemaining)}d ago)</span>
                      ) : nearExp ? (
                        <span className="block text-[10px] text-amber-600 font-medium">{daysRemaining} days remaining</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {expired && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            EXPIRED - QUARANTINED
                          </span>
                        )}
                        {nearExp && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            NEAR EXPIRY
                          </span>
                        )}
                        {low && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No medicines match the selected alert category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MedicineDetailsModal
        isOpen={Boolean(detailsMedicine)}
        onClose={() => setDetailsMedicine(null)}
        medicine={detailsMedicine}
        mode="inventory"
      />
    </div>
  );
}
