import React from 'react';
import { Package, HelpCircle, Flame, Plus, Minus, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Ingredient } from '../types';

interface InventoryProps {
  ingredients: Ingredient[];
  onUpdateInventory: (ingredientId: string, amount: number) => void;
  onRestockAll: () => void;
}

export default function InventoryView({
  ingredients,
  onUpdateInventory,
  onRestockAll
}: InventoryProps) {

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0c1322] select-none text-[#dce2f7]">
      
      {/* View Header with Restock Trigger */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-[#dce2f7] flex items-center gap-2">
            <Package className="w-7 h-7 text-brand-yellow" />
            <span>Recipe Ingredients Inventory</span>
          </h2>
          <p className="text-[#d3c5ac] text-xs font-mono mt-1">
            Re-calculation monitor. Stock levels sync automatically as kitchen tickets complete.
          </p>
        </div>

        <button
          onClick={onRestockAll}
          className="flex items-center gap-2 px-5 py-3 bg-[#ffe1a7] hover:bg-brand-yellow text-[#402d00] font-display font-bold rounded-xl text-sm transition-all shadow-lg hover:scale-102 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#402d00] animate-spin" style={{ animationDuration: '4s' }} />
          <span>FULL RESTOCK OVERDRIVE</span>
        </button>
      </div>

      {/* Grid of Materials Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ingredients.map((ing) => {
          const isCritical = ing.currentStock <= ing.warningThreshold;
          const percentage = Math.min(100, Math.max(0, (ing.currentStock / ing.maxStock) * 100));

          return (
            <div 
              key={ing.id}
              className={`bg-[#191f2f] rounded-xl p-5 border flex flex-col justify-between gap-5 transition-all shadow-md ${
                isCritical 
                  ? 'border-brand-red shadow-brand-red/5' 
                  : 'border-[#4f4633]/20 hover:border-[#4f4633]/50'
              }`}
            >
              {/* Header: Item details */}
              <div className="flex items-start justify-between min-w-0">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-[#d3c5ac]/60 uppercase tracking-widest">{ing.category}</span>
                  <h3 className="text-lg font-display font-bold text-[#dce2f7] mt-0.5 truncate select-all">
                    {ing.name}
                  </h3>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isCritical ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-red/10 border border-brand-red/30 rounded text-[9px] font-mono font-bold text-brand-red animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-brand-red" />
                      <span>LOW</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-green/10 border border-brand-green/20 rounded text-[9px] font-mono font-bold text-brand-green">
                      <Check className="w-3 h-3 text-brand-green" />
                      <span>OK</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Level bar block */}
              <div className="space-y-2">
                <div className="flex justify-between items-end font-mono text-xs">
                  <span className="text-[#d3c5ac]">Available Quantity:</span>
                  <span className={`text-sm font-bold ${isCritical ? 'text-brand-red font-black' : 'text-[#dce2f7]'}`}>
                    {ing.currentStock} {ing.unit} / {ing.maxStock} {ing.unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#070e1d] h-2.5 rounded-full overflow-hidden border border-[#4f4633]/15">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCritical ? 'bg-brand-red' : 'bg-brand-green'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-[10px] font-mono text-[#d3c5ac]/50 select-none">
                  <span>Empty</span>
                  <span>Alert Threshold: {ing.warningThreshold} {ing.unit}</span>
                  <span>Max</span>
                </div>
              </div>

              {/* Increments modification controls */}
              <div className="flex items-center justify-end gap-2.5 border-t border-[#4f4633]/15 pt-4">
                <button
                  onClick={() => onUpdateInventory(ing.id, -10)}
                  disabled={ing.currentStock <= 0}
                  className="w-10 h-10 rounded-xl bg-[#2e3545] text-[#dce2f7] flex items-center justify-center hover:bg-[#3d3722] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all border border-[#4f4633]/20"
                  title="Deduct 10 units"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateInventory(ing.id, 10)}
                  disabled={ing.currentStock >= ing.maxStock}
                  className="w-10 h-10 rounded-xl bg-[#2e3545] text-[#dce2f7] flex items-center justify-center hover:bg-[#3d3722] disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all border border-[#4f4633]/20"
                  title="Add 10 units"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
