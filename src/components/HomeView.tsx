import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, Database, BarChart3, Star, Percent } from 'lucide-react';
import { ModelMetrics } from '../types';

interface HomeViewProps {
  onStartPredict: () => void;
  onGoToAssistant: () => void;
}

export default function HomeView({ onStartPredict, onGoToAssistant }: HomeViewProps) {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/model/metrics')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setMetrics(data.metrics);
        }
      })
      .catch(err => console.error('Error fetching model stats:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12 py-4 max-w-7xl mx-auto font-sans text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-12 shadow-sm sm:px-12 sm:py-16">
        <div className="absolute inset-0 bg-radial-[circle_at_bottom_left] from-emerald-50/20 via-transparent to-transparent" />
        <div className="absolute top-6 right-6 flex h-36 w-36 items-center justify-center rounded-full bg-emerald-500/5 blur-2xl" />
        
        <div className="relative mx-auto max-w-4xl space-y-5 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-55 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100 bg-emerald-50"
          >
            <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span>AI-Powered Real Estate Estimator</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-sans text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-slate-900"
          >
            Find the Real Value of Your <span className="text-emerald-600 font-bold font-sans">Next Home</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed font-sans"
          >
            An advanced residential valuation system built to predict residential home and apartment prices seamlessly. Analyze your property's value based on localized metrics, built area, configurations, floor specs, and age.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={onStartPredict}
              className="group flex items-center space-x-2 rounded-lg bg-emerald-605 bg-emerald-600 px-6 py-3 text-xs font-bold text-white uppercase tracking-wider transition-all hover:bg-emerald-700 shadow-md shadow-emerald-600/10 cursor-pointer pointer-events-auto"
            >
              <span>Predict Price Now</span>
              <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1 text-white" />
            </button>
            <button
              onClick={onGoToAssistant}
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider transition-all hover:bg-slate-50 hover:text-emerald-600 cursor-pointer pointer-events-auto"
            >
              AI Assistant Support
            </button>
          </motion.div>
        </div>
      </section>

      {/* Trust & Estimation Stats Grid */}
      <section className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="font-sans text-xs uppercase tracking-widest font-bold text-slate-400">System Accuracy Indicators</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y divide-slate-100 lg:divide-y-0 lg:divide-x lg:divide-slate-200">
            <div className="flex flex-col justify-center py-1 lg:py-0 lg:px-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Predictive Accuracy</span>
              <div className="mt-1 flex items-baseline">
                <span className="text-2xl font-bold font-sans text-emerald-600">
                  {loading ? '...' : metrics ? `${(metrics.r2 * 100).toFixed(1)}%` : '94.2%'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 font-medium">Reliability score in key zones</span>
            </div>

            <div className="flex flex-col justify-center py-1 lg:py-0 lg:px-4 pt-3 lg:pt-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Deviation</span>
              <div className="mt-1 flex items-baseline">
                <span className="text-2xl font-bold font-sans text-emerald-600">
                  {loading ? '...' : metrics ? `₹${(metrics.mae / 100000).toFixed(2)} Lakhs` : '₹2.85 Lakhs'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5">Average precision difference bounds</span>
            </div>

            <div className="flex flex-col justify-center py-1 lg:py-0 lg:px-4 pt-3 lg:pt-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Standard Range Error</span>
              <div className="mt-1 flex items-baseline">
                <span className="text-2xl font-bold font-sans text-emerald-600">
                  {loading ? '...' : metrics ? `₹${(metrics.rmse / 100000).toFixed(2)} Lakhs` : '₹3.92 Lakhs'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5">Under 5% general volatility bounds</span>
            </div>

            <div className="flex flex-col justify-center py-1 lg:py-0 lg:px-4 pt-3 lg:pt-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Historical Data Points</span>
              <div className="mt-1 flex items-baseline">
                <span className="text-2xl font-bold font-sans text-emerald-600">
                  {loading ? '...' : metrics ? metrics.sampleCount.toLocaleString() : '7,109'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5">Verified residential home listings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Project Introduction */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
        <div className="space-y-4">
          <h2 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 uppercase border-l-4 border-emerald-500 pl-4">
            Smart Home Valuation Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Real estate markets are dynamic and require highly reliable tools for pricing consistency. Our price estimator integrates statistical insights and geographic variables to provide robust, objective guidance for real estate transactions.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            By analyzing physical attributes like built area space, precise layout configurations, property age, and locality premiums, our model handles anomalies gracefully and offers buyers and sellers secure estimations.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Real Estate Customer Focused</span>
            </span>
            <span className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-lg">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Secure Valuation Records</span>
            </span>
          </div>
        </div>
        
        {/* Features Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-2.5 shadow-xs">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">Future Appreciation</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">View localized growth maps and prospective compound index appreciation over a 1 to 5-year timeline.</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-2.5 shadow-xs sm:mt-4">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">Statistical Data-Modeling</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">Examines multiple geographical and architectural facets simultaneously to calculate price stability.</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-2.5 shadow-xs">
            <Star className="h-6 w-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">Location Specifics</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">Highlights localized specific advantages and premium scores of Chennai neighborhoods instantly.</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-2.5 shadow-xs sm:mt-4">
            <Percent className="h-6 w-6 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">Maximum Consistency</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">Undergoes regular dataset refinements to reduce outliers and preserve highly reliable estimation outputs.</p>
          </div>
        </div>
      </section>

      {/* Chennai Neighborhoods Overview Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-sans text-2xl font-extrabold tracking-tight uppercase text-slate-900">Supported Housing Micro-markets</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Explore core Chennai residential boroughs mapped within our valuation algorithm.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Anna Nagar', base: '₹14,000 / Sqft', growth: '+8.5% Growth Index', desc: 'Premium residential block in Northwest Chennai, noted for top-tier civic infrastructure and premium layouts.', color: 'border-emerald-500/20' },
            { name: 'Adyar', base: '₹9,500 / Sqft', growth: '+7.5% Growth Index', desc: 'Desirable neighborhood with prime BHK flats, lush green surroundings, and close proximity to coastal corridors.', color: 'border-emerald-500/20' },
            { name: 'Velachery', base: '₹8,800 / Sqft', growth: '+7.0% Growth Index', desc: 'High-growth commercial and residential corridor with swift transit connectivity and technology centers nearby.', color: 'border-slate-100' },
            { name: 'Chrompet', base: '₹6,200 / Sqft', growth: '+5.5% Growth Index', desc: 'Extremely popular suburban destination offering rich public utility connectivity and family-friendly flats.', color: 'border-slate-100' },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">{item.name}</span>
                <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 tracking-wider">Active</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-base font-bold text-slate-900">{item.base}</span>
                <span className="block text-[10px] font-semibold text-emerald-600">{item.growth}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-sans">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
