import React, { useEffect, useRef, useState } from 'react';
import { Promotion, ActiveWebsitePage } from '../types';
import { ArrowRight, Flame } from 'lucide-react';
import PromoSlider, { type PromoSlide } from '../components/shared/PromoSlider';

interface PromotionsPageProps {
  promotions: Promotion[];
  setActivePage: (page: ActiveWebsitePage) => void;
}

// Pure showcase -- campaigns already discount automatically the instant a
// matching item is added to cart (see cartMath.ts's getPromoDiscount), so
// this page no longer lets a customer "apply" a campaign a second time via a
// coupon code (that used to silently double-discount the same item). Just a
// big hero slider up top, then the same "Today's Best Promotions" auto-
// scrolling row already used on HomePage.tsx (ported verbatim, including its
// seamless-loop auto-scroll) instead of a second slider.
export const PromotionsPage: React.FC<PromotionsPageProps> = ({ promotions, setActivePage }) => {
  const slides: PromoSlide[] = promotions.map((promo) => ({
    id: promo.id,
    image: promo.bannerImageUrl,
    title: promo.title,
    subtitle: promo.description,
    badgeText: promo.badgeText,
  }));

  const promotionsRef = useRef<HTMLDivElement>(null);
  const [isPromotionsHovered, setIsPromotionsHovered] = useState(false);

  // Clone promotions for seamless looping if 4 or more
  const displayPromotions = promotions.length >= 4 ? [...promotions, ...promotions, ...promotions] : promotions;

  // Auto-scroll logic for promotions
  useEffect(() => {
    if (promotions.length < 4) return;
    const interval = setInterval(() => {
      if (!isPromotionsHovered && promotionsRef.current) {
        const container = promotionsRef.current;
        const firstSetWidth = container.scrollWidth / 3;

        // Seamless loop jump
        if (container.scrollLeft >= firstSetWidth * 2) {
          container.classList.remove('scroll-smooth');
          container.scrollLeft -= firstSetWidth;
          void container.offsetWidth; // force reflow
          container.classList.add('scroll-smooth');
        }

        const firstChild = container.firstElementChild as HTMLElement;
        const scrollAmount = firstChild ? firstChild.offsetWidth + 24 : container.clientWidth / 3; // 24px is gap-6

        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [promotions.length, isPromotionsHovered]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-10 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold px-3.5 py-1.5 rounded-full">
          Marketing Hub Special Deals
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
          Exclusive Promotions &amp; Offers
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Every deal below is already applied automatically when you add a matching item to your cart.
        </p>
      </div>

      {slides.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-16">No active promotions right now — check back soon!</div>
      ) : (
        <>
          <PromoSlider slides={slides} variant="large" />

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
            </div>

            {/* At least 3 cards shown side by side; beyond 3 the row scrolls/slides
                horizontally (snap-scroll) instead of wrapping to a new row. */}
            <div
              ref={promotionsRef}
              onMouseEnter={() => setIsPromotionsHovered(true)}
              onMouseLeave={() => setIsPromotionsHovered(false)}
              className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayPromotions.map((promo, index) => (
                <div
                  key={`${promo.id}-${index}`}
                  className="group relative rounded-2xl overflow-hidden bg-[#16130B] border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 shadow-xl flex flex-col gold-glow-hover h-64 flex-none w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] snap-start"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-40"
                    style={{ backgroundImage: `url(${promo.bannerImageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16130B] via-[#16130B]/80 to-transparent" />

                  <div className="relative p-6 space-y-2 z-10">
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
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="text-center pt-4">
        <button
          onClick={() => setActivePage('menu')}
          className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-extrabold px-8 py-3.5 rounded-xl hover:bg-[#ffe088] transition-all text-sm shadow-xl gold-glow"
        >
          Order From The Menu <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
