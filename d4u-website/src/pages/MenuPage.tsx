import React, { useState } from 'react';
import {
  CategoryGroup,
  Category,
  Product
} from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  Search,
  Flame,
  Star,
  Grid,
  List,
  UtensilsCrossed,
  Layers,
} from 'lucide-react';

interface MenuPageProps {
  categoryGroups: CategoryGroup[];
  categories: Category[];
  products: Product[];
  // Category name to pre-select on load — set when arriving here via a
  // Featured Category card on the Home page (see App.tsx MenuRoute, which
  // reads it from ?category=). Only applied on mount, same as any other
  // useState initial value.
  initialCategoryFilter?: string | null;
  onQuickViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  favoriteProductIds: string[];
  onToggleFavorite: (productId: string) => void;
  cartItems: { [productId: string]: number };
}

export const MenuPage: React.FC<MenuPageProps> = ({
  categoryGroups,
  categories,
  products,
  initialCategoryFilter,
  onQuickViewProduct,
  onAddToCart,
  favoriteProductIds,
  onToggleFavorite,
  cartItems,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(initialCategoryFilter ?? null);
  const [specialFilter, setSpecialFilter] = useState<'all' | 'discounted' | 'bestsellers' | 'spicy'>(
    'all'
  );
  const [menuSearch, setMenuSearch] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'rating'>('popular');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Filter products based on hierarchy selection
  const filteredProducts = products.filter((p) => {
    // 1. Menu Search
    if (
      menuSearch.trim() &&
      !p.name.toLowerCase().includes(menuSearch.toLowerCase()) &&
      !p.shortDescription.toLowerCase().includes(menuSearch.toLowerCase()) &&
      !p.tags.some((t) => t.toLowerCase().includes(menuSearch.toLowerCase()))
    ) {
      return false;
    }

    // 2. Special Quick Filter
    if (specialFilter === 'discounted' && !p.isDiscounted) return false;
    if (specialFilter === 'bestsellers' && !p.isBestSeller) return false;
    if (specialFilter === 'spicy' && !p.tags.some((t) => t.toLowerCase().includes('spicy'))) {
      return false;
    }

    // 3. Category Filter
    if (selectedCategoryFilter && p.categoryId !== selectedCategoryFilter) {
      return false;
    }

    // 4. Category Group Filter
    if (
      selectedGroupFilter &&
      !selectedCategoryFilter &&
      p.categoryGroupId !== selectedGroupFilter
    ) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.reviewCount || 0) - (a.reviewCount || 0); // Default popularity
  });

  const activeCategoryObj = categories.find((c) => c.id === selectedCategoryFilter);
  const activeGroupObj = categoryGroups.find((g) => g.id === selectedGroupFilter);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider flex items-center gap-1">
            <UtensilsCrossed className="w-3.5 h-3.5" /> D4U POS Synced Menu Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">
            Restaurant Menu &amp; Ordering Catalog
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Select items directly from our live kitchen database with custom modifiers and real-time stock levels.
          </p>
        </div>

        {/* View Layout & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#1A1A1D] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-2 rounded-lg text-xs transition-colors ${
                viewLayout === 'grid'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Grid Layout View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`p-2 rounded-lg text-xs transition-colors ${
                viewLayout === 'list'
                  ? 'bg-[#D4AF37] text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List Layout View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#1A1A1D] text-white text-xs px-3 py-2.5 rounded-xl border border-white/10 focus:border-[#D4AF37] outline-none font-semibold cursor-pointer"
            >
              <option value="popular">Sort By: Popularity</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* CATEGORY GROUP ROW -- top-level browsing: pick a group, then a category
          appears below it, then the product grid on the right reflects both. */}
      <div className="bg-[#121215] border border-white/10 rounded-2xl p-4 mb-6 space-y-4">
        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Category Group</span>
            <span className="text-[#D4AF37] text-[10px] normal-case tracking-normal">Synced KDS</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryGroups.map((group) => {
              const isGroupActive = selectedGroupFilter === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupFilter(isGroupActive ? null : group.id);
                    setSelectedCategoryFilter(null);
                    setSpecialFilter('all');
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isGroupActive
                      ? 'bg-[#D4AF37] text-black gold-glow'
                      : 'bg-[#1A1A1D] text-gray-300 border border-white/10 hover:border-[#D4AF37]/40 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {group.name}
                </button>
              );
            })}
          </div>
        </div>

        {activeGroupObj && (
          <div className="pt-3 border-t border-white/10">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Category — {activeGroupObj.name}
            </div>
            <div className="flex flex-wrap gap-2">
              {activeGroupObj.categories.filter((cat) => (cat.itemCount || 0) > 0).length === 0 ? (
                <span className="text-xs text-gray-500">No categories in this group yet.</span>
              ) : (
                activeGroupObj.categories
                  .filter((cat) => (cat.itemCount || 0) > 0)
                  .map((cat) => {
                    const isCatActive = selectedCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategoryFilter(isCatActive ? null : cat.id);
                          setSpecialFilter('all');
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                          isCatActive
                            ? 'bg-[#D4AF37] text-black shadow'
                            : 'bg-[#1A1A1D] text-gray-400 border border-white/10 hover:text-white hover:border-[#D4AF37]/40'
                        }`}
                      >
                        {cat.name} <span className="opacity-70">({cat.itemCount})</span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT POS SIDEBAR (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#121215] border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl">
            {/* Search Box in Menu Sidebar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search menu items..."
                className="w-full bg-[#1A1A1D] text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-white/10 focus:border-[#D4AF37] outline-none"
              />
            </div>

            {/* Quick Filters */}
            <div className="space-y-1.5 border-b border-white/10 pb-4">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Quick Shortcuts
              </div>

              <button
                onClick={() => {
                  setSpecialFilter('all');
                  setSelectedGroupFilter(null);
                  setSelectedCategoryFilter(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  specialFilter === 'all' && !selectedCategoryFilter && !selectedGroupFilter
                    ? 'bg-[#D4AF37] text-black font-extrabold gold-glow'
                    : 'bg-[#1A1A1D] text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>All Catalog Items</span>
                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setSpecialFilter('discounted');
                  setSelectedGroupFilter(null);
                  setSelectedCategoryFilter(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  specialFilter === 'discounted'
                    ? 'bg-amber-500 text-black font-extrabold shadow'
                    : 'bg-[#1A1A1D] text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-current" /> Discounted Deals 🔥
                </span>
                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                  {products.filter((p) => p.isDiscounted).length}
                </span>
              </button>

              <button
                onClick={() => {
                  setSpecialFilter('bestsellers');
                  setSelectedGroupFilter(null);
                  setSelectedCategoryFilter(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  specialFilter === 'bestsellers'
                    ? 'bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37]'
                    : 'bg-[#1A1A1D] text-gray-300 hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current" /> Chef's Bestsellers 👑
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">
                  {products.filter((p) => p.isBestSeller).length}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* MAIN PRODUCT DISPLAY AREA (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Active Filter Title */}
          <div className="bg-[#121215] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Viewing Filter:</span>
              <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                {activeCategoryObj
                  ? activeCategoryObj.name
                  : activeGroupObj
                  ? activeGroupObj.name
                  : specialFilter === 'discounted'
                  ? 'Discounted Deals'
                  : specialFilter === 'bestsellers'
                  ? 'Chef Bestsellers'
                  : 'All Items'}
              </span>
            </div>

            <div className="text-xs text-gray-400">
              Showing <span className="text-white font-bold">{sortedProducts.length}</span> dishes
            </div>
          </div>

          {/* Product Grid / List rendering */}
          {sortedProducts.length === 0 ? (
            <div className="bg-[#16130B] border border-white/10 rounded-3xl p-12 text-center space-y-3">
              <UtensilsCrossed className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-lg font-bold text-white font-display">No dishes match your filter</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Try clearing your search query or selecting a different POS category from the left sidebar.
              </p>
              <button
                onClick={() => {
                  setSelectedCategoryFilter(null);
                  setSelectedGroupFilter(null);
                  setSpecialFilter('all');
                  setMenuSearch('');
                }}
                className="bg-[#D4AF37] text-black text-xs font-bold px-6 py-2.5 rounded-full gold-glow"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={onQuickViewProduct}
                  onAddToCart={onAddToCart}
                  isFavorite={favoriteProductIds.includes(product.id)}
                  onToggleFavorite={onToggleFavorite}
                  cartItemCount={cartItems[product.id] || 0}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-[#16130B] border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl transition-all"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white font-display">
                          {product.name}
                        </h3>
                        {product.isDiscounted && (
                          <span className="bg-[#D4AF37] text-black font-bold text-[10px] px-2 py-0.5 rounded-full">
                            -{product.discountPercentage}% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {product.shortDescription}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="text-[#D4AF37] font-bold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#D4AF37]" /> {product.rating.toFixed(1)}
                        </span>
                        <span>({product.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-[#D4AF37] font-display">
                        ${product.price.toFixed(2)}
                      </div>
                      {product.originalPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQuickViewProduct(product)}
                        className="bg-[#1A1A1D] border border-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl hover:border-[#D4AF37]/50"
                      >
                        Quick View
                      </button>
                      <button
                        onClick={() => onAddToCart(product)}
                        className="bg-[#D4AF37] text-black text-xs font-extrabold px-4 py-2 rounded-xl gold-glow hover:bg-[#ffe088]"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
