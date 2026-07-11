import React, { useState } from 'react';
import { DeliveryOrder } from '../types';
import { DISPATCHABLE_MOCK_ORDERS } from '../data';
import { Network, Terminal, Plus, Send, Radio, ShoppingBag, DollarSign, ArrowRight } from 'lucide-react';

interface POSPanelProps {
  onDispatchOrderToRider: (order: DeliveryOrder) => void;
  isRiderOnline: boolean;
  activeOrder: DeliveryOrder | null;
}

export default function POSPanel({
  onDispatchOrderToRider,
  isRiderOnline,
  activeOrder
}: POSPanelProps) {
  const [customPrice, setCustomPrice] = useState('14.20');
  const [selectedRest, setSelectedRest] = useState('Burger Barn - Central Kitchen');
  const [selectedCust, setSelectedCust] = useState('Sarah Johnson');
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([
    'POS System Initialized on Port 8080...',
    'Online Ordering Webhooks synchronized.',
    'Rider Geo-tracking connected to backend.'
  ]);

  const handleCustomDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRiderOnline) {
      alert("⚠️ Cannot dispatch order. The Rider is currently OFFLINE! Toggle status to 'Online' in the rider app header first.");
      return;
    }
    if (activeOrder) {
      alert("⚠️ Rider is already busy with an active task. Complete or skip the existing task first!");
      return;
    }

    const restData = selectedRest.includes('Burger') ? {
      name: 'Burger Barn - Central Kitchen',
      addr: '888 Market St, San Francisco',
      x: 75,
      y: 35
    } : {
      name: 'Pizza Manifesto Headquarters',
      addr: '333 Post St, San Francisco',
      x: 50,
      y: 25
    };

    const dropoffData = selectedCust.includes('Sarah') ? {
      name: 'Sarah Johnson (Apt 4C)',
      addr: '245 Montgomery St, Apt 4C',
      x: 42,
      y: 15
    } : {
      name: 'Homer Simpson (Apt 4B)',
      addr: '742 Evergreen Terrace, Apt 4B',
      x: 62,
      y: 55
    };

    const newOrder: DeliveryOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      source: 'POS',
      restaurantName: restData.name,
      restaurantAddress: restData.addr,
      restaurantX: restData.x,
      restaurantY: restData.y,
      customerName: dropoffData.name,
      customerAddress: dropoffData.addr,
      customerX: dropoffData.x,
      customerY: dropoffData.y,
      earnings: Number(parseFloat(customPrice).toFixed(2)) || 10.50,
      distance: 2.1,
      itemsCount: 2,
      itemsList: ['1x Custom Meal Specialty Combo', '1x Classic Carbonated Drink'],
      estTimeMins: 14,
      paymentMethod: Math.random() > 0.5 ? 'ONLINE_PAID' : 'PAY_ON_DELIVERY_REQUESTED',
      paymentStatus: 'UNPAID'
    };

    onDispatchOrderToRider(newOrder);
    setDispatchLogs(prev => [
      `[${new Date().toLocaleTimeString()}] DISPATCHED ${newOrder.id} from POS Terminal 1. Waiting for rider acceptance...`,
      ...prev
    ]);
  };

  const handlePresetDispatch = (preset: DeliveryOrder) => {
    if (!isRiderOnline) {
      alert("⚠️ Cannot dispatch order. The Rider is currently OFFLINE! Toggle status to 'Online' in the rider app header first.");
      return;
    }
    if (activeOrder) {
      alert("⚠️ Rider is already busy with an active task. Please finish or skip the current trip first.");
      return;
    }
    onDispatchOrderToRider({
      ...preset,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}` // new instance
    });
    setDispatchLogs(prev => [
      `[${new Date().toLocaleTimeString()}] DISPATCHED ${preset.source} order to rider (Earning: +$${preset.earnings.toFixed(2)}).`,
      ...prev
    ]);
  };

  return (
    <div className="bg-[#141b2b] p-5 rounded-2xl border border-slate-800 text-slate-200">
      
      {/* Header */}
      <h2 className="font-display text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5"><Network className="w-4 h-4" /> POS & Backend Dispatch Control</span>
        <span className="text-[9px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-900/30">
          Connected Live
        </span>
      </h2>
      <p className="text-[11px] text-slate-400 leading-normal mb-4">
        As a restaurant cashier or manager, simulate dispatching digital orders directly from your POS terminal console to the rider's smartphone app.
      </p>

      {/* Preset Fast Trigger Buttons */}
      <div className="flex flex-col gap-2.5 mb-5">
        <label className="text-[10px] font-mono uppercase font-bold text-slate-400">⚡ Preset Backend Dispatch Channels</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DISPATCHABLE_MOCK_ORDERS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handlePresetDispatch(opt)}
              className="bg-[#070e1d] hover:bg-slate-900 text-left p-3 rounded-xl border border-slate-800/80 transition-colors flex flex-col justify-between h-20 outline-none text-xs cursor-pointer group"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-[9px] font-mono font-bold bg-[#141b2b] text-[#ffe1a7] px-1.5 py-0.2 rounded border border-slate-800">
                  {opt.source}
                </span>
                <span className="font-mono text-[#4edea3] font-extrabold">+${opt.earnings.toFixed(2)}</span>
              </div>
              <div className="mt-1">
                <p className="font-sans font-bold text-slate-200 text-[11px] truncate group-hover:text-amber-300">
                  {opt.restaurantName.split(' - ')[0]}
                </p>
                <p className="text-[9.5px] text-slate-500 truncate">Deliver to: {opt.customerName}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ADVANCED CUSTOM POS DISPATCH FORM */}
      <form onSubmit={handleCustomDispatch} className="bg-[#070e1d] p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
        <p className="text-[10px] font-mono uppercase font-bold text-slate-400">🍔 Direct POS Order Builder</p>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[8.5px] font-mono text-slate-500 uppercase tracking-wide">Restaurant Outlet (POS)</label>
            <select
              value={selectedRest}
              onChange={(e) => setSelectedRest(e.target.value)}
              className="w-full bg-[#141b2b] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
            >
              <option>Burger Barn - Central Kitchen</option>
              <option>Pizza Manifesto Headquarters</option>
            </select>
          </div>
          <div>
            <label className="block text-[8.5px] font-mono text-slate-500 uppercase tracking-wide">Customer (Destination)</label>
            <select
              value={selectedCust}
              onChange={(e) => setSelectedCust(e.target.value)}
              className="w-full bg-[#141b2b] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
            >
              <option>Sarah Johnson (Apt 4C)</option>
              <option>Homer Simpson (Apt 4B)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 items-end">
          <div>
            <label className="block text-[8.5px] font-mono text-slate-500 uppercase tracking-wide">Est. Rider Pay ($)</label>
            <input
              type="number"
              step="0.10"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-full bg-[#141b2b] border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 font-mono focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-sans font-extrabold text-[11px] tracking-wide rounded py-1.5 flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Dispatch Custom Order
          </button>
        </div>
      </form>

      {/* POS Terminal Event log output console */}
      <div className="mt-4 bg-slate-950 p-2.5 rounded-lg border border-slate-900 font-mono text-[9px] text-emerald-400 h-24 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
        <label className="text-[8px] font-bold text-emerald-600 block uppercase border-b border-emerald-900/30 pb-0.5 mb-1 flex items-center gap-1">
          <Terminal className="w-2.5 h-2.5" /> POS Integration Logs:
        </label>
        {dispatchLogs.map((log, index) => (
          <div key={`log-${index}`} className="leading-normal">
            {log}
          </div>
        ))}
      </div>

    </div>
  );
}
