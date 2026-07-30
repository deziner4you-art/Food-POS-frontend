import { useEffect, useState } from 'react';
import { Search, ShoppingBag, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';

function getProductDiscount(product: any, campaigns: any[], storeId: number | null): number {
  if (product.id && product.id.toString().includes('-')) return 0;
  if (['extra toppings', 'add-ons', 'addons'].includes((product.category || '').toLowerCase())) return 0;

  let maxDiscount = 0;
  for (const camp of campaigns || []) {
    if (!camp.published_web) continue;
    const hasStoreTarget = camp.target_stores?.length > 0;
    const hasCategoryTarget = camp.target_categories?.length > 0;
    const hasProductTarget = camp.target_products?.length > 0;
    const sid = storeId || 1;
    const storeMatches = hasStoreTarget ? camp.target_stores.some((s: any) => s.id === sid) : true;
    if (!storeMatches) continue;
    const categoryMatches = hasCategoryTarget && camp.target_categories.some((c: any) => c.name === product.category);
    const productMatches = hasProductTarget && camp.target_products.some((p: any) => p.id === product.id);
    const noSpecificTargets = !hasCategoryTarget && !hasProductTarget;
    if (noSpecificTargets || categoryMatches || productMatches) {
      if (camp.discount_pct > maxDiscount) maxDiscount = camp.discount_pct;
    }
  }
  return maxDiscount;
}

export default function MenuPage({ initialCategory }: { initialCategory?: string }) {
  const { foodItems, campaigns, storeId, addToCart, kioskMode } = useStore();

  const CATEGORY_GROUPS = Array.from(new Set(foodItems.map((f) => f.categoryGroup).filter(Boolean))) as string[];
  const [activeCategoryGroup, setActiveCategoryGroup] = useState('');

  const CATEGORIES: string[] = Array.from(
    new Set(
      foodItems
        .filter((f) => CATEGORY_GROUPS.length === 0 || f.categoryGroup === activeCategoryGroup || !activeCategoryGroup)
        .map((f) => f.category),
    ),
  ).filter((c) => !['extra toppings', 'add-ons', 'addons'].includes((c || '').toLowerCase()));

  const [activeCategory, setActiveCategory] = useState(initialCategory || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (CATEGORY_GROUPS.length > 0 && !activeCategoryGroup) setActiveCategoryGroup(CATEGORY_GROUPS[0]);
  }, [CATEGORY_GROUPS.join(','), activeCategoryGroup]);

  useEffect(() => {
    if (CATEGORIES.length > 0 && !activeCategory) setActiveCategory(CATEGORIES[0]);
    else if (CATEGORIES.length > 0 && !CATEGORIES.includes(activeCategory)) setActiveCategory(CATEGORIES[0]);
  }, [CATEGORIES.join(','), activeCategory]);

  const filteredProducts = foodItems.filter((prod) => {
    const isExempt = ['extra toppings', 'add-ons', 'addons'].includes((prod.category || '').toLowerCase());
    let matchesCategory = true;
    if (activeCategory === 'Discounted') matchesCategory = getProductDiscount(prod, campaigns, storeId) > 0;
    else if (activeCategory && activeCategory !== 'All Items') matchesCategory = prod.category === activeCategory;
    else if (activeCategory === 'All Items') matchesCategory = !isExempt;

    const matchesSearch =
      (prod.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="menu-grid-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8">
      <aside className={`${kioskMode ? 'w-48' : 'lg:w-64'} lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start`}>
        <div className="bg-stitch-card rounded-2xl p-2 border border-stitch-border flex lg:block items-center justify-between">
          <div className="flex-1 flex lg:flex-col gap-2 lg:gap-1 items-stretch px-2 lg:px-1 py-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[75vh] custom-scrollbar">
            {CATEGORY_GROUPS.length > 0 &&
              CATEGORY_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => { setActiveCategoryGroup(group); setActiveCategory(''); }}
                  className={`text-left px-4 py-2 lg:py-3 rounded-xl transition font-bold text-sm lg:text-[15px] whitespace-nowrap lg:whitespace-normal
                    ${activeCategoryGroup === group ? 'bg-stitch-accent text-stitch-accent-ink shadow-md' : 'text-stitch-muted hover:text-stitch-ink hover:bg-stitch-surface'}`}
                >
                  {group}
                </button>
              ))}
            {CATEGORY_GROUPS.length > 0 && <div className="hidden lg:block w-full h-[1px] bg-stitch-border my-2"></div>}

            {['All Items', 'Discounted', ...CATEGORIES].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 min-w-max lg:min-w-0 lg:w-full px-5 py-2.5 rounded-full lg:rounded-xl font-bold text-sm tracking-wide transition cursor-pointer text-left ${
                  activeCategory === category ? 'bg-stitch-accent text-stitch-accent-ink' : 'bg-stitch-surface/60 text-stitch-muted hover:text-stitch-ink hover:bg-stitch-surface'
                }`}
              >
                {category === 'Discounted' ? <span className="text-base leading-none">🔥</span> : <Sparkles className="w-4 h-4 shrink-0" />}
                {category}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl sm:text-4xl font-black text-stitch-accent tracking-tight">{activeCategory}</h2>
          <div className="flex items-center gap-4 max-w-md w-full justify-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stitch-muted" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stitch-surface border border-stitch-border rounded-full pl-9 pr-4 py-2 text-sm text-stitch-ink focus:outline-none focus:border-stitch-accent"
              />
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-stitch-card rounded-3xl border border-stitch-border">
            <ShoppingBag className="w-12 h-12 text-stitch-muted mx-auto mb-3" />
            <p className="text-stitch-muted font-bold">No products found matching your search.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${kioskMode ? 'xl:grid-cols-2' : 'xl:grid-cols-3'} gap-8`}>
            {filteredProducts.map((product) => {
              const discount = getProductDiscount(product, campaigns, storeId);
              return (
                <div key={product.id} className="bg-stitch-card border border-stitch-border rounded-3xl overflow-hidden relative group hover:border-stitch-accent/30 transition-all duration-300">
                  <div className="aspect-square relative overflow-hidden bg-stitch-surface">
                    {discount > 0 && (
                      <div className="absolute top-0 left-0 bg-stitch-accent text-stitch-accent-ink text-xs font-black px-3 py-1.5 rounded-br-2xl shadow-lg z-20 flex items-center gap-1">
                        <span>🔥</span> {discount}% OFF
                      </div>
                    )}
                    <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image} />
                    <div className="absolute inset-0 bg-gradient-to-t from-stitch-bg/95 via-stitch-bg/40 to-transparent"></div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end">
                    <div className="flex-1 pr-3">
                      <h3 className="text-stitch-ink font-black text-lg sm:text-xl tracking-tight mb-1">{product.name}</h3>
                      <p className="text-stitch-muted text-xs line-clamp-1 mb-2 leading-snug">{product.description}</p>
                    </div>
                    <div className="flex items-end justify-between mt-4 relative z-10">
                      <div>
                        <p className="text-sm text-stitch-muted font-bold tracking-widest uppercase mb-1">{product.category}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-black text-stitch-accent">
                            Rs. {discount > 0 ? (product.priceRs * (1 - discount / 100)).toFixed(0) : product.priceRs}
                          </p>
                          {discount > 0 && <p className="text-stitch-muted text-sm line-through">Rs. {product.priceRs}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className={`${kioskMode ? 'w-14 h-14' : 'w-11 h-11'} bg-stitch-panel hover:bg-stitch-accent text-stitch-ink hover:text-stitch-accent-ink rounded-full flex items-center justify-center transition shadow-lg shrink-0`}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
