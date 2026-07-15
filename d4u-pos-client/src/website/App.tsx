import React, { useState, useEffect } from 'react';
import { ViewMode, CartItem, FoodItem } from './types';
import { foodItems } from './data/foodItems';
import KioskMode from './components/KioskMode';
import MobileMode from './components/MobileMode';
import LandingMode from './components/LandingMode';
import './index.css';
import { db } from '../db';
import { customAlert, customSuccess } from '../utils/alerts';

export default function App() {
  const [currentMode, setCurrentMode] = useState<ViewMode>('kiosk');
  
  // Cart state holds items and quantity
  const [cart, setCart] = useState<CartItem[]>([]);

  // Seed the initial cart items on mount so it matches the screenshots out of the box!
  useEffect(() => {
    const zingerDeluxe = foodItems.find(item => item.id === '4');
    const limeSoda = foodItems.find(item => item.id === '12');
    
    const initialCart: CartItem[] = [];
    if (zingerDeluxe) {
      initialCart.push({ foodItem: zingerDeluxe, quantity: 1 });
    }
    if (limeSoda) {
      initialCart.push({ foodItem: limeSoda, quantity: 1 });
    }
    setCart(initialCart);
  }, []);

  // Set view mode automatically based on client device's screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCurrentMode('mobile');
      } else if (width < 1200) {
        setCurrentMode('landing');
      } else {
        setCurrentMode('kiosk');
      }
    };

    // Calculate once on component mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Increase item quantity
  const handleIncreaseQuantity = (itemId: string) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.foodItem.id === itemId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease item quantity (remove if quantity falls to 0)
  const handleDecreaseQuantity = (itemId: string) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.foodItem.id === itemId) {
          const newQty = item.quantity - 1;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  // Add a brand new item to the cart, or increase quantity if it already exists
  const handleAddToCart = (item: FoodItem) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(cartItem => cartItem.foodItem.id === item.id);
      if (existingIndex > -1) {
        const copy = [...prevCart];
        copy[existingIndex].quantity += 1;
        return copy;
      } else {
        return [...prevCart, { foodItem: item, quantity: 1 }];
      }
    });
  };

  // Remove completely
  const handleRemoveFromCart = (itemId: string, removeAll: boolean = true) => {
    setCart(prevCart => {
      if (removeAll) {
        return prevCart.filter(item => item.foodItem.id !== itemId);
      }
      return prevCart.map(item => {
        if (item.foodItem.id === itemId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  // Clear Basket / Cart
  const handleClearCart = () => {
    setCart([]);
  };

  // Process Checkout to POS
  const handleCheckout = async () => {
    if (cart.length === 0) {
      customAlert("Your cart is empty!");
      return;
    }

    const kotCart = cart.map(item => ({
      id: parseInt(item.foodItem.id),
      name: item.foodItem.name,
      price: item.foodItem.price,
      qty: item.quantity,
      img: item.foodItem.image
    }));

    const itemsString = cart.map(i => `${i.quantity}x ${i.foodItem.name}`).join(', ');
    const totalAmount = cart.reduce((sum, item) => sum + (item.foodItem.priceRs * item.quantity), 0);

    const newKot = {
      orderId: Math.floor(1000 + Math.random() * 9000),
      type: 'Online',
      status: 'PENDING',
      items: itemsString,
      notes: 'Online Order via Website',
      timePlaced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      prepTimeMinutes: 0,
      startTime: '',
      printCount: 0,
      totalAmount,
      customer: 'Web Customer',
      source: 'Website'
    };

    try {
      await db.kots.add(newKot);
      customSuccess('Order placed successfully! Pending restaurant approval.');
      setCart([]);
    } catch (e) {
      console.error('Checkout failed', e);
      customAlert('Error placing order.');
    }
  };

  return (
    <div id="application-layout-frame" className="min-h-screen bg-[#0c1322]">
      {/* Subtle responsive indicator badge at the top left corner to show users how layout automatically switches */}
      <div 
        id="device-profile-indicator" 
        className="fixed bottom-4 right-4 z-[999] bg-slate-900/90 backdrop-blur-md border border-amber-500/30 text-[10px] md:text-xs font-bold font-mono tracking-wider px-3 py-1.5 rounded-full text-amber-400 pointer-events-none shadow-lg flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        {currentMode === 'mobile' && '📱 Mobile View Live'}
        {currentMode === 'landing' && '🌐 Tablet Editorial Live'}
        {currentMode === 'kiosk' && '🖥️ Desktop Kiosk Live'}
      </div>

      {/* Primary view routing based on dynamic client window dimensions */}
      <div id="dynamic-viewport-container">
        {currentMode === 'kiosk' && (
          <KioskMode 
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
          />
        )}

        {currentMode === 'mobile' && (
          <MobileMode 
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
          />
        )}

        {currentMode === 'landing' && (
          <LandingMode 
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
          />
        )}
      </div>
    </div>
  );
}
