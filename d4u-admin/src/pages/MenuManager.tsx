import React, { useState, useEffect, useRef } from 'react';
import { ListTree, Plus, Edit, Trash2, Tag, Utensils, Store, Clock, Sliders, CheckCircle2, AlertCircle, ClipboardList, FileDown, FileUp } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { customAlert, customSuccess, customConfirm } from '../utils/alerts';
import ProductRequestsTab from './ProductRequestsTab';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';

export default function MenuManager() {
  const { selectedBranchId } = useAdminContext();
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}`
  });
  
  const getAuthHeaderOnly = () => ({
    'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}`
  });

  const [activeTab, setActiveTab] = useState<'MENUS' | 'CATEGORIES' | 'PRODUCTS' | 'MODIFIERS' | 'AVAILABILITY' | 'PRODUCT_REQUESTS'>('MENUS');
  
  const [stores, setStores] = useState<any[]>([]);

  // Menus State
  const [menus, setMenus] = useState<any[]>([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({ id: 0, name: '', store_ids: [] as number[] });

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: 0, name: '', menu_id: 0, store_ids: [] as number[], image_url: '', is_active: true, sort_order: 0 });

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<any[]>([]);
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);

  const initialProductForm = {
    id: 0,
    name: '',
    price: 0,
    cost: 0,
    description: '',
    category_ids: [] as number[],
    sku: '',
    barcode: '',
    image_url: '',
    thumbnail_url: '',
    tax_rate: 0,
    is_active: true,
    recipe_id: 0,
    availability_rule_id: 0,
    kitchen_station: 'Kitchen Main',
    printer_group: 'Hot Printer',
    kds_group: 'KDS Display 1',
    modifier_group_ids: [] as number[],
    assigned_store_ids: [] as number[],
    hasVariants: false,
    variants: [] as { name: string; price: number; cost: number; sku: string; barcode: string; recipe_id: number }[],
  };

  const [productForm, setProductForm] = useState(initialProductForm);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productFilterCategoryId, setProductFilterCategoryId] = useState<number>(0);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isModifierDropdownOpen, setIsModifierDropdownOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const modifierDropdownRef = useRef<HTMLDivElement>(null);

  // Modifiers State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ id: 0, name: '', is_required: false, min_selection: 0, max_selection: 1 });
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [modifierForm, setModifierForm] = useState({ id: 0, modifier_group_id: 0, name: '', additional_price: 0 });

  // Availability Rules State
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ id: 0, name: 'ALWAYS', type: 'ALWAYS', start_time: '09:00', end_time: '23:00', days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (modifierDropdownRef.current && !modifierDropdownRef.current.contains(event.target as Node)) {
        setIsModifierDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAll = async () => {
    try {
      const [stRes, mnRes, ctRes, prRes, rcRes, avRes, mgRes] = await Promise.all([
        fetch(`${BACKEND_URL}/stores`, { headers: getAuthHeaderOnly() }),
        fetch(`${BACKEND_URL}/catalog/menus`, { headers: getAuthHeaderOnly() }),
        fetch(`${BACKEND_URL}/catalog/categories?store_id=${selectedBranchId}`, { headers: getAuthHeaderOnly() }),
        fetch(`${BACKEND_URL}/catalog/products?store_id=${selectedBranchId}`, { headers: getAuthHeaderOnly() }),
        fetch(`${BACKEND_URL}/recipes/store/${selectedBranchId}`, { headers: getAuthHeaderOnly() }),
        fetch(`${BACKEND_URL}/catalog/availability-rules?store_id=${selectedBranchId}`, { headers: getAuthHeaderOnly() }),
        fetch(`${BACKEND_URL}/catalog/modifiers/groups?store_id=${selectedBranchId}`, { headers: getAuthHeaderOnly() })
      ]);
      if (stRes.ok) setStores(await stRes.json());
      if (mnRes.ok) setMenus(await mnRes.json());
      if (ctRes.ok) setCategories(await ctRes.json());
      if (prRes.ok) setProducts(await prRes.json());
      if (rcRes.ok) setRecipes(await rcRes.json());
      if (avRes.ok) setAvailabilityRules(await avRes.json());
      if (mgRes.ok) setModifierGroups(await mgRes.json());
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  useEffect(() => { fetchAll(); }, [selectedBranchId]);

  // Menu Handlers
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = menuForm.id ? 'PATCH' : 'POST';
    const url = menuForm.id ? `${BACKEND_URL}/catalog/menus/${menuForm.id}` : `${BACKEND_URL}/catalog/menus`;
    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ name: menuForm.name, store_ids: menuForm.store_ids })
      });
      if (res.ok) {
        setShowMenuModal(false);
        fetchAll();
        customSuccess('Menu saved successfully!');
      } else {
        const errorData = await res.json().catch(() => null);
        customAlert(errorData?.message || 'Failed to save menu.');
      }
    } catch (e) {
      customAlert('Network error while saving menu.');
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!(await customConfirm('Delete this menu collection?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/menus/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleDuplicateMenu = async (id: number) => {
    if (!(await customConfirm('Create a duplicate copy of this menu collection?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/menus/${id}/duplicate`, { method: 'POST', headers: getAuthHeaderOnly() });
      fetchAll();
      customSuccess('Menu duplicated successfully');
    } catch (e) { console.error(e); }
  };

  // Category Handlers
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = categoryForm.id ? 'PATCH' : 'POST';
    const url = categoryForm.id ? `${BACKEND_URL}/catalog/categories/${categoryForm.id}` : `${BACKEND_URL}/catalog/categories`;
    if (!selectedBranchId) return customAlert('Please select a branch first');
    try {
      const payload = { 
        store_id: selectedBranchId, 
        name: categoryForm.name, 
        menu_id: categoryForm.menu_id > 0 ? categoryForm.menu_id : null,
        store_ids: categoryForm.store_ids,
        is_active: categoryForm.is_active,
        sort_order: Number(categoryForm.sort_order),
        image_url: categoryForm.image_url
      };
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCategoryModal(false);
        fetchAll();
        customSuccess('Category saved!');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!(await customConfirm('Delete this category?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/categories/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategories.length === 0) return;
    if (!(await customConfirm(`Delete ${selectedCategories.length} selected categories?`))) return;
    for (const id of selectedCategories) {
      await fetch(`${BACKEND_URL}/catalog/categories/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
    }
    setSelectedCategories([]);
    fetchAll();
  };

  // Product Handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productForm.category_ids.length === 0) return customAlert('Please select at least one category');
    try {
      const method = isEditingProduct ? 'PATCH' : 'POST';
      const url = isEditingProduct ? `${BACKEND_URL}/catalog/products/${productForm.id}` : `${BACKEND_URL}/catalog/products`;
      
      const payload: any = {
        name: productForm.name,
        price: parseFloat(productForm.price as any) || 0,
        cost: parseFloat(productForm.cost as any) || 0,
        margin_pct: productForm.price > 0 ? (((productForm.price - productForm.cost) / productForm.price) * 100) : 100,
        description: productForm.description,
        category_ids: productForm.category_ids,
        sku: productForm.sku,
        barcode: productForm.barcode,
        image_url: productForm.image_url,
        tax_rate: parseFloat(productForm.tax_rate as any) || 0,
        is_active: productForm.is_active,
        status: 'APPROVED',
        recipe_id: productForm.recipe_id > 0 ? productForm.recipe_id : null,
        availability_rule_id: productForm.availability_rule_id > 0 ? productForm.availability_rule_id : null,
        kitchen_station: productForm.kitchen_station,
        printer_group: productForm.printer_group,
        kds_group: productForm.kds_group,
        modifier_group_ids: productForm.modifier_group_ids,
        variants: productForm.hasVariants ? productForm.variants.map(v => ({
          name: v.name,
          price: parseFloat(v.price as any) || 0,
          cost: parseFloat(v.cost as any) || 0,
          sku: v.sku || '',
          barcode: v.barcode || '',
          recipe_id: v.recipe_id > 0 ? v.recipe_id : undefined,
        })) : []
      };

      if (!isEditingProduct) {
        payload.store_id = selectedBranchId;
      }
      
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setProductForm(initialProductForm);
        setIsEditingProduct(false);
        fetchAll();
        customSuccess(isEditingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      } else {
        const err = await res.json().catch(() => null);
        customAlert(err?.message || 'Failed to save product');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!(await customConfirm('Delete this product?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/products/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) return;
    if (!(await customConfirm(`Delete ${selectedProducts.length} selected products?`))) return;
    for (const id of selectedProducts) {
      await fetch(`${BACKEND_URL}/catalog/products/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
    }
    setSelectedProducts([]);
    fetchAll();
  };

  const handleExportProductsCsv = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/products/export`, { headers: getAuthHeaderOnly() });
      if (!res.ok) return customAlert('Failed to export products.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu-products.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      customAlert('Failed to export products.');
    }
  };

  const handleImportProductsCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!selectedBranchId) return customAlert('Please select a branch first');

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/products/import?store_id=${selectedBranchId}`, {
        method: 'POST',
        headers: getAuthHeaderOnly(),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        customSuccess(`Import complete: ${data.created} created, ${data.updated} updated${data.errors ? `, ${data.errors} errors` : ''}.`);
        if (data.errors > 0) {
          console.warn('CSV import row errors:', data.results.filter((r: any) => r.action === 'error'));
        }
        fetchAll();
      } else {
        customAlert(data.message || 'CSV import failed.');
      }
    } catch (e) {
      console.error(e);
      customAlert('CSV import failed.');
    }
  };

  // Modifier Group Handlers
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = groupForm.id ? 'PATCH' : 'POST';
    const url = groupForm.id ? `${BACKEND_URL}/catalog/modifiers/groups/${groupForm.id}` : `${BACKEND_URL}/catalog/modifiers/groups`;
    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ ...groupForm, store_id: selectedBranchId })
      });
      if (res.ok) {
        setShowGroupModal(false);
        setGroupForm({ id: 0, name: '', is_required: false, min_selection: 0, max_selection: 1 });
        fetchAll();
        customSuccess('Modifier group saved!');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!(await customConfirm('Delete this modifier group?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/modifiers/groups/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleModifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = modifierForm.id ? 'PATCH' : 'POST';
    const url = modifierForm.id ? `${BACKEND_URL}/catalog/modifiers/${modifierForm.id}` : `${BACKEND_URL}/catalog/modifiers`;
    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(modifierForm)
      });
      if (res.ok) {
        setShowModifierModal(false);
        setModifierForm({ id: 0, modifier_group_id: 0, name: '', additional_price: 0 });
        fetchAll();
        customSuccess('Modifier saved!');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteModifier = async (id: number) => {
    if (!(await customConfirm('Delete this modifier item?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/modifiers/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  // Availability Rule Handlers
  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = ruleForm.id ? 'PATCH' : 'POST';
    const url = ruleForm.id ? `${BACKEND_URL}/catalog/availability-rules/${ruleForm.id}` : `${BACKEND_URL}/catalog/availability-rules`;
    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ ...ruleForm, store_id: selectedBranchId })
      });
      if (res.ok) {
        setShowRuleModal(false);
        setRuleForm({ id: 0, name: 'ALWAYS', type: 'ALWAYS', start_time: '09:00', end_time: '23:00', days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' });
        fetchAll();
        customSuccess('Availability rule saved!');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteRule = async (id: number) => {
    if (!(await customConfirm('Delete this availability rule?'))) return;
    try {
      await fetch(`${BACKEND_URL}/catalog/availability-rules/${id}`, { method: 'DELETE', headers: getAuthHeaderOnly() });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('d4u_admin_token')}`
        },
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
    }
  };

  // Product images are handled by a dedicated per-product endpoint (validates type/size,
  // generates a thumbnail, and deletes the previous file on replace) rather than the
  // generic /catalog/upload used above for categories.
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !productForm.id) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/products/${productForm.id}/image`, {
        method: 'POST',
        headers: getAuthHeaderOnly(),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProductForm({ ...productForm, image_url: data.image_url || '', thumbnail_url: data.thumbnail_url || '' });
        customSuccess('Product image uploaded successfully!');
      } else {
        customAlert(data.message || 'Image upload failed.');
      }
    } catch (err) {
      console.error('Product image upload failed', err);
      customAlert('Image upload failed.');
    }
  };

  const handleProductImageRemove = async () => {
    if (!productForm.id) return;
    const confirmed = await customConfirm('Remove this product image?');
    if (!confirmed) return;
    try {
      const res = await fetch(`${BACKEND_URL}/catalog/products/${productForm.id}/image`, {
        method: 'DELETE',
        headers: getAuthHeaderOnly(),
      });
      if (res.ok) {
        setProductForm({ ...productForm, image_url: '', thumbnail_url: '' });
        customSuccess('Product image removed.');
      }
    } catch (err) {
      console.error('Product image remove failed', err);
      customAlert('Failed to remove image.');
    }
  };

  const handleStoreToggle = (storeId: number, currentList: number[], setter: (val: number[]) => void) => {
    if (currentList.includes(storeId)) setter(currentList.filter(id => id !== storeId));
    else setter([...currentList, storeId]);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-160px)]">
      
      {/* Top Bar Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('MENUS')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'MENUS' ? 'bg-[#3b82f6] text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Store size={16} /> Menu Collections
        </button>
        <button 
          onClick={() => setActiveTab('CATEGORIES')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'CATEGORIES' ? 'bg-[#3b82f6] text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Tag size={16} /> Categories
        </button>
        <button 
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'PRODUCTS' ? 'bg-[#3b82f6] text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Utensils size={16} /> Menu Products
        </button>
        <button 
          onClick={() => setActiveTab('MODIFIERS')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'MODIFIERS' ? 'bg-[#3b82f6] text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Sliders size={16} /> Modifier Groups
        </button>
        <button 
          onClick={() => setActiveTab('AVAILABILITY')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'AVAILABILITY' ? 'bg-[#3b82f6] text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Clock size={16} /> Availability Rules
        </button>
        <button
          onClick={() => setActiveTab('PRODUCT_REQUESTS')}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${activeTab === 'PRODUCT_REQUESTS' ? 'bg-[#3b82f6] text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <ClipboardList size={16} /> Product Requests
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
                      {m.stores?.length > 0 ? m.stores.map((s:any) => s.name).join(', ') : <span className="text-slate-500 italic">None</span>}
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
                onClick={() => { setCategoryForm({ id: 0, name: '', menu_id: 0, store_ids: [], image_url: '', is_active: true, sort_order: categories.length + 1 }); setShowCategoryModal(true); }}
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
                    <th className="p-4">Sort</th>
                    <th className="p-4">Category Name</th>
                    <th className="p-4">Status</th>
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
                      <td className="p-4 font-mono text-slate-400">{c.sort_order ?? 0}</td>
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        {c.image_url ? (
                          <img src={`${BACKEND_URL}${c.image_url}`} alt={c.name} className="w-8 h-8 rounded object-cover border border-slate-600" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">No Img</div>
                        )}
                        {c.name}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">{c.menu?.name || 'Unassigned'}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {c.assigned_stores?.map((s:any) => (
                            <span key={s.id} className="bg-slate-700 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-slate-300">{s.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 flex justify-end gap-3 items-center">
                        <button 
                          onClick={() => { 
                            setCategoryForm({ 
                              id: c.id, 
                              name: c.name, 
                              menu_id: c.menu_id || 0, 
                              store_ids: c.assigned_stores?.map((s:any)=>s.id) || [], 
                              image_url: c.image_url || '',
                              is_active: c.is_active ?? true,
                              sort_order: c.sort_order ?? 0
                            }); 
                            setShowCategoryModal(true); 
                          }}
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
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">No categories found.</td></tr>
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
                <Utensils className="text-[#3b82f6]" /> Menu Products Engine
              </h3>
              <div className="flex gap-2">
                <button onClick={handleExportProductsCsv} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                  <FileDown size={16} /> Export CSV
                </button>
                <label className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors cursor-pointer">
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportProductsCsvFile} />
                  <FileUp size={16} /> Import CSV
                </label>
              </div>
            </div>

            {/* Form */}
            <div className="bg-slate-900 border-b border-slate-700 p-4 max-h-[360px] overflow-y-auto">
              <form onSubmit={handleProductSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Product Name *</label>
                    <input 
                      required type="text" placeholder="e.g. Zinger Burger"
                      value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Selling Price (Rs.) *</label>
                    <input 
                      required={!productForm.hasVariants} type="number" placeholder="500"
                      value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value) || 0})}
                      disabled={productForm.hasVariants}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-[#4edea3] font-mono font-bold text-sm focus:outline-none focus:border-[#fbbf24] disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">SKU</label>
                    <input 
                      type="text" placeholder="e.g. ZNG-01"
                      value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Barcode</label>
                    <input 
                      type="text" placeholder="e.g. 890123456789"
                      value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Product Image</label>
                  {isEditingProduct && productForm.id ? (
                    <div className="flex gap-3 items-center">
                      <label className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm cursor-pointer hover:bg-slate-800 whitespace-nowrap">
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProductImageUpload} />
                        <span>{productForm.image_url ? 'Replace Image' : 'Browse Image'}</span>
                      </label>
                      {productForm.image_url && (
                        <>
                          <img src={`${BACKEND_URL}${productForm.thumbnail_url || productForm.image_url}`} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
                          <button type="button" onClick={handleProductImageRemove} className="text-red-400 text-xs font-bold hover:underline">Remove</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Save the product first, then a Product Image option will appear here.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative" ref={categoryDropdownRef}>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Categories *</label>
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

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Recipe Mapping</label>
                    <select 
                      value={productForm.recipe_id} onChange={e => setProductForm({...productForm, recipe_id: parseInt(e.target.value)})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24] h-[38px]"
                    >
                      <option value={0}>-- No Standard Recipe --</option>
                      {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Availability Rule</label>
                    <select 
                      value={productForm.availability_rule_id} onChange={e => setProductForm({...productForm, availability_rule_id: parseInt(e.target.value)})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24] h-[38px]"
                    >
                      <option value={0}>-- Always Available --</option>
                      {availabilityRules.map(ar => <option key={ar.id} value={ar.id}>{ar.name} ({ar.type})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Tax Rate (%)</label>
                    <input 
                      type="number" placeholder="0"
                      value={productForm.tax_rate || ''} onChange={e => setProductForm({...productForm, tax_rate: parseFloat(e.target.value) || 0})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                </div>

                {/* Kitchen Routing & Modifiers */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Kitchen Station</label>
                    <input 
                      type="text" placeholder="e.g. Grill Station"
                      value={productForm.kitchen_station} onChange={e => setProductForm({...productForm, kitchen_station: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Printer Group</label>
                    <input 
                      type="text" placeholder="e.g. Kitchen Hot Printer"
                      value={productForm.printer_group} onChange={e => setProductForm({...productForm, printer_group: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">KDS Display Group</label>
                    <input 
                      type="text" placeholder="e.g. Main Kitchen KDS"
                      value={productForm.kds_group} onChange={e => setProductForm({...productForm, kds_group: e.target.value})}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm"
                    />
                  </div>

                  <div className="relative" ref={modifierDropdownRef}>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Modifier Groups</label>
                    <div 
                      onClick={() => setIsModifierDropdownOpen(!isModifierDropdownOpen)}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm cursor-pointer flex justify-between items-center h-[38px]"
                    >
                      <span className="truncate pr-2">
                        {productForm.modifier_group_ids.length > 0 
                          ? `${productForm.modifier_group_ids.length} Groups Linked` 
                          : 'Link Modifiers...'}
                      </span>
                      <span className="text-slate-400 text-xs">▼</span>
                    </div>
                    {isModifierDropdownOpen && (
                      <div className="absolute top-[60px] left-0 w-full bg-[#1e293b] border border-[#334155] rounded-md p-2 text-white text-sm max-h-48 overflow-y-auto flex flex-col gap-1 z-50 shadow-xl">
                        {modifierGroups.map(mg => (
                          <label key={mg.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-1.5 rounded">
                            <input 
                              type="checkbox" 
                              checked={productForm.modifier_group_ids.includes(mg.id)}
                              onChange={(e) => {
                                if (e.target.checked) setProductForm({...productForm, modifier_group_ids: [...productForm.modifier_group_ids, mg.id]});
                                else setProductForm({...productForm, modifier_group_ids: productForm.modifier_group_ids.filter(id => id !== mg.id)});
                              }}
                              className="accent-[#fbbf24] w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs">{mg.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants Section */}
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={productForm.hasVariants}
                        onChange={e => setProductForm({...productForm, hasVariants: e.target.checked, variants: e.target.checked && productForm.variants.length === 0 ? [{name: 'Small', price: 0, cost: 0, sku: '', barcode: '', recipe_id: 0}] : productForm.variants})}
                        className="w-4 h-4 accent-[#fbbf24] cursor-pointer"
                        id="hasVariantsToggle"
                      />
                      <label htmlFor="hasVariantsToggle" className="text-sm font-bold text-white cursor-pointer">Product Variants (e.g. Small, Medium, Large)</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <input 
                          type="checkbox" 
                          checked={productForm.is_active} 
                          onChange={e => setProductForm({...productForm, is_active: e.target.checked})}
                          className="accent-emerald-500 w-4 h-4" 
                        />
                        Active Product
                      </label>
                    </div>
                  </div>

                  {productForm.hasVariants && (
                    <div className="flex flex-col gap-2 mt-3">
                      {productForm.variants.map((v: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input 
                            type="text" placeholder="Size / Variant Name" 
                            value={v.name} onChange={e => { const nv = [...productForm.variants]; nv[idx].name = e.target.value; setProductForm({...productForm, variants: nv}) }}
                            className="bg-[#1e293b] border border-[#334155] rounded-md p-1.5 text-white text-xs flex-1"
                          />
                          <input 
                            type="number" placeholder="Price" 
                            value={v.price || ''} onChange={e => { const nv = [...productForm.variants]; nv[idx].price = parseFloat(e.target.value) || 0; setProductForm({...productForm, variants: nv}) }}
                            className="bg-[#1e293b] border border-[#334155] rounded-md p-1.5 text-[#4edea3] font-mono font-bold text-xs w-24"
                          />
                          <input 
                            type="text" placeholder="SKU" 
                            value={v.sku || ''} onChange={e => { const nv = [...productForm.variants]; nv[idx].sku = e.target.value; setProductForm({...productForm, variants: nv}) }}
                            className="bg-[#1e293b] border border-[#334155] rounded-md p-1.5 text-white text-xs w-24"
                          />
                          <select 
                            value={v.recipe_id || 0} onChange={e => { const nv = [...productForm.variants]; nv[idx].recipe_id = parseInt(e.target.value); setProductForm({...productForm, variants: nv}) }}
                            className="bg-[#1e293b] border border-[#334155] rounded-md p-1.5 text-white text-xs w-36"
                          >
                            <option value={0}>Standard Recipe</option>
                            {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          <button type="button" onClick={() => { const nv = productForm.variants.filter((_: any, i: number) => i !== idx); setProductForm({...productForm, variants: nv}); }} className="text-red-400 p-1.5 hover:bg-red-400/10 rounded-md">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setProductForm({...productForm, variants: [...productForm.variants, {name: '', price: 0, cost: 0, sku: '', barcode: '', recipe_id: 0}]})} className="text-xs text-[#fbbf24] flex items-center gap-1 mt-1 font-bold w-max hover:underline">
                        <Plus size={14} /> Add Variant Size
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 items-center">
                  {isEditingProduct && (
                    <button type="button" onClick={() => { setProductForm(initialProductForm); setIsEditingProduct(false); }} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                  )}
                  <button type="submit" className="bg-[#fbbf24] hover:bg-yellow-500 text-slate-900 rounded-md px-6 py-2 font-bold text-sm transition-colors flex items-center gap-2">
                    <Plus size={16} /> {isEditingProduct ? 'Update Product' : 'Create Product'}
                  </button>
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
                <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-4 w-12">
                      <input 
                        type="checkbox" 
                        className="accent-[#fbbf24] cursor-pointer"
                        onChange={(e) => {
                          const filtered = products.filter(p => productFilterCategoryId === 0 || p.categories?.some((c:any) => c.id === productFilterCategoryId));
                          if (e.target.checked) setSelectedProducts(filtered.map(p => p.id));
                          else setSelectedProducts([]);
                        }}
                        checked={selectedProducts.length > 0 && selectedProducts.length === products.filter(p => productFilterCategoryId === 0 || p.categories?.some((c:any) => c.id === productFilterCategoryId)).length}
                      />
                    </th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Recipe</th>
                    <th className="p-4">Routing</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => productFilterCategoryId === 0 || p.categories?.some((c:any) => c.id === productFilterCategoryId)).map(p => (
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
                          <img src={`${BACKEND_URL}${p.thumbnail_url || p.image_url}`} alt={p.name} className="w-9 h-9 rounded object-cover border border-slate-600" />
                        ) : (
                          <div className="w-9 h-9 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">No Img</div>
                        )}
                        <div>
                          <div>{p.name}</div>
                          <div className="text-xs font-mono text-slate-400 font-normal">SKU: {p.sku || 'N/A'} • Tax: {p.tax_rate}%</div>
                        </div>
                      </td>
                      <td className="p-4">
                        {p.recipe ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 size={12} /> {p.recipe.name}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs italic">No Recipe</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div>Station: <span className="text-slate-200">{p.kitchen_station || 'Default'}</span></div>
                        <div>KDS: <span className="text-slate-200">{p.kds_group || 'Default'}</span></div>
                      </td>
                      <td className="p-4 font-mono font-bold text-[#4edea3]">
                        {p.variants?.length > 0 ? `${p.variants.length} Sizes/Variants` : `Rs. ${p.price}`}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 flex justify-end gap-3 items-center">
                        <button 
                          onClick={() => { 
                            setProductForm({ 
                              id: p.id, 
                              name: p.name, 
                              price: p.price, 
                              cost: p.cost || 0,
                              description: p.description || '',
                              category_ids: p.categories?.map((c:any) => c.id) || [], 
                              sku: p.sku || '', 
                              barcode: p.barcode || '',
                              image_url: p.image_url || '',
                              thumbnail_url: p.thumbnail_url || '',
                              tax_rate: p.tax_rate || 0,
                              is_active: p.is_active ?? true,
                              recipe_id: p.recipe_id || 0,
                              availability_rule_id: p.availability_rule_id || 0,
                              kitchen_station: p.kitchen_station || 'Kitchen Main',
                              printer_group: p.printer_group || 'Hot Printer',
                              kds_group: p.kds_group || 'KDS Display 1',
                              modifier_group_ids: p.modifierGroups?.map((mg:any) => mg.modifier_group_id) || [],
                              assigned_store_ids: p.assigned_stores?.map((s:any) => s.id) || [], 
                              hasVariants: p.variants && p.variants.length > 0, 
                              variants: p.variants ? p.variants.map((v:any) => ({
                                name: v.name, 
                                price: v.price,
                                cost: v.cost || 0,
                                sku: v.sku || '',
                                barcode: v.barcode || '',
                                recipe_id: v.recipe_id || 0
                              })) : [] 
                            }); 
                            setIsEditingProduct(true); 
                          }} 
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
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODIFIERS TAB */}
        {activeTab === 'MODIFIERS' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="text-[#3b82f6]" /> Modifier Groups & Options
              </h3>
              <button 
                onClick={() => { setGroupForm({ id: 0, name: '', is_required: false, min_selection: 0, max_selection: 1 }); setShowGroupModal(true); }}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Plus size={18} /> Add Modifier Group
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modifierGroups.map(group => (
                  <div key={group.id} className="bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-lg">{group.name}</h4>
                        <div className="flex gap-2">
                          <button onClick={() => { setGroupForm({ id: group.id, name: group.name, is_required: group.is_required, min_selection: group.min_selection, max_selection: group.max_selection }); setShowGroupModal(true); }} className="text-slate-400 hover:text-white"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteGroup(group.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 flex gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${group.is_required ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                          {group.is_required ? 'Required' : 'Optional'}
                        </span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded">Min: {group.min_selection} • Max: {group.max_selection}</span>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-800 pt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase">Modifiers</span>
                          <button 
                            onClick={() => { setModifierForm({ id: 0, modifier_group_id: group.id, name: '', additional_price: 0 }); setShowModifierModal(true); }}
                            className="text-xs text-[#3b82f6] hover:underline font-bold flex items-center gap-1"
                          >
                            <Plus size={12} /> Add Item
                          </button>
                        </div>
                        {group.modifiers?.map((m: any) => (
                          <div key={m.id} className="flex justify-between items-center text-sm bg-slate-800/60 px-3 py-1.5 rounded border border-slate-700/50">
                            <span className="text-white font-medium">{m.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[#4edea3] font-mono text-xs">+Rs. {m.additional_price}</span>
                              <button onClick={() => handleDeleteModifier(m.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        ))}
                        {(!group.modifiers || group.modifiers.length === 0) && (
                          <p className="text-xs text-slate-500 italic">No modifier choices added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {modifierGroups.length === 0 && (
                  <p className="text-slate-500 col-span-full text-center p-8">No modifier groups found. Create one (e.g., Extra Cheese, Sauces).</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {activeTab === 'AVAILABILITY' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="text-[#3b82f6]" /> Menu Availability Rules
              </h3>
              <button 
                onClick={() => { setRuleForm({ id: 0, name: 'Breakfast', type: 'TIME_BASED', start_time: '07:00', end_time: '11:00', days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' }); setShowRuleModal(true); }}
                className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Plus size={18} /> Add Rule
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availabilityRules.map(rule => (
                  <div key={rule.id} className="bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-lg">{rule.name}</h4>
                        <div className="flex gap-2">
                          <button onClick={() => { setRuleForm({ id: rule.id, name: rule.name, type: rule.type, start_time: rule.start_time || '09:00', end_time: rule.end_time || '23:00', days: rule.days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' }); setShowRuleModal(true); }} className="text-slate-400 hover:text-white"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400 mt-2">
                        <div><strong>Rule Type:</strong> <span className="text-amber-400 font-bold">{rule.type}</span></div>
                        {rule.type !== 'ALWAYS' && (
                          <>
                            <div><strong>Hours:</strong> {rule.start_time} - {rule.end_time}</div>
                            <div><strong>Days:</strong> {rule.days}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {availabilityRules.length === 0 && (
                  <p className="text-slate-500 col-span-full text-center p-8">No custom rules found. Default rule is Always Available.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT REQUESTS TAB */}
        {activeTab === 'PRODUCT_REQUESTS' && (
          <ProductRequestsTab stores={stores} />
        )}

      </div>

      {/* Modals */}
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
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">{categoryForm.id ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleCategorySubmit}>
              <label className="block text-xs font-bold text-slate-400 mb-1">Category Name *</label>
              <input 
                required type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
              />
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Sort Order</label>
                  <input 
                    type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({...categoryForm, sort_order: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer">
                    <input 
                      type="checkbox" checked={categoryForm.is_active} onChange={e => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    Active Category
                  </label>
                </div>
              </div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Category Image</label>
              <div className="flex gap-3 items-center mb-4">
                <label className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm cursor-pointer hover:bg-slate-800 flex-1 text-center whitespace-nowrap">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, (url) => setCategoryForm({...categoryForm, image_url: url}))} />
                  <span>{categoryForm.image_url ? 'Change Image' : 'Browse Image'}</span>
                </label>
                {categoryForm.image_url && <img src={`${BACKEND_URL}${categoryForm.image_url}`} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#3b82f6] hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">{groupForm.id ? 'Edit Modifier Group' : 'Add Modifier Group'}</h3>
            <form onSubmit={handleGroupSubmit}>
              <label className="block text-xs font-bold text-slate-400 mb-1">Group Name *</label>
              <input 
                required type="text" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})}
                placeholder="e.g. Choose Sauce"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
              />
              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="checkbox" checked={groupForm.is_required} onChange={e => setGroupForm({...groupForm, is_required: e.target.checked})}
                  className="accent-[#3b82f6] w-4 h-4 cursor-pointer" id="reqCheck"
                />
                <label htmlFor="reqCheck" className="text-sm font-bold text-white cursor-pointer">Required Selection</label>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Min Selection</label>
                  <input 
                    type="number" value={groupForm.min_selection} onChange={e => setGroupForm({...groupForm, min_selection: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Max Selection</label>
                  <input 
                    type="number" value={groupForm.max_selection} onChange={e => setGroupForm({...groupForm, max_selection: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowGroupModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#3b82f6] hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modifier Modal */}
      {showModifierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">Add Modifier Choice</h3>
            <form onSubmit={handleModifierSubmit}>
              <label className="block text-xs font-bold text-slate-400 mb-1">Modifier Name *</label>
              <input 
                required type="text" value={modifierForm.name} onChange={e => setModifierForm({...modifierForm, name: e.target.value})}
                placeholder="e.g. Extra Cheese"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
              />
              <label className="block text-xs font-bold text-slate-400 mb-1">Additional Price (Rs.)</label>
              <input 
                type="number" value={modifierForm.additional_price || ''} onChange={e => setModifierForm({...modifierForm, additional_price: parseFloat(e.target.value) || 0})}
                placeholder="50"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-[#4edea3] font-mono font-bold focus:outline-none focus:border-[#3b82f6] mb-6"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModifierModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#3b82f6] hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm animate-scale-up">
            <h3 className="text-xl font-bold text-white mb-4">{ruleForm.id ? 'Edit Rule' : 'Add Availability Rule'}</h3>
            <form onSubmit={handleRuleSubmit}>
              <label className="block text-xs font-bold text-slate-400 mb-1">Rule Name</label>
              <input 
                required type="text" value={ruleForm.name} onChange={e => setRuleForm({...ruleForm, name: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-[#3b82f6] mb-4"
              />
              <label className="block text-xs font-bold text-slate-400 mb-1">Type</label>
              <select 
                value={ruleForm.type} onChange={e => setRuleForm({...ruleForm, type: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mb-4"
              >
                <option value="ALWAYS">ALWAYS</option>
                <option value="TIME_BASED">TIME_BASED</option>
              </select>
              {ruleForm.type === 'TIME_BASED' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Start Time</label>
                    <input type="time" value={ruleForm.start_time} onChange={e => setRuleForm({...ruleForm, start_time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">End Time</label>
                    <input type="time" value={ruleForm.end_time} onChange={e => setRuleForm({...ruleForm, end_time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRuleModal(false)} className="flex-1 py-3 rounded-lg font-bold text-slate-400 bg-slate-900 hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg font-bold text-white bg-[#3b82f6] hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
