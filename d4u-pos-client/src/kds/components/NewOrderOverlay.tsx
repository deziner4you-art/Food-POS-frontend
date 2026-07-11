import React, { useState } from 'react';
import { Bell, VolumeX, Volume2, CheckCircle2, Speaker } from 'lucide-react';
import type { Order, StationSettings } from '../types';

interface NewOrderOverlayProps {
  order: Order | null;
  settings: StationSettings;
  updateSettings: (s: Partial<StationSettings>) => void;
  onAccept: (orderId: string, prepMinutes: number) => void;
}

export default function NewOrderOverlay({
  order,
  settings,
  updateSettings,
  onAccept
}: NewOrderOverlayProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);

  if (!order) return null;

  const handleSilentToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSettings({ silentAlert: !settings.silentAlert });
  };

  const timeOptions = [5, 10, 15, 20];

  return (
    <div 
      className="absolute inset-0 z-50 bg-[#0c1322]/90 backdrop-blur-[4px] flex items-center justify-center p-4 md:p-6 select-none transition-all duration-300"
      id="new-order-overlay"
    >
      <div 
        className="max-w-2xl w-full bg-[#1b2232] rounded-[20px] shadow-[0_0_60px_rgba(249,189,34,0.2)] border-2 border-[#fcbc30] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Header Banner */}
        <div className="bg-[#fcbc30] px-6 py-4 flex justify-between items-center transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#141208] rounded-full flex items-center justify-center shadow-inner shrink-0">
              <Bell className="w-5.5 h-5.5 text-[#fcbc30] animate-bounce" fill="#fcbc30" />
            </div>
            <div>
              <h2 className="font-display font-black leading-none tracking-tight text-2xl md:text-3xl text-[#141208]">
                NEW ORDER
              </h2>
              <p className="text-[#5c4300] font-mono text-[9px] md:text-[10px] font-bold leading-none mt-1 tracking-wider">
                INCOMING FROM FRONT TICKETING TERMINAL
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleSilentToggle}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 border border-transparent transition-all cursor-pointer bg-[#141208] text-[#fcbc30] hover:scale-102 hover:brightness-110 shadow-sm`}
          >
            {settings.silentAlert ? (
              <>
                <VolumeX className="w-3.5 h-3.5 font-bold" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Active</span>
              </>
            )}
          </button>
        </div>

        {/* Order Details Body */}
        <div className="p-6 md:p-8 flex-grow flex flex-col gap-5">
          <div className="flex justify-between items-end border-b border-[#2e374d] pb-4">
            <div className="min-w-0 flex-1">
              <p className="text-[#a0aec0] font-mono font-bold uppercase tracking-widest text-[9px] md:text-[10px] mb-0.5">
                ITEM DETAILS
              </p>
              <h3 className="text-white font-display font-bold text-xl md:text-2xl leading-tight truncate">
                {order.items.map(item => `${item.quantity}x ${item.name}`).join(' + ')}
              </h3>
            </div>
            
            <div className="text-right shrink-0">
              <p className="text-[#a0aec0] font-mono font-bold uppercase tracking-widest text-[9px] md:text-[10px] mb-0.5">
                ORDER ID
              </p>
              <h3 className="text-[#fcbc30] font-display font-black text-2xl md:text-3xl tabular-nums leading-none">
                #{order.displayId || order.id}
              </h3>
            </div>
          </div>

          {/* Chef Instructions Callout Banner */}
          <div className="bg-[#241315] border-l-[5px] border-[#ff3333] p-4 rounded-r-lg">
            <p className="text-[#ffb6b3] font-mono font-bold uppercase tracking-wider text-[9px] mb-1">
              CHEF RECIPE INSTRUCTIONS
            </p>
            <h4 className="text-[#ff4444] font-display font-black text-xl md:text-2xl leading-tight uppercase tracking-tight">
              {order.instructions || "STANDARD PREPARATION"}
            </h4>
          </div>

          {/* Interactive Time Picker Grid */}
          <div className="flex flex-col gap-2">
            <p className="text-[#a0aec0] font-mono font-bold uppercase tracking-wide text-[11px]">
              SET PREPARATION TIME TARGET
            </p>
            <div className="grid grid-cols-4 gap-3">
              {timeOptions.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`py-2.5 px-1.5 rounded-lg border transition-all cursor-pointer text-center ${
                    selectedMinutes === mins
                      ? 'bg-[#1b2232] border-[#fcbc30] text-[#fcbc30] font-bold shadow-md'
                      : 'bg-[#111622] border-[#202737] text-[#cbd5e1] hover:border-[#fcbc30]/40 hover:bg-[#141b2b]'
                  }`}
                >
                  <div className={`text-lg md:text-xl font-mono font-black ${selectedMinutes === mins ? 'text-[#fcbc30]' : 'text-white'}`}>
                    {mins}m
                  </div>
                  <div className={`text-[9px] font-mono font-bold tracking-wider mt-0.5 uppercase ${selectedMinutes === mins ? 'text-[#fcbc30]' : 'text-[#718096]'}`}>
                    {mins === 10 ? 'Default' : mins === 5 ? 'Rush' : milsLabel(mins)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accept Button Bottom Bar */}
        <div className="px-6 py-5 bg-[#111622] border-t border-[#202737] flex justify-center">
          <button
            type="button"
            onClick={() => onAccept(order.id, selectedMinutes)}
            className="w-full flex items-center justify-center gap-2 bg-[#4edea3] hover:bg-[#3bc68a] text-[#002113] py-4 rounded-xl font-display font-black text-xl tracking-wider uppercase active:scale-[0.99] transition-all shadow-md hover:shadow-[#4edea3]/20 cursor-pointer"
          >
            <CheckCircle2 className="w-5.5 h-5.5 text-[#002113]" fill="currentColor" />
            <span>ACCEPT WORK ORDER</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function milsLabel(mins: number): string {
  if (mins === 15 || mins === 20) return 'Buffer';
  return 'Target';
}
