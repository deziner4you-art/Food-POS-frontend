import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Receipt, 
  CircleDot, 
  UtensilsCrossed, 
  X,
  Sparkles
} from 'lucide-react';
import type { Order, OrderStatus, OrderItem } from '../types';
import { customAlert } from '../../utils/alerts';

interface OrdersViewProps {
  orders: Order[];
  isEmergencyStop: boolean;
}

export default function OrdersView({
  orders,
  isEmergencyStop
}: OrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Filtering logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.includes(searchQuery) ||
      (order.displayId && order.displayId.includes(searchQuery)) ||
      order.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/30';
      case 'preparing': return 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/30';
      case 'ready': return 'text-brand-green bg-brand-green/10 border-brand-green/30';
      case 'completed': return 'text-[#d3c5ac] bg-[#2e3545]/40 border-[#4f4633]/30';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0c1322] text-[#dce2f7] select-none">
      
      {/* LEFT COLUMN: Filters, Search and Orders Table */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r border-[#4f4633]/30">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-display font-bold text-[#dce2f7] flex items-center gap-2">
            <Receipt className="w-7 h-7 text-brand-yellow" />
            <span>Operational Ticket Register</span>
          </h2>


        </div>

        {/* Searching and Tab Filters bar */}
        <div className="flex gap-4 mb-6 shrink-0 flex-wrap">
          <div className="flex-1 min-w-[200px] bg-[#191f2f] border border-[#4f4633]/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#d3c5ac]" />
            <input 
              type="text"
              placeholder="Search ID, burger recipes or tables..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full border-none focus:ring-0 text-sm font-sans placeholder-[#d3c5ac]/50"
            />
          </div>

          <div className="flex bg-[#191f2f] rounded-xl border border-[#4f4633]/30 p-1 font-mono text-xs">
            {(['all', 'preparing', 'ready', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-brand-yellow text-[#261a00] font-black'
                    : 'text-[#dce2f7] hover:text-[#fbbf24] hover:bg-[#2e3545]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List Table block */}
        <div className="flex-1 overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#d3c5ac]/60">
              <CircleDot className="w-12 h-12 mb-3 text-brand-yellow animate-pulse" />
              <p className="font-semibold text-lg">No tickets match search filters</p>
              <p className="text-xs">Adjust your search word query above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#191f2f] border-brand-yellow shadow-md shadow-brand-yellow/5' 
                        : 'bg-[#191f2f]/40 border-[#4f4633]/15 hover:border-[#4f4633]/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-display font-bold text-base text-[#dce2f7] select-all">
                          Order #{order.displayId || order.id}
                        </span>
                        <span className="text-xs font-mono text-[#d3c5ac] mt-1.5 truncate">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(' + ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-bold text-brand-yellow">{order.tableName}</span>
                        <span className="text-[10px] font-mono text-[#d3c5ac]/50 mt-1">{order.createdAt.substring(11, 19)}</span>
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded text-2xs uppercase font-mono font-black border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Ticket Detail Pane */}
      <div className="w-[360px] bg-[#070e1d] p-6 overflow-y-auto flex flex-col justify-between select-all shrink-0">
        {selectedOrder ? (
          <div className="flex flex-col h-full gap-6">
            <div className="border-b border-[#4f4633]/30 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-display font-bold text-[#dce2f7]">
                  Ticket #{selectedOrder.displayId || selectedOrder.id}
                </span>
                <span className={`px-2.5 py-1 rounded text-2xs uppercase font-mono font-black border ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-[#d3c5ac] mt-3">
                <span className="text-brand-yellow">{selectedOrder.tableName}</span>
                <span>Created: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Menu Items lists */}
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider mb-2">Recipe Portion</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#191f2f] p-3 rounded-xl border border-[#4f4633]/15">
                      <span className="font-display font-semibold font-bold text-md text-[#dce2f7]">
                        {item.name}
                      </span>
                      <span className="bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30 font-display font-medium px-2.5 py-0.5 rounded text-sm font-bold">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cooking customizations */}
              {selectedOrder.instructions && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider mb-2">Special Chef Modifiers</h4>
                  <div className="bg-[#410006]/35 border-l-4 border-brand-red p-4 rounded-r-xl select-none">
                    <p className="text-brand-red font-display font-bold text-base leading-tight uppercase animate-urgent-blink">
                      {selectedOrder.instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Timestamps diagnostics specs */}
              <div>
                <span className="text-xs font-mono font-bold text-[#d3c5ac] uppercase tracking-wider mb-2 block">
                  Operations Diagnostics
                </span>
                <div className="bg-[#191f2f]/50 border border-[#2e3545]/40 p-4 rounded-xl space-y-2 text-xs font-mono text-[#dce2f7]/80">
                  <div className="flex justify-between">
                    <span>Target Cook Limit:</span>
                    <span className="text-brand-yellow">{Math.round(selectedOrder.timerTotalSeconds / 60)} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Elapsed Timer:</span>
                    <span>{Math.floor(selectedOrder.timerElapsedSeconds / 60)}m {selectedOrder.timerElapsedSeconds % 60}s</span>
                  </div>
                  {selectedOrder.completedAt && (
                    <div className="flex justify-between">
                      <span>Completed Lock:</span>
                      <span className="text-brand-green">{new Date(selectedOrder.completedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#d3c5ac]/50 font-sans">
            <UtensilsCrossed className="w-12 h-12 mb-3 text-[#d3c5ac]/20" />
            <p className="font-medium text-sm">Select an active ticket to drill diagnostics info</p>
          </div>
        )}
      </div>


    </div>
  );
}
