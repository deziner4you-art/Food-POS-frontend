import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../../context/AdminContext';

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

          <WorkspaceSwitcher user={user} />
          <WorkspaceStatus />

        </div>
        
      </div>
    </div>
  );
}
