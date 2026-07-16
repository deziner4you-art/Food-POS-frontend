import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Store, PackageOpen, ChefHat, Globe, LayoutDashboard, LogOut, Lock, Users } from 'lucide-react';
import { AdminProvider, useAdminContext } from './context/AdminContext';

import StaffPermissions from './pages/StaffPermissions';
import InventoryManager from './pages/InventoryManager';
import RecipeManager from './pages/RecipeManager';
import MenuManager from './pages/MenuManager';
import CmsManager from './pages/CmsManager';
import Dashboard from './pages/Dashboard';
import MarketingHub from './pages/MarketingHub';
import CustomersManager from './pages/CustomersManager';
import SuperAdmin from './pages/SuperAdmin';
import OwnerApp from './pages/OwnerApp';
import SetupWizard from './pages/SetupWizard';

import { Megaphone, ShieldCheck } from 'lucide-react';

const BACKEND_URL = 'https://api.pos.deziner4you.com';

import { ChevronLeft, ChevronRight } from 'lucide-react';

function AdminLayout({ children, onLogout, user }: { children: React.ReactNode, onLogout: () => void, user: any }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { isBranchEntered, setIsBranchEntered, branches, selectedBranchId } = useAdminContext();
  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  let navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard, color: 'text-blue-400', bg: 'bg-blue-500/20' }
  ];

  if (isBranchEntered) {
    navItems = [
      ...navItems,
      { path: '/staff', label: 'Staff & Permissions', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
      { path: '/menu', label: 'Menu Builder', icon: ChefHat, color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/20' },
      { path: '/inventory', label: 'Inventory', icon: PackageOpen, color: 'text-[#8b5cf6]', bg: 'bg-[#8b5cf6]/20' },
      { path: '/recipes', label: 'Recipe Costing', icon: ChefHat, color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/20' },
      { path: '/marketing', label: 'Marketing Hub', icon: Megaphone, color: 'text-[#10b981]', bg: 'bg-[#10b981]/20' },
      { path: '/customers', label: 'CRM & Loyalty', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/20' },
      { path: '/cms', label: 'Website CMS', icon: Globe, color: 'text-[#ec4899]', bg: 'bg-[#ec4899]/20' }
    ];
  }

  if (user?.role === 'Super Admin') {
    navItems.push({ path: '/saas', label: 'SaaS Setup', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/20' });
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-2 relative`}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-slate-800 text-slate-300 border border-slate-700 rounded-full p-1 hover:text-white hover:bg-slate-700 z-10"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className={`mb-6 pt-4 transition-all overflow-hidden ${isSidebarOpen ? 'px-4' : 'px-0 text-center'}`}>
          <h2 className={`font-black text-white whitespace-nowrap ${isSidebarOpen ? 'text-2xl' : 'text-sm'}`}>
            {isSidebarOpen ? 'D4U Admin' : 'D4U'}
          </h2>
          {isSidebarOpen && <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">Head Office HQ</p>}
        </div>

        {/* Branch context indicator */}
        {isBranchEntered && selectedBranch && (
          <div className="mb-2">
            <div className={`${isSidebarOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'} flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-xl`}>
              <Store size={16} className="text-pink-400 min-w-[16px]" />
              {isSidebarOpen && <span className="text-pink-300 font-bold text-xs whitespace-nowrap overflow-hidden text-ellipsis">{selectedBranch.name}</span>}
            </div>
            <button
              onClick={() => { setIsBranchEntered(false); navigate('/'); }}
              className={`mt-1 w-full text-xs text-slate-400 hover:text-white flex items-center ${isSidebarOpen ? 'gap-1 px-2 justify-start' : 'justify-center'} py-1 rounded-lg hover:bg-slate-800 transition-colors`}
              title="Back to Overview"
            >
              <ChevronLeft size={14} /> {isSidebarOpen && 'Back to Overview'}
            </button>
          </div>
        )}

        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4 py-4' : 'justify-center py-4 px-0'} w-full rounded-xl font-bold transition-all ${isActive ? `${item.bg} ${item.color}` : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              title={!isSidebarOpen ? item.label : ''}
            >
              <Icon size={20} className="min-w-[20px]" /> 
              {isSidebarOpen && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
            </button>
          )
        })}

        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between px-4' : 'justify-center'} py-2`}>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-bold text-sm whitespace-nowrap text-ellipsis">{user?.name || 'Admin'}</span>
                <span className="text-slate-500 text-xs whitespace-nowrap text-ellipsis">{user?.role || 'System'}</span>
              </div>
            )}
            <button onClick={onLogout} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-slate-900 overflow-y-auto p-8 relative">
        {children}
      </div>
    </div>
  );
}

