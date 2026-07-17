import React, { useState, useEffect } from 'react';
import { ChefHat, ShoppingCart, Search, Plus, Minus, X, CheckCircle, Navigation, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : 'https://pos-api.deziner4you.com';
const socket = io(BACKEND_URL);

interface WaiterModeProps {
  storeId: number;
  terminalPin: string;
  waiterName: string;
  onLogout: () => void;
}

export default function WaiterMode({ storeId, terminalPin, waiterName, onLogout }: WaiterModeProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tableNo, setTableNo] = useState('');

  useEffect(() => {
    fetch(`${BACKEND_URL}/catalog?store_id=${storeId}`)
      .then(res => res.json())
      .then(data => {
        const sortedCats = (data.categories || []).sort((a: any, b: any) => a.display_order - b.display_order);
        setCategories(sortedCats);
        setProducts(data.products || []);
        if (sortedCats.length > 0) setActiveCategory(sortedCats[0].id);
      })
      .catch(console.error);
  }, [storeId]);

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 0 || p.category_id === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && p.isActive !== false;
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success('Added to cart');
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = i.qty + delta;
        return newQty > 0 ? { ...i, qty: newQty } : i;
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const sendTerminalOrder = () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!tableNo.trim()) return toast.error('Please enter a Table Number');

    const orderData = {
      store_id: storeId,
      waiter_name: waiterName,
      terminal_pin: terminalPin,
      table_no: tableNo,
      items: cart,
      total: cartTotal,
      timestamp: new Date().toISOString()
    };

    socket.emit('NEW_TERMINAL_ORDER', orderData);
    toast.success('Order sent to POS!');
    setCart([]);
    setTableNo('');
    setIsCartOpen(false);
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
            {waiterName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">{waiterName}</h1>
            <p className="text-xs text-indigo-400 font-bold">Terminal Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-slate-300 hover:text-white">
            <ShoppingCart size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={onLogout} className="text-xs font-bold bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-white">
            Exit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Categories Horizontal Scroll */}
        <div className="bg-slate-800/50 p-3 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-2 border-b border-slate-700">
          <button 
            onClick={() => setActiveCategory(0)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${activeCategory === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${activeCategory === c.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search menu..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 custom-scrollbar pb-24">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden active:scale-95 transition-transform cursor-pointer flex flex-col">
              <div className="h-24 bg-slate-900 relative">
                {p.image_url ? (
                  <img src={p.image_url.startsWith('http') ? p.image_url : `${BACKEND_URL}${p.image_url}`} className="w-full h-full object-cover opacity-80" alt={p.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="text-slate-700 w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-indigo-400">
                  Rs. {p.price}
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight">{p.name}</h3>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 font-bold">
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
          <div className="bg-slate-800 p-4 flex items-center gap-4 border-b border-slate-700 shadow-md">
            <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-700 rounded-full text-white">
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-bold text-lg text-white flex-1">Terminal Cart</h2>
            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full font-bold text-sm">
              Rs. {cartTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 py-12 font-bold flex flex-col items-center">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                Your cart is empty
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    <div className="text-indigo-400 font-bold text-sm mt-1">Rs. {(item.price * item.qty).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-1 border border-slate-700">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-slate-300 hover:text-white">
                      <Minus size={16} />
                    </button>
                    <span className="font-bold text-white w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-slate-300 hover:text-white">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-800 p-6 border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Table Number / Guest Name</label>
              <div className="relative">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="e.g. Table 5" 
                  value={tableNo}
                  onChange={e => setTableNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-bold text-lg"
                />
              </div>
            </div>
            <button 
              onClick={sendTerminalOrder}
              disabled={cart.length === 0}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black py-4 rounded-xl transition-all flex justify-center items-center gap-2 text-lg"
            >
              <CheckCircle size={24} />
              Send to Cashier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
