import { Link } from 'react-router-dom';
import { Globe, Share2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function Footer() {
  const { settings } = useStore();

  return (
    <footer className="bg-stitch-panel pt-12 pb-6 border-t border-stitch-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="text-stitch-accent font-black text-xl mb-4">{`${settings?.siteTitle || 'D4U Restaurant'}`}</h3>
            <p className="text-stitch-muted text-sm leading-relaxed mb-6 whitespace-pre-wrap">
              {`${settings?.aboutText || 'The future of fast-casual dining. Premium culinary quality fused with state-of-the-art POS ordering mechanisms.'}`}
            </p>
            <div className="flex space-x-4">
              {settings?.facebookUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"><Globe className="w-5 h-5" /></a>}
              {settings?.instagramUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><Share2 className="w-5 h-5" /></a>}
              {settings?.twitterUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.twitterUrl} target="_blank" rel="noreferrer" aria-label="Twitter"><Share2 className="w-5 h-5" /></a>}
              {settings?.youtubeUrl && <a className="text-stitch-muted hover:text-stitch-ink transition" href={settings.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube"><Share2 className="w-5 h-5" /></a>}
            </div>
          </div>

          <div>
            <h4 className="text-stitch-ink font-black mb-4 uppercase text-xs tracking-widest">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              {settings?.address && <li className="text-stitch-muted">{settings.address}</li>}
              {settings?.contactPhone && <li className="text-stitch-muted">{settings.contactPhone}</li>}
              {settings?.contactEmail && <li className="text-stitch-muted">{settings.contactEmail}</li>}
              <li><Link className="text-stitch-muted hover:text-stitch-ink transition" to="/menu">Our Menu</Link></li>
              <li><Link className="text-stitch-muted hover:text-stitch-ink transition" to="/contact">Locations</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-stitch-ink font-black mb-4 uppercase text-xs tracking-widest">Company</h4>
            {settings?.companyText ? (
              <p className="text-stitch-muted text-sm whitespace-pre-wrap">{`${settings.companyText}`}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                <li><Link className="text-stitch-muted hover:text-stitch-ink transition" to="/about">About Us</Link></li>
                <li><Link className="text-stitch-muted hover:text-stitch-ink transition" to="/promotions">Promotions</Link></li>
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-stitch-ink font-black mb-4 uppercase text-xs tracking-widest">Join The D4U</h4>
            <p className="text-stitch-muted text-sm mb-4 leading-normal">Subscribe for exclusive chef specials and priority reservations.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as typeof e.target & { email: { value: string } };
                target.email.value = '';
              }}
              className="flex"
            >
              <input
                name="email"
                className="bg-stitch-surface border border-stitch-border text-stitch-ink text-sm rounded-l-xl px-4 py-2.5 w-full focus:outline-none focus:border-stitch-accent"
                placeholder="Enter email address"
                type="email"
                required
              />
              <button className="bg-stitch-accent hover:bg-stitch-accent-hover text-stitch-accent-ink font-black text-sm px-5 py-2.5 rounded-r-xl transition" type="submit">
                JOIN
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-stitch-accent py-3.5 relative mt-8">
        <div className="max-w-7xl mx-auto px-4 flex justify-center items-center">
          <div className="text-stitch-accent-ink text-xs font-black tracking-wide">
            © 2026 D4U Restaurant Group. Inspired by the bold. Built for the gourmet.
          </div>
        </div>
      </div>
    </footer>
  );
}
