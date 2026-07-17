import React from 'react';
import { Bike } from 'lucide-react';

interface WelcomeViewProps {
  onContinue: () => void;
}

export default function WelcomeView({ onContinue }: WelcomeViewProps) {
  return (
    <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
      {/* Top curved background element */}
      <div className="absolute top-0 left-0 w-full h-[45%] bg-slate-800 rounded-b-[100px] -z-10" />

      {/* Main Illustration Area */}
      <div className="flex-1 flex flex-col items-center justify-center pt-8">
        <div className="w-48 h-48 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.3)] relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <Bike size={80} className="text-slate-900" />
        </div>
        
        <div className="text-center px-6 mt-4">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Welcome to the<br />Rider Station
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            Manage your deliveries, track routes, and settle your daily collections easily.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-12 flex flex-col gap-4">
        <button 
          onClick={onContinue}
          className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          Continue as a rider
        </button>
      </div>

      {/* Bottom curved border (matches top style) */}
      <div className="absolute bottom-[-50px] left-[-20%] w-[140%] h-[100px] bg-slate-800/50 rounded-t-[50%] -z-10" />
    </div>
  );
}
