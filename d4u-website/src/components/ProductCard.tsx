import React from 'react';
import { Product } from '../types';
import { Star, Heart, Eye, Plus, Check, Flame, ShieldAlert } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  cartItemCount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
  cartItemCount = 0,
}) => {
  const hasVariants = !!product.variants && product.variants.length > 0;
  const hasModifiers = !!product.modifierGroups && product.modifierGroups.length > 0;
  const needsCustomization = hasVariants || hasModifiers;

  return (
    <div className="group relative bg-[#16130B] border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between gold-glow-hover">
      
      {/* Top Metallic Background */}
      <div className="absolute top-0 left-0 right-0 h-[220px] bg-gradient-to-b from-[#e5e5e5] via-[#a3a3a3] to-[#16130B] opacity-90" />

      {/* Top Icons */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-lg'
              : 'bg-black/40 text-gray-200 hover:text-white hover:bg-black/60 backdrop-blur-sm'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={() => onQuickView(product)}
          className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-gray-200 hover:text-white backdrop-blur-sm flex items-center justify-center transition-colors"
          title="Quick View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Image Container */}
      <div className="relative z-10 flex flex-col items-center pt-10 pb-4">
        <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl relative border-4 border-transparent">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        {/* Badges positioned relative to the card, left-aligned near image bottom.
            Only Discounted / Sold Out are shown -- a raw "In Stock: N" count
            doesn't apply to a restaurant menu (no real per-item inventory
            tracking behind it), so it's never shown here. */}
        <div className="absolute bottom-6 left-5 flex flex-col gap-1">
          {product.isDiscounted && product.discountPercentage && (
            <span className="bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-extrabold text-[10px] px-2.5 py-1 rounded shadow-md flex items-center gap-1 uppercase tracking-wider w-fit">
              <Flame className="w-3 h-3 fill-black" /> -{product.discountPercentage}% OFF
            </span>
          )}
          {product.stockCount === 0 && (
            <span className="text-[10px] font-semibold text-rose-100 bg-rose-600 px-2 py-0.5 rounded shadow w-fit">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Card Details Body */}
      <div className="relative z-10 p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white font-display line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Footer Price & Add To Cart Button */}
        <div className="flex items-end justify-between">
          <div>
            {hasVariants ? (
              <>
                <div className="text-[10px] text-gray-400 font-medium mb-0.5">&nbsp;</div>
                <span className="text-xl font-extrabold text-[#D4AF37] font-display">Choose Size</span>
              </>
            ) : (
              <>
                <div className="text-[10px] text-gray-400 font-medium mb-0.5">Price</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-[#D4AF37] font-display">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-gray-500 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => (needsCustomization ? onQuickView(product) : onAddToCart(product))}
            disabled={!product.isAvailable || product.stockCount === 0}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              cartItemCount > 0
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 font-extrabold'
                : 'bg-[#D4AF37] text-black hover:bg-[#ffe088] gold-glow'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cartItemCount > 0 ? (
              <>
                <Check className="w-4 h-4" /> Added ({cartItemCount})
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add To Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
