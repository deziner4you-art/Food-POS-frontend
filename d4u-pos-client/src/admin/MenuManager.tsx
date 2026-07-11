import React, { useState, useEffect } from 'react';
import { ListTree, Plus, Edit, Trash2, Tag, Utensils } from 'lucide-react';

const BACKEND_URL = 'http://' + (typeof window !== 'undefined' ? window.location.hostname : 'localhost') + ':3001';

export default function MenuManager() {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'PRODUCTS'>('CATEGORIES');
  
  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ id: 0, name: '', price: 0, category_id: 0, sku: '', image_url: '' });
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/categories?store_id=1`);
      if (res.ok) setCategories(await res.json());
    } catch (e) {
      console.error('Failed to fetch categories', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/products?store_id=1`);
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Category Handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: 1, name: categoryName })
      });
      if (res.ok) {
        setShowCategoryModal(false);
        setCategoryName('');
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Product Handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = isEditingProduct ? 'PATCH' : 'POST';
      const url = isEditingProduct ? `${BACKEND_URL}/catalog/products/${productForm.id}` : `${BACKEND_URL}/catalog/products`;
      
      const payload = isEditingProduct 
        ? { name: productForm.name, price: productForm.price, category_id: productForm.category_id, sku: productForm.sku, image_url: productForm.image_url }
        : { store_id: 1, name: productForm.name, price: productForm.price, category_id: productForm.category_id, sku: productForm.sku, image_url: productForm.image_url, cost: 0, margin_pct: 100, status: 'APPROVED' };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowProductModal(false);
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Delete this product? It will be hidden from POS.')) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveProduct = async (id: number) => {
    try {
      await fetch(`${BACKEND_URL}/catalog/products/${id}/approve`, { method: 'PATCH' });
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-160px)]">
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'CATEGORIES' ? 'bg-[#3b82f6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Tag size={18} /> Menu Categories
        </button>
        <button 
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-[#3b82f6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Utensils size={18} /> Menu Products
        </button>
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
        {/* CATEGORIES TAB */}
        {activeTab === 'CATEGORIES' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ListTree className="text-[#3b82f6]" /> Categories
              </h3>
              <button 
                onClick={() => { setCategoryName(''); setShowCategoryModal(true); }}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Plus size={18} /> Add Category
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(c => (
                  <div key={c.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-white text-lg">{c.name}</span>
                  </div>
                ))}
                {categories.length === 0 && <p className="text-slate-500">No categories found.</p>}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'PRODUCTS' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Utensils className="text-[#3b82f6]" /> Products (Menu Items)
              </h3>
              <button 
                onClick={() => { setProductForm({ id: 0, name: '', price: 0, category_id: categories[0]?.id || 0, sku: '', image_url: '' }); setIsEditingProduct(false); setShowProductModal(true); }}
                className="flex items-center gap-2 bg-[#fbbf24] hover:bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Plus size={18} /> Add Custom Product
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                      <td className="p-4 font-bold text-white">{p.name}</td>
                      <td className="p-4 font-mono text-slate-400">{p.sku || '-'}</td>
                      <td className="p-4"><span className="bg-slate-700 px-2 py-1 rounded text-xs">{p.category?.name}</span></td>
                      <td className="p-4 font-mono font-bold text-[#4edea3]">Rs. {p.price}</td>
                      <td className="p-4">
                        {p.status === 'PENDING' ? (
                          <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-bold animate-pulse">PENDING APPROVAL</span>
                        ) : (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">APPROVED</span>
                        )}
                      </td>
                      <td className="p-4 flex justify-end gap-3 items-center">
                        {p.status === 'PENDING' && (
                          <button onClick={() => handleApproveProduct(p.id)} className="bg-[#fbbf24] hover:bg-yellow-500 text-black px-3 py-1 rounded font-bold text-xs transition-colors">
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => { setProductForm({ id: p.id, name: p.name, price: p.price, category_id: p.category_id, sku: p.sku || '', image_url: p.image_url || '' }); setIsEditingProduct(true); setShowProductModal(true); }} 
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">Add Category</h3>
            <form onSubmit={handleCategorySubmit}>
              <label className="block text-xs font-bold text-slate-400 mb-1">Category Name</label>
              <input 
                required type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#3b82f6] hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-0 w-full max-w-[500px] animate-scale-up overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#1e293b] flex justify-between items-center bg-[#0f172a]">
              <h3 className="text-[1.2rem] font-bold text-white m-0 flex items-center gap-2">
                <Plus size={20} className="text-[#fbbf24]" /> {isEditingProduct ? 'Edit Product' : 'Add Custom Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-white"><Trash2 size={18} style={{display:'none'}}/><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-[0.9rem] font-bold text-slate-400 mb-1">Product Name</label>
                  <input 
                    required type="text" placeholder="Enter Product Name"
                    value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-3 text-white focus:outline-none focus:border-[#fbbf24]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.9rem] font-bold text-slate-400 mb-1">Price (Rs.)</label>
                    <input 
                      required type="number" placeholder="e.g. 500"
                      value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-3 text-white font-mono focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.9rem] font-bold text-slate-400 mb-1">Product Code / SKU</label>
                    <input 
                      type="text" placeholder="e.g. B-102"
                      value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-3 text-white focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[0.9rem] font-bold text-slate-400 mb-1">Category</label>
                  <select 
                    required value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: parseInt(e.target.value)})}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-3 text-white focus:outline-none focus:border-[#fbbf24]"
                  >
                    <option value={0} disabled>Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[0.9rem] font-bold text-slate-400 mb-1">Product Image</label>
                  <div className="flex gap-2 items-center">
                    <div className="bg-[#334155] text-white px-4 py-2 rounded text-[0.85rem] cursor-not-allowed opacity-50">Browse Picture...</div>
                    {productForm.image_url && <img src={productForm.image_url} alt="Preview" className="w-10 h-10 object-cover rounded border border-[#334155]" />}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 p-4 bg-[#1e293b] border border-[#334155] text-white font-bold rounded-md hover:bg-slate-700 uppercase">CANCEL</button>
                  <button type="submit" className="flex-[2] p-4 bg-[#fbbf24] hover:bg-yellow-500 text-black font-bold rounded-md uppercase border-none">
                    {isEditingProduct ? 'UPDATE PRODUCT' : 'CREATE CUSTOM PRODUCT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
