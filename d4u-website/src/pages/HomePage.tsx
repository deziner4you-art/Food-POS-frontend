import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BACKEND_URL } from '../hooks/useStoreData';

export default function HomePage() {
  const { banners } = useStore();
  const navigate = useNavigate();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const activeBanner = banners && banners.length > 0 ? banners[currentBannerIndex] : null;

  return (
    <div>
      <section className="relative w-full min-h-[420px] sm:h-[500px] bg-stitch-panel flex items-center overflow-hidden transition-all duration-700">
        <div className="absolute inset-0 z-0">
          <div key={activeBanner ? activeBanner.id : 'default'} className="absolute inset-0 w-full h-full animate-fade-in">
            <img
              alt={activeBanner ? activeBanner.title : 'Delicious Premium Angus Burger'}
              className="w-full h-full object-cover opacity-60 sm:opacity-80 animate-pan-zoom"
              src={activeBanner ? `${BACKEND_URL}${activeBanner.imageUrl}` : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80'}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-stitch-bg/90 via-stitch-bg/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full animate-fade-in" key={`text-${currentBannerIndex}`}>
          <div className="max-w-2xl bg-stitch-bg/40 p-8 sm:p-12 rounded-[2rem] border border-stitch-border shadow-2xl">
            <span className="inline-block bg-stitch-accent text-stitch-accent-ink text-[10px] sm:text-xs font-black px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              Featured
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-none mb-4 text-stitch-ink">
              {activeBanner ? (
                <>
                  {(activeBanner.title || '').split(' ').slice(0, -1).join(' ')}
                  <br />
                  <span className="text-stitch-accent">{(activeBanner.title || '').split(' ').slice(-1).join(' ')}</span>
                </>
              ) : (
                <>
                  Delicious
                  <br />
                  <span className="text-stitch-accent">Food</span>
                </>
              )}
            </h1>
            <p className="mt-2 max-w-lg text-sm sm:text-lg text-stitch-muted mb-6">
              {activeBanner ? activeBanner.subtitle : 'Freshly prepared, delivered fast — order from our full menu now.'}
            </p>
            <button
              onClick={() => (activeBanner?.linkUrl ? (window.location.href = activeBanner.linkUrl) : navigate('/menu'))}
              className="bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink font-extrabold py-3 px-8 rounded-full flex items-center gap-2 transition duration-300 transform hover:scale-105 accent-glow"
            >
              {activeBanner?.buttonText || 'ORDER NOW'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {banners && banners.length > 1 && (
          <div className="absolute bottom-6 right-6 flex space-x-2 z-10">
            {banners.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'w-10 bg-stitch-accent' : 'w-2 bg-stitch-muted/50 hover:bg-stitch-muted'}`}
              />
            ))}
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <button onClick={() => navigate('/promotions')} className="text-stitch-accent font-bold hover:underline flex items-center gap-1 mx-auto">
          View Today&apos;s Promotions <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
