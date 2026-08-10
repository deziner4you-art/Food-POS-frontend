import React from 'react';
import { Promotion, ActiveWebsitePage } from '../types';
import { ArrowRight } from 'lucide-react';
import PromoSlider, { type PromoSlide } from '../components/shared/PromoSlider';

interface PromotionsPageProps {
  promotions: Promotion[];
  setActivePage: (page: ActiveWebsitePage) => void;
}

// Pure showcase -- campaigns already discount automatically the instant a
// matching item is added to cart (see cartMath.ts's getPromoDiscount), so
// this page no longer lets a customer "apply" a campaign a second time via a
// coupon code (that used to silently double-discount the same item). It's
// just a big hero slider up top and a smaller strip below, both cycling
// through the same live campaign list.
export const PromotionsPage: React.FC<PromotionsPageProps> = ({ promotions, setActivePage }) => {
  const slides: PromoSlide[] = promotions.map((promo) => ({
    id: promo.id,
    image: promo.bannerImageUrl,
    title: promo.title,
    subtitle: promo.description,
    badgeText: promo.badgeText,
  }));

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
          <PromoSlider slides={slides} variant="small" />
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
