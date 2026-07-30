import { Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function ContactPage() {
  const { settings } = useStore();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-black mb-8 text-stitch-ink text-center">Contact Us</h1>

      <div className="bg-stitch-panel border border-stitch-border rounded-3xl p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full border border-stitch-border flex-shrink-0 flex items-center justify-center text-stitch-accent">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stitch-ink text-base">Our Location</h3>
            <p className="text-stitch-muted text-sm mt-1 whitespace-pre-wrap">{settings?.address || '452 Gourmet Avenue, Culinary District'}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full border border-stitch-border flex-shrink-0 flex items-center justify-center text-stitch-accent">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stitch-ink text-base">Phone Support</h3>
            <p className="text-stitch-muted text-sm mt-1 whitespace-pre-wrap">{settings?.contactPhone || '+1 (555) 123-4567'}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full border border-stitch-border flex-shrink-0 flex items-center justify-center text-stitch-accent">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-stitch-ink text-base">Email Address</h3>
            <p className="text-stitch-muted text-sm mt-1 whitespace-pre-wrap">{settings?.contactEmail || 'hello@d4u.com'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
