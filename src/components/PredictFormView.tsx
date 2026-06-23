import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Calendar, Maximize2, Bed, Bath, ParkingSquare, 
  Building2, Droplets, Map, ChevronRight, TrendingUp, 
  FileText, RefreshCw, Star, ArrowRight, Layers
} from 'lucide-react';
import { PredictionResult } from '../types';
import { generatePDF } from "../utils/generatePDF";

export default function PredictFormView() {
  // Form States using ONLY the dataset/user specifications
  const [formData, setFormData] = useState({
    area: 'Adyar',
    intSqft: 1200,
    nBedroom: 2,
    nBathroom: 2,
    propertyAge: 5,
    parkFacil: 'Yes',
    furnishingStatus: 'Semi Furnished',
    waterSource: 'Metro Water',
    floor: 1,
    totalFloors: 4,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const areas = ['Adyar', 'Chrompet', 'Karapakkam', 'KK Nagar', 'Anna Nagar', 'T Nagar', 'Velachery'];
  const furnishingOptions = ['Unfurnished', 'Semi Furnished', 'Fully Furnished'];
  const waterOptions = ['Metro Water', 'Well Water', 'Borewell', 'Public Tap'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'intSqft' || name === 'nBedroom' || name === 'nBathroom' || name === 'propertyAge' || name === 'floor' || name === 'totalFloors'
        ? parseInt(value) || 0
        : value
    }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare payload. Map client variables and pre-fill underlying Random Forest features that the algorithm expects
    const payload = {
      area: formData.area,
      intSqft: formData.intSqft,
      nBedroom: formData.nBedroom,
      nBathroom: formData.nBathroom,
      parkFacil: formData.parkFacil,
      propertyAge: formData.propertyAge,
      // Pass clean defaults for underlying dataset categorical encodings
      buildType: 'house',
      utilityAvail: 'allpub',
      street: 'paved',
      mzzone: 'rl'
    };

    try {
      const response = await fetch('/api/model/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setResult(data.result);
      } else {
        setError(data.message || 'Failed to estimate property value.');
      }
    } catch (err: any) {
      setError('Evaluation service is temporarily offline. Please verify that the local development server is active.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format prices in Indian Rupees Lakhs & Crores
  const formatINR = (value: number) => {
  if (value >= 10000000) {
    return `₹ ${(value / 10000000).toFixed(2)} Crore`;
  }

  if (value >= 100000) {
    return `₹ ${(value / 100000).toFixed(2)} Lakh`;
  }

  return `₹ ${value.toLocaleString("en-IN")}`;
};
  const getInvestmentColorClass = (grade: string) => {
    switch (grade) {
      case 'Excellent': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Good': return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'Average': return 'bg-amber-50 text-amber-750 border border-amber-200';
      case 'Poor': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto font-sans text-slate-800">
      <div className="space-y-2 border-l-4 border-emerald-600 pl-4">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
         Chennai House Price Prediction System
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm">
          Submit spatial and layout parameters to calculate a professional valuation estimate and potential asset appreciation outlook.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Specifications Form Panel */}
        <form onSubmit={handlePredict} className="lg:col-span-7 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building2 className="h-4.5 w-4.5 text-emerald-600" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Property Attributes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AREA */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Map className="h-3.5 w-3.5 text-emerald-600" /> Location Area
              </label>
              <select
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
              >
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* INT_SQFT */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-emerald-600" /> Area (sq.ft)
              </label>
              <input
                type="number"
                name="intSqft"
                min="300"
                max="8000"
                value={formData.intSqft}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-mono font-medium"
                required
              />
            </div>

            {/* BEDROOMS */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Bed className="h-3.5 w-3.5 text-emerald-600" /> Bedrooms (BHK)
              </label>
              <select
                name="nBedroom"
                value={formData.nBedroom}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map(b => <option key={b} value={b}>{b} BHK</option>)}
              </select>
            </div>

            {/* BATHROOMS */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5 text-emerald-600" /> Bathrooms
              </label>
              <select
                name="nBathroom"
                value={formData.nBathroom}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
              >
                {[1, 2, 3, 4].map(ba => <option key={ba} value={ba}>{ba} Bathroom{ba > 1 ? 's' : ''}</option>)}
              </select>
            </div>

            {/* PROPERTY AGE */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" /> Property Age (Years)
              </label>
              <select
                name="propertyAge"
                value={formData.propertyAge}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i).map(year => (
                  <option key={year} value={year}>{year === 0 ? 'Brand New (< 1 year)' : `${year} Year${year > 1 ? 's' : ''} Old`}</option>
                ))}
              </select>
            </div>

            {/* PARKING FACILITY */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <ParkingSquare className="h-3.5 w-3.5 text-emerald-600" /> Parking Available
              </label>
              <select
                name="parkFacil"
                value={formData.parkFacil}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
              >
                <option value="Yes">Yes, Private Allocated</option>
                <option value="No">No Private Parking</option>
              </select>
            </div>

            {/* FURNISHING STATUS */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Furnishing Status
              </label>
              <select
                name="furnishingStatus"
                value={formData.furnishingStatus}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
              >
                {furnishingOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* WATER SOURCE */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-emerald-600" /> Water Source
              </label>
              <select
                name="waterSource"
                value={formData.waterSource}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium cursor-pointer"
              >
                {waterOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            {/* FLOOR */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600" /> Property Floor
              </label>
              <input
                type="number"
                name="floor"
                min="0"
                max="60"
                value={formData.floor}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-mono font-medium"
                required
              />
            </div>

            {/* TOTAL FLOORS */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600" /> Total Building Floors
              </label>
              <input
                type="number"
                name="totalFloors"
                min="1"
                max="60"
                value={formData.totalFloors}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-mono font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-md shadow-emerald-600/10 transition-all hover:bg-emerald-700 cursor-pointer pointer-events-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Running House Valuation...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-emerald-200 animate-pulse" />
                <span>Generate Valuation Estimate</span>
              </>
            )}
          </button>
        </form>

        {/* Prediction Result Display Panel */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-rose-800 text-xs shadow-xs">
              <span className="font-bold uppercase tracking-wider block mb-1">Estimation Stopped:</span> {error}
            </div>
          )}

          {!result && !error && !loading && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-dashed border-slate-200 shadow-xs">
              <Building2 className="h-10 w-10 text-slate-350 mb-3" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Ready for Valuation</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                Select your property parameters and click the green button to formulate a professional market value analysis.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl border border-slate-100 shadow-xs animate-pulse">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Formulating Appraisal...</h3>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1.5 leading-relaxed font-sans">
                Processing locational pricing indices and checking relative asset parameters...
              </p>
            </div>
          )}

          {result && !loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Core Output Cards */}
              <div className="rounded-xl border border-slate-100 bg-white p-5 text-slate-800 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl" />
                
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-[9px] font-semibold tracking-widest text-emerald-600 uppercase">ESTIMATED ASSET PRICE</span>
                  <div className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${getInvestmentColorClass(result.investmentGrade)}`}>
                    ★ {result.investmentGrade} Rating
                  </div>
                </div>

                <div className="mt-4 relative z-10">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-none block">
                    {formatINR(result.predictedPrice)}
                  </span>
                  <span className="block mt-2.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Calculated Market Price (Standard Model Output)
                  </span>
                </div>
              </div>
              <button
  onClick={() => generatePDF(formData, result.predictedPrice)}
  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold"
>
  Download PDF Report
</button>

              {/* Projections Segment */}
              <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Prospective Appreciation Trends</span>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { label: 'Outbound after 1 Year', value: result.forecast1Yr, note: '1-Year Projection' },
                    { label: 'Outbound after 3 Years', value: result.forecast3Yr, note: '3-Year Projection' },
                    { label: 'Outbound after 5 Years', value: result.forecast5Yr, note: '5-Year Projection' }
                  ].map((f, i) => {
                    const priceDiff = f.value - result.predictedPrice;
                    const incrementPct = Math.round((priceDiff / result.predictedPrice) * 100);
                    return (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{f.label}</span>
                          <span className="text-[9px] text-emerald-600 font-semibold flex items-center mt-1 uppercase tracking-widest">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Projected Growth: +{incrementPct}% ({f.note})
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {formatINR(f.value).split(' (~')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Professional Insights Explanation section */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-xs space-y-2.5">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4.5 w-4.5 text-emerald-600" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-705 text-emerald-800">Appraisal & Locality Survey</span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans space-y-2 whitespace-pre-wrap selection:bg-emerald-250">
                  {result.explanation}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
