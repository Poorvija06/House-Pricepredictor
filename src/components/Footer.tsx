import React from 'react';
import { Building2 } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  return (
    <footer className="w-full bg-white border-t border-slate-100 text-slate-500 mt-16 font-sans">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6 gap-4">
          
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-sans font-extrabold tracking-tight text-slate-900 block text-sm uppercase">
               Chennai House Price
              </span>
              <span className="text-[9px] font-mono leading-none tracking-widest text-slate-400 block uppercase">
                Prediction System
              </span>
            </div>
          </div>

          {/* Specified core links only */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold">
            <button 
              onClick={() => setActiveTab('home')} 
              className="text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer pointer-events-auto"
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('predict')} 
              className="text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer pointer-events-auto"
            >
              Predict Price
            </button>
            <button 
              onClick={() => setActiveTab('about')} 
              className="text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer pointer-events-auto"
            >
              About
            </button>
            <button 
              onClick={() => setActiveTab('contact')} 
              className="text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer pointer-events-auto"
            >
              Contact
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© 2026 Chennai House Price Prediction System. All Rights Reserved.</p>
          <p className="font-medium text-[11px] text-slate-400">
            Dedicated Real Estate Valuation & Analysis Platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
