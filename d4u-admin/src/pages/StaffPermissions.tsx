import React, { useState, useEffect, useRef } from 'react';
import { Users, Shield, Plus, Trash2, Edit2, Check, X, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function StaffPermissions() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [roleId, setRoleId] = useState<number>(0);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  
  const [activeTab, setActiveTab] = useState<'staff' | 'rider'>('staff');
  const [riderDetails, setRiderDetails] = useState<any>({
    vehicle_type: '', model: '', color: '', cc: '', license_plate: '', registration_no: '', dob: '', city: ''
  });

  const MODULES = [
    { id: 'pos', label: 'POS Terminal' },
    { id: 'kds', label: 'KDS (Kitchen Display)' },
    { id: 'rider', label: 'Rider App' },
    { id: 'admin', label: 'Backend Admin' },
    { id: 'website', label: 'Website CMS' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, storesRes, rolesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/users`),
        fetch(`${BACKEND_URL}/stores`),
        fetch(`${BACKEND_URL}/users/roles`)
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (storesRes.ok) setBranches(await storesRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
    } catch (e) {
      customAlert('Could not connect to backend. Is the server running?');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setPhone(user.phone);
      setPin(''); // Don't show existing PIN
      setImageUrl(user.image_url || '');
      setRoleId(user.role_id || user.role?.id || 0);
      setStoreId(user.store_id ?? null);
      setPermissions(user.module_permissions || {});
      setRiderDetails(user.rider_details || {
        vehicle_type: '', model: '', color: '', cc: '', license_plate: '', registration_no: '', dob: '', city: ''
      });
      if (user.role?.name?.toLowerCase() === 'rider') {
        setActiveTab('rider');
      } else {
        setActiveTab('staff');
      }
    } else {
      setEditingUser(null);
      setName('');
      setPhone('');
      setPin('');
      setImageUrl('');
      setRoleId(roles.find(r => r.name.toLowerCase() !== 'rider')?.id || roles[0]?.id || 0);
      setStoreId(branches[0]?.id || null);
      setPermissions({
        pos: true,
        kds: false,
        rider: false,
        admin: false,
        website: false
      });
      setRiderDetails({
        vehicle_type: '', model: '', color: '', cc: '', license_plate: '', registration_no: '', dob: '', city: ''
      });
      setActiveTab('staff');
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/users/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(`${BACKEND_URL}${data.url}`);
        customSuccess('Image uploaded successfully');
      } else {
        customAlert('Failed to upload image');
      }
    } catch (err) {
      customAlert('Error uploading image');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) return customAlert('Name and Phone are required');
    if (!editingUser && !pin.trim()) return customAlert('PIN is required for new users');
    if (activeTab === 'staff' && roleId === 0) return customAlert('Please select a role');

    setSaving(true);
    try {
      const method = editingUser ? 'PATCH' : 'POST';
      const url = editingUser ? `${BACKEND_URL}/users/${editingUser.id}` : `${BACKEND_URL}/users`;

      let finalRoleId = roleId;
      let finalPermissions = permissions;
      if (activeTab === 'rider') {
        const riderRole = roles.find((r:any) => r.name.toLowerCase() === 'rider');
        if (riderRole) finalRoleId = riderRole.id;
        finalPermissions = { pos: false, kds: false, admin: false, website: false, rider: true };
      }

      const payload: any = { name, phone, role_id: finalRoleId, store_id: storeId, module_permissions: finalPermissions };
      if (pin.trim()) payload.pin = pin;
      if (imageUrl.trim()) payload.image_url = imageUrl;
      if (activeTab === 'rider') payload.rider_details = riderDetails;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Save failed');
      }

      customSuccess(editingUser ? 'User updated successfully!' : `User "${name}" created! They can now login to POS.`);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      customAlert(err.message || 'Error saving user');
    }
    setSaving(false);
  };

  const handleDelete = async (user: any) => {
    if (!(await customConfirm(`Are you sure you want to remove ${user.name}?`))) return;
    try {
      const res = await fetch(`${BACKEND_URL}/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      customSuccess(`${user.name} removed.`);
      fetchData();
    } catch (err: any) {
      customAlert(err.message || 'Error deleting user');
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    const name = (roleName || '').toLowerCase();
    if (name.includes('admin') || name.includes('super')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (name.includes('manager') || name.includes('head')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (name.includes('cashier')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (name.includes('rider')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    return 'bg-slate-700 text-slate-300 border-slate-600';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen bg-slate-900">
      <div className="text-slate-400 text-lg font-bold animate-pulse">Loading Staff from Backend...</div>
    </div>
  );

  return (
    <div className="p-8 text-white min-h-screen bg-slate-900 overflow-y-auto">

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Shield className="text-indigo-500" size={32} />
            Staff & Permissions
          </h1>
          <p className="text-slate-400">Manage POS login credentials for all branches. Users created here can log into POS.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={20} /> Add New Staff
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-slate-800 border border-dashed border-slate-600 rounded-2xl p-16 text-center">
          <Users size={64} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-400 mb-2">No Staff Found</h3>
          <p className="text-slate-500 mb-6">Add your first cashier or manager to get started.</p>
          <button onClick={() => openModal()} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-3 rounded-xl font-bold transition-all">
            <Plus size={18} className="inline mr-2" />Add First Staff Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const branch = branches.find(b => b.id === user.store_id);
            const roleName = user.role?.name || 'Unknown';
            return (
              <div key={user.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-indigo-500/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xl font-black text-indigo-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{user.name}</h3>
                      <div className="flex gap-2 text-sm mt-1 items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(roleName)}`}>{roleName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(user)} className="p-2 bg-slate-700 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(user)} className="p-2 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-20">Phone:</span>
                    <span className="font-mono text-slate-200">{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-20">PIN:</span>
                    <span className="font-mono text-slate-400 tracking-widest">••••</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-20">Branch:</span>
                    <span className="text-indigo-400 font-bold">{branch ? branch.name : '🏢 Head Office'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.module_permissions && Object.entries(user.module_permissions).map(([key, val]) => {
                    if (val) {
                      const mod = MODULES.find(m => m.id === key);
                      return (
                         <span key={key} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-slate-600 uppercase">
                          {mod ? mod.label : key}
                        </span>
                      )
                    }
                    return null;
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold">{editingUser ? (activeTab === 'rider' ? 'Edit Rider' : 'Edit Staff') : 'Add New Staff'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            {!editingUser && (
              <div className="flex border-b border-slate-700 shrink-0">
                <button 
                  onClick={() => setActiveTab('staff')}
                  className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'staff' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                  STAFF
                </button>
                <button 
                  onClick={() => setActiveTab('rider')}
                  className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'rider' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                  RIDERS
                </button>
              </div>
            )}

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. Ali Cashier" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Phone (Login ID) *</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                    placeholder="e.g. 03000000001" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Photo URL (Optional for Our Staff section)</label>
                <div className="flex gap-2">
                  <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                    placeholder="https://example.com/photo.jpg" />
                  <label className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload size={18} /> Browse
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {activeTab === 'staff' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Role *</label>
                    <select value={roleId} onChange={e => setRoleId(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500">
                      <option value={0} disabled>Select Role...</option>
                      {roles.filter(r => r.name.toLowerCase() !== 'rider').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">
                      PIN / Password {editingUser ? '(leave blank to keep)' : '*'}
                    </label>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 tracking-widest"
                      placeholder="e.g. 1234" />
                  </div>
                </div>
              )}

              {activeTab === 'rider' && (
                <>
                  <div className="pt-4 mt-2 border-t border-slate-700">
                    <h3 className="text-sm font-bold text-indigo-400 mb-4">Rider Details</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Vehicle Type</label>
                        <select value={riderDetails.vehicle_type} onChange={e => setRiderDetails({...riderDetails, vehicle_type: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500">
                          <option value="">Select...</option>
                          <option value="Bicycle">Bicycle</option>
                          <option value="Motorbike">Motorbike</option>
                          <option value="Car">Car</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Registration No.</label>
                        <input type="text" value={riderDetails.registration_no} onChange={e => setRiderDetails({...riderDetails, registration_no: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                          placeholder="e.g. 6WED2098" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">License Plate No.</label>
                        <input type="text" value={riderDetails.license_plate} onChange={e => setRiderDetails({...riderDetails, license_plate: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                          placeholder="e.g. 6WED2098" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Date of Birth</label>
                        <input type="date" value={riderDetails.dob} onChange={e => setRiderDetails({...riderDetails, dob: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">City</label>
                        <input type="text" value={riderDetails.city} onChange={e => setRiderDetails({...riderDetails, city: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                          placeholder="City name" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Color</label>
                        <input type="text" value={riderDetails.color} onChange={e => setRiderDetails({...riderDetails, color: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                          placeholder="e.g. Red" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">
                      PIN / Password {editingUser ? '(leave blank to keep)' : '*'}
                    </label>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 tracking-widest"
                      placeholder="e.g. 1234" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Assign to Branch *</label>
                <select value={storeId ?? ''} onChange={e => setStoreId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500">
                  <option value="">🏢 Head Office (All Branches)</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  💡 POS will only show menu items assigned to the selected branch.
                </p>
              </div>

              {activeTab === 'staff' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-3">Module Permissions (Access Control)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {MODULES.filter(m => m.id !== 'rider').map(mod => (
                      <div 
                        key={mod.id}
                        onClick={() => setPermissions(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${permissions[mod.id] ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${permissions[mod.id] ? 'bg-indigo-500 text-white' : 'bg-slate-800'}`}>
                          {permissions[mod.id] && <Check size={14} />}
                        </div>
                        <span className="font-bold text-xs">{mod.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 text-xs text-slate-400">
                <strong className="text-slate-300">🔐 Login Info:</strong> Staff will login to POS using their <strong>Phone</strong> as username and <strong>PIN</strong> as password.
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-3 font-bold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-2">
                <Check size={20} /> {saving ? 'Saving...' : (editingUser ? 'Update User' : 'Create & Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
