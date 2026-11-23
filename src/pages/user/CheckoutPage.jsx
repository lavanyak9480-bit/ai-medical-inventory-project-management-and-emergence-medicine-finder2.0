import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Building2,
  MapPin,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PhonePeModal } from '../../components/payment/PhonePeModal';
import { formatCurrency } from '../../utils/dateUtils';
import { Badge } from '../../components/common/Badge';

export function CheckoutPage() {
  const { carts, removeFromCart, createOrder, currentUser } = useApp();
  const navigate = useNavigate();

  const [deliveryAddress, setDeliveryAddress] = useState(
    currentUser?.address || 'Flat 402, Green Valley Apts, Indiranagar, Bengaluru - 560038'
  );

  // PhonePe Modal state
  const [activePaymentPharmacy, setActivePaymentPharmacy] = useState(null); // 'Pharmacy A' | 'Pharmacy B' | null
  const [paymentAmount, setPaymentAmount] = useState(0);

  const cartA = carts['Pharmacy A'] || [];
  const cartB = carts['Pharmacy B'] || [];

  const totalA = cartA.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
  const totalB = cartB.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);

  const handleLaunchPayment = (pharmacy, amount) => {
    setActivePaymentPharmacy(pharmacy);
    setPaymentAmount(amount);
  };

  const handlePaymentSuccess = () => {
    if (!activePaymentPharmacy) return;

    const items = activePaymentPharmacy === 'Pharmacy A' ? cartA : cartB;
    const amount = activePaymentPharmacy === 'Pharmacy A' ? totalA : totalB;

    // Create order in context and reduce stock
    const newOrder = createOrder({
      pharmacy: activePaymentPharmacy,
      items,
      totalAmount: amount,
      deliveryAddress,
      paymentStatus: 'Paid',
      paymentMethod: 'PhonePe UPI (Demo)'
    });

    setActivePaymentPharmacy(null);
    // Navigate directly to My Orders
    navigate('/my-orders');
  };

  if (cartA.length === 0 && cartB.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Compare medicines across Pharmacy A and Pharmacy B and add items to place separate orders.
        </p>
        <button
          onClick={() => navigate('/compare')}
          className="mt-5 px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
        >
          Compare & Select Medicines
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Separate Pharmacy Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Pharmacy A and Pharmacy B maintain separate inventories and are checked out individually.
        </p>
      </div>

      {/* Delivery Address Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-slate-800 text-sm">Delivery Address</h2>
        </div>
        <div className="mt-3">
          <textarea
            rows={2}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter full address for dispatch..."
          />
          <p className="text-[11px] text-slate-400 mt-1">Recipient: {currentUser?.name} • {currentUser?.phone}</p>
        </div>
      </div>

      {/* Separate Pharmacy Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pharmacy A Checkout Card */}
        {cartA.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center space-x-2">
                  <Badge variant="Pharmacy A">Pharmacy A</Badge>
                  <span className="text-xs text-slate-500">Order Summary</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">{cartA.length} item(s)</span>
              </div>

              <div className="divide-y divide-slate-100 mt-3 max-h-56 overflow-y-auto pr-1">
                {cartA.map((it) => (
                  <div key={it.medicine.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{it.medicine.name} {it.medicine.strength}</p>
                      <p className="text-slate-500 text-[11px]">
                        Qty: {it.quantity} × {formatCurrency(it.medicine.price)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">
                        {formatCurrency(it.medicine.price * it.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart('Pharmacy A', it.medicine.id)}
                        className="text-slate-400 hover:text-rose-500"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Pharmacy A Total:</span>
                <span className="text-xl font-extrabold text-emerald-700">{formatCurrency(totalA)}</span>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchPayment('Pharmacy A', totalA)}
                className="w-full py-3 bg-[#5f259f] hover:bg-[#4d1e82] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs"
              >
                <QrCode className="w-4 h-4 text-purple-200" />
                <span>Pay {formatCurrency(totalA)} via PhonePe QR</span>
              </button>
            </div>
          </div>
        )}

        {/* Pharmacy B Checkout Card */}
        {cartB.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-sky-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <div className="flex items-center space-x-2">
                  <Badge variant="Pharmacy B">Pharmacy B</Badge>
                  <span className="text-xs text-slate-500">Order Summary</span>
                </div>
                <span className="text-xs font-bold text-sky-700">{cartB.length} item(s)</span>
              </div>

              <div className="divide-y divide-slate-100 mt-3 max-h-56 overflow-y-auto pr-1">
                {cartB.map((it) => (
                  <div key={it.medicine.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{it.medicine.name} {it.medicine.strength}</p>
                      <p className="text-slate-500 text-[11px]">
                        Qty: {it.quantity} × {formatCurrency(it.medicine.price)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">
                        {formatCurrency(it.medicine.price * it.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart('Pharmacy B', it.medicine.id)}
                        className="text-slate-400 hover:text-rose-500"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Pharmacy B Total:</span>
                <span className="text-xl font-extrabold text-sky-700">{formatCurrency(totalB)}</span>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchPayment('Pharmacy B', totalB)}
                className="w-full py-3 bg-[#5f259f] hover:bg-[#4d1e82] text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-xs"
              >
                <QrCode className="w-4 h-4 text-purple-200" />
                <span>Pay {formatCurrency(totalB)} via PhonePe QR</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PhonePe Dummy Payment Modal */}
      <PhonePeModal
        isOpen={Boolean(activePaymentPharmacy)}
        onClose={() => setActivePaymentPharmacy(null)}
        amount={paymentAmount}
        pharmacy={activePaymentPharmacy || ''}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