// Overview placeholder removed, we use Dashboard now

import { Toaster } from 'react-hot-toast';



export default function App() {
  const [settings, setSettings] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Fetch system settings to check if Auth is enforced
    fetch(`${BACKEND_URL}/cms/settings`)
      .then(res => res.json())
      .then(data => {
        setSettings(data || {});
        if (data.brand?.currency) {
          (window as any).d4u_currency = data.brand.currency;
        }
        if (data.brand?.vat_percentage !== undefined) {
          (window as any).d4u_vat = data.brand.vat_percentage;
        }
      })
      .catch(() => {
        // Backend not reachable — still allow app to load with defaults
        setSettings({});
      });

    // 2. Check local storage for existing session
    const storedUser = localStorage.getItem('d4u_admin_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      });
      if (!res.ok) throw new Error('Invalid Credentials');
      const data = await res.json();
      
      if (data.user.role !== 'Super Admin' && data.user.role !== 'Business Admin' && data.user.role !== 'Admin' && data.user.role !== 'HeadOffice') {
        throw new Error('Access Denied. Admins only.');
      }

      setUser(data.user);
      localStorage.setItem('d4u_admin_user', JSON.stringify(data.user));
      localStorage.setItem('d4u_admin_token', data.access_token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('d4u_admin_user');
    localStorage.removeItem('d4u_admin_token');
  };

  // Allow /setup and /owner to load without waiting for settings or auth
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isSetupRoute = currentPath === '/setup';
  const isOwnerRoute = currentPath === '/owner';

  if (isSetupRoute) return <BrowserRouter><Routes><Route path="/setup" element={<SetupWizard />} /></Routes></BrowserRouter>;
  if (isOwnerRoute) return <BrowserRouter><Routes><Route path="/owner" element={<OwnerApp />} /></Routes></BrowserRouter>;

  if (!settings) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Loading System...</div>;

  // Enforce Login if module is enabled
  if (settings.module_auth_enabled && !user) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#ec4899]/20 text-[#ec4899] rounded-full flex items-center justify-center">
              <Lock size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-2">Admin Portal</h2>
          <p className="text-slate-400 text-sm text-center mb-8">Enter your credentials to access HQ</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Phone Number</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-[#ec4899] outline-none" 
                placeholder="0300..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Secure PIN</label>
              <input 
                type="password" 
                value={pin}
                onChange={e => setPin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-[#ec4899] outline-none tracking-widest" 
                placeholder="****"
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}
            <button type="submit" className="w-full bg-[#ec4899] hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors mt-4">
              Access HQ
            </button>

            <div className="mt-6 text-center border-t border-slate-700 pt-6">
              <p className="text-slate-400 text-sm mb-2">New Restaurant Client?</p>
              <button 
                type="button" 
                onClick={() => window.location.href = '/setup'}
                className="w-full bg-slate-800 hover:bg-slate-700 text-[#4edea3] border border-[#4edea3]/30 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} /> Setup your SaaS
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AdminProvider>
        <Toaster position="bottom-right" />
        <Routes>
          <Route path="/owner" element={<OwnerApp />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/*" element={
            <AdminLayout onLogout={handleLogout} user={user}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/staff" element={<StaffPermissions />} />
                <Route path="/menu" element={<MenuManager />} />
                <Route path="/inventory" element={<InventoryManager />} />
                <Route path="/recipes" element={<RecipeManager />} />
                <Route path="/marketing" element={<MarketingHub />} />
                <Route path="/customers" element={<CustomersManager />} />
                <Route path="/cms" element={<CmsManager />} />
                <Route path="/saas" element={<SuperAdmin />} />
              </Routes>
            </AdminLayout>
          } />
        </Routes>
      </AdminProvider>
    </BrowserRouter>
  );
}
