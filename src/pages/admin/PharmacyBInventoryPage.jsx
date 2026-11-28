import React, { useState } from 'react';
import { Building2, Search, PlusCircle, Edit3, Check, X, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockBadge } from '../../components/common/Badge';
import { MedicineImage } from '../../components/common/MedicineImage';
import { MedicineDetailsModal } from '../../components/common/MedicineDetailsModal';
import { AddMedicineModal } from '../../components/admin/AddMedicineModal';
import { formatCurrency, formatDate, isExpired } from '../../utils/dateUtils';

export function PharmacyBInventoryPage() {
  const { pharmacyBInventory, updateMedicine, fetchPharmacyBInventory } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [detailsMedicine, setDetailsMedicine] = useState(null);

  // Inline editing state: { [medId]: { stock, price } }
  const [editingId, setEditingId] = useState(null);
  const [inlineData, setInlineData] = useState({ stock: '', price: '' });

  React.useEffect(() => {
    fetchPharmacyBInventory().catch(() => {});
  }, [fetchPharmacyBInventory]);

  const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const pharmacyBMedicines = pharmacyBInventory.filter((m) => {
    if (tokens.length === 0) return true;
    const haystack = [m.name, m.strength, m.form, m.batchNumber, m.genericName, m.category]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return tokens.every((tok) => haystack.includes(tok));
  });

  const startInlineEdit = (med) => {
    setEditError('');
    setEditingId(med.id);
    setInlineData({
      stock: med.quantity !== null && med.quantity !== undefined ? med.quantity : '',
      price: med.price !== null && med.price !== undefined ? med.price : ''
    });
  };

  const saveInlineEdit = async (id) => {
    setEditError('');
    try {
      const payload = {};
      if (inlineData.stock !== '') {
        const q = parseInt(inlineData.stock, 10);
        if (isNaN(q) || q < 0) {
          setEditError('Stock quantity cannot be negative.');
          return;
        }
        payload.quantity = q;
      }
      if (inlineData.price !== '') {
        const p = parseFloat(inlineData.price);
        if (isNaN(p) || p <= 0) {
          setEditError('Price must be greater than zero.');
          return;
        }
        payload.price = p;
      }

      await updateMedicine(id, payload);
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update Pharmacy B inventory.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full w-fit mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dedicated Unit Inventory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pharmacy B Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage stock quantity, batch numbers, unit prices and expiry dates specifically for Pharmacy B.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add to Pharmacy B</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Pharmacy B medicines by name or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {editError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{editError}</span>
        </div>
      )}

      {/* Table: Medicine name | Batch number | Stock quantity | Price | Expiry date | Stock status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Medicine Name</th>
                <th className="px-4 py-3.5">Batch Number</th>
                <th className="px-4 py-3.5">Stock Quantity</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-4 py-3.5">Stock Status</th>
                <th className="px-4 py-3.5 text-right">Quick Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pharmacyBMedicines.map((med) => {
                const isEditing = editingId === med.id;
                const expired = isExpired(med.expiryDate);

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
                            className="font-bold text-slate-800 text-sm hover:text-sky-700 text-left transition-colors"
                          >
                            {med.name}
                          </button>
                          <p className="text-slate-400 text-[11px]">{med.strength || 'Strength not specified'} • {med.form}</p>
                          {med.category && <p className="text-slate-400 text-[10px]">{med.category}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{med.batchNumber || 'Not provided'}</td>
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={inlineData.stock}
                          onChange={(e) => setInlineData(prev => ({ ...prev, stock: e.target.value }))}
                          className="w-20 px-2 py-1 rounded border border-sky-400 text-xs font-bold"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">
                          {med.quantity !== null && med.quantity !== undefined ? `${med.quantity} units` : 'Not provided'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={inlineData.price}
                          onChange={(e) => setInlineData(prev => ({ ...prev, price: e.target.value }))}
                          className="w-20 px-2 py-1 rounded border border-sky-400 text-xs font-bold"
                        />
                      ) : (
                        <span className="font-bold text-slate-800">{formatCurrency(med.price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={expired ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {formatDate(med.expiryDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StockBadge quantity={med.quantity} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => saveInlineEdit(med.id)}
                            className="p-1 rounded bg-sky-600 text-white hover:bg-sky-700"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startInlineEdit(med)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Quick Edit Stock & Price"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {pharmacyBMedicines.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No medicines found in Pharmacy B inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMedicineModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultPharmacy="Pharmacy B"
      />

      <MedicineDetailsModal
        isOpen={Boolean(detailsMedicine)}
        onClose={() => setDetailsMedicine(null)}
        medicine={detailsMedicine}
        mode="inventory"
      />
    </div>
  );
}
