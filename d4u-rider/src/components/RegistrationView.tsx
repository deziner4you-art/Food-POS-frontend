import React, { useState } from 'react';
import { Bike, ChevronDown, UploadCloud, MapPin, Navigation } from 'lucide-react';

interface RegistrationViewProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export default function RegistrationView({ onCancel, onSubmit }: RegistrationViewProps) {
  const [step, setStep] = useState(1);

  // Reusable Input Field Component matching the design
  const UnderlinedInput = ({ label, type = 'text', placeholder = '', isSelect = false }: any) => (
    <div className="flex flex-col mb-6">
      <label className="text-slate-900 font-bold text-[15px] mb-2">{label}</label>
      <div className="relative">
        {isSelect ? (
          <select className="w-full appearance-none bg-transparent text-slate-700 text-[15px] pb-2 border-b-2 border-[#8a2be2] focus:outline-none focus:border-[#6a1b9a]">
            <option value="" disabled selected>{placeholder}</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        ) : (
          <input 
            type={type} 
            placeholder={placeholder}
            className="w-full bg-transparent text-slate-700 text-[15px] pb-2 border-b-2 border-[#8a2be2] focus:outline-none focus:border-[#6a1b9a] placeholder:text-slate-500"
          />
        )}
        {isSelect && (
          <div className="absolute right-0 top-1 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-slate-700" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#8a2be2] overflow-hidden p-2">
      {/* Phone Frame Styling to match mockup's thick purple border */}
      <div className="flex-1 bg-[#fcf5fb] rounded-[36px] overflow-hidden relative flex flex-col shadow-2xl">
        
        {/* Top Header Graphic (Curved purple background with illustration) */}
        <div className="relative h-[250px] shrink-0 overflow-hidden">
          {/* Curved Background Shape */}
          <div className="absolute top-[-50px] right-[-20%] w-[120%] h-[150%] bg-[#ecd4f7] rounded-bl-[150px] -z-10" />
          
          {/* Illustration Container */}
          <div className="absolute bottom-4 right-4">
            <div className="relative">
               {/* Stand-in for the complex illustration */}
               <div className="w-40 h-40 flex items-center justify-center">
                  <Bike className="w-24 h-24 text-[#8a2be2]" />
                  {step === 2 && (
                    <div className="absolute top-0 right-0 bg-white p-2 rounded-xl shadow-md border-2 border-[#8a2be2]">
                       <MapPin className="w-6 h-6 text-[#8a2be2]" />
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 flex flex-col custom-scrollbar">
          <div className="mb-6">
            <p className="text-slate-800 font-bold mb-1">{step}/3</p>
            <h2 className="text-2xl font-bold text-[#8a2be2]">
              {step === 1 ? 'Personal Details' : 'Vehicle Details'}
            </h2>
          </div>

          <div className="flex-1">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <UnderlinedInput label="Full Name" placeholder="John Devis" />
                
                <div className="grid grid-cols-2 gap-4">
                  <UnderlinedInput label="Date of birth" placeholder="MM/DD/YYYY" />
                  <UnderlinedInput label="City" placeholder="Select city" isSelect />
                </div>

                <UnderlinedInput label="License Plate No." placeholder="e.g. 6WED2098" />
                <UnderlinedInput label="Registration No." placeholder="e.g. 6WED2098" />
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <UnderlinedInput label="Vehicle Name" placeholder="Honda" isSelect />
                <UnderlinedInput label="Model" placeholder="2016" isSelect />
                
                <div className="grid grid-cols-2 gap-4">
                  <UnderlinedInput label="Color" placeholder="Red" isSelect />
                  <UnderlinedInput label="CC" placeholder="70 CC" isSelect />
                </div>

                <UnderlinedInput label="License Plate No." placeholder="e.g. 6WED2098" />
                <UnderlinedInput label="Registration No." placeholder="e.g. 6WED2098" />
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                <p className="text-slate-900 font-bold text-[15px] mb-4">Take a photo of Vehicle Registration</p>
                
                <div className="flex-1 min-h-[200px] bg-[#dcdcdc] rounded-lg flex items-center justify-center relative mb-2">
                  <button className="bg-[#8a2be2] hover:bg-[#6a1b9a] text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95">
                    <UploadCloud className="w-5 h-5" />
                    Upload
                  </button>
                </div>
                <div className="flex justify-between text-slate-500 text-xs font-bold px-1 mb-8">
                  <span>Must be jpeg and png</span>
                  <span>max size: 2MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="mt-auto pt-6 flex gap-4">
            {step === 3 ? (
              <>
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 bg-transparent border-2 border-slate-300 text-slate-900 font-bold rounded-xl transition-all hover:bg-slate-100 active:scale-[0.98]"
                >
                  Retake
                </button>
                <button 
                  onClick={onSubmit}
                  className="flex-1 py-4 bg-[#8a2be2] hover:bg-[#6a1b9a] text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]"
                >
                  Submit
                </button>
              </>
            ) : (
              <button 
                onClick={() => setStep(s => s + 1)}
                className="w-full py-4 bg-[#8a2be2] hover:bg-[#6a1b9a] text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-[#8a2be2]/30 active:scale-[0.98]"
              >
                Continue
              </button>
            )}
          </div>
          
          {step === 1 && (
            <div className="mt-4 text-center">
              <button onClick={onCancel} className="text-slate-500 underline text-sm">Cancel Registration</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
