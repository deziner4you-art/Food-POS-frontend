import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Store, PackageOpen, ChefHat, Globe, LayoutDashboard, LogOut, Lock, Users, Activity, ShoppingCart } from 'lucide-react';
import { AdminProvider, useAdminContext } from './context/AdminContext';
import { PackageProvider } from './context/PackageContext';
import { apiFetch } from './utils/api';
import { getDeviceId, storeTokens, clearTokens, refreshAccessToken } from './utils/session';
import GlobalErrorToast from './components/GlobalErrorToast';
import GlobalHeader from './components/workspace/GlobalHeader';

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
import BootstrapMode from './pages/BootstrapMode';
import StoreManager from './pages/StoreManager';
import HQOverview from './pages/HQOverview';
import RecycleBin from './pages/RecycleBin';
import HealthDashboard from './pages/HealthDashboard';
import PurchaseManager from './pages/PurchaseManager';

import { Megaphone, ShieldCheck, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

function AdminLayout({ children, onLogout, user, forceBootstrap }: { children: React.ReactNode, onLogout: () => void, user: any, forceBootstrap?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { isBranchEntered, setIsBranchEntered, branches, selectedBranchId } = useAdminContext();
  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  // MARKETING-002: SaaS module gating — Marketing Hub disappears entirely
  // (not just disabled) when the branch's package doesn't include it.
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  useEffect(() => {
    if (!selectedBranchId) return;
    apiFetch(`/marketing/capabilities?store_id=${selectedBranchId}`)
      .then(res => res.ok ? res.json() : { enabled: true })
      .then(data => setMarketingEnabled(data.enabled !== false))
      .catch(() => setMarketingEnabled(true));
  }, [selectedBranchId]);

  let navItems = forceBootstrap ? [] : [
    { path: '/', label: 'Live Analytics', icon: LayoutDashboard, color: 'text-blue-400', bg: 'bg-blue-500/20' }
  ];

  if (isBranchEntered) {
    navItems = [
      ...navItems,
      { path: '/staff', label: 'Staff & Permissions', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
      { path: '/menu', label: 'Menu Builder', icon: ChefHat, color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/20' },
      { path: '/inventory', label: 'Inventory', icon: PackageOpen, color: 'text-[#8b5cf6]', bg: 'bg-[#8b5cf6]/20' },
      { path: '/recipes', label: 'Recipe Costing', icon: ChefHat, color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/20' },
      { path: '/purchase', label: 'Purchase & Receiving', icon: ShoppingCart, color: 'text-orange-400', bg: 'bg-orange-500/20' },
      ...(marketingEnabled ? [{ path: '/marketing', label: 'Marketing Hub', icon: Megaphone, color: 'text-[#10b981]', bg: 'bg-[#10b981]/20' }] : []),
      { path: '/customers', label: 'CRM & Loyalty', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/20' },
      { path: '/cms', label: 'Website CMS', icon: Globe, color: 'text-[#ec4899]', bg: 'bg-[#ec4899]/20' }
    ];
  }

  // HQ-level (brand-wide) settings — only relevant at the HQ Overview level,
  // not inside a specific branch's dashboard (a branch's own sidebar already
  // covers everything that branch needs; these would just duplicate HQ).
  if (!forceBootstrap && !isBranchEntered && user?.role === 'Super Admin') {
    navItems.push({ path: '/saas', label: 'SaaS Setup', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/20' });
    navItems.push({ path: '/branches', label: 'Branches (Stores)', icon: Store, color: 'text-teal-400', bg: 'bg-teal-500/20' });
    navItems.push({ path: '/health', label: 'System Health', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/20' });
  }

  return (
    <div className="flex h-screen bg-stitch-bg overflow-hidden">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-stitch-panel border-r border-stitch-border p-4 flex flex-col gap-2 relative`}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-stitch-card text-stitch-muted border border-stitch-border rounded-full p-1 hover:text-stitch-ink hover:bg-stitch-surface z-10"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Branch context indicator or HQ Header */}
        {isBranchEntered && selectedBranch ? (
          <>
            {user?.role === 'Super Admin' && (
              <div className="mb-4 flex items-center gap-2 pt-2">
                <button
                  onClick={() => { setIsBranchEntered(false); navigate('/'); }}
                  className={`flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl font-bold transition-all shadow-lg text-sm`}
                  title="Return to HQ"
                >
                  <Building2 size={16} /> {isSidebarOpen && 'Super Admin'}
                </button>
                {isSidebarOpen && (
                  <button onClick={onLogout} className="p-2 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors" title="Logout">
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={`mb-6 pt-4 transition-all overflow-hidden ${isSidebarOpen ? 'px-4' : 'px-0 text-center'}`}>
            <h2 className={`font-black text-white whitespace-nowrap ${isSidebarOpen ? 'text-2xl' : 'text-sm'}`}>
              {isSidebarOpen ? 'D4U Admin' : 'D4U'}
            </h2>
            {isSidebarOpen && <p className="text-xs text-stitch-muted mt-1 whitespace-nowrap">Head Office HQ</p>}
          </div>
        )}

        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4 py-4' : 'justify-center py-4 px-0'} w-full rounded-xl font-bold transition-all ${isActive ? `${item.bg} ${item.color}` : 'text-stitch-muted hover:bg-stitch-surface hover:text-stitch-ink'}`}
              title={!isSidebarOpen ? item.label : ''}
            >
              <Icon size={20} className="min-w-[20px]" /> 
              {isSidebarOpen && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
            </Link>
          )
        })}

        <div className="mt-auto pt-4 border-t border-stitch-border">
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between px-4' : 'justify-center'} py-2`}>
            {isSidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-bold text-sm whitespace-nowrap text-ellipsis">{user?.name || 'Admin'}</span>
                <span className="text-stitch-muted text-xs whitespace-nowrap text-ellipsis">{user?.role || 'System'}</span>
              </div>
            )}
            <button onClick={onLogout} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-stitch-bg overflow-hidden relative">
        <GlobalHeader user={user} onLogout={onLogout} />
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </div>
    </div>
  );
}


function MainApp({ user, handleLogout }: { user: any, handleLogout: () => void }) {
  const { isBranchEntered, brands } = useAdminContext();
  
  if (brands.length === 0) {
    return (
      <Routes>
        <Route path="/" element={<BootstrapMode user={user} handleLogout={handleLogout} />} />
        <Route path="/saas" element={<AdminLayout onLogout={handleLogout} user={user} forceBootstrap><SuperAdmin /></AdminLayout>} />
        <Route path="/setup" element={<AdminLayout onLogout={handleLogout} user={user} forceBootstrap><SetupWizard /></AdminLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout} user={user}>
      <Routes>
        <Route path="/" element={isBranchEntered ? <Dashboard /> : <HQOverview />} />
        
        {/* Branch Specific Routes */}
        <Route path="/staff" element={<StaffPermissions />} />
        <Route path="/menu" element={<MenuManager />} />
        <Route path="/inventory" element={<InventoryManager />} />
        <Route path="/recipes" element={<RecipeManager />} />
        <Route path="/purchase" element={<PurchaseManager />} />
        <Route path="/marketing" element={<MarketingHub />} />
        <Route path="/customers" element={<CustomersManager />} />
        <Route path="/cms" element={<CmsManager />} />
        
        {/* Super Admin Routes */}
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/saas" element={<SuperAdmin />} />
        <Route path="/branches" element={<StoreManager />} />
        <Route path="/recycle-bin" element={<RecycleBin />} />
        <Route path="/health" element={<HealthDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
}

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
        headers: { 'Content-Type': 'application/json', 'x-device-id': getDeviceId() },
        body: JSON.stringify({ phone, pin })
      });
      if (!res.ok) throw new Error('Invalid Credentials');
      const data = await res.json();

      if (data.user.role !== 'Super Admin' && data.user.role !== 'Business Admin' && data.user.role !== 'Admin' && data.user.role !== 'HeadOffice') {
        throw new Error('Access Denied. Admins only.');
      }

      setUser(data.user);
      localStorage.setItem('d4u_admin_user', JSON.stringify(data.user));
      // Stores refresh_token too — see utils/session.ts's proactive silent
      // refresh, which keeps this session alive instead of silently expiring
      // 1 hour after login (every API call was failing with a masked
      // "unexpected system error" once that happened).
      storeTokens(data.access_token, data.refresh_token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('d4u_admin_user');
    clearTokens();
  };

  // Proactively refresh the access token every 45 minutes so a long-open
  // admin session (this one, for instance) never silently starts failing.
  useEffect(() => {
    if (!user) return;
    refreshAccessToken();
    const interval = setInterval(() => { refreshAccessToken(); }, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Allow /setup and /owner to load without waiting for settings or auth
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isSetupRoute = currentPath === '/setup';
  const isOwnerRoute = currentPath === '/owner';

  if (isSetupRoute) return <BrowserRouter basename="/admin"><Routes><Route path="/setup" element={<SetupWizard />} /></Routes></BrowserRouter>;
  if (isOwnerRoute) return <BrowserRouter basename="/admin"><Routes><Route path="/owner" element={<OwnerApp />} /></Routes></BrowserRouter>;

  if (!settings) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Loading System...</div>;

  // Enforce Login for Admin Panel (Backend APIs always require JWT)
  if (!user) {
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
    <BrowserRouter basename="/admin">
      <PackageProvider>
        <AdminProvider>
          <GlobalErrorToast />
          <Toaster position="bottom-right" />
          <Routes>
            <Route path="/owner" element={<OwnerApp />} />
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="/recycle-bin" element={<RecycleBin />} />
            <Route path="/*" element={<MainApp user={user} handleLogout={handleLogout} />} />
          </Routes>
        </AdminProvider>
      </PackageProvider>
    </BrowserRouter>
  );
}
