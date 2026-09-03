'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabase';

interface Variety {
  id: string | number;
  name: string;
  maturity_days: number;
  ideal_soil_ph: number;
  type: string;
  drought_tolerance?: string;
  flood_tolerance?: string;
}

export default function DecisionSupport() {
  const [soilPh, setSoilPh] = useState('');
  const [rainfall, setRainfall] = useState('Medium');
  const [recommendations, setRecommendations] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setErrorMsg(null);

    try {
      // 1. Fetch all varieties from Supabase to prevent strict SQL filter drops
      const { data, error } = await supabase.from('varieties').select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        setRecommendations([]);
        return;
      }

      // 2. Filter by Rainfall Tolerance (Case-insensitive check)
      let matchedData = data.filter((v: Variety) => {
        if (rainfall === 'Low') {
          return v.drought_tolerance?.toLowerCase() === 'high';
        }
        if (rainfall === 'High') {
          return v.flood_tolerance?.toLowerCase() === 'high';
        }
        return true; // Medium rainfall accepts all varieties
      });

      // Fallback: If strict rainfall filtering yields zero results, fall back to all varieties
      if (matchedData.length === 0) {
        matchedData = data;
      }

      // 3. Filter and Sort by pH Proximity
      if (soilPh) {
        const targetPh = parseFloat(soilPh);

        // Expanded pH tolerance range (+/- 1.5) with fallback to closest varieties
        let phFiltered = matchedData.filter(
          (v: Variety) => v.ideal_soil_ph != null && Math.abs(v.ideal_soil_ph - targetPh) <= 1.5
        );

        // If no varieties fall within +/- 1.5 pH, use the whole dataset for closest match ranking
        if (phFiltered.length === 0) {
          phFiltered = matchedData.filter((v: Variety) => v.ideal_soil_ph != null);
        }

        // Sort varieties by closest distance to measured pH
        phFiltered.sort(
          (a: Variety, b: Variety) =>
            Math.abs(a.ideal_soil_ph - targetPh) - Math.abs(b.ideal_soil_ph - targetPh)
        );

        setRecommendations(phFiltered);
      } else {
        setRecommendations(matchedData);
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err.message);
      setErrorMsg('Failed to load crop recommendations. Please check database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-2">📋 Smart Variety Selection Engine</h2>
      <p className="text-sm text-slate-500 mb-4">Input local field metrics to identify optimal rice strains.</p>

      <form onSubmit={getRecommendations} className="space-y-4 mb-6">
        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Measured Soil pH Level</label>
          <input 
            type="number" 
            step="0.1" 
            placeholder="e.g., 6.5" 
            value={soilPh} 
            onChange={(e) => setSoilPh(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1 font-medium">Expected Rainfall Condition</label>
          <select 
            value={rainfall} 
            onChange={(e) => setRainfall(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
          >
            <option value="High">High Rainfall (Flooded Plains)</option>
            <option value="Medium">Normal/Medium Rainfall</option>
            <option value="Low">Low Rainfall (Drought Prone)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium text-sm py-2 rounded-lg transition-colors shadow-sm"
        >
          {loading ? 'Analyzing data...' : 'Generate Crop Recommendation'}
        </button>
      </form>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 mb-4">
          {errorMsg}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Recommended Rice Strains ({recommendations.length})
          </h4>
          {recommendations.map((item) => {
            const targetPh = parseFloat(soilPh);
            const phDiff = soilPh && item.ideal_soil_ph != null ? Math.abs(item.ideal_soil_ph - targetPh).toFixed(1) : null;

            return (
              <div key={item.id} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex justify-between items-center text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    {phDiff && (
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                        ΔpH: {phDiff}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">Maturity: {item.maturity_days} days | Ideal pH: {item.ideal_soil_ph ?? 'N/A'}</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">{item.type}</span>
              </div>
            );
          })}
        </div>
      )}

      {hasSearched && !loading && recommendations.length === 0 && !errorMsg && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-700">No matching seed varieties found</p>
          <p className="text-xs text-slate-500 mt-1">Try broadening your pH filter or inserting seed variety records in Supabase.</p>
        </div>
      )}
    </div>
  );
}