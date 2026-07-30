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
  return (
    <div className="group bg-[#16130B] border border-white/10 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between gold-glow-hover">
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1A1A1D]">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16130B] via-transparent to-black/40 opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          {product.isDiscounted && product.discountPercentage && (
            <span className="bg-gradient-to-r from-amber-500 to-[#D4AF37] text-black font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
              <Flame className="w-3 h-3 fill-black" /> -{product.discountPercentage}% OFF
            </span>
          )}

          {product.isBestSeller && (
            <span className="bg-[#1A1A1D]/90 text-[#D4AF37] border border-[#D4AF37]/40 font-bold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md">
              👑 Bestseller
            </span>
          )}
        </div>

        {/* Favorite & Quick View Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isFavorite
                ? 'bg-rose-500 text-white shadow-lg'
                : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80 backdrop-blur-md'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => onQuickView(product)}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-gray-300 hover:text-[#D4AF37] backdrop-blur-md flex items-center justify-center transition-colors"
            title="Quick View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Stock Status Badge */}
        <div className="absolute bottom-3 left-3">
          {product.stockCount > 0 ? (
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              In Stock: {product.stockCount}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Card Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Tags — rating/review count only shown once real review data exists (never fabricated) */}
          {(product.rating > 0 || product.prepTimeMinutes) && (
            <div className="flex items-center gap-2 mb-1.5 text-[11px] text-gray-400">
              {product.rating > 0 && (
                <>
                  <span className="flex items-center gap-1 text-[#D4AF37] font-semibold">
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37]" /> {product.rating.toFixed(1)}
                  </span>
                  <span>({product.reviewCount} reviews)</span>
                </>
              )}
              {product.prepTimeMinutes && (
                <span className="ml-auto text-gray-500">• {product.prepTimeMinutes} mins</span>
              )}
            </div>
          )}

          <h3 className="text-base font-bold text-white font-display line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Footer Price & Add To Cart Button */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-gray-400 font-medium">Price</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-[#D4AF37] font-display">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-gray-500 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.isAvailable || product.stockCount === 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
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
