import React from 'react';
import { Sparkles, Map, Smartphone, Calculator } from 'lucide-react';

export default function FeaturesView() {
  const feats = [
    {
      icon: Calculator,
      title: 'Instant Price Prediction',
      desc: 'Formulate accurate value evaluations for residential listings in real time. Simply specify layout criteria to generate reliable, baseline pricing estimates instantly.'
    },
    {
      icon: Map,
      title: 'Chennai Location Analysis',
      desc: 'Formulates micro-market insights and base value weights for top areas, capturing regional price indicators and connectivity premiums accurately.'
    },
    {
      icon: Smartphone,
      title: 'User-Friendly Interface',
      desc: 'Optimized for desktop and mobile use alike. Navigate simple, jargon-free forms and review clearly formatted results on one seamless layout.'
    },
    {
      icon: Sparkles,
      title: 'AI-Based Estimation',
      desc: 'Analyzes spatial dimensions, build age, furnishing type, and local demand indexes systematically to output balanced, modern appraised property values.'
    }
  ];

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto font-sans text-slate-800">
      {/* Section Header */}
      <div className="space-y-2 border-l-4 border-emerald-600 pl-4">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
          Key Features & Services
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm">
          A dedicated residential valuation platform designed to offer clear information and objective appraisal tools.
        </p>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {feats.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div key={idx} className="rounded-xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col sm:flex-row gap-5 hover:shadow-md transition-all">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-950 text-xs sm:text-sm uppercase tracking-wider">{f.title}</h3>
                <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-sans">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
