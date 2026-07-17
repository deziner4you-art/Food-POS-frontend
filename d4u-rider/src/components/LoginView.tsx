import React, { useState } from 'react';
import { Navigation, Loader2 } from 'lucide-react';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

interface LoginViewProps {
  onLoginSuccess: (riderId: string, storeId: number, name: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if user has Rider role or has Rider permission
      const roleName = typeof data.user.role === 'string' ? data.user.role : data.user.role?.name;
      const isRiderRole = roleName?.toLowerCase() === 'rider' || data.user.role_id === 11;
      const hasRiderPerm = data.user.module_permissions?.rider === true || data.user.role?.permissions?.all === true;
      const isSuperAdmin = data.user.role_id === 3;
      
      if (!isRiderRole && !hasRiderPerm && !isSuperAdmin) {
         throw new Error('Access denied. You are not registered as a Rider.');
      }

      const storeId = data.user.store_id || 1;
      
      // Save token (if we want to use JWT later)
      if (data.access_token) {
        localStorage.setItem('d4u_rider_token', data.access_token);
      }
      
      localStorage.setItem('d4u_rider_store', storeId.toString());
      localStorage.setItem('d4u_rider_name', data.user.name);
      localStorage.setItem('d4u_rider_store_name', data.user.store?.name || 'Deziner4You Branch');
      
      onLoginSuccess(data.user.id.toString(), storeId, data.user.name);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#fbbf24]/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-slate-500/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-sm z-10 animate-fade-in-up">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#fbbf24] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.2)] mb-6 transform -rotate-6">
            <Navigation className="w-10 h-10 text-slate-900 fill-current transform rotate-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2 font-display">Rider Login</h1>
          <p className="text-slate-400 text-sm text-center">Enter your assigned phone number and PIN to access deliveries.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black tracking-widest text-white uppercase ml-1 block mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 03000000007"
              className="w-full bg-slate-900/50 border border-slate-700 focus:border-[#fbbf24] rounded-2xl px-5 py-4 text-white placeholder-slate-600 outline-none transition-all font-medium text-lg shadow-inner"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black tracking-widest text-white uppercase ml-1 block mb-2 mt-4">Security PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-900/50 border border-slate-700 focus:border-[#fbbf24] rounded-2xl px-5 py-4 text-white placeholder-slate-600 outline-none transition-all font-black text-2xl tracking-[0.5em] shadow-inner text-center"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm font-medium text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-transparent border-2 border-[#fbbf24] hover:bg-[#fbbf24]/10 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.1)] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50 mt-8 flex items-center justify-center gap-2 uppercase tracking-widest text-sm active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
          </button>
        </form>
        
        <p className="text-center text-xs text-slate-500 mt-8 font-medium">
          Only authorized branch riders can access this system.
        </p>
      </div>
    </div>
  );
}
