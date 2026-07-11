import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2, Edit2, Key, Check } from 'lucide-react';

export default function StaffPermissions() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Serves as Username/ID
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Cashier');
  const [storeId, setStoreId] = useState(1);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';
    
    // Always load mock users first (no backend dependency)
    const mockUsers = [
      { id: 1, email: '03000000001', password: '1234', name: 'Ali Cashier (B1)', role: 'Cashier', store_id: 1, permissions: ['pos'] },
      { id: 2, email: '03000000002', password: 'manager123', name: 'Sara Manager (B1)', role: 'Manager', store_id: 1, permissions: ['pos', 'admin', 'inventory', 'marketing'] },
      { id: 3, email: 'admin', password: 'admin', name: 'Super Admin', role: 'Admin', store_id: 0, permissions: ['*'] }
    ];
    setUsers(mockUsers);

    // Try to load real branches (optional, won't block rendering)
    try {
      let res = await fetch(BACKEND_URL + '/stores');
      if (res.ok) {
        const data = await res.json();
        // Backend returns { value: [...], Count: N }
        const branchList = Array.isArray(data) ? data : (data.value || data.stores || data.data || []);
        if (branchList.length > 0) setBranches(branchList);
      }
    } catch (e) {
      console.warn('Could not load branches:', e);
    }

    setLoading(false);
  };

  const handleSave = () => {
    const newUser = {
      id: editingUser ? editingUser.id : Date.now(),
      name,
      email,
      password,
      role,
      store_id: Number(storeId),
      permissions
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? newUser : u));
    } else {
      setUsers([...users, newUser]);
    }

    setIsModalOpen(false);
    setEditingUser(null);
  };

  const openModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setPassword(user.password);
      setRole(user.role);
      setStoreId(user.store_id);
      setPermissions(user.permissions || []);
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setRole('Cashier');
      setStoreId(branches[0]?.id || 1);
      setPermissions(['pos']);
    }
    setIsModalOpen(true);
  };

  const togglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter(p => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen bg-slate-900">
      <div className="text-slate-400 text-lg font-bold animate-pulse">Loading Staff...</div>
    </div>
  );

  return (
    <div className="p-8 text-white min-h-screen bg-slate-900 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Shield className="text-indigo-500" size={32} />
            Staff & Permissions Board
          </h1>
          <p className="text-slate-400">Manage login credentials and system access for all branches</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={20} /> Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const branch = branches.find(b => b.id === user.store_id);
          return (
            <div key={user.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-indigo-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-indigo-400">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{user.name}</h3>
                    <div className="flex gap-2 text-sm mt-1">
                      <span className="text-slate-400">{user.role}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-indigo-400">{branch ? branch.name : 'All Branches'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(user)} className="p-2 bg-slate-700 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setUsers(users.filter(u => u.id !== user.id))} className="p-2 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 w-24">Login ID:</span>
                  <span className="font-mono text-slate-300">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 w-24">PIN/Pass:</span>
                  <span className="font-mono text-slate-300">••••</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {user.permissions.includes('*') ? (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold border border-red-500/30">Super Admin Access</span>
                ) : user.permissions.map((p: string) => (
                  <span key={p} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs font-bold border border-slate-600 uppercase">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h2 className="text-2xl font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2">✕</button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500" placeholder="e.g. Ali Cashier" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500">
                    <option>Cashier</option>
                    <option>Manager</option>
                    <option>Admin</option>
                    <option>Rider</option>
                    <option>KDS Chef</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Login ID / Username</label>
                  <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500" placeholder="e.g. 03001234567" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Password / PIN</label>
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500" placeholder="e.g. 1234" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Assign to Branch</label>
                <select value={storeId} onChange={e => setStoreId(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500">
                  <option value={0}>All Branches (Head Office)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3">Panel Access Permissions</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'pos', label: 'POS Terminal' },
                    { id: 'kds', label: 'Kitchen Display' },
                    { id: 'admin', label: 'Backend Admin' },
                    { id: 'inventory', label: 'Inventory' },
                    { id: 'marketing', label: 'Marketing Hub' },
                    { id: 'cms', label: 'Website CMS' }
                  ].map(perm => (
                    <div 
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${permissions.includes(perm.id) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${permissions.includes(perm.id) ? 'bg-indigo-500 text-white' : 'bg-slate-800'}`}>
                        {permissions.includes(perm.id) && <Check size={14} />}
                      </div>
                      <span className="font-bold text-sm">{perm.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all">Cancel</button>
              <button onClick={handleSave} className="px-6 py-3 font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all flex items-center gap-2">
                <Check size={20} /> Save User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
