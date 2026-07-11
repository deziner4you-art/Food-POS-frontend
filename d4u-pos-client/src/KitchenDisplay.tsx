import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

export default function KitchenDisplay() {
  const [timeStr, setTimeStr] = useState('');
  const [selectedPrepTime, setSelectedPrepTime] = useState(15);
  
  const [modalType, setModalType] = useState<'NONE' | 'CHEF_LOGIN'>('NONE');
  const [chef, setChef] = useState<{ name: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('d4u_chef') || 'null'); } catch { return null; }
  });
  const [chefLoginName, setChefLoginName] = useState('');
  
  // Fetch KOTs from Dexie Database
  const kots = useLiveQuery(() => db.kots.toArray()) || [];
  
  // Split kots by status
  const activeKots = kots.filter(k => k.status === 'PREPARING' || k.status === 'READY');
  const newKots = kots.filter(k => k.status === 'NEW');

  // Popup overlay state
  const [selectedNewKot, setSelectedNewKot] = useState<any>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-GB', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set the popup to the first NEW kot if any
  useEffect(() => {
    if (newKots.length > 0 && !selectedNewKot) {
      setSelectedNewKot(newKots[0]);
    } else if (newKots.length === 0) {
      setSelectedNewKot(null);
    }
  }, [newKots, selectedNewKot]);

  const handleAcceptOrder = async () => {
    if (selectedNewKot) {
      // Time selected (defaulting to 15m, can be changed via UI)
      await db.kots.update(selectedNewKot.id, { 
        status: 'PREPARING', 
        prepTimeMinutes: selectedPrepTime, // Use user-selected preparation time
        startTime: new Date().toISOString() 
      });
      setSelectedNewKot(null);
      // Reset prep time selection for next order
      setSelectedPrepTime(15);
    }
  };

  const handleMarkReady = async (kot: any) => {
    let isLate = false;
    if (kot.startTime) {
      const target = new Date(kot.startTime).getTime() + (kot.prepTimeMinutes * 60 * 1000);
      if (new Date().getTime() > target) isLate = true;
    }
    await db.kots.update(kot.id, { status: 'READY', isLate });
  };

  // Utility to calculate remaining time
  const getRemainingTime = (kot: any) => {
    if (!kot.startTime) return "00:00";
    const start = new Date(kot.startTime).getTime();
    const target = start + (kot.prepTimeMinutes * 60 * 1000);
    const now = new Date().getTime();
    const remainingSeconds = Math.floor((target - now) / 1000);
    
    if (remainingSeconds < 0) {
      const min = Math.floor(Math.abs(remainingSeconds) / 60);
      const sec = Math.abs(remainingSeconds) % 60;
      return `-${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    
    const min = Math.floor(remainingSeconds / 60);
    const sec = remainingSeconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="dark bg-background text-on-background overflow-hidden h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar Navigation */}
      <aside className="w-[240px] bg-surface-container-lowest border-r border-outline-variant flex flex-col h-full shrink-0">
        <div className="p-6 flex flex-col gap-6">
          <div 
            className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-surface-container transition-colors"
            onClick={() => {
              if (chef) {
                setChef(null);
                localStorage.removeItem('d4u_chef');
              } else {
                setChefLoginName('');
                setModalType('CHEF_LOGIN');
              }
            }}
          >
            <div 
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container bg-cover bg-center" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBK3tYdWIHrzS35gXN_e8OLTGDFtifxhEFCdElswQsgA3zZcvfGAOI5w3O0f_7BFo6y2bJQDhHlU2rWyvDeAcavaiwRoee-s8XQYp1dqFualqFn76rC7mEaFMZ_I3_IcKMFBbtvGNoXiFlNwf0XM3_NztGSmdFyjyp8AC7gFwMoQsOAsF5-5_35OLAeWTDZle1FF65Ham_uNnxWrZUQNsAPEqP4pTwt9puEmyA1DJsGvHb3U6Qv7vTQwBfkOGeBsLk2HfBZfuz7wzg")' }}
            >
            </div>
            <div className="flex flex-col">
              <h2 className="text-on-surface font-bold leading-none text-xl">{chef ? chef.name : 'Chef Login'}</h2>
              <p className="text-on-surface-variant text-sm mt-1">{chef ? '(Click to Logout)' : 'Main Grill & Fryer'}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '24px' }}>grid_view</span>
              <span className="font-medium">Dashboard</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '24px' }}>receipt_long</span>
              <span className="font-medium">Orders</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/20 cursor-pointer">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              <span className="font-bold">Kitchen</span>
            </div>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-outline-variant bg-surface-container-low">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">System Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-xs text-secondary font-bold">ONLINE</span>
            </div>
          </div>
          <button className="w-full bg-error-container text-on-error-container py-3 rounded-lg font-bold text-sm tracking-wide uppercase hover:bg-on-tertiary transition-colors">
            Emergency Stop
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-dim relative overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-outline-variant bg-surface-container shadow-md z-10">
          <div className="flex items-center gap-8">
            <h1 className="font-bold text-3xl text-on-surface">Kitchen Display System</h1>
            <div className="flex gap-4">
              <div className="flex items-center bg-surface-container-highest px-4 py-2 rounded-full border border-outline-variant">
                <span className="text-sm font-bold text-primary mr-2">PREPARING:</span>
                <span className="text-lg font-bold">{activeKots.filter(k => k.status === 'PREPARING').length}</span>
              </div>
              <div className="flex items-center bg-surface-container-highest px-4 py-2 rounded-full border border-outline-variant">
                <span className="text-sm font-bold text-secondary mr-2">READY:</span>
                <span className="text-lg font-bold">{activeKots.filter(k => k.status === 'READY').length}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Local Time</span>
              <span className="text-xl font-bold tabular-nums">{timeStr}</span>
            </div>
          </div>
        </header>

        {/* KOT Grid */}
        <section className="flex-1 p-6 overflow-y-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', alignContent: 'start' }}>
          {activeKots.map((kot) => (
            <div key={kot.id} className={`border-2 rounded-xl flex flex-col shadow-lg relative overflow-hidden ${kot.status === 'READY' ? 'bg-secondary-container/20 border-secondary' : 'bg-surface-container border-outline-variant'}`}>
              <div className={`p-3 flex justify-between items-center ${kot.status === 'READY' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-on-surface border-b border-outline-variant'}`}>
                <span className="font-bold text-lg">ORDER #{kot.orderId}</span>
                <span className={`text-xs font-black uppercase ${kot.status === 'READY' ? 'text-on-secondary' : 'text-secondary'}`}>{kot.status}</span>
              </div>
              
              <div className="p-4 flex-1 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xl text-on-surface whitespace-pre-line leading-tight">{kot.items.replace(/,\s/g, '\n')}</span>
                    <span className="text-sm font-bold text-on-surface-variant ml-2 bg-surface-container-highest px-2 py-1 rounded">{kot.type}</span>
                  </div>
                  {kot.notes && (
                    <p className="text-on-tertiary font-bold text-lg animate-pulse bg-on-tertiary/20 px-3 py-2 rounded-lg border-l-4 border-on-tertiary">
                      {kot.notes}
                    </p>
                  )}
                </div>
                <div className="h-[1px] bg-outline-variant"></div>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-on-surface-variant font-bold">Time Remaining</span>
                    <span className={`text-3xl font-bold tabular-nums ${kot.status === 'READY' ? 'text-secondary' : 'text-on-surface'}`}>
                      {kot.status === 'READY' ? 'READY' : getRemainingTime(kot)}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">schedule</span>
                </div>
              </div>
              
              {kot.status === 'PREPARING' && (
                <button 
                  onClick={() => handleMarkReady(kot)}
                  className="bg-surface-container-highest text-on-surface py-4 font-black text-lg tracking-widest uppercase hover:bg-surface-bright transition-all"
                >
                  MARK READY
                </button>
              )}
            </div>
          ))}
        </section>

        {/* New Order Popup Overlay */}
        <div className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 transition-all transform ${selectedNewKot ? 'scale-100 opacity-100' : 'scale-110 opacity-0 pointer-events-none'}`}>
          {selectedNewKot && (
            <div className="w-[90vw] h-[90vh] bg-red-600 rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.6)] border-4 border-red-800 overflow-hidden flex flex-col">
              {/* Animated Header */}
              <div className="bg-red-800 p-8 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-red-600 text-4xl animate-bounce">notifications_active</span>
                  </div>
                  <h2 className="font-bold text-white tracking-tighter text-6xl drop-shadow-md">NEW ORDER</h2>
                </div>
              </div>
              
              {/* Order Content */}
              <div className="p-12 flex-1 flex flex-col gap-8 overflow-y-auto">
                <div className="flex justify-between items-end border-b-2 border-red-400 pb-8">
                  <div className="flex-1">
                    <p className="text-red-200 font-bold uppercase tracking-widest text-xl mb-2">Item Details</p>
                    <h3 className="text-white font-bold text-5xl whitespace-pre-line leading-tight drop-shadow-sm">{selectedNewKot.items.replace(/,\s/g, '\n')}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-red-200 font-bold uppercase tracking-widest text-xl mb-2">Order ID</p>
                    <h3 className="text-white font-black text-6xl drop-shadow-md">#{selectedNewKot.orderId}</h3>
                    <p className="text-red-100 font-bold mt-2 text-2xl">{selectedNewKot.type}</p>
                  </div>
                </div>
                
                {selectedNewKot.notes && (
                  <div className="border-4 border-white bg-red-700 p-8 rounded-2xl shadow-inner">
                      <p className="text-white font-bold uppercase tracking-widest text-2xl mb-4">Chef Instructions</p>
                      <h4 className="text-white font-black text-5xl uppercase leading-tight drop-shadow-md">
                        {selectedNewKot.notes}
                      </h4>
                  </div>
                )}
                
                {/* Time Picker */}
                <div className="flex flex-col gap-6 mt-auto pt-8 border-t-2 border-red-400">
                  <p className="text-white font-bold uppercase tracking-widest text-2xl">Set Preparation Time</p>
                  <div className="grid grid-cols-4 gap-6">
                    { [5,15,25,45].map((min) => (
                      <button
                        key={min}
                        onClick={() => setSelectedPrepTime(min)}
                        className={
                          `py-8 rounded-2xl border-4 text-4xl font-black transition-all shadow-lg ` +
                          (selectedPrepTime === min ? 'bg-white text-red-700 border-white scale-105' : 'bg-red-800/50 text-white border-red-400 hover:bg-red-800 hover:border-white')
                        }
                      >
                        {min}m
                      </button>
                    )) }
                  </div>
                </div>
              </div>
              
              {/* Accept Button */}
              <div className="p-8 bg-red-800 border-t-4 border-red-900">
                <button 
                  onClick={handleAcceptOrder}
                  className="w-full bg-white text-red-700 py-8 rounded-2xl font-black text-5xl tracking-[0.1em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                  ACCEPT ORDER
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Chef Login Modal */}
        {modalType === 'CHEF_LOGIN' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 transition-all">
            <div className="w-[400px] bg-surface-container rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-outline-variant overflow-hidden flex flex-col">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                <h2 className="font-bold text-on-surface text-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined">person</span> Chef Login
                </h2>
                <span className="material-symbols-outlined cursor-pointer text-on-surface-variant hover:text-on-surface" onClick={() => setModalType('NONE')}>close</span>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Chef Full Name / ID</label>
                <input 
                  type="text" 
                  value={chefLoginName}
                  onChange={e => setChefLoginName(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline text-on-surface p-4 rounded-xl text-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Enter Name e.g., Ali"
                  autoFocus
                />
                <button 
                  onClick={() => { 
                    if(chefLoginName.trim().length > 0) {
                      const c = { name: chefLoginName.trim() };
                      setChef(c);
                      localStorage.setItem('d4u_chef', JSON.stringify(c));
                      setModalType('NONE');
                    }
                  }} 
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg mt-2 hover:bg-primary/90 transition-colors"
                >
                  Login to Station
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
