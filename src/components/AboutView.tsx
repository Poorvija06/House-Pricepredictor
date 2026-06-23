import React from 'react';
import { Target, Info, ShieldCheck, HelpCircle } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto font-sans text-slate-850 text-slate-800">
      {/* Page Header */}
      <div className="space-y-2 border-l-4 border-emerald-600 pl-4">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
          About Our System
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm">
          Empowering real estate buyers, sellers, and homeowners with structured mathematical evaluations and objective pricing insights.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Project Overview */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Info className="h-5 w-5 text-emerald-600" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Project Overview</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            The AI House Price Prediction System evaluates residential property indicators to formulate baseline market values. By taking into account physical attributes like built area, layout configuration, property age, and localized premiums, we offer a transparent, reliable starting point for property appraisals.
          </p>
        </div>

        {/* Objective */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Target className="h-5 w-5 text-emerald-600" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Our Objective</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            Our goal is to bring transparency and equity to home shopping. Having access to a structured predictive calculation enables buyers to buy with confidence and empowers sellers to define realistic, market-grounded listing parameters, preventing over-pricing in local micro-markets.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="rounded-xl border border-slate-100 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Benefits of AI Prediction</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1.5">
          <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-50 space-y-1.5">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">Fully Objective</span>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans">
              Evaluations are calculated strictly from structural parameters, removing emotional and negotiator biases.
            </p>
          </div>
          
          <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-50 space-y-1.5">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">Instant Output</span>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans">
              Generate localized assessments in real time without waiting for manual surveys or expensive appraisal fees.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-50 space-y-1.5">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">Future Projection Insights</span>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans">
              Provides multi-year compound trend forecasts to assist in choosing strong high-yield properties securely.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
