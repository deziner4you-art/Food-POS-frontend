import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, Plus, Trash2, Award, X, Phone, User as UserIcon, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import { useAdminContext } from '../context/AdminContext';
import { customConfirm } from '../utils/alerts';

export default function CustomersManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { activeBrandId, selectedBranchId } = useAdminContext();

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: 0, name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = () => {
    if (!activeBrandId) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let url = `/customers?brand_id=${activeBrandId}`;
    if (selectedBranchId) {
      url += `&store_id=${selectedBranchId}`;
    }
    apiFetch(url)
      .then(res => res.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load customers');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeBrandId, selectedBranchId]);

  const handleOpenCreate = () => {
    setFormData({ id: 0, name: '', phone: '', address: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (customer: any) => {
    setFormData({
      id: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!(await customConfirm('Are you sure you want to delete this customer?'))) return;
    try {
      const res = await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Customer deleted');
        fetchCustomers();
      } else {
        toast.error('Failed to delete customer');
      }
    } catch (e) {
      toast.error('Error deleting customer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      return toast.error('Name and Phone are required');
    }
    setSubmitting(true);
    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `/customers/${formData.id}` : `/customers`;
      const bodyData = isEditing
        ? { name: formData.name, address: formData.address }
        : { brand_id: activeBrandId || 1, name: formData.name, phone: formData.phone, address: formData.address };

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isEditing ? 'Customer updated' : 'Customer created');
        setShowModal(false);
        fetchCustomers();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (e) {
      toast.error('Network error saving customer');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone?.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Users className="text-[#3b82f6] w-8 h-8" />
            CRM & Loyalty
          </h1>
          <p className="text-slate-400 mt-1">Manage customers and loyalty profiles</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-[#3b82f6] outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4 rounded-tl-xl">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Loyalty Points</th>
                  <th className="p-4 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{customer.name}</div>
                      <div className="text-[10px] text-slate-500">Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{customer.phone}</td>
                    <td className="p-4 max-w-[200px] truncate" title={customer.address}>{customer.address || '-'}</td>
                    <td className="p-4">
                      <span className="bg-slate-700 text-white px-2.5 py-1 rounded-md text-xs font-bold">{customer.total_orders || 0}</span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[#fbbf24] font-black bg-[#fbbf24]/10 px-3 py-1 rounded-full w-fit">
                        <Award className="w-4 h-4" />
                        {customer.loyalty_points || 0} pts
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(customer)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors" 
                        title="Edit Customer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-400 transition-colors" 
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No customers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Customer Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="03001234567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    rows={3}
                    placeholder="Customer delivery address..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
