import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import {
  X,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Truck,
  MapPin,
  Phone,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface OrderTrackerModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const [simulatedStatus, setSimulatedStatus] = useState<OrderStatus>(order.status);

  useEffect(() => {
    // Automatically advance order status simulation every few seconds for demonstration
    const timer1 = setTimeout(() => {
      if (simulatedStatus === 'pending') setSimulatedStatus('preparing');
    }, 4000);

    const timer2 = setTimeout(() => {
      if (simulatedStatus === 'preparing') setSimulatedStatus('on_the_way');
    }, 9000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [simulatedStatus]);

  const steps = [
    { key: 'pending', label: 'Order Confirmed', icon: CheckCircle2, desc: 'Received by D4U Kitchen KDS' },
    { key: 'preparing', label: 'Chef Cooking', icon: UtensilsCrossed, desc: 'Fresh broast & handi simmering' },
    { key: 'on_the_way', label: 'Out for Delivery', icon: Truck, desc: 'Rider on the way in thermal box' },
    { key: 'delivered', label: 'Order Delivered', icon: MapPin, desc: 'Bon Appétit!' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === simulatedStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#16130B] border border-[#D4AF37]/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-display">
                  Order #{order.orderNumber}
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                  Live POS Tracking
                </span>
              </div>
              <p className="text-xs text-gray-400">Placed: {order.createdAt}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="bg-gradient-to-r from-[#D4AF37]/15 to-amber-950/20 border border-[#D4AF37]/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
              Estimated Arrival
            </div>
            <div className="text-xl font-extrabold text-white font-display">
              {simulatedStatus === 'delivered' ? 'Delivered!' : order.estimatedDeliveryTime || '20 mins'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Total Paid</div>
            <div className="text-lg font-bold text-[#D4AF37] font-display">
              ${order.totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Step Timeline */}
        <div className="space-y-4 py-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 w-0.5 h-8 -z-10 transition-colors ${
                      idx < currentStepIndex ? 'bg-[#D4AF37]' : 'bg-white/10'
                    }`}
                  />
                )}

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isDone
                      ? 'bg-[#D4AF37] text-black font-extrabold shadow-lg gold-glow'
                      : 'bg-[#1A1A1D] border border-white/10 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-bold font-display ${
                        isCurrent ? 'text-[#D4AF37]' : isDone ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20 font-semibold animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Driver / Address Box */}
        <div className="bg-[#1A1A1D] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-300">
            <span className="font-semibold text-white">Delivery Address:</span>
            <span className="text-gray-400 truncate max-w-[240px]">{order.deliveryAddress}</span>
          </div>

          {order.driverName && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[#D4AF37]">
              <span className="font-semibold">Assigned Delivery Rider:</span>
              <span className="font-bold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {order.driverName}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#1A1A1D] hover:bg-[#25252A] text-white border border-white/10 text-xs font-bold py-3 rounded-xl transition-colors"
        >
          Close Live Tracking Window
        </button>
      </div>
    </div>
  );
};
