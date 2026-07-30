import React, { useState } from 'react';
import { UserProfile, Order, Product } from '../types';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Award,
  Star,
  RotateCcw,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface CustomerAccountPageProps {
  userProfile: UserProfile;
  orders: Order[];
  products: Product[];
  onOpenOrderTracker: (order: Order) => void;
  onReorder: (order: Order) => void;
  favoriteProductIds: string[];
  onQuickViewProduct: (product: Product) => void;
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  userProfile,
  orders,
  products,
  onOpenOrderTracker,
  onReorder,
  favoriteProductIds,
  onQuickViewProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses' | 'loyalty'>('orders');

  const favoriteProducts = products.filter((p) => favoriteProductIds.includes(p.id));

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-8 animate-fade-in">
      {/* Profile Banner Card */}
      <div className="bg-[#121215] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-black font-extrabold text-2xl flex items-center justify-center shadow-lg font-display">
            {userProfile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white font-display">
                {userProfile.name}
              </h1>
              <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs px-3 py-0.5 rounded-full font-bold">
                👑 {userProfile.loyaltyTier}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {userProfile.email} • {userProfile.phone}
            </p>
          </div>
        </div>

        {/* Loyalty Quick Badge */}
        <div className="bg-[#1A1A1D] border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative z-10 w-full md:w-auto justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              D4U Rewards Balance
            </div>
            <div className="text-xl font-extrabold text-[#D4AF37] font-display">
              {userProfile.loyaltyPoints} Points
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-[#D4AF37] text-black shadow gold-glow'
              : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Order History ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'wishlist'
              ? 'bg-[#D4AF37] text-black shadow gold-glow'
              : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" /> Saved Wishlist ({favoriteProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'addresses'
              ? 'bg-[#D4AF37] text-black shadow gold-glow'
              : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" /> Delivery Addresses
        </button>

        <button
          onClick={() => setActiveTab('loyalty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'loyalty'
              ? 'bg-[#D4AF37] text-black shadow gold-glow'
              : 'bg-[#1A1A1D] text-gray-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" /> Loyalty Rewards &amp; Perks
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-[#16130B] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl hover:border-[#D4AF37]/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] font-bold flex items-center justify-center">
                    #
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-display">
                      Order #{order.orderNumber}
                    </div>
                    <div className="text-xs text-gray-400">Placed: {order.createdAt}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      order.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {order.status === 'delivered'
                      ? 'Delivered'
                      : order.status === 'on_the_way'
                      ? 'Out for Delivery 🛵'
                      : 'Kitchen Preparing 👨‍🍳'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.cartItemId} className="flex items-center justify-between text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#D4AF37]">{item.quantity}x</span>
                      <span>{item.product.name}</span>
                    </div>
                    <span className="font-semibold text-white">${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Order Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-400">
                  Total Paid: <span className="text-base font-extrabold text-[#D4AF37] font-display ml-1">${order.totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => onOpenOrderTracker(order)}
                    className="flex-1 sm:flex-none bg-[#D4AF37] text-black font-extrabold text-xs px-4 py-2 rounded-xl gold-glow hover:bg-[#ffe088]"
                  >
                    <Truck className="w-3.5 h-3.5 inline mr-1" /> Live POS Tracker
                  </button>
                  <button
                    onClick={() => onReorder(order)}
                    className="flex-1 sm:flex-none bg-[#1A1A1D] border border-white/10 text-white font-bold text-xs px-4 py-2 rounded-xl hover:border-white/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline mr-1 text-[#D4AF37]" /> Re-Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProducts.length === 0 ? (
            <div className="col-span-full bg-[#16130B] border border-white/10 rounded-2xl p-12 text-center text-xs text-gray-400 space-y-2">
              <Heart className="w-8 h-8 text-rose-500 mx-auto" />
              <div>No favorite dishes saved yet. Click the heart icon on any product card!</div>
            </div>
          ) : (
            favoriteProducts.map((p) => (
              <div
                key={p.id}
                className="bg-[#16130B] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate font-display">{p.name}</h4>
                  <div className="text-xs font-extrabold text-[#D4AF37]">${p.price.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => onQuickViewProduct(p)}
                  className="bg-[#D4AF37] text-black text-xs font-bold px-3 py-1.5 rounded-lg"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userProfile.savedAddresses.map((addr) => (
            <div key={addr.id} className="bg-[#16130B] border border-white/10 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" /> {addr.label}
              </div>
              <div className="text-xs text-gray-400">{addr.address}</div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: LOYALTY */}
      {activeTab === 'loyalty' && (
        <div className="bg-[#16130B] border border-[#D4AF37]/30 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
                D4U Enterprise Tier Status
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display">
                Gold Loyalty VIP
              </h3>
            </div>
            <Award className="w-12 h-12 text-[#D4AF37]" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-300 font-semibold">
              <span>Current Balance: {userProfile.loyaltyPoints} Points</span>
              <span>Next Tier (Platinum): 2000 Points</span>
            </div>
            <div className="w-full bg-[#1A1A1D] h-3 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full gold-glow"
                style={{ width: `${(userProfile.loyaltyPoints / 2000) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-300 pt-2">
            <div className="bg-[#1A1A1D] p-4 rounded-xl space-y-1 border border-white/10">
              <div className="font-bold text-white">10% Cash Points Back</div>
              <div className="text-gray-400">Earn points automatically on every POS web order.</div>
            </div>
            <div className="bg-[#1A1A1D] p-4 rounded-xl space-y-1 border border-white/10">
              <div className="font-bold text-white">Free Priority Express</div>
              <div className="text-gray-400">Zero delivery fees on orders above $30.00.</div>
            </div>
            <div className="bg-[#1A1A1D] p-4 rounded-xl space-y-1 border border-white/10">
              <div className="font-bold text-white">Chef Table Access</div>
              <div className="text-gray-400">Early access to seasonal weekend tasting menus.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
