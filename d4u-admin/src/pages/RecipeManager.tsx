import React, { useState, useEffect } from 'react';
import { ChefHat, Save, Plus, Trash2, CheckCircle2, Download, Upload, List, Edit2 } from 'lucide-react';
import { useAdminContext } from '../context/AdminContext';
import { customAlert, customSuccess } from '../utils/alerts';
import { apiFetch } from '../utils/api';

export default function RecipeManager() {
  const { selectedBranchId } = useAdminContext();
  // Auth headers handled centrally by apiFetch → utils/api.ts

  // Data state
  const [categories, setCategories] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'RECIPES' | 'MAPPING'>('RECIPES');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New Category / Recipe Modals
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [newRecipeData, setNewRecipeData] = useState({ name: '', category_id: 0 });

  useEffect(() => {
    if (!selectedBranchId) return;
    loadAllData();
  }, [selectedBranchId]);

  const loadAllData = async () => {
    try {
      const [catRes, recRes, invRes, prodRes] = await Promise.all([
        apiFetch(`/recipes/categories/${selectedBranchId}`),
        apiFetch(`/recipes/store/${selectedBranchId}`),
        apiFetch(`/inventory/items/${selectedBranchId}`),
        apiFetch(`/catalog/products?store_id=${selectedBranchId}`)
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (recRes.ok) setRecipes(await recRes.json());
      if (invRes.ok) setInventory(await invRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (e) {
      console.error('Failed to load data', e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/recipes/categories`, {
        method: 'POST',
        body: JSON.stringify({ store_id: selectedBranchId, name: newCatName })
      });
      if (res.ok) {
        setShowNewCat(false);
        setNewCatName('');
        loadAllData();
      }
    } catch (e) {
      customAlert("Failed to create category");
    }
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/recipes`, {
        method: 'POST',
        body: JSON.stringify({ 
          store_id: selectedBranchId, 
          name: newRecipeData.name, 
          category_id: newRecipeData.category_id || null 
        })
      });
      if (res.ok) {
        setShowNewRecipe(false);
        setNewRecipeData({ name: '', category_id: 0 });
        loadAllData();
      }
    } catch (e) {
      customAlert("Failed to create recipe");
    }
  };

  const handleUpdateRecipeMeta = async () => {
    if (!selectedRecipe) return;
    setIsSaving(true);
    try {
      await apiFetch(`/recipes/${selectedRecipe.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          yield: selectedRecipe.yield,
          portion_size: selectedRecipe.portion_size,
          waste_percentage: selectedRecipe.waste_percentage,
          prep_time_mins: selectedRecipe.prep_time_mins,
          instructions: selectedRecipe.instructions
        })
      });
      customSuccess("Recipe details saved");
      loadAllData();
    } catch (e) {
      customAlert("Failed to save recipe details");
    }
    setIsSaving(false);
  };

  const handleSaveIngredients = async () => {
    if (!selectedRecipe) return;
    setIsSaving(true);
    try {
      const validIngredients = selectedRecipe.ingredients
        .filter((i: any) => parseInt(i.inventory_id) > 0 && parseFloat(i.quantity) > 0)
        .map((i: any) => ({
          inventory_id: parseInt(i.inventory_id),
          quantity: parseFloat(i.quantity),
          unit: i.unit
        }));

      await apiFetch(`/recipes/${selectedRecipe.id}/ingredients`, {
        method: 'POST',
        body: JSON.stringify({ ingredients: validIngredients })
      });
      customSuccess("Ingredients saved successfully!");
      loadAllData();
    } catch (e) {
      customAlert("Failed to save ingredients");
    }
    setIsSaving(false);
  };

  const handleMapRecipeToProduct = async (product_id: number, recipe_id: number | null) => {
    try {
      const res = await apiFetch(`/catalog/products/${product_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ recipe_id })
      });
      if (res.ok) {
        customSuccess("Product mapped to recipe");
        loadAllData();
      }
    } catch (e) {
      customAlert("Failed to map recipe");
    }
  };

  const addIngredientRow = () => {
    if (!selectedRecipe) return;
    setSelectedRecipe({
      ...selectedRecipe,
      ingredients: [...selectedRecipe.ingredients, { id: Math.random(), inventory_id: 0, quantity: 0, unit: '', price: 0 }]
    });
  };

  const updateIngredientRow = (id: number, field: string, value: any) => {
    if (!selectedRecipe) return;
    const newIngredients = selectedRecipe.ingredients.map((row: any) => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value };
        if (field === 'inventory_id') {
          const inv = inventory.find(i => i.id === parseInt(value));
          if (inv) {
            newRow.unit = inv.unit;
            newRow.price = inv.unit_price;
          }
        }
        return newRow;
      }
      return row;
    });
    setSelectedRecipe({ ...selectedRecipe, ingredients: newIngredients });
  };

  const removeIngredientRow = (id: number) => {
    if (!selectedRecipe) return;
    setSelectedRecipe({
      ...selectedRecipe,
      ingredients: selectedRecipe.ingredients.filter((row: any) => row.id !== id)
    });
  };

  const calculateTotalCost = () => {
    if (!selectedRecipe) return 0;
    return selectedRecipe.ingredients.reduce((sum: number, row: any) => {
      const price = row.inventory?.unit_price || row.price || 0;
      return sum + (price * row.quantity);
    }, 0);
  };

  const filteredRecipes = selectedCategoryId
    ? recipes.filter(r => r.category_id === selectedCategoryId)
    : recipes;

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3">
            <ChefHat size={36} className="text-amber-500" />
            Recipe Engine
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage standardized recipes and link them to menu products.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('RECIPES')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'RECIPES' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            Manage Recipes
          </button>
          <button 
            onClick={() => setActiveTab('MAPPING')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'MAPPING' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            Map to Menu
          </button>
        </div>
      </div>

      {activeTab === 'RECIPES' && (
        <div className="flex gap-6">
          {/* Left Panel: Categories & Recipes */}
          <div className="w-1/3 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><List size={18} /> Categories</h3>
                <button onClick={() => setShowNewCat(true)} className="text-amber-500 hover:text-amber-600 font-bold text-sm flex items-center"><Plus size={16} /> Add</button>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedCategoryId(null)}
                  className={`w-full text-left px-4 py-2 rounded-lg font-bold transition-all ${selectedCategoryId === null ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  All Recipes
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg font-bold transition-all ${selectedCategoryId === cat.id ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800">Recipes</h3>
                <button onClick={() => setShowNewRecipe(true)} className="text-amber-500 hover:text-amber-600 font-bold text-sm flex items-center"><Plus size={16} /> New</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRecipes.map(recipe => (
                  <button 
                    key={recipe.id}
                    onClick={() => {
                      const rec = recipes.find(r => r.id === recipe.id);
                      // Add random ID to ingredients for local state rendering
                      const formattedRec = {
                        ...rec,
                        ingredients: rec.ingredients.map((i: any) => ({ ...i, id: Math.random(), price: i.inventory?.unit_price || 0 }))
                      };
                      setSelectedRecipe(formattedRec);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedRecipe?.id === recipe.id ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold shadow-md' : 'border-slate-100 hover:border-amber-200 text-slate-700 hover:shadow-sm'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{recipe.name}</span>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{recipe.ingredients?.length || 0} items</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Recipe Editor */}
          <div className="w-2/3">
            {selectedRecipe ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 animate-fade-in">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">{selectedRecipe.name}</h2>
                    <p className="text-slate-500">Edit recipe details and raw materials</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-400">Total Recipe Cost</div>
                    <div className="text-3xl font-black text-emerald-500">Rs. {calculateTotalCost().toFixed(2)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Yield (Total Output)</label>
                    <input type="number" value={selectedRecipe.yield} onChange={e => setSelectedRecipe({...selectedRecipe, yield: parseFloat(e.target.value)})} className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Portion Size</label>
                    <input type="number" value={selectedRecipe.portion_size || ''} onChange={e => setSelectedRecipe({...selectedRecipe, portion_size: parseFloat(e.target.value)})} className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 font-bold" placeholder="e.g. 250g" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Waste %</label>
                    <input type="number" value={selectedRecipe.waste_percentage} onChange={e => setSelectedRecipe({...selectedRecipe, waste_percentage: parseFloat(e.target.value)})} className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Prep Time (Mins)</label>
                    <input type="number" value={selectedRecipe.prep_time_mins} onChange={e => setSelectedRecipe({...selectedRecipe, prep_time_mins: parseInt(e.target.value)})} className="w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 font-bold" />
                  </div>
                  <div className="col-span-4 mt-2">
                    <button onClick={handleUpdateRecipeMeta} disabled={isSaving} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-sm">Save Recipe Details</button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg text-slate-800">Ingredients</h3>
                  <button onClick={addIngredientRow} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1 transition-colors">
                    <Plus size={16} /> Add Ingredient
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Material</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Quantity</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Unit</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Cost</th>
                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecipe.ingredients?.length === 0 && (
                        <tr><td colSpan={6} className="p-4 text-center text-slate-400 italic">No ingredients added yet.</td></tr>
                      )}
                      {selectedRecipe.ingredients?.map((row: any) => {
                        const rowCost = row.inventory?.unit_price || row.price || 0;
                        const total = rowCost * row.quantity;
                        return (
                          <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2">
                              <select 
                                value={row.inventory_id || ''} 
                                onChange={(e) => updateIngredientRow(row.id, 'inventory_id', e.target.value)}
                                className="w-full bg-white text-slate-900 border border-slate-200 rounded p-2 text-sm outline-none focus:border-amber-500"
                              >
                                <option value="">Select Material...</option>
                                {inventory.map(inv => (
                                  <option key={inv.id} value={inv.id}>{inv.name} (Rs. {inv.unit_price}/{inv.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input 
                                type="number" 
                                value={row.quantity || ''}
                                onChange={(e) => updateIngredientRow(row.id, 'quantity', e.target.value)}
                                className="w-24 bg-white text-slate-900 border border-slate-200 rounded p-2 text-sm outline-none focus:border-amber-500"
                                placeholder="Qty"
                              />
                            </td>
                            <td className="p-2 text-sm text-slate-600 font-bold">{row.unit || '-'}</td>
                            <td className="p-2 text-sm text-slate-600">Rs. {rowCost.toFixed(2)}</td>
                            <td className="p-2 text-sm font-bold text-slate-800">Rs. {total.toFixed(2)}</td>
                            <td className="p-2 text-right">
                              <button onClick={() => removeIngredientRow(row.id)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 hover:bg-red-100 rounded">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveIngredients}
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 hover:scale-105"
                  >
                    <Save size={20} />
                    {isSaving ? 'Saving...' : 'Save Ingredients & Recalculate'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
                <ChefHat size={64} className="mb-4 text-slate-300" />
                <h3 className="text-xl font-bold mb-2">No Recipe Selected</h3>
                <p>Select a recipe from the left panel to edit its details and ingredients.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'MAPPING' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 animate-fade-in">
          <h2 className="text-2xl font-black text-slate-800 mb-2">Menu to Recipe Mapping</h2>
          <p className="text-slate-500 mb-8">Link your menu products to standard recipes to enable accurate costing and inventory deduction.</p>
          
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-indigo-50 border-b border-indigo-100 text-indigo-800">
                  <th className="p-4 font-black">Menu Product</th>
                  <th className="p-4 font-black">Current Recipe Assigned</th>
                  <th className="p-4 font-black w-64">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">SKU: {product.sku || 'N/A'} • Price: Rs. {product.price}</div>
                    </td>
                    <td className="p-4">
                      <select 
                        value={product.recipe_id || ''} 
                        onChange={(e) => handleMapRecipeToProduct(product.id, e.target.value ? parseInt(e.target.value) : null)}
                        className={`w-full border rounded-lg p-2 text-sm outline-none font-bold ${product.recipe_id ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-indigo-500'}`}
                      >
                        <option value="">-- No Recipe Assigned --</option>
                        {recipes.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      {product.recipe_id ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle2 size={14} /> Mapped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-100 px-3 py-1 rounded-full text-xs font-bold">
                          <AlertCircle size={14} /> Unmapped
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
            <h3 className="text-xl font-black text-slate-800 mb-4">New Category</h3>
            <form onSubmit={handleCreateCategory}>
              <input type="text" autoFocus required value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Sauces, Pizza Dough" className="w-full bg-white text-slate-900 border rounded-xl p-3 mb-4 outline-none focus:border-amber-500" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewCat(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
            <h3 className="text-xl font-black text-slate-800 mb-4">New Recipe</h3>
            <form onSubmit={handleCreateRecipe}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1">Recipe Name</label>
                <input type="text" autoFocus required value={newRecipeData.name} onChange={e => setNewRecipeData({...newRecipeData, name: e.target.value})} placeholder="e.g. Standard Pizza Sauce" className="w-full bg-white text-slate-900 border rounded-xl p-3 outline-none focus:border-amber-500" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 mb-1">Category (Optional)</label>
                <select value={newRecipeData.category_id} onChange={e => setNewRecipeData({...newRecipeData, category_id: parseInt(e.target.value)})} className="w-full bg-white text-slate-900 border rounded-xl p-3 outline-none focus:border-amber-500">
                  <option value={0}>None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewRecipe(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple AlertCircle icon since we didn't import it at the top
const AlertCircle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);
