import React, { useState } from 'react';
import {
  Pill,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, StockBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { MedicineImage } from '../../components/common/MedicineImage';
import { MedicineDetailsModal } from '../../components/common/MedicineDetailsModal';
import { AddMedicineModal } from '../../components/admin/AddMedicineModal';
import { formatCurrency, formatDate, isExpired } from '../../utils/dateUtils';

export function MedicinesManagementPage() {
  const { medicines, updateMedicine, deleteMedicine } = useApp();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deletingMedicine, setDeletingMedicine] = useState(null);
  const [detailsMedicine, setDetailsMedicine] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState('ALL'); // 'ALL' | 'Pharmacy A' | 'Pharmacy B'

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    strength: '',
    form: '',
    batchNumber: '',
    quantity: '',
    price: '',
    expiryDate: ''
  });
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredMedicines = medicines.filter(m => {
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const haystack = [m.name, m.strength, m.form, m.batchNumber, m.genericName, m.category]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesSearch = tokens.length === 0 || tokens.every(tok => haystack.includes(tok));

    const matchesPharmacy = selectedPharmacy === 'ALL' || m.pharmacy === selectedPharmacy;
    return matchesSearch && matchesPharmacy;
  });

  const handleOpenEdit = (med) => {
    setEditingMedicine(med);
    setEditForm({
      name: med.name || '',
      strength: med.strength || '',
      form: med.form || '',
      batchNumber: med.batchNumber || '',
      quantity: med.quantity !== null && med.quantity !== undefined ? med.quantity : '',
      price: med.price !== null && med.price !== undefined ? med.price : '',
      expiryDate: med.expiryDate || ''
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    const payload = {
      name: editForm.name,
      strength: editForm.strength,
      form: editForm.form,
      batchNumber: editForm.batchNumber,
      expiryDate: editForm.expiryDate
    };

    if (editForm.quantity !== '') {
      const qty = parseInt(editForm.quantity, 10);
      if (isNaN(qty) || qty < 0) {
        setEditError('Quantity cannot be negative.');
        return;
      }
      payload.quantity = qty;
    }

    if (editForm.price !== '') {
      const prc = parseFloat(editForm.price);
      if (isNaN(prc) || prc <= 0) {
        setEditError('Price must be greater than 0.');
        return;
      }
      payload.price = prc;
    }

    setIsSaving(true);
    try {
      await updateMedicine(editingMedicine.id, payload);
      setEditingMedicine(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update medicine.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingMedicine) {
      setDeleteError('');
      try {
        await deleteMedicine(deletingMedicine.id);
        setDeletingMedicine(null);
      } catch (err) {
        setDeleteError(err.message || 'Failed to delete medicine.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Medicine Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            View, add, edit, or delete inventory medicines across Pharmacy A and Pharmacy B.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by medicine name, generic name, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedPharmacy}
            onChange={(e) => setSelectedPharmacy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="ALL">All Pharmacies (A & B)</option>
            <option value="Pharmacy A">Pharmacy A</option>
            <option value="Pharmacy B">Pharmacy B</option>
          </select>
        </div>
      </div>

      {/* Simple Required Table: Medicine | Strength | Pharmacy | Stock | Price | Expiry | Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Medicine</th>
                <th className="px-4 py-3.5">Strength</th>
                <th className="px-4 py-3.5">Pharmacy</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Expiry</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMedicines.map((med) => {
                const expired = isExpired(med.expiryDate);

                return (
                  <tr key={med.id} className={`hover:bg-slate-50/70 transition-colors ${expired ? 'bg-rose-50/20' : ''}`}>
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
                          <p className="text-slate-400 text-[11px] font-mono">
                            Batch: {med.batchNumber || 'Not provided'}
                          </p>
                          {med.category && (
                            <p className="text-slate-400 text-[10px]">{med.category}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {med.strength || 'Not specified'} <span className="text-slate-400 text-[11px]">({med.form})</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={med.pharmacy}>{med.pharmacy}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <StockBadge quantity={med.quantity} />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {formatCurrency(med.price)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={expired ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {formatDate(med.expiryDate)}
                      </span>
                      {expired && (
                        <span className="block text-[10px] text-rose-500 font-medium">Expired Batch</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Medicine"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMedicine(med)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No medicines match the selected filter or search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Medicine Modal */}
      {editingMedicine && (
        <Modal
          isOpen={Boolean(editingMedicine)}
          onClose={() => setEditingMedicine(null)}
          title={`Edit Medicine: ${editingMedicine.name} (${editingMedicine.pharmacy})`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Strength</label>
                <input
                  type="text"
                  value={editForm.strength}
                  onChange={(e) => setEditForm(prev => ({ ...prev, strength: e.target.value }))}
                  placeholder="e.g. 500mg"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={editForm.batchNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="e.g. BATCH-01"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Form</label>
                <input
                  type="text"
                  value={editForm.form}
                  onChange={(e) => setEditForm(prev => ({ ...prev, form: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingMedicine(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMedicine && (
        <Modal
          isOpen={Boolean(deletingMedicine)}
          onClose={() => setDeletingMedicine(null)}
          title="Confirm Medicine Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{deletingMedicine.name} ({deletingMedicine.strength})</strong> from <strong className="text-emerald-700">{deletingMedicine.pharmacy}</strong>?
            </p>
            <p className="text-[11px] text-slate-400">
              Batch: {deletingMedicine.batchNumber} • Stock: {deletingMedicine.quantity}
            </p>

            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingMedicine(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Delete Medicine
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {/* Medicine Details Modal */}
      <MedicineDetailsModal
        isOpen={Boolean(detailsMedicine)}
        onClose={() => setDetailsMedicine(null)}
        medicine={detailsMedicine}
        mode="inventory"
      />
    </div>
  );
}
