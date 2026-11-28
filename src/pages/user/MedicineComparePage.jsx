import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StockBadge } from '../../components/common/Badge';
import { MedicineImage } from '../../components/common/MedicineImage';
import { MedicineDetailsModal } from '../../components/common/MedicineDetailsModal';
import { formatCurrency, formatDate } from '../../utils/dateUtils';

export function MedicineComparePage() {
  const {
    comparisonList,
    fetchComparison,
    carts,
    addToCart,
    updateCartQuantity
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const initialExtracted = location.state?.extractedMedicines || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [cartSuccessNotice, setCartSuccessNotice] = useState('');
  const [cartErrorNotice, setCartErrorNotice] = useState('');
  const [detailsMedicine, setDetailsMedicine] = useState(null);

  useEffect(() => {
    fetchComparison().catch(() => { });
  }, [fetchComparison]);

  const itemsToCompare = React.useMemo(() => {
    let baseList;
    if (initialExtracted.length > 0) {
      baseList = [];
      initialExtracted.forEach(ext => {
        if ((ext.name || '').includes('Unable to detect')) {
          baseList.push({
            name: ext.name,
            strength: ext.strength,
            isUncertain: true
          });
          return;
        }

        // Match exact medicine name and normalized strength (if strength detected clearly)
        const extName = (ext.name || '').toLowerCase().trim();
        const extStrengthNorm = (ext.strength || '').toLowerCase().replace(/\s+/g, '');
        const hasStrength = extStrengthNorm && !extStrengthNorm.includes('unabletodetect');

        const matches = comparisonList.filter(c =>
          c.name.toLowerCase().trim() === extName &&
          (!hasStrength || (c.strength || '').toLowerCase().replace(/\s+/g, '') === extStrengthNorm)
        );

        if (matches.length > 0) {
          matches.forEach(m => baseList.push({ ...m, isUncertain: false }));
        } else {
          baseList.push({
            medicine_id: null,
            name: ext.name,
            strength: ext.strength,
            form: '',
            generic_name: '',
            category: '',
            prescription_required: true,
            pharmacy_a: { available: false, stock: 0, price: null, status: 'Not Stocked' },
            pharmacy_b: { available: false, stock: 0, price: null, status: 'Not Stocked' },
            overall_status: 'Not available in either pharmacy.',
            isUncertain: false
          });
        }
      });
    } else {
      baseList = comparisonList;
    }

    if (searchTerm.trim()) {
      const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      return baseList.filter((m) => {
        if (m.isUncertain) return true;
        const haystack = [m.name, m.generic_name, m.category, m.strength, m.form]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return tokens.every((tok) => haystack.includes(tok));
      });
    }

    return baseList;
  }, [initialExtracted, comparisonList, searchTerm]);

  const handleAddToCart = (pharmacy, med, offer) => {
    setCartErrorNotice('');
    try {
      const cartMedicine = {
        id: offer.inventory_id,
        inventoryId: offer.inventory_id,
        medicineId: med.medicine_id,
        name: med.name,
        strength: med.strength || '',
        form: med.form,
        imageUrl: med.image_url,
        price: offer.price,
        quantity: offer.stock,
        expiryDate: offer.expiry_date,
        prescriptionRequired: med.prescription_required
      };
      addToCart(pharmacy, cartMedicine, 1);
      setCartSuccessNotice(`Added ${med.name} (${pharmacy}) to cart!`);
      setTimeout(() => setCartSuccessNotice(''), 2500);
    } catch (err) {
      setCartErrorNotice(err.message || 'Unable to add medicine to cart.');
    }
  };

  const totalCartCount = (carts['Pharmacy A']?.length || 0) + (carts['Pharmacy B']?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
            <Scale className="w-4 h-4" />
            <span>Dual Pharmacy Price & Stock Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Compare Pharmacy A & Pharmacy B
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live database comparison. Different strengths are never mixed, and expired batches are excluded.
          </p>
        </div>

        {totalCartCount > 0 && (
          <button
            onClick={() => navigate('/checkout')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Proceed to Checkout ({totalCartCount} items)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {cartSuccessNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{cartSuccessNotice}</span>
        </div>
      )}

      {cartErrorNotice && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cartErrorNotice}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine by name, generic name, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        {initialExtracted.length > 0 && (
          <button
            onClick={() => {
              navigate('/compare', { state: {} });
              setSearchTerm('');
            }}
            className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
          >
            Clear OCR Filter (Show All)
          </button>
        )}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Medicine & Strength</th>
                <th className="px-5 py-3.5 bg-emerald-50/50 border-x border-emerald-100">
                  <div className="flex items-center space-x-1 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Pharmacy A</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 bg-sky-50/50">
                  <div className="flex items-center space-x-1 text-sky-800">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>Pharmacy B</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-center">Status / Best Deal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsToCompare.map((med, index) => {
                if (med.isUncertain) {
                  return (
                    <tr key={index} className="bg-rose-50/30">
                      <td colSpan={4} className="px-5 py-4 text-rose-700">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            <strong>Uncertain OCR Item:</strong> Unable to detect – manual confirmation required. Please consult pharmacist.
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const offerA = med.pharmacy_a || { available: false, stock: 0, price: null, status: 'Not Stocked' };
                const offerB = med.pharmacy_b || { available: false, stock: 0, price: null, status: 'Not Stocked' };
                const unavailableInBoth = !offerA.available && !offerB.available;

                const renderOfferCell = (pharmacyName, offer, btnColor) => {
                  if (!offer.stocked_in_catalog) {
                    return (
                      <div className="text-slate-400 italic text-xs">
                        Not stocked in {pharmacyName}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-base font-bold text-slate-900">
                          {offer.price !== null && offer.price !== undefined
                            ? formatCurrency(offer.price)
                            : 'Price missing'}
                        </span>
                        {offer.price !== null && offer.price !== undefined && (
                          <span className="text-[10px] text-slate-400">/ unit</span>
                        )}
                      </div>

                      <div>
                        <StockBadge quantity={offer.stock} />
                      </div>

                      {offer.expiry_date ? (
                        <p className={`text-[11px] ${offer.is_near_expiry ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                          Exp: {formatDate(offer.expiry_date)} {offer.is_near_expiry ? '(Near Expiry)' : ''}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">
                          {offer.status}
                        </p>
                      )}

                      {offer.available && (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(pharmacyName, med, offer)}
                          className={`mt-2 w-full py-1.5 px-3 ${btnColor} text-white font-medium rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center space-x-1`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Order from {pharmacyName}</span>
                        </button>
                      )}
                    </div>
                  );
                };

                return (
                  <tr key={`${med.medicine_id || med.name}-${index}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start space-x-3">
                        <MedicineImage
                          imageUrl={med.image_url}
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
                          <p className="text-slate-500 text-xs">
                            {med.strength || 'Strength not specified'} {med.form ? `• ${med.form}` : ''}
                          </p>
                          {med.category && (
                            <p className="text-slate-400 text-[11px]">{med.category}</p>
                          )}
                          {med.prescription_required && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Prescription (Rx) Required
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 bg-emerald-50/30 border-x border-emerald-100">
                      {renderOfferCell('Pharmacy A', offerA, 'bg-emerald-600 hover:bg-emerald-700')}
                    </td>

                    <td className="px-5 py-4 bg-sky-50/30">
                      {renderOfferCell('Pharmacy B', offerB, 'bg-sky-600 hover:bg-sky-700')}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {unavailableInBoth ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            Not available in either pharmacy.
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1">
                            No active non-expired stock with pricing
                          </span>
                        </div>
                      ) : (
                        <div>
                          {offerA.available && offerB.available ? (
                            offerA.price < offerB.price ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Pharmacy A is ₹{(offerB.price - offerA.price).toFixed(2)} cheaper
                              </span>
                            ) : offerB.price < offerA.price ? (
                              <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                                Pharmacy B is ₹{(offerA.price - offerB.price).toFixed(2)} cheaper
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Equal Price
                              </span>
                            )
                          ) : offerA.available ? (
                            <span className="text-xs text-emerald-700 font-medium">Available only in Pharmacy A</span>
                          ) : (
                            <span className="text-xs text-sky-700 font-medium">Available only in Pharmacy B</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {itemsToCompare.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    No medicines match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cart Summary Card & Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="font-bold text-slate-800 text-sm">Pharmacy A Cart</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              {carts['Pharmacy A']?.length || 0} item(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {(carts['Pharmacy A'] || []).map((cartItem) => (
              <div key={cartItem.medicine.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">{cartItem.medicine.name} {cartItem.medicine.strength}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatCurrency(cartItem.medicine.price)} × {cartItem.quantity} = {formatCurrency(cartItem.medicine.price * cartItem.quantity)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartQuantity('Pharmacy A', cartItem.medicine.id, cartItem.quantity - 1)}
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-semibold w-4 text-center">{cartItem.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity('Pharmacy A', cartItem.medicine.id, cartItem.quantity + 1)}
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {(!carts['Pharmacy A'] || carts['Pharmacy A'].length === 0) && (
              <p className="py-4 text-center text-xs text-slate-400">Pharmacy A cart is empty.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <h2 className="font-bold text-slate-800 text-sm">Pharmacy B Cart</h2>
            </div>
            <span className="text-xs font-semibold text-sky-700">
              {carts['Pharmacy B']?.length || 0} item(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {(carts['Pharmacy B'] || []).map((cartItem) => (
              <div key={cartItem.medicine.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">{cartItem.medicine.name} {cartItem.medicine.strength}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatCurrency(cartItem.medicine.price)} × {cartItem.quantity} = {formatCurrency(cartItem.medicine.price * cartItem.quantity)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartQuantity('Pharmacy B', cartItem.medicine.id, cartItem.quantity - 1)}
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-semibold w-4 text-center">{cartItem.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity('Pharmacy B', cartItem.medicine.id, cartItem.quantity + 1)}
                    className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {(!carts['Pharmacy B'] || carts['Pharmacy B'].length === 0) && (
              <p className="py-4 text-center text-xs text-slate-400">Pharmacy B cart is empty.</p>
            )}
          </div>
        </div>
      </div>

      <MedicineDetailsModal
        isOpen={Boolean(detailsMedicine)}
        onClose={() => setDetailsMedicine(null)}
        medicine={detailsMedicine}
        mode="compare"
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
