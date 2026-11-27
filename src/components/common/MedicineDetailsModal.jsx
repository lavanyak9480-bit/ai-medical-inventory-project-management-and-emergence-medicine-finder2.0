import React from 'react';
import { Plus, ShieldAlert, Building2, Calendar, Package } from 'lucide-react';
import { Modal } from './Modal';
import { MedicineImage } from './MedicineImage';
import { Badge, StockBadge } from './Badge';
import { formatCurrency, formatDate } from '../../utils/dateUtils';

export function MedicineDetailsModal({
  isOpen,
  onClose,
  medicine,
  mode = 'inventory', // 'inventory' | 'compare'
  onAddToCart
}) {
  if (!medicine) return null;

  const isCompare = mode === 'compare';
  const name = medicine.name || medicine.medicine_name || 'Medicine';
  const genericName = medicine.genericName || medicine.generic_name || '';
  const strength = medicine.strength || '';
  const form = medicine.form || '';
  const category = medicine.category || '';
  const indication = medicine.indication || '';
  const rxRequired = Boolean(medicine.prescriptionRequired ?? medicine.prescription_required);
  const rxStatus = medicine.prescriptionStatus || medicine.prescription_status || (rxRequired ? 'Rx' : 'Non-prescription');
  const imageUrl = medicine.imageUrl || medicine.image_url;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Medicine Details"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Header Summary with Large Medicine Image */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <MedicineImage
            imageUrl={imageUrl}
            name={name}
            strength={strength}
            form={form}
            size="lg"
            className="mx-auto sm:mx-0"
          />

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h4 className="text-xl font-extrabold text-slate-900">{name}</h4>
              {rxRequired ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Rx Required</span>
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {rxStatus}
                </span>
              )}
            </div>

            {genericName && (
              <p className="text-xs text-slate-600">
                Generic: <span className="font-semibold text-slate-800">{genericName}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
                Strength: {strength || 'Not specified'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
                Form: {form || 'Not specified'}
              </span>
              {category && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium">
                  {category}
                </span>
              )}
            </div>

            {indication && (
              <p className="text-xs text-slate-500 pt-1">
                <strong className="text-slate-700">Indication:</strong> {indication}
              </p>
            )}
          </div>
        </div>

        {/* Pharmacy Availability Details */}
        {isCompare ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Pharmacy A', offer: medicine.pharmacy_a, border: 'border-emerald-200', bg: 'bg-emerald-50/40', btn: 'bg-emerald-600 hover:bg-emerald-700' },
              { label: 'Pharmacy B', offer: medicine.pharmacy_b, border: 'border-sky-200', bg: 'bg-sky-50/40', btn: 'bg-sky-600 hover:bg-sky-700' }
            ].map(({ label, offer, border, bg, btn }) => (
              <div key={label} className={`p-4 rounded-xl border ${border} ${bg} space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <Badge variant={label}>{label}</Badge>
                  {offer?.stocked_in_catalog ? (
                    <StockBadge quantity={offer.stock} />
                  ) : (
                    <Badge variant="default">Not Stocked</Badge>
                  )}
                </div>

                {offer?.stocked_in_catalog ? (
                  <div className="space-y-1 text-xs text-slate-600">
                    <p className="text-lg font-extrabold text-slate-900">
                      {offer.price !== null && offer.price !== undefined
                        ? formatCurrency(offer.price)
                        : 'Price missing'}
                    </p>
                    <p>Batch: <span className="font-mono text-slate-700">{offer.batch_number || 'Not provided'}</span></p>
                    <p>Expiry: <span className="font-medium text-slate-700">{offer.expiry_date ? formatDate(offer.expiry_date) : offer.status}</span></p>
                    {offer.available && onAddToCart && (
                      <button
                        type="button"
                        onClick={() => {
                          onAddToCart(label, medicine, offer);
                          onClose();
                        }}
                        className={`mt-2 w-full py-2 px-3 ${btn} text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add from {label}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Not available in {label} catalog.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center space-x-1 text-slate-400 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Pharmacy</span>
              </div>
              <Badge variant={medicine.pharmacy}>{medicine.pharmacy}</Badge>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center space-x-1 text-slate-400 mb-1">
                <Package className="w-3.5 h-3.5" />
                <span>Stock &amp; Batch</span>
              </div>
              <StockBadge quantity={medicine.quantity} />
              <p className="font-mono text-[11px] text-slate-500 mt-1">{medicine.batchNumber || 'No batch'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 block mb-1">Unit Price</span>
              <p className="text-base font-extrabold text-slate-900">{formatCurrency(medicine.price)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center space-x-1 text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expiry Date</span>
              </div>
              <p className={`font-bold ${medicine.isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatDate(medicine.expiryDate)}
              </p>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
