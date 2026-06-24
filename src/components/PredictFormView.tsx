import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles, Calendar, Maximize2, Bed, Bath, ParkingSquare,
  Building2, Droplets, Map, TrendingUp,
  RefreshCw, Layers
} from 'lucide-react';
import { PredictionResult } from '../types';
import { generatePDF } from "../utils/generatePDF";

export default function PredictFormView() {

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
      [name]:
        name === 'intSqft' ||
        name === 'nBedroom' ||
        name === 'nBathroom' ||
        name === 'propertyAge' ||
        name === 'floor' ||
        name === 'totalFloors'
          ? parseInt(value) || 0
          : value
    }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      location: formData.area.toLowerCase(),
      intSqft: formData.intSqft,
      nBedroom: formData.nBedroom,
      nBathroom: formData.nBathroom,
      parkFacil: formData.parkFacil.toLowerCase(),
      buildType: "house",
      utilityAvail: "allpub",
      street: "paved",
      mzzone: "rl",
      propertyAge: formData.propertyAge
    };

    try {
      const response = await fetch(
        "https://house-price-api.onrender.com/api/model/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setResult(data.result);
      } else {
        setError(data.message || "Prediction failed");
      }

    } catch (err) {
      setError("Backend unreachable / API issue");
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (value: number) => {
    if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Crore`;
    if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} Lakh`;
    return `₹ ${value.toLocaleString("en-IN")}`;
  };

  const getInvestmentColorClass = (grade: string) => {
    switch (grade) {
      case 'Excellent': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Good': return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'Average': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Poor': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto font-sans text-slate-800">

      {/* HEADER */}
      <div className="space-y-2 border-l-4 border-emerald-600 pl-4">
        <h1 className="text-2xl font-bold uppercase">
          Chennai House Price Prediction System
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* FORM */}
        <form onSubmit={handlePredict} className="lg:col-span-7 bg-white p-6 rounded-xl border space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <select name="area" value={formData.area} onChange={handleInputChange}>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <input
              type="number"
              name="intSqft"
              value={formData.intSqft}
              onChange={handleInputChange}
            />

            <select name="nBedroom" value={formData.nBedroom} onChange={handleInputChange}>
              {[1,2,3,4,5].map(b => <option key={b}>{b}</option>)}
            </select>

            <select name="nBathroom" value={formData.nBathroom} onChange={handleInputChange}>
              {[1,2,3,4].map(b => <option key={b}>{b}</option>)}
            </select>

            <input
              type="number"
              name="propertyAge"
              value={formData.propertyAge}
              onChange={handleInputChange}
            />

            <select name="parkFacil" value={formData.parkFacil} onChange={handleInputChange}>
              <option>Yes</option>
              <option>No</option>
            </select>

          </div>

          <button type="submit" disabled={loading} className="bg-emerald-600 text-white p-3 rounded w-full">
            {loading ? "Predicting..." : "Generate Prediction"}
          </button>

        </form>

        {/* RESULT */}
        <div className="lg:col-span-5 space-y-4">

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded">
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="p-6 border rounded text-center">
              Enter values to predict price
            </div>
          )}

          {loading && (
            <div className="p-6 text-center">
              Loading...
            </div>
          )}

          {result && (
            <motion.div className="bg-white p-6 rounded border space-y-4">

              <div>
                <h2 className="text-sm uppercase">Predicted Price</h2>
                <h1 className="text-2xl font-bold">
                  {formatINR(result.predictedPrice)}
                </h1>
              </div>

              <div>
                <h3 className="font-bold text-sm">Investment Grade</h3>
                <span className={`px-2 py-1 rounded text-xs ${getInvestmentColorClass(result.investmentGrade)}`}>
                  {result.investmentGrade}
                </span>
              </div>

              <button
                onClick={() => generatePDF(formData, result.predictedPrice)}
                className="bg-emerald-600 text-white w-full p-2 rounded"
              >
                Download PDF
              </button>

              {/* FORECAST */}
              <div className="space-y-2">
                <div>1 Year: {formatINR(result.forecast1Yr)}</div>
                <div>3 Years: {formatINR(result.forecast3Yr)}</div>
                <div>5 Years: {formatINR(result.forecast5Yr)}</div>
              </div>

            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}