import React from 'react';
import { StaffMember } from '../types';
import { ShieldCheck, Sparkles, Award, Utensils, Heart } from 'lucide-react';

interface AboutPageProps {
  staff: StaffMember[];
}

export const AboutPage: React.FC<AboutPageProps> = ({ staff }) => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-16 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold px-3.5 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Culinary Craftsmanship
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-display">
          Our Heritage &amp; Mission
        </h1>
        <p className="text-sm text-gray-300 leading-relaxed">
          Founded on the principle of uncompromised enterprise dining quality, D4U Food combines time-tested secret marinade recipes with real-time POS kitchen displays and temperature-controlled logistics.
        </p>
      </div>

      {/* Story & Vision Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#16130B] border border-white/10 p-8 rounded-3xl space-y-3 gold-glow-hover">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-display">Our Culinary Story</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Starting from a single clay oven hearth near Masjid-e-Taqwa, D4U evolved into an enterprise multi-tenant ERP platform serving over 15,000 gourmet orders weekly.
          </p>
        </div>

        <div className="bg-[#16130B] border border-white/10 p-8 rounded-3xl space-y-3 gold-glow-hover">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-display">Quality Commitment</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Every batch of pressure-fried Broast uses 100% organic, grass-fed chicken and pure cold-pressed oil, monitored digitally by our POS Kitchen Display System (KDS).
          </p>
        </div>

        <div className="bg-[#16130B] border border-white/10 p-8 rounded-3xl space-y-3 gold-glow-hover">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-display">Vision 2030</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Expanding our seamless SaaS platform across 50 flagship branches, offering high-speed delivery, zero paper waste, and automated loyalty rewards.
          </p>
        </div>
      </div>

      {/* Kitchen Photo Gallery */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-white font-display text-center">
          Inside Our Kitchen &amp; Fire Hearth
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop"
            alt="Kitchen prep"
            className="rounded-2xl object-cover h-48 w-full border border-white/10 hover:border-[#D4AF37]/50 transition-colors"
          />
          <img
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=600&auto=format&fit=crop"
            alt="Master Chef"
            className="rounded-2xl object-cover h-48 w-full border border-white/10 hover:border-[#D4AF37]/50 transition-colors"
          />
          <img
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop"
            alt="BBQ Charcoal"
            className="rounded-2xl object-cover h-48 w-full border border-white/10 hover:border-[#D4AF37]/50 transition-colors"
          />
          <img
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop"
            alt="Woodfired Pizza"
            className="rounded-2xl object-cover h-48 w-full border border-white/10 hover:border-[#D4AF37]/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
