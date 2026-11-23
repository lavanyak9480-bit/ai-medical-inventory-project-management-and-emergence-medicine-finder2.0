import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Info,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge, StockBadge } from '../../components/common/Badge';
import { formatCurrency, isExpired } from '../../utils/dateUtils';

export function MedicineComparePage() {
  const { medicines, carts, addToCart, removeFromCart, updateCartQuantity } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // If navigated from OCR, use extracted medicines, otherwise search/browse
  const initialExtracted = location.state?.extractedMedicines || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [cartSuccessNotice, setCartSuccessNotice] = useState('');

  // Extract distinct medicine names available in the catalog
  const distinctMedicineCatalog = React.useMemo(() => {
    const map = new Map();
    medicines.forEach(m => {
      // Exclude expired batches from sellable search/comparison!
      if (isExpired(m.expiryDate)) return;

      const key = `${m.name.toLowerCase().trim()}_${m.strength.toLowerCase().trim()}`;
      if (!map.has(key)) {
        map.set(key, {
          name: m.name,
          strength: m.strength,
          genericName: m.genericName,
          form: m.form,
          prescriptionRequired: m.prescriptionRequired
        });
      }
    });
    return Array.from(map.values());
  }, [medicines]);

  // If user came from OCR, map extracted names to comparison items
  const itemsToCompare = React.useMemo(() => {
    if (initialExtracted.length > 0) {
      return initialExtracted.map(ext => {
        // If unable to detect
        if (ext.name.includes('Unable to detect')) {
          return {
            name: ext.name,
            strength: ext.strength,
            isUncertain: true
          };
        }
        return {
          name: ext.name,
          strength: ext.strength,
          isUncertain: false
        };
      });
    }

    // Otherwise show all or filtered items
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return distinctMedicineCatalog.filter(
        m => m.name.toLowerCase().includes(q) || m.genericName?.toLowerCase().includes(q)
      );
    }

    return distinctMedicineCatalog;
  }, [initialExtracted, distinctMedicineCatalog, searchTerm]);

  // Helper to get active non-expired stock and price for a pharmacy
  const getPharmacyOffer = (medicineName, strength, pharmacyName) => {
    const match = medicines.find(m =>
      m.name.toLowerCase().trim() === medicineName.toLowerCase().trim() &&
      (!strength || m.strength.toLowerCase().trim() === strength.toLowerCase().trim()) &&
      m.pharmacy === pharmacyName &&
      !isExpired(m.expiryDate)
    );

    if (!match) {
      return { available: false, stock: 0, price: null, item: null };
    }

    return {
      available: match.quantity > 0,
      stock: match.quantity,
      price: match.price,
      item: match
    };
  };

  const handleAddToCart = (pharmacy, item) => {
    try {
      addToCart(pharmacy, item, 1);
      setCartSuccessNotice(`Added ${item.name} (${pharmacy}) to cart!`);
      setTimeout(() => setCartSuccessNotice(''), 2500);
    } catch (err) {
      alert(err.message);
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
            Real-time stock and unit prices. Expired batches are automatically excluded. Order from pharmacies separately.
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

      {/* Search Input when not locked to extracted prescription */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search medicine by brand or generic name..."
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

                const offerA = getPharmacyOffer(med.name, med.strength, 'Pharmacy A');
                const offerB = getPharmacyOffer(med.name, med.strength, 'Pharmacy B');

                const unavailableInBoth = !offerA.available && !offerB.available;

                return (
                  <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                    {/* Medicine Info */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                      <p className="text-slate-500 text-xs">{med.strength} {med.form ? `• ${med.form}` : ''}</p>
                      {med.genericName && (
                        <p className="text-slate-400 text-[11px] italic">{med.genericName}</p>
                      )}
                      {med.prescriptionRequired && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Prescription (Rx) Required
                        </span>
                      )}
                    </td>

                    {/* Pharmacy A Column */}
                    <td className="px-5 py-4 bg-emerald-50/30 border-x border-emerald-100">
                      {offerA.item ? (
                        <div className="space-y-1.5">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-base font-bold text-slate-900">
                              {formatCurrency(offerA.price)}
                            </span>
                            <span className="text-[10px] text-slate-400">/ unit</span>
                          </div>
                          <div>
                            <StockBadge quantity={offerA.stock} />
                          </div>
                          {offerA.available && (
                            <button
                              type="button"
                              onClick={() => handleAddToCart('Pharmacy A', offerA.item)}
                              className="mt-2 w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center space-x-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Order from Pharmacy A</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-xs">
                          Not stocked in Pharmacy A
                        </div>
                      )}
                    </td>

                    {/* Pharmacy B Column */}
                    <td className="px-5 py-4 bg-sky-50/30">
                      {offerB.item ? (
                        <div className="space-y-1.5">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-base font-bold text-slate-900">
                              {formatCurrency(offerB.price)}
                            </span>
                            <span className="text-[10px] text-slate-400">/ unit</span>
                          </div>
                          <div>
                            <StockBadge quantity={offerB.stock} />
                          </div>
                          {offerB.available && (
                            <button
                              type="button"
                              onClick={() => handleAddToCart('Pharmacy B', offerB.item)}
                              className="mt-2 w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center space-x-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Order from Pharmacy B</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-xs">
                          Not stocked in Pharmacy B
                        </div>
                      )}
                    </td>

                    {/* Comparison Status */}
                    <td className="px-5 py-4 text-center">
                      {unavailableInBoth ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            Not available in either pharmacy
                          </span>
                          <span className="text-[11px] text-slate-400 mt-1">
                            Continue with other available medicines
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Cart Summary Card & Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pharmacy A Cart Box */}
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

        {/* Pharmacy B Cart Box */}
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
    </div>
  );
}
