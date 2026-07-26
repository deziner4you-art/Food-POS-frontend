import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, WifiOff, ShieldOff, ServerCrash, X } from 'lucide-react';

interface ErrorToast {
  id: number;
  code: number;
  message: string;
}

const codeConfig: Record<number, { icon: React.ReactNode; color: string; title: string }> = {
  0:   { icon: <WifiOff size={16} />,     color: 'amber',  title: 'Network Error' },
  403: { icon: <ShieldOff size={16} />,   color: 'orange', title: 'Access Denied' },
  500: { icon: <ServerCrash size={16} />, color: 'red',    title: 'System Error' },
};

const defaultConfig = {
  icon: <AlertTriangle size={16} />,
  color: 'red',
  title: 'Error',
};

let toastCounter = 0;

export default function GlobalErrorToast() {
  const [toasts, setToasts] = useState<ErrorToast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { code, message } = (e as CustomEvent).detail;
      const id = ++toastCounter;
      setToasts((prev) => [...prev, { id, code, message }]);
      // Auto-dismiss after 6 seconds
      setTimeout(() => dismiss(id), 6000);
    };

    window.addEventListener('d4u:apierror', handler);
    return () => window.removeEventListener('d4u:apierror', handler);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const cfg = codeConfig[toast.code] ?? defaultConfig;
        const colorMap: Record<string, string> = {
          amber:  'border-amber-500/40 bg-amber-500/10 text-amber-300',
          orange: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
          red:    'border-red-500/40 bg-red-500/10 text-red-300',
        };
        const cls = colorMap[cfg.color] ?? colorMap.red;
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 border rounded-xl px-4 py-3 shadow-2xl animate-slide-up ${cls}`}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            <span className="mt-0.5 shrink-0">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{cfg.title}</p>
              <p className="text-xs opacity-80 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
