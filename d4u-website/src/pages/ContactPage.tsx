import React, { useState } from 'react';
import { Branch } from '../types';
import { MapPin, Phone, MessageSquare, Mail, Send, CheckCircle2, Clock } from 'lucide-react';

interface ContactPageProps {
  currentBranch: Branch;
  contactEmail: string;
  whatsappNumber: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({ currentBranch, contactEmail, whatsappNumber }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Table Reservation',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Email Routing via standard mailto deep-link
    if (contactEmail) {
      const emailBody = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'N/A'}\n\nMessage:\n${formData.message}\n\nBranch: ${currentBranch.name}`;
      const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink, '_blank');
    }

    // 2. WhatsApp Routing via wa.me API deep-link
    if (whatsappNumber) {
      const waMsg = `*New Contact Request*\n\n*Name:* ${formData.name}\n*Email:* ${formData.email}\n*Subject:* ${formData.subject}\n*Message:* ${formData.message}\n*Branch:* ${currentBranch.name}`;
      const formattedNumber = whatsappNumber.replace(/[^0-9]/g, '');
      const waLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(waMsg)}`;
      window.open(waLink, '_blank');
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: 'Table Reservation', message: '' });
    }, 4000);
  };

  const activeBranch = currentBranch;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-12 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
          Contact &amp; Table Reservations
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          Have a question about our menu, corporate catering, or table booking? Connect directly with our front desk managers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#16130B] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white font-display">Send Us A Message</h2>

          {submitted ? (
            <div className="bg-emerald-950/80 border border-emerald-500/40 p-6 rounded-2xl text-center space-y-2 text-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold font-display">Thank You! Message Received</h3>
              <p className="text-xs">
                Our branch manager at {activeBranch.name} will respond to your inquiry shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g., Hamza Farooq"
                    className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="hamza@example.com"
                    className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                  >
                    <option value="Table Reservation">Table VIP Reservation</option>
                    <option value="Corporate Catering">Corporate Catering Order</option>
                    <option value="Feedback">Feedback / Review</option>
                    <option value="General Inquiry">General ERP Inquiry</option>
                  </select>
                </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Your Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us your reservation date, party size, or specific dietary requirements..."
                  className="w-full bg-[#1A1A1D] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#D4AF37] text-black font-extrabold py-3.5 rounded-xl hover:bg-[#ffe088] transition-all flex items-center justify-center gap-2 gold-glow text-xs"
              >
                <Send className="w-4 h-4" /> Submit Request
              </button>
            </form>
          )}
        </div>

        {/* Branch Info & Map Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#16130B] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white font-display">
              {activeBranch.name}
            </h3>

            <div className="space-y-3 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <span>{activeBranch.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span>{activeBranch.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>{activeBranch.openingHours}</span>
              </div>
            </div>

            {/* Direct Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`https://wa.me/${activeBranch.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Us
              </a>
              <a
                href={`tel:${activeBranch.phone}`}
                className="bg-[#1A1A1D] border border-white/10 hover:border-[#D4AF37]/50 text-white font-bold text-xs p-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" /> Call Hotline
              </a>
            </div>

            {/* Interactive Map Graphic */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1A1A1D] border border-white/10 mt-4 flex items-center justify-center">
              <img
                src={activeBranch.imageUrl}
                alt="Store exterior"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4 text-center">
                <MapPin className="w-8 h-8 text-[#D4AF37] animate-bounce" />
                <span className="text-xs font-bold text-white mt-1">
                  GPS Coordinates: {activeBranch.lat}, {activeBranch.lng}
                </span>
                <span className="text-[10px] text-gray-300">Live Navigation Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
