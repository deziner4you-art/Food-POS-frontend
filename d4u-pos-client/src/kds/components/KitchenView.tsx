import React from 'react';
import { Timer, Clock, ThumbsUp, AlertTriangle, Salad, Sparkles } from 'lucide-react';
import type { Order } from '../types';

interface KitchenViewProps {
  orders: Order[];
  onMarkReady: (orderId: string) => void;
  onSimulateOrder: () => void;
  onAcceptOrderClick?: (order: Order) => void;
  isEmergencyStop: boolean;
  readOnly?: boolean;
}

export default function KitchenView({
  orders,
  onMarkReady,
  onSimulateOrder,
  onAcceptOrderClick,
  isEmergencyStop,
  readOnly = false
}: KitchenViewProps) {
  // Only show orders that are 'preparing' (or accepted 'pending' orders that we should render)
  const activeOrders = orders.filter(o => o.status === 'preparing' || o.status === 'pending');

  const formatTime = (totalSeconds: number, elapsedSeconds: number) => {
    const remaining = totalSeconds - elapsedSeconds;
    const isOverdue = remaining < 0;
    const absRemaining = Math.abs(remaining);
    const mins = Math.floor(absRemaining / 60);
    const secs = absRemaining % 60;
    const padMin = mins.toString().padStart(2, '0');
    const padSec = secs.toString().padStart(2, '0');
    return {
      text: `${isOverdue ? '-' : ''}${padMin}:${padSec}`,
      isOverdue,
      remainingSeconds: remaining
    };
  };

  return (
    <section className="flex-1 p-6 overflow-y-auto selection-none bg-[#0c1322]">
      {activeOrders.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-[#191f2f] border border-[#4f4633]/20 rounded-full flex items-center justify-center text-[#d3c5ac]/50 mb-6 animate-pulse">
            <Salad className="w-12 h-12 text-[#4edea3]" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[#dce2f7] mb-2">
            No Active Kitchen Tickets
          </h2>
          <p className="text-[#d3c5ac] max-w-sm mb-6 text-sm">
            All customer orders have been successfully prepared. Enjoy the temporary quiet before the rush!
          </p>
          {!readOnly && (
            <button 
              onClick={onSimulateOrder}
              disabled={isEmergencyStop}
              className="flex items-center gap-2 px-6 py-3 bg-[#ffe1a7] text-[#402d00] hover:bg-brand-yellow font-display font-medium rounded-xl transition-all shadow-lg shadow-brand-yellow/10 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-[#402d00]" />
              <span>Simulate Customer Order</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeOrders.map((order) => {
            const timeInfo = formatTime(order.timerTotalSeconds, order.timerElapsedSeconds);
            const isRedAlert = timeInfo.isOverdue || timeInfo.remainingSeconds < 120 || order.isUrgent;
            
            // Calculate progress percentage
            const progressPercent = Math.min(
              100,
              Math.max(0, (order.timerElapsedSeconds / order.timerTotalSeconds) * 100)
            );

            const isPendingApproval = order.status === 'pending';

            return (
              <div 
                key={order.id}
                className={`bg-[#191f2f] rounded-xl flex flex-col shadow-xl relative overflow-hidden transition-all duration-300 border-2 ${
                  isPendingApproval
                    ? 'border-[#f59e0b] shadow-[#261a00]/30 hover:border-[#fbbf24] animate-pulse-subtle'
                    : isRedAlert 
                      ? 'border-[#ff3333] shadow-[#93000a]/10' 
                      : 'border-[#4f4633]/30 hover:border-[#4f4633]/60'
                }`}
              >
                {/* Header Strip */}
                {isPendingApproval ? (
                  <div className="bg-[#fbbf24] text-[#261a00] p-3.5 flex justify-between items-center border-b border-[#fbbf24]/30 select-none">
                    <span className="font-display font-bold text-lg select-all">
                      ORDER #{order.displayId || order.id}
                    </span>
                    <span className="bg-[#261a00] text-[#fbbf24] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                      Pending Accept
                    </span>
                  </div>
                ) : isRedAlert ? (
                  <div className="bg-brand-darkred text-white p-3.5 flex justify-between items-center">
                    <span className="font-display font-bold text-[#ffdad6] text-lg select-all">
                      ORDER #{order.displayId || order.id}
                    </span>
                    <div className="flex items-center gap-1.5 bg-[#690005] px-2 py-0.5 rounded text-xxs font-black text-[#ffdad6] uppercase tracking-wider animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-[#ffb4ab]" />
                      <span>URGENT</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#2e3545] text-[#dce2f7] p-3.5 flex justify-between items-center border-b border-[#4f4633]/30">
                    <span className="font-display font-bold text-lg select-all">
                      ORDER #{order.displayId || order.id}
                    </span>
                    <span className="text-brand-green text-xs font-mono font-bold uppercase tracking-wider">
                      Preparing
                    </span>
                  </div>
                )}

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        {order.items.map((item, idx) => (
                          <h3 key={idx} className="font-display font-bold text-xl text-[#dce2f7] leading-tight mb-1">
                            {item.quantity}x {item.name}
                          </h3>
                        ))}
                      </div>
                      <span className="shrink-0 bg-[#2e3545] text-[#d3c5ac] px-2.5 py-1 rounded text-xs font-mono font-bold border border-[#4f4633]/20">
                        {order.tableName}
                      </span>
                    </div>

                    {/* Modification Warning Code box */}
                    {order.instructions ? (
                      <div className={`border-l-4 px-3.5 py-2.5 rounded-r ${
                        isPendingApproval 
                          ? 'bg-[#fbbf24]/10 border-[#fbbf24]' 
                          : 'bg-[#410006]/40 border-[#ff3333]'
                      }`}>
                        <p className={`font-display font-bold leading-snug uppercase tracking-wide text-sm ${
                          isPendingApproval
                            ? 'text-[#ffe8b3]'
                            : isRedAlert 
                              ? 'text-[#ffb4ab] animate-urgent-blink font-black' 
                              : 'text-[#ffb4ab]'
                        }`}>
                          {order.instructions}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[#d3c5ac]/50 text-xs italic">Standard preparation recipe</p>
                    )}
                  </div>

                  {/* Spacer / Divider */}
                  <div className="space-y-2">
                    <div className="h-[1px] bg-[#4f4633]/20" />
                    
                    {/* Time Tracking Section */}
                    {isPendingApproval ? (
                      <div className="flex justify-between items-center select-none py-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-mono font-bold text-[#d3c5ac]/70 tracking-wider">
                            PREPARATION TIME TARGET
                          </span>
                          <span className="text-xl font-mono font-bold text-[#fbbf24] animate-pulse">
                            Awaiting Select
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#261a00] border border-[#fbbf24]/20 px-2.5 py-1 rounded">
                          <Clock className="w-5 h-5 text-[#fbbf24] animate-bounce" />
                          <span className="text-[10px] font-mono font-bold text-[#fbbf24] tracking-tight">
                            NOT SET
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center select-none">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-mono font-bold text-[#d3c5ac]/70 tracking-wider">
                            {timeInfo.isOverdue ? 'Overdue Elapsed' : 'Time Remaining'}
                          </span>
                          <span className={`text-3xl font-mono font-bold tabular-nums tracking-tight leading-none ${
                            isRedAlert ? 'text-brand-red font-black' : 'text-brand-yellow font-bold'
                          }`}>
                            {timeInfo.text}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono font-bold text-[#d3c5ac] bg-[#2e3545] px-2 py-1 rounded">
                            {Math.floor(order.timerTotalSeconds / 60)}m Max
                          </span>
                          {isRedAlert ? (
                            <AlertTriangle className="w-9 h-9 text-brand-red animate-pulse" />
                          ) : (
                            <Timer className="w-9 h-9 text-[#d3c5ac]" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress tracking bar */}
                    <div className="w-full bg-[#070e1d] h-2 rounded-full overflow-hidden border border-[#4f4633]/10">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          isPendingApproval
                            ? 'bg-[#2a3040] w-0'
                            : timeInfo.isOverdue 
                              ? 'bg-brand-red w-full' 
                              : isRedAlert 
                                ? 'bg-brand-yellow' 
                                : 'bg-brand-green'
                        }`}
                        style={{ width: isPendingApproval ? '0%' : `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Accept vs Mark Ready Action Button */}
                {!readOnly && (
                  isPendingApproval ? (
                    <button
                      id={`accept-btn-${order.id}`}
                      onClick={() => onAcceptOrderClick && onAcceptOrderClick(order)}
                      disabled={isEmergencyStop}
                      className="py-4 bg-[#fbbf24] hover:bg-[#f59e0b] active:scale-[0.99] text-[#261a00] font-display font-black text-lg tracking-widest uppercase cursor-pointer text-center transition-all disabled:opacity-40"
                    >
                      CHOOSE TIME & ACCEPT
                    </button>
                  ) : (
                    <button
                      id={`ready-btn-${order.id}`}
                      onClick={() => onMarkReady(order.id)}
                      disabled={isEmergencyStop}
                      className="py-4 bg-brand-green text-[#003824] font-display font-black text-lg tracking-widest uppercase cursor-pointer text-center transition-all hover:bg-[#6ffbbe] active:bg-[#00a572] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      MARK READY
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
