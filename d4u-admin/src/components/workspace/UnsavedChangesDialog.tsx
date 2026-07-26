import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function UnsavedChangesDialog({ isOpen, onCancel, onConfirm }: UnsavedChangesDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Unsaved Changes</h3>
            <p className="text-slate-400 text-sm mt-1">
              You have unsaved work in the current module.
            </p>
          </div>
        </div>

        <p className="text-slate-300 mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          Switching workspace will reload the dashboard and discard those changes. Are you sure you want to proceed?
        </p>

        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]"
          >
            Switch Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
