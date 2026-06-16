import { useState, useEffect } from 'react';
import type { CartItem, FoodItem } from './types';
import LandingMode from './components/LandingMode';
import KioskMode from './components/KioskMode';
import MobileMode from './components/MobileMode';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewMode, setViewMode] = useState<'landing' | 'kiosk' | 'mobile'>(() => {
    const w = window.innerWidth;
    if (w <= 640) return 'mobile';
    if (w <= 1024) return 'kiosk';
    return 'landing';
  });

  useEffect(() => {
    document.title = 'D4U Restaurant — Online Ordering';
    const onResize = () => {
      const w = window.innerWidth;
      if (w <= 640) setViewMode('mobile');
      else if (w <= 1024) setViewMode('kiosk');
      else setViewMode('landing');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleAddToCart = (item: FoodItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.foodItem.id === item.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { foodItem: item, quantity: 1 }];
    });
  };

  const handleDecreaseQuantity = (itemId: string) => {
    setCart(prev =>
      prev.map(c => c.foodItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
         .filter(c => c.quantity > 0)
    );
  };

  const handleIncreaseQuantity = (itemId: string) => {
    setCart(prev =>
      prev.map(c => c.foodItem.id === itemId ? { ...c, quantity: c.quantity + 1 } : c)
    );
  };

  const handleRemoveFromCart = (itemId: string, removeAll?: boolean) => {
    if (removeAll) {
      setCart(prev => prev.filter(c => c.foodItem.id !== itemId));
    } else {
      setCart(prev => prev.filter(c => c.foodItem.id !== itemId));
    }
  };

  const handleClearCart = () => setCart([]);

  if (viewMode === 'mobile') {
    return (
      <MobileMode
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onDecreaseQuantity={handleDecreaseQuantity}
        onIncreaseQuantity={handleIncreaseQuantity}
        onClearCart={handleClearCart}
      />
    );
  }

  if (viewMode === 'kiosk') {
    return (
      <KioskMode
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onDecreaseQuantity={handleDecreaseQuantity}
        onIncreaseQuantity={handleIncreaseQuantity}
        onClearCart={handleClearCart}
      />
    );
  }

  return (
    <LandingMode
      cart={cart}
      onAddToCart={handleAddToCart}
      onRemoveFromCart={handleRemoveFromCart}
      onDecreaseQuantity={handleDecreaseQuantity}
      onIncreaseQuantity={handleIncreaseQuantity}
      onClearCart={handleClearCart}
    />
  );
}
