import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Clock, UserCheck, UserMinus, ShieldCheck } from 'lucide-react';

export default function StaffManagement() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'CASHIER'|'CHEF'|'RIDER'|'MANAGER'>('CASHIER');

  const logs = useLiveQuery(() => db.staffLogs.toArray()) || [];
  const activeShifts = logs.filter(l => !l.clockOut);
  const completedShifts = logs.filter(l => l.clockOut);

  const handleClockIn = async () => {
    if (!name || !pin) return alert('Name and PIN required');
    if (activeShifts.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      return alert(`${name} is already clocked in!`);
    }
    
    await db.staffLogs.add({
      name,
      pin,
      role,
      clockIn: new Date().toISOString()
    });
    setName('');
    setPin('');
  };

  const handleClockOut = async () => {
    if (!name || !pin) return alert('Name and PIN required');
    const active = activeShifts.find(s => s.name.toLowerCase() === name.toLowerCase() && s.pin === pin);
    if (!active || !active.id) {
      return alert('Invalid Name or PIN, or no active shift found.');
    }
    
    await db.staffLogs.update(active.id, {
      clockOut: new Date().toISOString()
    });
    setName('');
    setPin('');
  };

  return (
    <div className="p-8 animate-slide-up h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white m-0">Staff Timeclock</h2>
          <p className="text-slate-400 mt-1 text-sm">Manage staff attendance and shifts</p>
        </div>
        <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl px-4 py-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#fbbf24]" />
          <span className="text-sm font-bold text-[#fbbf24]">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeclock Panel */}
        <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <ShieldCheck className="text-blue-400 w-5 h-5" /> Clock In / Out
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Staff Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">4-Digit PIN</label>
              <input 
                type="password" 
                maxLength={4}
                value={pin} 
                onChange={e => setPin(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 tracking-widest text-center text-lg"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Role</label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500"
              >
                <option value="CASHIER">Cashier</option>
                <option value="CHEF">Chef</option>
                <option value="RIDER">Delivery Rider</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4">
              <button 
                onClick={handleClockIn}
                className="bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/50 hover:bg-[#4edea3]/20 font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <UserCheck size={20} /> Clock In
              </button>
              <button 
                onClick={handleClockOut}
                className="bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <UserMinus size={20} /> Clock Out
              </button>
            </div>
          </div>
        </div>

        {/* Active Shifts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></div> Active Shifts ({activeShifts.length})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {activeShifts.length === 0 ? (
                <p className="text-sm text-slate-500 italic col-span-2">No staff currently clocked in.</p>
              ) : (
                activeShifts.map(s => (
                  <div key={s.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-xs font-bold text-blue-400">{s.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Clocked in at</p>
                      <p className="text-sm font-bold text-slate-300">{new Date(s.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-black text-white mb-6">Today's Completed Shifts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Staff Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Clock In</th>
                    <th className="px-4 py-3">Clock Out</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {completedShifts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">No completed shifts today.</td>
                    </tr>
                  ) : (
                    completedShifts.map(s => {
                      const hours = ((new Date(s.clockOut!).getTime() - new Date(s.clockIn).getTime()) / (1000 * 60 * 60)).toFixed(2);
                      return (
                        <tr key={s.id} className="border-b border-slate-700/50 last:border-0">
                          <td className="px-4 py-3 font-bold text-white">{s.name}</td>
                          <td className="px-4 py-3 text-blue-400">{s.role}</td>
                          <td className="px-4 py-3">{new Date(s.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-4 py-3">{new Date(s.clockOut!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-4 py-3 font-bold text-[#fbbf24] text-right">{hours}h</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
