import React, { useState } from 'react';
import { ShoppingBag, CheckCircle2, Clock, Truck, Package, ShieldCheck, MapPin, XCircle, QrCode, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/common/Badge';
import { MedicineImage } from '../../components/common/MedicineImage';
import { PhonePeModal } from '../../components/payment/PhonePeModal';
import { formatCurrency, formatDate } from '../../utils/dateUtils';

const STAGES = [
  { key: "Order Placed", label: "1. Order Placed", icon: ShoppingBag },
  { key: "Verification", label: "2. Verification", icon: ShieldCheck },
  { key: "Preparing", label: "3. Preparing", icon: Package },
  { key: "Dispatched", label: "4. Dispatched", icon: Truck },
  { key: "Delivered", label: "5. Delivered", icon: CheckCircle2 }
];

export function MyOrdersPage() {
  const { orders, currentUser, cancelOrder, completeDemoPayment, failDemoPayment } = useApp();
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [payingOrder, setPayingOrder] = useState(null);

  const myOrders = orders.filter(o => !o.userId || o.userId === currentUser?.id);

  const handleCancelOrder = async (orderId) => {
    setActionError('');
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
    } catch (err) {
      setActionError(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Orders & Live Tracking</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track stage-by-stage fulfillment from Pharmacy A and Pharmacy B.
        </p>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No orders placed yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Compare prices across Pharmacy A & B and complete a demo checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => {
            const isCancelled = order.orderStatus === 'Cancelled';
            const canCancel = !['Dispatched', 'Delivered', 'Cancelled'].includes(order.orderStatus);
            const canPay = !isCancelled && (order.paymentStatus === 'Pending' || order.paymentStatus === 'Failed');
            const currentStageIndex = STAGES.findIndex(s => s.key === order.orderStatus);

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{order.id}</span>
                      <Badge variant={order.pharmacy}>{order.pharmacy}</Badge>
                      <Badge variant={order.paymentStatus}>{order.paymentStatus}</Badge>
                      {isCancelled && <Badge variant="Cancelled">Cancelled</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Placed on {formatDate(order.createdAt)} • Payment Method: {order.paymentMethod}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">Total Amount</span>
                    <span className="text-xl font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                {/* 5-Stage Stepper Tracker or Cancelled Notice */}
                {isCancelled ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold">Order Cancelled</p>
                      <p className="text-rose-700 mt-0.5">
                        This order has been cancelled ({order.paymentStatus}). Any deducted inventory stock has been restored.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-xs font-semibold text-slate-500 mb-4">Order Progress Stages:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {STAGES.map((stage, idx) => {
                        const isCompleted = idx <= currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        const Icon = stage.icon;

                        return (
                          <div
                            key={stage.key}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                                : isCompleted
                                ? 'bg-slate-50 border-slate-200 text-slate-700'
                                : 'bg-white border-slate-100 text-slate-400 opacity-60'
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-xs mb-1.5 ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <p className="text-[11px] font-bold">{stage.label}</p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {isCompleted ? (isCurrent ? 'Current' : 'Done') : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Medicines List in Order */}
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Prescribed Medicines Ordered:</p>
                  <div className="divide-y divide-slate-200/60">
                    {order.medicines.map((m, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <MedicineImage
                            imageUrl={m.imageUrl}
                            name={m.medicineName || m.name}
                            strength={m.strength}
                            form={m.form}
                            size="xs"
                          />
                          <span className="font-semibold text-slate-800 truncate">{m.name}</span>
                        </div>
                        <span className="text-slate-600 shrink-0">
                          {m.quantity} × {formatCurrency(m.price)} = <strong className="text-slate-800">{formatCurrency(m.subtotal)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Destination & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center text-xs text-slate-500 space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Delivery to: <strong className="text-slate-700">{order.userAddress}</strong></span>
                  </div>

                  {(canPay || canCancel) && (
                    <div className="flex items-center gap-2">
                      {canPay && (
                        <button
                          type="button"
                          onClick={() => setPayingOrder(order)}
                          className="px-3.5 py-1.5 bg-[#5f259f] hover:bg-[#4d1e82] text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{order.paymentStatus === 'Failed' ? 'Retry Demo Payment' : 'Pay Demo UPI'}</span>
                        </button>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors disabled:opacity-60"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PhonePeModal
        isOpen={Boolean(payingOrder)}
        onClose={() => setPayingOrder(null)}
        amount={payingOrder?.totalAmount || 0}
        pharmacy={payingOrder?.pharmacy || ''}
        onPaymentSuccess={async () => {
          if (!payingOrder) return;
          try {
            await completeDemoPayment(payingOrder.id, payingOrder.pharmacy);
            setPayingOrder(null);
          } catch (err) {
            setActionError(err.message || 'Demo payment failed.');
            setPayingOrder(null);
          }
        }}
        onPaymentFail={async () => {
          if (!payingOrder) return;
          try {
            await failDemoPayment(payingOrder.id);
          } catch (err) {
            setActionError(err.message || 'Demo payment failed.');
          }
        }}
      />
    </div>
  );
}
