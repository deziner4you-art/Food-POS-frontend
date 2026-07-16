import React, { useState, useEffect } from 'react';
import { Users, Search, Edit2, Wallet, Plus, Minus, History, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function CustomersManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // A hypothetical brand_id = 1 for now, or fetch all if not restricted
  const brandId = 1;

  const fetchCustomers = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/customers?brand_id=${brandId}`)
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
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
  }, []);

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
          <p className="text-slate-400 mt-1">Manage customers and loyalty points</p>
        </div>
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
                  <th className="p-4 rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{customer.name}</div>
                      <div className="text-[10px] text-slate-500">Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-mono">{customer.phone}</td>
                    <td className="p-4 max-w-[200px] truncate" title={customer.address}>{customer.address || '-'}</td>
                    <td className="p-4">
                      <span className="bg-slate-700 text-white px-2 py-1 rounded-md text-xs font-bold">{customer.total_orders}</span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-[#fbbf24] font-black bg-[#fbbf24]/10 px-3 py-1 rounded-full w-fit">
                        <Award className="w-4 h-4" />
                        {customer.loyalty_points} pts
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors" title="Manage Customer">
                        <Edit2 className="w-4 h-4" />
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
    </div>
  );
}
