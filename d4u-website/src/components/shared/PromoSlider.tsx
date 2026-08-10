import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';

export interface PromoSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
}

interface PromoSliderProps {
  slides: PromoSlide[];
  variant: 'large' | 'small';
}

// Pure showcase slider -- mirrors the auto-advancing crossfade hero already
// proven on HomePage.tsx (currentSlideIndex + setInterval + dot/arrow
// controls), extracted as its own reusable component since the Promotions
// page needs two independent instances of it (a big hero-style one and a
// smaller strip below). No apply/redeem action lives here anymore --
// campaigns already discount automatically when added to cart, so this is
// display only.
export default function PromoSlider({ slides, variant }: PromoSliderProps) {
  const [index, setIndex] = useState(0);
  const isLarge = variant === 'large';

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, isLarge ? 6000 : 4000);
    return () => clearInterval(interval);
  }, [slides.length, isLarge]);

  if (slides.length === 0) return null;

  const active = slides[index] || slides[0];

  return (
    <section
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0C0C0E] flex items-center ${
        isLarge ? 'min-h-[420px] lg:min-h-[520px]' : 'min-h-[160px] lg:min-h-[200px]'
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
        style={{ backgroundImage: `url(${active.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0E]/90 via-[#0C0C0E]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0E]/80 via-transparent to-[#0C0C0E]/30" />

      <div className={`relative z-10 w-full ${isLarge ? 'px-6 sm:px-10 py-10' : 'px-4 sm:px-6 py-5'}`}>
        <div className={isLarge ? 'max-w-2xl space-y-4' : 'max-w-md space-y-2'}>
          {active.badgeText && (
            <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              <Tag className="w-3 h-3" /> {active.badgeText}
            </span>
          )}
          <h3 className={`font-extrabold text-white font-display leading-tight ${isLarge ? 'text-2xl sm:text-4xl' : 'text-base sm:text-lg'}`}>
            {active.title}
          </h3>
          {active.subtitle && (
            <p className={`text-gray-300 ${isLarge ? 'text-sm sm:text-base max-w-xl' : 'text-xs line-clamp-1'}`}>{active.subtitle}</p>
          )}
        </div>

        {slides.length > 1 && (
          <div className={`flex items-center gap-3 ${isLarge ? 'mt-6' : 'mt-3'}`}>
            <div className="flex items-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Show slide ${i + 1}`}
                  className={`rounded-full transition-all ${isLarge ? 'h-2' : 'h-1.5'} ${
                    index === i ? `${isLarge ? 'w-8' : 'w-5'} bg-[#D4AF37]` : `${isLarge ? 'w-2' : 'w-1.5'} bg-white/20 hover:bg-white/40`
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                aria-label="Previous slide"
                className={`rounded-full bg-[#1A1A1D] border border-white/10 text-white flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors ${isLarge ? 'w-8 h-8' : 'w-6 h-6'}`}
              >
                <ChevronLeft className={isLarge ? 'w-4 h-4' : 'w-3 h-3'} />
              </button>
              <button
                onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
                aria-label="Next slide"
                className={`rounded-full bg-[#1A1A1D] border border-white/10 text-white flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-colors ${isLarge ? 'w-8 h-8' : 'w-6 h-6'}`}
              >
                <ChevronRight className={isLarge ? 'w-4 h-4' : 'w-3 h-3'} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
