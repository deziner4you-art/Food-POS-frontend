import React from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { TRACKING_STEPS, mapBackendStatusToStep, getCustomerStatusLabel, getCustomerStatusDescription, isOrderTerminal } from '../utils/orderStatusMapper';

interface OrderTrackerModalProps {
  order: any | null;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const orderId = order.id || order.orderNumber || order.orderId;
  const currentStepIndex = mapBackendStatusToStep(order.status);
  const isTerminal = isOrderTerminal(order.status);
  const statusLabel = getCustomerStatusLabel(order.status);
  const statusDesc = getCustomerStatusDescription(order.status);

  const amount = Number(order.totalAmount || order.total_amount) || 0;
  const createdAtFormatted = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (order.timePlaced || 'Just now');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#16130B] border border-[#D4AF37]/40 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-display">
                  Order #{orderId}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                  isTerminal
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40 animate-pulse'
                }`}>
                  {isTerminal ? 'Completed' : 'Live Realtime'}
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> Placed at {createdAtFormatted}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Tracker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="bg-gradient-to-r from-[#D4AF37]/15 to-amber-950/20 border border-[#D4AF37]/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
              Current Status
            </div>
            <div className="text-xl font-extrabold text-white font-display">
              {statusLabel}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {statusDesc}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Total</div>
            <div className="text-lg font-bold text-[#D4AF37] font-display">
              {formatCurrency(amount)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">
              {order.type || order.order_type || 'Delivery'}
            </div>
          </div>
        </div>

        {/* Step Timeline */}
        <div className="space-y-4 py-2">
          {TRACKING_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {idx < TRACKING_STEPS.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 w-0.5 h-8 -z-10 transition-colors ${
                      idx < currentStepIndex ? 'bg-[#D4AF37]' : 'bg-white/10'
                    }`}
                  />
                )}

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-[#D4AF37] text-black font-extrabold shadow-lg shadow-[#D4AF37]/30 ring-2 ring-[#D4AF37]'
                      : isDone
                        ? 'bg-[#D4AF37]/80 text-black font-extrabold'
                        : 'bg-[#1A1A1D] border border-white/10 text-gray-500'
                  }`}
                >
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="w-5 h-5 text-black" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
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
                    {isCurrent && !isTerminal && (
                      <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20 font-semibold animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{step.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Customer & Delivery Details */}
        <div className="bg-[#1A1A1D] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-300">
            <span className="flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4 text-[#D4AF37]" /> Customer
            </span>
            <span className="font-semibold text-white">
              {order.customer || order.customerName || 'Guest'}
            </span>
          </div>

          {(order.customerPhone || order.phone) && (
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4 text-[#D4AF37]" /> Contact
              </span>
              <span className="font-semibold text-white">
                {order.customerPhone || order.phone}
              </span>
            </div>
          )}

          {(order.customerAddress || order.address) && (
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-2 text-gray-400 shrink-0">
                <MapPin className="w-4 h-4 text-[#D4AF37]" /> Address
              </span>
              <span className="font-semibold text-white text-right truncate max-w-[280px]">
                {order.customerAddress || order.address}
              </span>
            </div>
          )}

          {order.claimedByRiderName && (
            <div className="flex items-center justify-between text-emerald-400 border-t border-white/5 pt-2 mt-2">
              <span className="font-bold">Assigned Rider:</span>
              <span className="font-black">{order.claimedByRiderName}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#D4AF37] hover:bg-[#ffe088] text-black font-extrabold py-3 rounded-xl transition-all font-display text-sm cursor-pointer shadow-lg"
        >
          Back to Browsing
        </button>
      </div>
    </div>
  );
};
