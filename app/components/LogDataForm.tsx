'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

interface SeedLot {
  id: string | number;
  lot_code: string;
}

interface LogEntry {
  id: string | number;
  seed_lot_id?: string | number;
  region: string;
  soil_type: string;
  current_soil_ph: number;
  avg_monthly_rainfall_mm: number;
  created_at?: string;
  seed_lots?: { lot_code: string };
}

export default function LogDataForm() {
  const [seedLots, setSeedLots] = useState<SeedLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [region, setRegion] = useState('');
  const [soilType, setSoilType] = useState('Loam');
  const [soilPh, setSoilPh] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Fetch active seed lots and environmental logs
  const fetchInitialData = async () => {
    setFetching(true);
    
    // 1. Fetch Seed Lots for dropdown selection using lot_code
    const { data: lotData, error: lotError } = await supabase
      .from('seed_lots')
      .select('id, lot_code');

    if (lotData) setSeedLots(lotData);
    if (lotError) console.error('Error fetching seed lots:', lotError.message);

    // 2. Fetch Environmental Logs with relational join
    const { data: logData, error: logError } = await supabase
      .from('environmental_data')
      .select('*, seed_lots(lot_code)')
      .order('id', { ascending: false });

    if (!logError && logData) {
      // Safely map relational batch data with client-side fallback matching
      const formattedLogs = logData.map((log: any) => {
        const linkedLot = lotData?.find((lot) => lot.id === log.seed_lot_id);
        return {
          ...log,
          seed_lots: log.seed_lots || (linkedLot ? { lot_code: linkedLot.lot_code } : undefined),
        };
      });
      setLogs(formattedLogs);
    } else {
      // Fallback: If join query fails, fetch basic logs and manually join in memory
      const { data: fallbackLogs } = await supabase
        .from('environmental_data')
        .select('*')
        .order('id', { ascending: false });

      if (fallbackLogs) {
        const mappedFallback = fallbackLogs.map((log: any) => {
          const linkedLot = lotData?.find((lot) => lot.id === log.seed_lot_id);
          return {
            ...log,
            seed_lots: linkedLot ? { lot_code: linkedLot.lot_code } : undefined,
          };
        });
        setLogs(mappedFallback);
      }
      if (logError) console.error('Error fetching environmental data:', logError.message);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!region.trim() || !soilPh || !rainfall) {
      setMessage({ text: 'Please complete all required fields.', isError: true });
      return;
    }

    const parsedPh = parseFloat(soilPh);
    const parsedRainfall = parseFloat(rainfall);

    if (parsedPh < 0 || parsedPh > 14) {
      setMessage({ text: 'Soil pH must be a value between 0.0 and 14.0.', isError: true });
      return;
    }

    if (parsedRainfall < 0) {
      setMessage({ text: 'Monthly rainfall cannot be negative.', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    // Construct insert payload dynamically to prevent schema/FK constraint issues
    const payload: Record<string, any> = {
      region: region.trim(),
      soil_type: soilType,
      current_soil_ph: parsedPh,
      avg_monthly_rainfall_mm: parsedRainfall,
    };

    if (selectedLotId) {
      payload.seed_lot_id = selectedLotId;
    }

    // Attach recorded_by only if active authenticated session exists
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        payload.recorded_by = user.id;
      }
    } catch (authErr) {
      console.warn('Auth check skipped or unauthenticated:', authErr);
    }

    const { error } = await supabase
      .from('environmental_data')
      .insert([payload]);

    setLoading(false);

    if (error) {
      setMessage({ text: `Database Error: ${error.message}`, isError: true });
    } else {
      setMessage({ text: '✅ Field entry and batch lineage recorded successfully!', isError: false });
      setSelectedLotId('');
      setRegion('');
      setSoilPh('');
      setRainfall('');
      fetchInitialData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-1">📥 Log Local Environmental Data</h2>
        <p className="text-xs text-slate-500 mb-6">Record field soil telemetry and link metrics to active seed batches.</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1 font-semibold">Associated Seed Batch (Optional Traceability Link)</label>
            <select 
              value={selectedLotId} 
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800 mb-4"
            >
              <option value="">-- Select Seed Lot / Batch --</option>
              {seedLots.map((lot) => (
                <option key={lot.id} value={lot.id}>Batch: {lot.lot_code}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-semibold">Farm Region / Municipality *</label>
              <input 
                type="text" 
                placeholder="e.g., Tigaon" 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-semibold">Soil Classification *</label>
              <select 
                value={soilType} 
                onChange={(e) => setSoilType(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
              >
                <option value="Loam">Loam</option>
                <option value="Clay">Clay</option>
                <option value="Silt">Silt</option>
                <option value="Sandy">Sandy</option>
                <option value="Peat">Peat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-semibold">Measured Soil pH (0 - 14) *</label>
              <input 
                type="number" 
                step="0.1" 
                min="0"
                max="14"
                placeholder="e.g., 6.2" 
                value={soilPh} 
                onChange={(e) => setSoilPh(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-semibold">Monthly Rainfall (mm) *</label>
              <input 
                type="number" 
                min="0"
                placeholder="e.g., 180" 
                value={rainfall} 
                onChange={(e) => setRainfall(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {loading ? 'Submitting field log...' : 'Submit Field Log'}
          </button>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-medium border ${
              message.isError 
                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {message.text}
            </div>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Recorded Soil & Telemetry Data
            </h3>
            <p className="text-xs text-slate-500">Historical readings stored in the database</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-200">
            {logs.length} Entries
          </span>
        </div>

        {fetching ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading soil entries...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No soil data entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Batch Code</th>
                  <th className="py-2.5 px-3">Region / Municipality</th>
                  <th className="py-2.5 px-3">Soil Type</th>
                  <th className="py-2.5 px-3">Soil pH</th>
                  <th className="py-2.5 px-3">Monthly Rainfall</th>
                  <th className="py-2.5 px-3">Logged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors text-slate-700">
                    <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">
                      {log.seed_lots?.lot_code || 'Unlinked'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.region}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {log.soil_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {log.current_soil_ph}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {log.avg_monthly_rainfall_mm} mm
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Recorded'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}