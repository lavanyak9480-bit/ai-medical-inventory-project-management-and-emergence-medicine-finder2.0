import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isExpired } from '../../utils/dateUtils';

export function AddMedicineModal({ isOpen, onClose }) {
  const { addMedicine } = useApp();

  const initialFormState = {
    name: '',
    genericName: '',
    strength: '',
    form: 'Tablet',
    prescriptionRequired: false,
    batchNumber: '',
    quantity: '',
    price: '',
    mfgDate: '',
    expiryDate: '',
    pharmacySelection: 'Both Pharmacies' // 'Pharmacy A' | 'Pharmacy B' | 'Both Pharmacies'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      // Basic validation checks
      if (!formData.name.trim()) {
        setError('Medicine name is required.');
        return;
      }
      if (!formData.strength.trim()) {
        setError('Strength (e.g. 500mg, 10mg) is required.');
        return;
      }
      if (!formData.batchNumber.trim()) {
        setError('Batch number is required.');
        return;
      }
      const qty = parseInt(formData.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setError('Quantity must be a positive number greater than 0.');
        return;
      }
      const prc = parseFloat(formData.price);
      if (isNaN(prc) || prc <= 0) {
        setError('Price must be greater than ₹0.00.');
        return;
      }
      if (!formData.expiryDate) {
        setError('Expiry date is required.');
        return;
      }
      if (isExpired(formData.expiryDate)) {
        setError('Cannot add expired batches to sellable inventory. Please set a future expiry date.');
        return;
      }

      // Add to inventory
      addMedicine(formData);
      setSuccessMsg(`Successfully added ${formData.name} to ${formData.pharmacySelection}!`);
      
      setTimeout(() => {
        setFormData(initialFormState);
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to add medicine.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Medicine to Inventory" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Pharmacy Selection */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Target Pharmacy Inventory <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Pharmacy A', label: 'Pharmacy A Only' },
              { id: 'Pharmacy B', label: 'Pharmacy B Only' },
              { id: 'Both Pharmacies', label: 'Both Pharmacies (A & B)' },
            ].map(item => (
              <label
                key={item.id}
                className={`flex items-center justify-center p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  formData.pharmacySelection === item.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="pharmacySelection"
                  value={item.id}
                  checked={formData.pharmacySelection === item.id}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Medicine Name & Generic Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Medicine Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Amoxicillin"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Generic Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="genericName"
              placeholder="e.g. Amoxicillin Trihydrate"
              value={formData.genericName}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Strength & Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Strength <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="strength"
              placeholder="e.g. 500mg, 10mg, 100ml"
              value={formData.strength}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Form <span className="text-rose-500">*</span>
            </label>
            <select
              name="form"
              value={formData.form}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
              <option value="Ointment">Ointment</option>
              <option value="Drops">Drops</option>
              <option value="Inhaler">Inhaler</option>
            </select>
          </div>
        </div>

        {/* Batch Number & Prescription Required */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Batch Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="batchNumber"
              placeholder="e.g. BATCH-2026-X1"
              value={formData.batchNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div className="pt-4">
            <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="prescriptionRequired"
                checked={formData.prescriptionRequired}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="font-medium">Prescription Required (Rx)</span>
            </label>
            <p className="text-[11px] text-slate-400 ml-6">Requires verified prescription before dispensing</p>
          </div>
        </div>

        {/* Quantity & Unit Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Stock Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              placeholder="e.g. 100"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Price per Unit (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              step="0.5"
              min="1"
              placeholder="e.g. 75.00"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* Manufacture Date & Expiry Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Manufacture Date <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              name="mfgDate"
              value={formData.mfgDate}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Expiry Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-0.5">Must be a future date for sellable inventory</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add to Inventory</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
