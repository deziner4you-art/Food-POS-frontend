import React, { useState, useEffect } from 'react';
import {
  HeroSlide,
  Promotion,
  CategoryGroup,
  Category,
  Product,
  RestaurantService,
  StaffMember,
  Branch,
  CustomerReview,
  ActiveWebsitePage
} from '../types';
import { Hero3DCanvas } from '../components/Hero3DCanvas';
import { ProductCard } from '../components/ProductCard';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Star,
  Zap,
  Sparkles,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  Smartphone,
  Copy,
  Check,
  Heart,
  UtensilsCrossed
} from 'lucide-react';

interface HomePageProps {
  heroSlides: HeroSlide[];
  promotions: Promotion[];
  categoryGroups: CategoryGroup[];
  categories: Category[];
  products: Product[];
  services: RestaurantService[];
  staff: StaffMember[];
  branches: Branch[];
  reviews: CustomerReview[];
  setActivePage: (page: ActiveWebsitePage) => void;
  onQuickViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  favoriteProductIds: string[];
  onToggleFavorite: (productId: string) => void;
  cartItems: { [productId: string]: number };
}

export const HomePage: React.FC<HomePageProps> = ({
  heroSlides,
  promotions,
  categoryGroups,
  categories,
  products,
  services,
  staff,
  branches,
  reviews,
  setActivePage,
  onQuickViewProduct,
  onAddToCart,
  favoriteProductIds,
  onToggleFavorite,
  cartItems,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0]?.id || '');
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null);

  const visibleSlides = heroSlides.filter((s) => s.isVisible);

  // Auto sliding hero banner
  useEffect(() => {
    if (visibleSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % visibleSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [visibleSlides.length]);

  const activeSlide = visibleSlides[currentSlideIndex] || visibleSlides[0];

  const bestSellerProducts = products.filter((p) => p.isBestSeller || p.rating >= 4.9).slice(0, 4);
  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPromoCode(code);
    setTimeout(() => setCopiedPromoCode(null), 2500);
  };

  return (
    <div className="space-y-16 pb-16 animate-fade-in">
      {/* 1. HERO SECTION WITH 3D CANVAS & AUTOSLIDER */}
      <section className="relative w-full min-h-[600px] lg:min-h-[680px] bg-[#0C0C0E] overflow-hidden flex items-center border-b border-white/10">
        {/* Background Image Slide Transition */}
        {activeSlide && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105 opacity-60"
            style={{ backgroundImage: `url(${activeSlide.desktopImageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0E]/90 via-[#0C0C0E]/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E]/80 via-transparent to-[#0C0C0E]/40 z-10" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 relative z-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Content Left (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold px-3.5 py-1.5 rounded-full gold-glow">
              <Sparkles className="w-3.5 h-3.5" /> D4U Restaurant ERP SaaS Ecosystem
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white font-display leading-[1.1] tracking-tight">
              {activeSlide?.title} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-300 to-[#8C6D1F]">
                {activeSlide?.highlightText}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed font-normal">
              {activeSlide?.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setActivePage('menu')}
                className="bg-[#D4AF37] text-black font-extrabold px-8 py-4 rounded-xl hover:bg-[#ffe088] transition-all text-sm shadow-xl gold-glow flex items-center gap-2"
              >
                Order Now <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePage('promotions')}
                className="bg-[#1A1A1D] border border-white/15 text-white font-bold px-6 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-[#D4AF37]" /> View Today's Promos
              </button>
            </div>

            {/* Slider Dots & Controls */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                {visibleSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlideIndex === idx
                        ? 'w-8 bg-[#D4AF37] gold-glow'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() =>
                    setCurrentSlideIndex((prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length)
                  }
                  className="w-9 h-9 rounded-full bg-[#1A1A1D] border border-white/10 text-white flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentSlideIndex((prev) => (prev + 1) % visibleSlides.length)
                  }
                  className="w-9 h-9 rounded-full bg-[#1A1A1D] border border-white/10 text-white flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Hero 3D Interactive Presentation Right (5 cols) */}
          <div className="lg:col-span-5 relative h-[380px] lg:h-[450px]">
            <Hero3DCanvas />
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-16">
        {/* 2. TODAY'S PROMOTIONS (Loaded from Marketing Hub CMS) */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-[#D4AF37]" /> Marketing Hub Offers
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Today's Best Promotions
              </h2>
            </div>
            <button
              onClick={() => setActivePage('promotions')}
              className="text-xs text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
            >
              Explore All Offers <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* At least 3 cards shown side by side; beyond 3 the row scrolls/slides
              horizontally (snap-scroll) instead of wrapping to a new row. */}
          <div className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth -mx-1 px-1">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                onClick={() => setActivePage('promotions')}
                role="button"
                tabIndex={0}
                className="group relative rounded-2xl overflow-hidden bg-[#16130B] border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 shadow-xl flex flex-col justify-between gold-glow-hover h-64 flex-none w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] snap-start cursor-pointer"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-40"
                  style={{ backgroundImage: `url(${promo.bannerImageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16130B] via-[#16130B]/80 to-transparent" />

                <div className="relative p-6 space-y-2 z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="bg-[#D4AF37] text-black font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                      {promo.badgeText}
                    </span>
                    <h3 className="text-2xl font-extrabold text-white font-display mt-2">
                      {promo.title}
                    </h3>
                    <p className="text-xs text-[#D4AF37] font-semibold">{promo.subtitle}</p>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                      {promo.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyCode(promo.code); }}
                      className="bg-[#1A1A1D]/90 hover:bg-[#25252A] text-gray-200 border border-white/10 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono font-bold"
                    >
                      {copiedPromoCode === promo.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#D4AF37]" /> Code: {promo.code}
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); setActivePage('menu'); }}
                      className="bg-[#D4AF37] text-black text-xs font-extrabold px-4 py-1.5 rounded-lg gold-glow hover:bg-[#ffe088] transition-colors"
                    >
                      Claim Deal
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. FEATURED CATEGORIES */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
                Explore POS Categories
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Featured Categories
              </h2>
            </div>
            <button
              onClick={() => setActivePage('menu')}
              className="text-xs text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
            >
              View Full Menu <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActivePage('menu')}
                className="group bg-[#16130B] border border-white/10 hover:border-[#D4AF37] rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 shadow-lg"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 bg-[#1A1A1D] border border-white/10 group-hover:border-[#D4AF37]/50">
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h4 className="text-xs font-bold text-white font-display group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                  {cat.name}
                </h4>
              </button>
            ))}
          </div>
        </section>

        {/* 4. BEST SELLING PRODUCTS — hidden entirely until real bestseller/rating data exists (never fabricated) */}
        {bestSellerProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37]" /> Top Rated Selections
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Best Selling Dishes
              </h2>
            </div>
            <button
              onClick={() => setActivePage('menu')}
              className="text-xs text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
            >
              View All Dishes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellerProducts.slice(0, 4).map((product) => (
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
        </section>
        )}

        {/* 5. RESTAURANT SERVICES — no D4U backend source exists yet; hidden until one does */}
        {services.length > 0 && (
        <section className="bg-[#121215] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
              Enterprise POS Quality Assurance
            </h3>
            <h2 className="text-2xl font-extrabold text-white font-display">
              Why Diners Trust D4U ERP Platform
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((serv) => (
              <div
                key={serv.id}
                className="bg-[#1A1A1D] border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center space-y-3 gold-glow-hover transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white font-display">{serv.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{serv.description}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* 6. CUSTOMER REVIEWS — no D4U backend source exists yet; hidden until one does */}
        {reviews.length > 0 && (
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
              Verified Diner Feedback
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              What Our Guests Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#16130B] border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-300 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <img
                    src={rev.customerAvatar}
                    alt={rev.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-[#D4AF37]/40"
                  />
                  <div>
                    <div className="text-xs font-bold text-white font-display">
                      {rev.customerName}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Ordered: <span className="text-[#D4AF37]">{rev.orderedItemName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* 7. MEET OUR STAFF — no D4U backend source exists yet; hidden until one does */}
        {staff.length > 0 && (
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
              Culinary Leadership
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Meet Our Executive Culinary Team
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {staff.map((st) => (
              <div
                key={st.id}
                className="bg-[#16130B] border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden shadow-xl group transition-all"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#1A1A1D]">
                  <img
                    src={st.photoUrl}
                    alt={st.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-0.5 rounded-full inline-block font-bold">
                    {st.role} • {st.designation}
                  </div>
                  <h3 className="text-base font-bold text-white font-display">{st.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{st.bio}</p>
                  {st.specialtyDish && (
                    <div className="text-[11px] text-[#D4AF37] font-semibold pt-2 border-t border-white/10">
                      Signature Dish: {st.specialtyDish}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* 8. BRANCHES & MAP LOCATOR */}
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
              Enterprise Store Roster
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Our Branch Locations
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {branches.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`cursor-pointer bg-[#16130B] border rounded-2xl p-5 space-y-3 transition-all ${
                  selectedBranchId === b.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 gold-glow'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-display">{b.name}</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    Open Now
                  </span>
                </div>

                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" /> {b.address}
                </p>

                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> {b.phone}
                </p>

                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> {b.openingHours}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePage('contact');
                  }}
                  className="w-full mt-2 bg-[#1A1A1D] hover:bg-[#25252A] text-xs font-bold py-2 rounded-xl text-white border border-white/10 transition-colors"
                >
                  Get Directions & Reserve Table
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
