import React, { useState, useEffect, useRef } from 'react';
import { ListTree, Plus, Edit, Trash2, Tag, Utensils, Store } from 'lucide-react';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function MenuManager() {
  const [activeTab, setActiveTab] = useState<'MENUS' | 'CATEGORIES' | 'PRODUCTS' | 'EXTRA_TOPPINGS' | 'ADD_ONS'>('MENUS');
  
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
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        ? { name: productForm.name, price: parseFloat(productForm.price as any) || 0, category_ids: productForm.category_ids, sku: productForm.sku, image_url: productForm.image_url, status: 'APPROVED', variants: productForm.hasVariants ? productForm.variants : [] }
        : { store_id: 1, name: productForm.name, price: parseFloat(productForm.price as any) || 0, category_ids: productForm.category_ids, sku: productForm.sku, image_url: productForm.image_url, cost: 0, margin_pct: 100, status: 'APPROVED', variants: productForm.hasVariants ? productForm.variants : [] };
      
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

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) return customAlert('Please select items to delete');
    if (!(await customConfirm(`Delete ${selectedProducts.length} selected items?`))) return;
    try {
      await Promise.all(selectedProducts.map(id => 
        fetch(`${BACKEND_URL}/catalog/products/${id}`, { method: 'DELETE' })
      ));
      setSelectedProducts([]);
      fetchAll();
      customSuccess('Selected items deleted');
    } catch (e) {
      console.error(e);
      customAlert('Error deleting some items');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!(await customConfirm('Are you sure you want to delete this category?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/categories/${id}`, { method: 'DELETE' });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) return customAlert('Please select items to delete');
    if (!(await customConfirm(`Delete ${selectedCategories.length} selected categories?`))) return;
    try {
      await Promise.all(selectedCategories.map(id => 
        fetch(`${BACKEND_URL}/catalog/categories/${id}`, { method: 'DELETE' })
      ));
      setSelectedCategories([]);
      fetchAll();
      customSuccess('Selected categories deleted');
    } catch (e) {
      console.error(e);
      customAlert('Error deleting some categories');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setter(data.imageUrl);
          customSuccess('Image uploaded successfully!');
        }
      }
    } catch (err) {
      console.error('Upload failed', err);
      customError('Failed to upload image.');
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!(await customConfirm('Delete this menu collection? Menu k sath is ki jitni cheezein (categories, products, toppings, add-ons) thi wo bhi remove hoo gi.'))) return;
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

  const ensureCategoryExists = async (name: string) => {
    let cat = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (cat) return cat.id;
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: 1, name: name, store_ids: [1] }) // Default to store 1
      });
      if (res.ok) {
        const newCat = await res.json();
        await fetchAll();
        return newCat.id;
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const handleQuickAdd = async (name: string, price: number, categoryName: string) => {
    if (!name || price < 0) return customAlert('Please enter valid name and price');
    const catId = await ensureCategoryExists(categoryName);
    if (!catId) return customAlert(`Failed to find or create ${categoryName} category`);
    
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: 1, name, price, category_ids: [catId], sku: '', image_url: '', cost: 0, margin_pct: 100, status: 'APPROVED', variants: [] })
      });
      if (res.ok) {
        customSuccess(`${name} added to ${categoryName}!`);
        fetchAll();
      }
    } catch (e) { console.error(e); }
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
        <button 
          onClick={() => setActiveTab('EXTRA_TOPPINGS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'EXTRA_TOPPINGS' ? 'bg-[#3b82f6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Plus size={18} /> Extra Toppings
        </button>
        <button 
          onClick={() => setActiveTab('ADD_ONS')}
          className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'ADD_ONS' ? 'bg-[#3b82f6] text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Plus size={18} /> Add-ons
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
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
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
            
            <div className="bg-slate-900 border-b border-slate-700 p-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-white px-2">Total Categories: {categories.length}</span>
                {selectedCategories.length > 0 && (
                  <button 
                    onClick={handleBulkDeleteCategories}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                  >
                    <Trash2 size={14} /> Delete Selected ({selectedCategories.length})
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-xs uppercase font-bold text-slate-400 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        className="accent-[#fbbf24] cursor-pointer"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCategories(categories.map(c => c.id));
                          else setSelectedCategories([]);
                        }}
                        checked={selectedCategories.length > 0 && selectedCategories.length === categories.length}
                      />
                    </th>
                    <th className="p-4">Category Name</th>
                    <th className="p-4">Menu</th>
                    <th className="p-4">Assigned Branches</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} className={`border-t border-slate-700/50 hover:bg-slate-700/20 ${selectedCategories.includes(c.id) ? 'bg-[#fbbf24]/10' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="accent-[#fbbf24] cursor-pointer"
                          checked={selectedCategories.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCategories([...selectedCategories, c.id]);
                            else setSelectedCategories(selectedCategories.filter(id => id !== c.id));
                          }}
                        />
                      </td>
                      <td className="p-4 font-bold text-white">{c.name}</td>
                      <td className="p-4 text-slate-400 text-sm">{c.menu?.name || 'Unassigned'}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {c.assigned_stores?.map((s:any) => (
                            <span key={s.id} className="bg-slate-700 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">{s.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 flex justify-end gap-3 items-center">
                        <button 
                          onClick={() => { setCategoryForm({ id: c.id, name: c.name, menu_id: c.menu_id || 0, store_ids: c.assigned_stores.map((s:any)=>s.id) }); setShowCategoryModal(true); }}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-300 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No categories found.</td></tr>
                  )}
                </tbody>
              </table>
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

                  <div className="flex-[1.5] relative" ref={categoryDropdownRef}>
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
                    required={!productForm.hasVariants} type="number" placeholder="e.g. 500"
                    value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                    disabled={productForm.hasVariants}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-[#4edea3] font-mono font-bold text-sm focus:outline-none focus:border-[#fbbf24] h-[38px] disabled:opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Image</label>
                  <div className="flex gap-2 items-center">
                    <label className="bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm cursor-pointer hover:bg-slate-700 h-[38px] flex items-center justify-center flex-1 whitespace-nowrap">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setProductForm({...productForm, image_url: url}))} />
                      <span className="truncate">{productForm.image_url ? 'Change Image' : 'Browse'}</span>
                    </label>
                    {productForm.image_url && <img src={`${BACKEND_URL}${productForm.image_url}`} alt="Preview" className="w-9 h-9 rounded-md object-cover border border-[#334155]" />}
                  </div>
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
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-white px-2">Total Products: {products.length}</span>
                {selectedProducts.length > 0 && (
                  <button 
                    onClick={handleBulkDeleteProducts}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                  >
                    <Trash2 size={14} /> Delete Selected ({selectedProducts.length})
                  </button>
                )}
              </div>
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
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        className="accent-[#fbbf24] cursor-pointer"
                        onChange={(e) => {
                          const filtered = products.filter(p => productFilterCategoryId === 0 || p.categories?.some((c:any) => c.id === productFilterCategoryId));
                          if (e.target.checked) {
                            setSelectedProducts(filtered.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                        checked={selectedProducts.length > 0 && selectedProducts.length === products.filter(p => productFilterCategoryId === 0 || p.categories?.some((c:any) => c.id === productFilterCategoryId)).length}
                      />
                    </th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Categories</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => p.status === 'PENDING').length > 0 && (
                    <>
                      <tr>
                        <td colSpan={6} className="bg-amber-500/20 text-amber-400 font-bold p-3 text-xs uppercase tracking-wider">
                          Pending Approvals (From POS)
                        </td>
                      </tr>
                      {products.filter(p => p.status === 'PENDING').map(p => (
                        <tr key={p.id} className="border-t border-slate-700/50 bg-amber-500/5">
                          <td className="p-4">
                            <input type="checkbox" className="accent-[#fbbf24] cursor-pointer" checked={selectedProducts.includes(p.id)} onChange={(e) => { if (e.target.checked) setSelectedProducts([...selectedProducts, p.id]); else setSelectedProducts(selectedProducts.filter(id => id !== p.id)); }} />
                          </td>
                          <td className="p-4 font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            {p.name}
                          </td>
                          <td className="p-4 font-mono text-slate-400">{p.sku || '-'}</td>
                          <td className="p-4">
                            <span className="text-amber-400 text-xs italic">Needs Category Assignment</span>
                          </td>
                          <td className="p-4 font-mono font-bold text-[#4edea3]">Rs. {p.price}</td>
                          <td className="p-4 flex justify-end gap-3 items-center">
                            <button 
                              onClick={() => { setProductForm({ id: p.id, name: p.name, price: p.price, category_ids: [], sku: p.sku || '', image_url: p.image_url || '', assigned_store_ids: p.assigned_stores?.map((s:any) => s.id) || [], hasVariants: false, variants: [] }); setIsEditingProduct(true); customAlert('Please assign a category and verify details, then click Update to Approve.'); }} 
                              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1 rounded text-xs font-bold transition-colors"
                            >
                              Review & Approve
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={6} className="bg-slate-800 text-slate-400 font-bold p-3 text-xs uppercase tracking-wider">
                          Approved Products
                        </td>
                      </tr>
                    </>
                  )}

                  {products.filter(p => p.status !== 'PENDING' && (productFilterCategoryId === 0 || p.categories?.some((c:any) => c.id === productFilterCategoryId))).map(p => (
                    <tr key={p.id} className={`border-t border-slate-700/50 hover:bg-slate-700/20 ${selectedProducts.includes(p.id) ? 'bg-[#fbbf24]/10' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="accent-[#fbbf24] cursor-pointer"
                          checked={selectedProducts.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProducts([...selectedProducts, p.id]);
                            else setSelectedProducts(selectedProducts.filter(id => id !== p.id));
                          }}
                        />
                      </td>
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        {p.image_url ? (
                          <img src={`${BACKEND_URL}${p.image_url}`} alt={p.name} className="w-8 h-8 rounded object-cover border border-slate-600" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">No Img</div>
                        )}
                        {p.name}
                      </td>
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

        {/* EXTRA TOPPINGS TAB */}
        {activeTab === 'EXTRA_TOPPINGS' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-[#3b82f6]" /> Extra Toppings
              </h3>
            </div>
            <div className="bg-slate-900 border-b border-slate-700 p-4">
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                const form = e.currentTarget;
                const fd = new FormData(form);
                handleQuickAdd(fd.get('tname') as string, parseFloat(fd.get('tprice') as string), 'Extra Toppings').then(() => form.reset()); 
              }} className="flex gap-4 items-end max-w-lg">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Topping Name</label>
                  <input name="tname" required type="text" placeholder="e.g. Extra Cheese" className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Price (Rs.)</label>
                  <input name="tprice" required type="number" placeholder="50" className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-[#4edea3] font-mono text-sm" />
                </div>
                <button type="submit" className="bg-[#fbbf24] hover:bg-yellow-500 text-slate-900 rounded-md px-4 py-2 font-bold text-sm h-[38px] flex items-center gap-2">
                  <Plus size={16} /> Add
                </button>
              </form>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.filter(p => p.categories?.some((c:any) => c.name.toLowerCase() === 'extra toppings')).map(p => (
                  <div key={p.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col justify-between group relative">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-[#4edea3] font-mono text-xs">Rs. {p.price}</span>
                    <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  </div>
                ))}
                {products.filter(p => p.categories?.some((c:any) => c.name.toLowerCase() === 'extra toppings')).length === 0 && <p className="text-slate-500 col-span-full">No Extra Toppings found. Add one above.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ADD_ONS TAB */}
        {activeTab === 'ADD_ONS' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-[#3b82f6]" /> Add-ons
              </h3>
            </div>
            <div className="bg-slate-900 border-b border-slate-700 p-4">
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                const form = e.currentTarget;
                const fd = new FormData(form);
                handleQuickAdd(fd.get('aname') as string, parseFloat(fd.get('aprice') as string), 'Add-ons').then(() => form.reset()); 
              }} className="flex gap-4 items-end max-w-lg">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Add-on Name</label>
                  <input name="aname" required type="text" placeholder="e.g. Dip Sauce" className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Price (Rs.)</label>
                  <input name="aprice" required type="number" placeholder="50" className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-[#4edea3] font-mono text-sm" />
                </div>
                <button type="submit" className="bg-[#fbbf24] hover:bg-yellow-500 text-slate-900 rounded-md px-4 py-2 font-bold text-sm h-[38px] flex items-center gap-2">
                  <Plus size={16} /> Add
                </button>
              </form>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.filter(p => p.categories?.some((c:any) => c.name.toLowerCase() === 'add-ons' || c.name.toLowerCase() === 'addons')).map(p => (
                  <div key={p.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col justify-between group relative">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-[#4edea3] font-mono text-xs">Rs. {p.price}</span>
                    <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  </div>
                ))}
                {products.filter(p => p.categories?.some((c:any) => c.name.toLowerCase() === 'add-ons' || c.name.toLowerCase() === 'addons')).length === 0 && <p className="text-slate-500 col-span-full">No Add-ons found. Add one above.</p>}
              </div>
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
              <label className="block text-xs font-bold text-slate-400 mb-1">Category Image (Optional)</label>
              <div className="flex gap-3 items-center mb-4">
                <label className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm cursor-pointer hover:bg-slate-800 flex-1 text-center whitespace-nowrap">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setCategoryForm({...categoryForm, image_url: url}))} />
                  <span>{categoryForm.image_url ? 'Change Image' : 'Browse Image'}</span>
                </label>
                {categoryForm.image_url && <img src={`${BACKEND_URL}${categoryForm.image_url}`} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />}
              </div>
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
