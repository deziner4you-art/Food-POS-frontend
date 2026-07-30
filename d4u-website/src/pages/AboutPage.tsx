import { useStore } from '../context/StoreContext';

export default function AboutPage() {
  const { settings, storeName } = useStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <p className="text-stitch-accent text-xs font-black uppercase tracking-widest mb-2">Our Story</p>
      <h2 className="text-3xl sm:text-4xl font-black mb-4 text-stitch-ink">ABOUT {storeName?.toUpperCase()}</h2>
      <p className="text-stitch-muted mb-12 max-w-xl mx-auto text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
        {settings?.aboutText || 'The future of fast-casual dining. Premium culinary quality fused with state-of-the-art POS ordering mechanisms.'}
      </p>
    </div>
  );
}
