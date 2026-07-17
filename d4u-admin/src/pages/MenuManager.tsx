import React, { useState, useEffect } from 'react';
import { ListTree, Plus, Edit, Trash2, Tag, Utensils, Store } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function MenuManager() {
  const [activeTab, setActiveTab] = useState<'MENUS' | 'CATEGORIES' | 'PRODUCTS'>('MENUS');
  
  const [stores, setStores] = useState<any[]>([]);

  // Menus State
  const [menus, setMenus] = useState<any[]>([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({ id: 0, name: '', store_ids: [] as number[] });

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: 0, name: '', menu_id: 0, store_ids: [] as number[] });

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({ id: 0, name: '', price: 0, category_ids: [] as number[], sku: '', image_url: '', assigned_store_ids: [] as number[], hasVariants: false, variants: [] as {name: string, price: number}[] });
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productFilterCategoryId, setProductFilterCategoryId] = useState<number>(0);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const fetchAll = async () => {
    try {
      const [stRes, mnRes, ctRes, prRes] = await Promise.all([
        fetch(`${BACKEND_URL}/stores`),
        fetch(`${BACKEND_URL}/catalog/menus`),
        fetch(`${BACKEND_URL}/catalog/categories`),
        fetch(`${BACKEND_URL}/catalog/products`)
      ]);
      if (stRes.ok) setStores(await stRes.json());
      if (mnRes.ok) setMenus(await mnRes.json());
      if (ctRes.ok) setCategories(await ctRes.json());
      if (prRes.ok) setProducts(await prRes.json());
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Menu Handlers
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = menuForm.id ? 'PATCH' : 'POST';
    const url = menuForm.id ? `${BACKEND_URL}/catalog/menus/${menuForm.id}` : `${BACKEND_URL}/catalog/menus`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: menuForm.name, store_ids: menuForm.store_ids })
      });
      if (res.ok) {
        setShowMenuModal(false);
        fetchAll();
      }
    } catch (e) { console.error(e); }
  };

  // Category Handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = categoryForm.id ? 'PATCH' : 'POST';
    const url = categoryForm.id ? `${BACKEND_URL}/catalog/categories/${categoryForm.id}` : `${BACKEND_URL}/catalog/categories`;
    try {
      const payload = { 
        store_id: 1, 
        name: categoryForm.name, 
        menu_id: categoryForm.menu_id > 0 ? categoryForm.menu_id : null,
        store_ids: categoryForm.store_ids 
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCategoryModal(false);
        fetchAll();
      }
    } catch (e) { console.error(e); }
  };

  // Product Handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productForm.category_ids.length === 0) return customAlert('Please select at least one category');
    try {
      const method = isEditingProduct ? 'PATCH' : 'POST';
      const url = isEditingProduct ? `${BACKEND_URL}/catalog/products/${productForm.id}` : `${BACKEND_URL}/catalog/products`;
      
      const payload = isEditingProduct 
        ? { name: productForm.name, price: productForm.price, category_ids: productForm.category_ids, sku: productForm.sku, image_url: productForm.image_url, variants: productForm.hasVariants ? productForm.variants : [] }
        : { store_id: 1, name: productForm.name, price: productForm.price, category_ids: productForm.category_ids, sku: productForm.sku, image_url: productForm.image_url, cost: 0, margin_pct: 100, status: 'APPROVED', variants: productForm.hasVariants ? productForm.variants : [] };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setProductForm({ id: 0, name: '', price: 0, category_ids: [], sku: '', image_url: '', assigned_store_ids: [], hasVariants: false, variants: [] });
        setIsEditingProduct(false);
        fetchAll();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!(await customConfirm('Delete this product?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/products/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!(await customConfirm('Delete this menu collection?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/menus/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleDuplicateMenu = async (id: number) => {
    if (!(await customConfirm('Create a duplicate copy of this menu collection?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/menus/${id}/duplicate`, { method: 'POST' });
      fetchAll();
      customSuccess('Menu duplicated successfully');
    } catch (e) { console.error(e); }
  };

  const handleStoreToggle = (storeId: number, currentList: number[], setter: (val: number[]) => void) => {
    if (currentList.includes(storeId)) setter(currentList.filter(id => id !== storeId));
    else setter([...currentList, storeId]);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-160px)]">
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('MENUS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'MENUS' ? 'bg-[#3b82f6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Store size={18} /> Menu Collections
        </button>
        <button 
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'CATEGORIES' ? 'bg-[#3b82f6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Tag size={18} /> Categories
        </button>
        <button 
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'PRODUCTS' ? 'bg-[#3b82f6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Utensils size={18} /> Products
        </button>
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
        
        {/* MENUS TAB */}
        {activeTab === 'MENUS' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Store className="text-[#3b82f6]" /> Menu Collections (Branch Wise)
              </h3>
              <button 
                onClick={() => { setMenuForm({ id: 0, name: '', store_ids: [] }); setShowMenuModal(true); }}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Plus size={18} /> Create Menu Collection
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menus.map(m => (
                  <div key={m.id} className="bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white text-lg">{m.name}</h4>
                      <div className="flex gap-2">
                        <button onClick={() => handleDuplicateMenu(m.id)} className="text-purple-400 hover:text-purple-300 mr-2 flex items-center gap-1" title="Duplicate Menu">
                          <Plus size={16}/> Copy
                        </button>
                        <button onClick={() => { setMenuForm({ id: m.id, name: m.name, store_ids: m.stores.map((s:any)=>s.id) }); setShowMenuModal(true); }} className="text-slate-400 hover:text-white"><Edit size={16}/></button>
                        <button onClick={() => handleDeleteMenu(m.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      <strong>Assigned Branches:</strong><br/>
                      {m.stores.length > 0 ? m.stores.map((s:any) => s.name).join(', ') : <span className="text-slate-500 italic">None</span>}
                    </div>
                    <div className="text-sm text-slate-400">
                      <strong>Categories:</strong> {m.categories?.length || 0}
                    </div>
                  </div>
                ))}
                {menus.length === 0 && <p className="text-slate-500 col-span-full text-center p-8">No menu collections found. Create one to assign to branches.</p>}
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'CATEGORIES' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ListTree className="text-[#3b82f6]" /> Menu Categories
              </h3>
              <button 
                onClick={() => { setCategoryForm({ id: 0, name: '', menu_id: 0, store_ids: [] }); setShowCategoryModal(true); }}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Plus size={18} /> Add Category
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(c => (
                  <div key={c.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col gap-2 relative group">
                    <span className="font-bold text-white text-lg">{c.name}</span>
                    <span className="text-xs text-slate-400">Menu: {c.menu?.name || 'Unassigned'}</span>
                    <button onClick={() => { setCategoryForm({ id: c.id, name: c.name, menu_id: c.menu_id || 0, store_ids: c.assigned_stores.map((s:any)=>s.id) }); setShowCategoryModal(true); }} className="absolute top-4 right-4 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all"><Edit size={16}/></button>
                  </div>
                ))}
                {categories.length === 0 && <p className="text-slate-500 col-span-full">No categories found.</p>}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'PRODUCTS' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Utensils className="text-[#3b82f6]" /> Products (Menu Items)
              </h3>
            </div>

            {/* Horizontal Add Custom Product Form */}
            <div className="bg-slate-900 border-b border-slate-700 p-4 flex flex-col gap-4">
              <form onSubmit={handleProductSubmit} className="flex flex-col gap-3 w-full">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 mb-1">Product Name</label>
                    <input 
                      required type="text" placeholder="Enter Product Name"
                      value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 mb-1">SKU</label>
                    <input 
                      type="text" placeholder="e.g. B-102"
                      value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>

                  <div className="flex-[1.5] relative">
                    <label className="block text-xs font-bold text-slate-400 mb-1">Categories (Select Multiple)</label>
                    <div 
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm cursor-pointer flex justify-between items-center h-[38px]"
                    >
                      <span className="truncate pr-2">
                        {productForm.category_ids.length > 0 
                          ? `${productForm.category_ids.length} Selected` 
                          : 'Select Categories...'}
                      </span>
                      <span className="text-slate-400 text-xs">▼</span>
                    </div>
                    {isCategoryDropdownOpen && (
                      <div className="absolute top-[60px] left-0 w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm max-h-48 overflow-y-auto flex flex-col gap-1 z-50 shadow-xl">
                        {categories.map(c => (
                          <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-1.5 rounded">
                            <input 
                              type="checkbox" 
                              checked={productForm.category_ids.includes(c.id)}
                              onChange={(e) => {
                                if (e.target.checked) setProductForm({...productForm, category_ids: [...productForm.category_ids, c.id]});
                                else setProductForm({...productForm, category_ids: productForm.category_ids.filter(id => id !== c.id)});
                              }}
                              className="accent-[#fbbf24] w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 mb-1">Price (Rs.)</label>
                    <input 
                      required type="number" placeholder="e.g. 500"
                      value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-[#4edea3] font-mono font-bold text-sm focus:outline-none focus:border-[#fbbf24] h-[38px]"
                    />
                  </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <button type="submit" className="w-full bg-[#fbbf24] hover:bg-yellow-500 text-slate-900 rounded-md p-2 font-bold text-sm transition-colors flex items-center justify-center gap-2 h-[38px]">
                        <Plus size={16} /> {isEditingProduct ? 'Update' : 'Add'}
                      </button>
                      {isEditingProduct && (
                        <button type="button" onClick={() => { setProductForm({ id: 0, name: '', price: 0, category_ids: [], sku: '', image_url: '', assigned_store_ids: [], hasVariants: false, variants: [] }); setIsEditingProduct(false); }} className="w-full mt-1 text-xs text-slate-400 hover:text-white">Cancel Edit</button>
                      )}
                    </div>
                  </div>

                  {/* Variants Section */}
                  <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <input 
                        type="checkbox" 
                        checked={productForm.hasVariants}
                        onChange={e => setProductForm({...productForm, hasVariants: e.target.checked, variants: e.target.checked && productForm.variants.length === 0 ? [{name: 'Small', price: 0}] : productForm.variants})}
                        className="w-4 h-4 accent-[#fbbf24] cursor-pointer"
                        id="hasVariantsToggle"
                      />
                      <label htmlFor="hasVariantsToggle" className="text-sm font-bold text-white cursor-pointer">Has Variants (e.g., Pizza Sizes)</label>
                    </div>

                    {productForm.hasVariants && (
                      <div className="flex flex-col gap-2">
                        {productForm.variants.map((v: any, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input 
                              type="text" placeholder="Size (e.g. Medium)" 
                              value={v.name} onChange={e => { const nv = [...productForm.variants]; nv[idx].name = e.target.value; setProductForm({...productForm, variants: nv}) }}
                              className="bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:border-[#fbbf24] flex-1"
                            />
                            <input 
                              type="number" placeholder="Price" 
                              value={v.price || ''} onChange={e => { const nv = [...productForm.variants]; nv[idx].price = parseFloat(e.target.value) || 0; setProductForm({...productForm, variants: nv}) }}
                              className="bg-[#1e293b] border border-[#334155] rounded-md p-2 text-[#4edea3] font-mono font-bold text-sm focus:border-[#fbbf24] w-24"
                            />
                            <button type="button" onClick={() => { const nv = productForm.variants.filter((_: any, i: number) => i !== idx); setProductForm({...productForm, variants: nv}); }} className="text-red-400 p-2 hover:bg-red-400/10 rounded-md">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setProductForm({...productForm, variants: [...productForm.variants, {name: '', price: 0}]})} className="text-xs text-[#fbbf24] flex items-center gap-1 mt-1 font-bold w-max hover:underline">
                          <Plus size={14} /> Add Size Variant
                        </button>
                      </div>
                    )}
                  </div>
              </form>
            </div>

            {/* Filter */}
            <div className="bg-slate-900 border-b border-slate-700 p-3 flex items-center justify-between">
              <span className="text-sm font-bold text-white px-2">Total Products: {products.length}</span>
              <select 
                value={productFilterCategoryId} 
                onChange={e => setProductFilterCategoryId(parseInt(e.target.value))}
                className="bg-[#1e293b] border border-[#334155] rounded-md p-1.5 text-white text-sm focus:outline-none focus:border-[#fbbf24] w-64"
              >
                <option value={0}>All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Categories</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => productFilterCategoryId === 0 || p.categories?.some((c:any) => c.id === productFilterCategoryId)).map(p => (
                    <tr key={p.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                      <td className="p-4 font-bold text-white">{p.name}</td>
                      <td className="p-4 font-mono text-slate-400">{p.sku || '-'}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.categories?.map((c:any) => (
                            <span key={c.id} className="bg-slate-700 px-2 py-1 rounded text-xs">{c.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#4edea3]">{p.variants?.length > 0 ? `${p.variants.length} Variants` : `Rs. ${p.price}`}</td>
                      <td className="p-4 flex justify-end gap-3 items-center">
                        <button 
                          onClick={() => { setProductForm({ id: p.id, name: p.name, price: p.price, category_ids: p.categories?.map((c:any) => c.id) || [], sku: p.sku || '', image_url: p.image_url || '', assigned_store_ids: p.assigned_stores?.map((s:any) => s.id) || [], hasVariants: p.variants && p.variants.length > 0, variants: p.variants ? p.variants.map((v:any) => ({name: v.name, price: v.price})) : [] }); setIsEditingProduct(true); }} 
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
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">{menuForm.id ? 'Edit Menu Collection' : 'Create Menu Collection'}</h3>
            <form onSubmit={handleMenuSubmit}>
              <label className="block text-xs font-bold text-slate-400 mb-1">Collection Name</label>
              <input 
                required type="text" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
                placeholder="e.g. Main Branch Menu"
              />
              <label className="block text-xs font-bold text-slate-400 mb-2">Assign to Branches:</label>
              <div className="flex flex-col gap-2 mb-6 max-h-40 overflow-y-auto">
                {stores.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer text-sm text-white">
                    <input 
                      type="checkbox" 
                      checked={menuForm.store_ids.includes(s.id)}
                      onChange={() => handleStoreToggle(s.id, menuForm.store_ids, (ids) => setMenuForm({...menuForm, store_ids: ids}))}
                      className="accent-[#3b82f6] w-4 h-4 cursor-pointer"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowMenuModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#3b82f6] hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">{categoryForm.id ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleCategorySubmit}>
              <label className="block text-xs font-bold text-slate-400 mb-1">Category Name</label>
              <input 
                required type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
              />
              <label className="block text-xs font-bold text-slate-400 mb-1">Belongs to Menu Collection (Optional)</label>
              <select 
                value={categoryForm.menu_id} onChange={e => setCategoryForm({...categoryForm, menu_id: parseInt(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
              >
                <option value={0}>None</option>
                {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#3b82f6] hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals End Here */}

    </div>
  );
}
