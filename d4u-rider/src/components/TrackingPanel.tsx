import React, { useState } from 'react';
import { DeliveryOrder, DeliveryStatus } from '../types';
import { Check, ClipboardList, Navigation, Phone, MessageSquare, ShieldAlert, Sparkles, AlertTriangle, CreditCard, CheckCircle, ChevronRight, X } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'motion/react';

interface TrackingPanelProps {
  status: DeliveryStatus;
  activeOrder: DeliveryOrder;
  currentPathIndex: number;
  totalPathSteps: number;
  onAcceptOrder: () => void;
  onDeclineOrder: () => void;
  onArriveAtRestaurant: () => void;
  onConfirmPickedUp: () => void;
  onMarkDelivered: () => void;
  onCompleteRestReset: (feedback: { tip: number }) => void;
}

export default function TrackingPanel({
  status,
  activeOrder,
  currentPathIndex,
  totalPathSteps,
  onAcceptOrder,
  onDeclineOrder,
  onArriveAtRestaurant,
  onConfirmPickedUp,
  onMarkDelivered,
  onCompleteRestReset
}: TrackingPanelProps) {
  // Checkbox state for package items
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  
  // Custom online payment modal simulated states
  const [showPaymentTerminal, setShowPaymentTerminal] = useState(false);
  const [paymentTerminalStatus, setPaymentTerminalStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [tipSelection, setTipSelection] = useState<number>(0);
  
  // Chat messaging micro state
  const [chatMessage, setChatMessage] = useState('');
  const [sentChatSnippet, setSentChatSnippet] = useState<string | null>(null);

  // Math metrics
  const remainingSteps = Math.max(0, totalPathSteps - 1 - currentPathIndex);
  const realTimeEta = Math.max(1, Math.round(remainingSteps * 0.1));
  const progressPercent = Math.min(100, Math.round((currentPathIndex / (totalPathSteps - 1 || 1)) * 100));

  // Frame motion sliding handle for "Slide to Start Delivery" accept screen
  const xSwipe = useMotionValue(0);
  const swipeBackgroundWidth = useTransform(xSwipe, [0, 200], ['0%', '100%']);
  const swipeTextOpacity = useTransform(xSwipe, [0, 80], [1, 0.15]);

  const handleSwipeEnd = () => {
    if (xSwipe.get() >= 180) {
      xSwipe.set(220); // lock
      onAcceptOrder();
    } else {
      xSwipe.set(0); // bounce back
    }
  };

  const handleSendQuickChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setSentChatSnippet(chatMessage);
    setChatMessage('');
    setTimeout(() => {
      setSentChatSnippet(null);
    }, 4500);
  };

  // Simulate NFC Credit Card online payment for the client
  const triggerOnlinePaymentSim = () => {
    setPaymentTerminalStatus('PROCESSING');
    setTimeout(() => {
      setPaymentTerminalStatus('SUCCESS');
      // Update local state payment indicators
      activeOrder.paymentMethod = 'ONLINE_PAID';
      activeOrder.paymentStatus = 'PAID';
    }, 2000);
  };

  // Check if all items are packed
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const isReadyToShip = checkedCount === activeOrder.itemsList.length;

  return (
    <div className="bg-[#141b2b] p-5 rounded-2xl border border-slate-800 flex flex-col gap-5 text-slate-200 shadow-xl overflow-hidden relative">
      
      {/* Dynamic lightbar state glow indicators */}
      {status === 'OFFERED' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-[#ffe1a7] to-amber-500 animate-pulse" />
      )}
      {status === 'PICKED_UP' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#4edea3] to-emerald-500" />
      )}

      {/* VIEW A: NEW DISPATCH INCOMING POPOVER (MATCHES SCREEN 1) */}
      {status === 'OFFERED' && (
        <div className="flex flex-col gap-4 text-left">
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold bg-amber-950 text-amber-300 border border-amber-900/40 px-2.5 py-0.5 rounded-full animate-bounce">
              ⚡ LIVE POS OFFER INCOMING
            </span>
            <span className="text-xs text-slate-450 font-mono font-bold">
              {activeOrder.id}
            </span>
          </div>

          <div>
            <h3 className="font-display font-black text-2xl text-slate-100 flex items-baseline gap-1">
              New Delivery Order
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Automated restaurant dispatch route configured for rider assignment.
            </p>
          </div>

          {/* Golden Earning Box from screen 1 */}
          <div className="bg-[#070e1d] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-mono text-slate-500 uppercase tracking-wider">Estimated Payout</p>
              <h4 className="text-2xl font-display font-black text-rose-350 tracking-tight mt-1">
                +${activeOrder.earnings.toFixed(2)}
              </h4>
              <p className="text-[10px] text-[#4edea3] mt-1 font-mono">Includes 100% of customer tips</p>
            </div>
            
            <div className="bg-[#ffe1a7] text-[#402d00] p-3 rounded-lg text-center min-w-[70px]">
              <span className="text-[9.5px] uppercase font-mono tracking-wider font-extrabold block">EARN</span>
              <p className="text-lg font-display font-black mt-0.5">+100XP</p>
            </div>
          </div>

          {/* Details Section (Screen 1 UI styling matching) */}
          <div className="flex flex-col gap-3.5 bg-[#070e1d] p-4 rounded-xl border border-slate-800 relative">
            
            {/* Dashed route trace line */}
            <div className="absolute left-[20px] top-[28px] bottom-[28px] w-0.5 bg-slate-850 border-dashed border-l border-slate-700 pointer-events-none" />

            {/* Restaurant Pickup */}
            <div className="flex gap-3 relative">
              <span className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500 text-amber-500 flex items-center justify-center text-[10px] shrink-0 font-bold">A</span>
              <div>
                <p className="text-[9.5px] uppercase font-mono font-bold text-amber-500 tracking-wider">Restaurant Food Pickup</p>
                <p className="font-display font-bold text-slate-100 text-[12.5px] mt-0.5">{activeOrder.restaurantName}</p>
                <p className="text-[11px] text-slate-450 mt-0.5">{activeOrder.restaurantAddress}</p>
              </div>
            </div>

            {/* Customer Dropoff */}
            <div className="flex gap-3 relative">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-500 flex items-center justify-center text-[10px] shrink-0 font-bold">B</span>
              <div>
                <p className="text-[9.5px] uppercase font-mono font-bold text-emerald-500 tracking-wider">Customer Dropoff Delivery</p>
                <p className="font-display font-bold text-slate-100 text-[12.5px] mt-0.5">{activeOrder.customerName}</p>
                <p className="text-[11px] text-slate-450 mt-0.5">{activeOrder.customerAddress}</p>
              </div>
            </div>

          </div>

          <div className="flex gap-3 rounded-xl bg-slate-900/60 p-3 text-[11px] border border-slate-850 justify-between">
            <span>📦 <strong>Items:</strong> {activeOrder.itemsCount} Delicious dishes</span>
            <span>⏱️ <strong>Est time:</strong> {activeOrder.estTimeMins} mins</span>
          </div>

          {/* SCREEN 1: SLIDE/SWIPE TO ACCEPT RIDE DELIVERY */}
          <div className="relative w-full h-[52px] bg-[#070e1d] border border-slate-800 rounded-full overflow-hidden p-1 flex items-center justify-center">
            
            {/* Sliding backdrop */}
            <motion.div
              style={{ width: swipeBackgroundWidth }}
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-600/30 to-amber-400/50"
            />

            {/* Swipe prompt */}
            <motion.div
              style={{ opacity: swipeTextOpacity }}
              className="absolute font-display text-[11px] font-black uppercase tracking-widest text-[#ffe1a7] select-none pointer-events-none flex items-center gap-1"
            >
              Swipe Right to Accept <ChevronRight className="w-3.5 h-3.5 inline animate-bounce" />
            </motion.div>

            {/* Circular handler */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 290 }}
              dragElastic={0.08}
              dragMomentum={false}
              onDragEnd={handleSwipeEnd}
              style={{ x: xSwipe }}
              className="z-10 w-[44px] h-[44px] absolute left-1 bg-[#fbbf24] text-[#402d00] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-amber-300 border border-amber-300 shadow-xl"
            >
              <ChevronRight className="w-5 h-5 shrink-0" />
            </motion.div>

          </div>

          {/* Decline button to decline order request */}
          <button
            onClick={onDeclineOrder}
            className="w-full text-center py-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            Decline Order
          </button>

        </div>
      )}

      {/* VIEW B: ORDER ACCEPTED - ROUTE TOWARDS RESTAURANT */}
      {status === 'ACCEPTED' && (
        <div className="flex flex-col gap-4 text-left">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <span className="text-[9px] font-mono font-bold text-amber-500">Task Phase 1/3</span>
              <h3 className="font-display font-black text-slate-100 text-sm uppercase tracking-wide mt-0.5">En Route to Restaurant</h3>
            </div>
            
            <div className="text-right">
              <span className="text-[9.5px] font-mono text-slate-500">Live ETA</span>
              <p className="text-xs font-mono font-bold text-amber-400">{realTimeEta} minutes</p>
            </div>
          </div>

          <div className="bg-[#070e1d] p-3.5 rounded-xl border border-slate-800">
            <p className="text-[9px] font-mono uppercase text-slate-550">Restaurant Outlet:</p>
            <p className="font-display font-bold text-[#ffe1a7] text-sm mt-0.5">{activeOrder.restaurantName}</p>
            <p className="text-xs text-slate-350 mt-1">Address: {activeOrder.restaurantAddress}</p>
          </div>

          <p className="text-xs text-slate-400 leading-normal bg-slate-900/40 p-3 rounded-lg border border-slate-850">
            🛵 Your GPS scooter is simulated moving block-by-block on the vector map towards the restaurant. You can accelerate simulation time by clicking "warp" on the sandbox controls.
          </p>

          <button
            onClick={onArriveAtRestaurant}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-display font-black uppercase text-xs tracking-wider rounded-xl transition shadow-lg cursor-pointer"
          >
            I've Arrived at Restaurant (Confirm GPS)
          </button>
        </div>
      )}

      {/* VIEW C: ARRIVED AT RESTAURANT - PACKAGE CHECKLISTS */}
      {status === 'ARRIVED_REST' && (
        <div className="flex flex-col gap-4 text-left">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <span className="text-[9px] font-mono font-bold text-amber-400">Task Phase 2/3</span>
              <h3 className="font-display font-black text-slate-100 text-[13px] uppercase tracking-wide">Food Verification Checklist</h3>
            </div>
            <span className="text-[9.5px] font-mono bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded border border-amber-900/30 font-bold">
              At Kitchen काउंटर
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            Cross-check the dishes packed by the kitchen chefs in the bags. Verify all order items to prevent customer disputes.
          </p>

          {/* Checkboxes items list */}
          <div className="flex flex-col gap-2 bg-[#070e1d] p-3.5 rounded-xl border border-slate-800">
            {activeOrder.itemsList.map((dish, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <label 
                  key={`dish-check-${idx}`} 
                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer text-xs
                    ${isChecked 
                      ? 'bg-emerald-950/20 border-emerald-950 text-slate-200' 
                      : 'bg-[#141b2b] border-slate-850 text-slate-400'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setCheckedItems(prev => ({ ...prev, [idx]: e.target.checked }));
                    }}
                    className="rounded border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className={isChecked ? 'line-through opacity-80' : ''}>{dish}</span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Items Packed: {checkedCount} of {activeOrder.itemsList.length}</span>
            {isReadyToShip ? (
              <span className="text-emerald-400 font-bold">All verified! ✓</span>
            ) : (
              <span className="text-rose-400 font-bold">Check all items first</span>
            )}
          </div>

          <button
            onClick={onConfirmPickedUp}
            disabled={!isReadyToShip}
            className={`w-full py-3.5 font-display font-black uppercase text-xs tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer
              ${isReadyToShip 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            <Check className="w-4 h-4" /> Picked Up Food (En Route to Customer)
          </button>
        </div>
      )}

      {/* VIEW D: DRIVING TO CUSTOMER - INCORPORATING ONLINE PAYMENT SYSTEM LINK */}
      {status === 'PICKED_UP' && (
        <div className="flex flex-col gap-4 text-left">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#4edea3]">Task Phase 3/3</span>
              <h3 className="font-display font-black text-slate-105 text-[13px] uppercase tracking-wide">Delivering to Customer</h3>
            </div>
            
            <div className="text-right">
              <span className="text-[9.5px] font-mono text-slate-500">Live ETA</span>
              <p className="text-xs font-mono font-bold text-[#4edea3]">{realTimeEta} minutes</p>
            </div>
          </div>

          {/* Delivery destination target details */}
          <div className="bg-[#070e1d] p-3.5 rounded-xl border border-slate-800">
            <p className="text-[9px] font-mono uppercase text-slate-550">Delivery Destination Address:</p>
            <p className="font-display font-bold text-[#ffe1a7] text-sm mt-0.5">{activeOrder.customerName}</p>
            <p className="text-xs text-slate-350 mt-1">Apartment Address: {activeOrder.customerAddress}</p>
            <div className="flex gap-2 mt-2">
              <span className="bg-slate-900 border border-slate-800 text-[8.5px] text-slate-350 px-2 py-0.5 rounded uppercase font-bold font-mono">
                Payment: {activeOrder.paymentMethod === 'ONLINE_PAID' ? 'ONLINE PREPAID ✓' : 'COLLECT PAYMENT REQUIRED'}
              </span>
            </div>
          </div>

          {/* --- INCORPORATED ONLINE PAYMENT INTEGRATION FOR CLIENTS --- */}
          {activeOrder.paymentMethod !== 'ONLINE_PAID' ? (
            <div className="bg-amber-500/5 text-amber-200 border border-amber-500/20 rounded-xl p-3 text-xs leading-relaxed">
              <p className="font-bold flex items-center gap-1 text-[#fbbf24] uppercase text-[10.5px]">
                <CreditCard className="w-4 h-4 shrink-0" /> Online Payment on Handover Required
              </p>
              <p className="text-[10px] mt-1 text-slate-350">
                The client chose to pay on delivery. Offer them the integrated smart terminal to tap their debit/credit card or scan to pay.
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setShowPaymentTerminal(true);
                  setPaymentTerminalStatus('IDLE');
                }}
                className="mt-3.5 w-full py-2 bg-gradient-to-r from-amber-500 to-[#fbbf24] hover:brightness-110 text-slate-900 font-sans font-black uppercase text-[10px] tracking-wider rounded-lg shadow-md cursor-pointer transition-all"
              >
                📱 Open Online Card terminal
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl p-3 text-xs leading-relaxed flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold uppercase block text-[10px]">Prepaid Online Order</span>
                Payment is complete. No collection required. Deliver food directly!
              </div>
            </div>
          )}

          {/* Chat with Customer micro-box */}
          <form onSubmit={handleSendQuickChat} className="flex gap-2">
            <input
              type="text"
              placeholder="Text client (e.g. 'Outside building...')"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-grow bg-[#070e1d] border border-slate-800 text-[11px] rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button type="submit" className="bg-slate-850 hover:bg-slate-800 text-[10.5px] px-3 py-1.5 rounded-lg border border-slate-800 font-bold hover:text-slate-100 cursor-pointer">
              Send
            </button>
          </form>

          {sentChatSnippet && (
            <div className="bg-amber-100 text-slate-900 p-2.5 rounded-lg text-[10px] font-semibold flex flex-col gap-0.5 shadow">
              <span>💬 <strong>You (Rider):</strong> "{sentChatSnippet}"</span>
              <span className="text-[8.5px] text-slate-500 font-mono">Delivered to customer's cell</span>
            </div>
          )}

          {/* Finalize Delivery button */}
          <button
            onClick={() => {
              if (activeOrder.paymentMethod !== 'ONLINE_PAID') {
                alert("⚠️ Please collect the required Cash on Delivery or open the client online payment terminal first to avoid discrepancies!");
                return;
              }
              onMarkDelivered();
            }}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#002113] font-display font-black uppercase text-xs tracking-wider rounded-xl transition shadow-lg cursor-pointer"
          >
            Mark Order as Successfully Delivered ✓
          </button>

        </div>
      )}

      {/* COMPLETED DELIVERED RECEIPT STAGE */}
      {status === 'DELIVERED' && (
        <div className="flex flex-col gap-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-xl">
            ✓
          </div>

          <div>
            <h3 className="font-display font-black text-slate-100 text-base">Deliver Flipped Successful</h3>
            <p className="text-slate-400 text-xs mt-1">
              Food delivery logged in POS system database records.
            </p>
          </div>

          {/* Receipt Stats summary */}
          <div className="bg-[#070e1d] p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-left flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Restaurant Dispatcher:</span>
              <span className="text-slate-250 truncate max-w-[150px]">{activeOrder.restaurantName.split(' - ')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Location:</span>
              <span className="text-slate-250 truncate max-w-[150px]">{activeOrder.customerAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Channel:</span>
              <span className="text-[#4edea3] font-bold">ONLINE COMPLETED</span>
            </div>
            <div className="h-px bg-slate-900 my-1" />
            <div className="flex justify-between">
              <span className="text-slate-500">Base Earnings:</span>
              <span className="text-slate-250 font-bold">${activeOrder.earnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Rider Tip:</span>
              <span className="text-emerald-400 font-extrabold">+${tipSelection.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-900 my-1" />
            <div className="flex justify-between text-xs font-bold text-slate-100">
              <span className="font-display text-[#ffe1a7]">Grand Earnings Payout:</span>
              <span className="text-[#ffe1a7]">${(activeOrder.earnings + tipSelection).toFixed(2)}</span>
            </div>
          </div>

          {/* Tips simulation */}
          <div>
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500 mb-2">Simulate Client Handover Tip</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 6].map((amt) => {
                const isSelected = tipSelection === amt;
                return (
                  <button
                    key={`tip-add-${amt}`}
                    type="button"
                    onClick={() => setTipSelection(amt)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer
                      ${isSelected 
                        ? 'bg-emerald-900/30 text-[#4edea3] border-emerald-500' 
                        : 'bg-[#141b2b] text-slate-400 border-slate-850 hover:border-slate-800'
                      }`}
                  >
                    +${amt}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onCompleteRestReset({ tip: tipSelection })}
            className="w-full py-3 bg-[#fbbf24] hover:bg-[#ffe1a7] text-[#402d00] font-display font-black rounded-lg text-xs tracking-wider uppercase transition shadow-lg cursor-pointer"
          >
            Acknowledge & Sync POS
          </button>
        </div>
      )}

      {/* CARD/NFC CLIENT ONLINE PAYMENT SIMULATED SCREEN MODAL */}
      {showPaymentTerminal && (
        <div className="fixed inset-0 bg-[#070e1d]/90 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-[#141b2b] border border-slate-800 p-6 rounded-2xl w-full max-w-sm text-center flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setShowPaymentTerminal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-beer flex items-center justify-center mx-auto text-yellow-500 text-lg">
              📱
            </div>

            <div>
              <h3 className="font-display font-black text-slate-100 text-base">Integrated Card Reader</h3>
              <p className="text-slate-400 text-xs mt-1">
                Collecting online credit/debit card fee for order <span className="font-mono text-slate-300 font-bold">{activeOrder.id}</span>
              </p>
            </div>

            <div className="bg-[#070e1d] p-4 rounded-xl border border-slate-900 font-mono text-center">
              <span className="text-[10px] text-slate-500 uppercase block tracking-wider mb-1">To Be Charged Online</span>
              <p className="text-2xl font-display font-black text-[#ffe1a7]">${activeOrder.earnings.toFixed(2)}</p>
            </div>

            {paymentTerminalStatus === 'IDLE' && (
              <div className="flex flex-col gap-3">
                <div className="text-[10.5px] text-slate-400 leading-normal bg-slate-900/60 p-3 rounded-lg border border-slate-850">
                  ⚡ <strong>NFC Handshake:</strong> Customer can tap their phone (Google Pay/Apple Pay) or insert a physical chip card directly.
                </div>
                
                <button
                  onClick={triggerOnlinePaymentSim}
                  className="w-full py-3 bg-gradient-to-r from-[#fbbf24] to-[#4edea3] text-slate-900 font-sans font-extrabold uppercase text-xs tracking-wider rounded-xl shadow-lg cursor-pointer transition-all"
                >
                  💳 SIMULATE CUSTOMER CARD TAP
                </button>
              </div>
            )}

            {paymentTerminalStatus === 'PROCESSING' && (
              <div className="py-6 flex flex-col gap-2 justify-center items-center">
                <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                <span className="text-[11px] font-mono text-amber-500 animate-pulse uppercase font-bold tracking-wider">
                  Contactless Processing...
                </span>
              </div>
            )}

            {paymentTerminalStatus === 'SUCCESS' && (
              <div className="py-4 flex flex-col gap-3 justify-center items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Online Transaction Approved!
                  </span>
                  <p className="text-[9.5px] text-slate-500 mt-1">Receipt dispatched to customer email address.</p>
                </div>
                
                <button
                  onClick={() => setShowPaymentTerminal(false)}
                  className="mt-2 py-1.5 px-4 bg-slate-800 hover:bg-slate-705 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Return to Active Map
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
