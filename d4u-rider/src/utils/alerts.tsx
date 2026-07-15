import toast from 'react-hot-toast';
import React from 'react';

export const customConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast.custom((t) => (
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl max-w-sm w-full animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="bg-red-500/20 text-red-400 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-black text-lg mb-1">Are you sure?</h3>
            <p className="text-slate-400 text-sm mb-4">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-2">
          <button 
            onClick={() => { toast.dismiss(t.id); resolve(false); }}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { toast.dismiss(t.id); resolve(true); }}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: 'top-center', id: 'confirm-toast' });
  });
};

export const customAlert = (message: string) => {
  toast.error(message, {
    style: {
      borderRadius: '12px',
      background: '#1e293b',
      color: '#fff',
      border: '1px solid #334155'
    }
  });
};

export const customSuccess = (message: string) => {
  toast.success(message, {
    style: {
      borderRadius: '12px',
      background: '#1e293b',
      color: '#fff',
      border: '1px solid #334155'
    }
  });
};
