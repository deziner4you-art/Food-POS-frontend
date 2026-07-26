import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../../context/AdminContext';
import { Building2, LogOut, User } from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import WorkspaceContextPanel from './WorkspaceContextPanel';
import WorkspaceStatus from './WorkspaceStatus';

export default function GlobalHeader({ user, onLogout }: { user: any, onLogout?: () => void }) {
  const { setIsBranchEntered } = useAdminContext();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'Super Admin';
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        
        {/* Left: Context Information */}
        <div className="flex items-center gap-4 flex-wrap">
          <WorkspaceContextPanel user={user} />
        </div>

        {/* Right: Switcher & Status */}
        <div className="flex items-center gap-4 flex-wrap">
          {isSuperAdmin && (
            <button 
              onClick={() => { setIsBranchEntered(false); navigate('/'); }}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg text-sm"
              title="Return to HQ Overview"
            >
              <Building2 size={16} /> Return to HQ
            </button>
          )}
          <WorkspaceSwitcher user={user} />
          <WorkspaceStatus />

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-white font-bold text-sm">{user?.name || 'Admin'}</span>
              <span className="text-slate-400 text-xs">{user?.role || 'System'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
              <User size={18} />
            </div>
            {onLogout && (
              <button onClick={onLogout} className="p-2 ml-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
