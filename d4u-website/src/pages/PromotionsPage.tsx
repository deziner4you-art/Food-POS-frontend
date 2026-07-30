import React, { useState } from 'react';
import { Promotion, ActiveWebsitePage } from '../types';
import { Tag, Flame, Copy, Check, ArrowRight, Sparkles } from 'lucide-react';

interface PromotionsPageProps {
  promotions: Promotion[];
  setActivePage: (page: ActiveWebsitePage) => void;
  onApplyPromoCode: (promo: Promotion) => void;
}

export const PromotionsPage: React.FC<PromotionsPageProps> = ({
  promotions,
  setActivePage,
  onApplyPromoCode,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (promo: Promotion) => {
    navigator.clipboard.writeText(promo.code);
    setCopiedCode(promo.code);
    onApplyPromoCode(promo);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-10 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold px-3.5 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Marketing Hub Special Deals
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
          Exclusive Promotions &amp; Coupons
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Save big on your next enterprise dining order. Copy your preferred coupon code below or apply directly to your active cart.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-[#16130B] border border-white/10 hover:border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between gold-glow-hover transition-all duration-300"
          >
            <div className="relative h-48 bg-[#1A1A1D]">
              <img
                src={promo.bannerImageUrl}
                alt={promo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#16130B] via-transparent to-black/30" />
              <span className="absolute top-4 left-4 bg-[#D4AF37] text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-lg">
                {promo.badgeText}
              </span>
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-white font-display">{promo.title}</h3>
                <div className="text-xs text-[#D4AF37] font-semibold">{promo.subtitle}</div>
                <p className="text-xs text-gray-400 leading-relaxed">{promo.description}</p>
                {promo.minOrderValue && (
                  <div className="text-[11px] text-gray-500">
                    Min order amount: ${promo.minOrderValue.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between bg-[#1A1A1D] border border-white/10 rounded-xl p-3">
                  <div className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#D4AF37]" /> {promo.code}
                  </div>
                  <button
                    onClick={() => handleCopy(promo)}
                    className="bg-[#D4AF37] text-black font-extrabold text-xs px-3 py-1.5 rounded-lg hover:bg-[#ffe088] transition-colors flex items-center gap-1.5"
                  >
                    {copiedCode === promo.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-black" /> Applied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setActivePage('menu')}
                  className="w-full bg-[#1A1A1D] hover:bg-[#25252A] text-white text-xs font-bold py-2.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  Apply &amp; Order Menu <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
