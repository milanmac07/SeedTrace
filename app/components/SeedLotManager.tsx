'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import SeedLotQRModal from './SeedLotQRModal';

export interface SeedLot {
  id: string;
  lot_code: string;
  
  // DA Farmer Demographics
  farmer_name?: string;
  contact_number?: string;
  location?: string;
  birthday?: string;
  gender?: string;
  is_ip?: boolean;
  ip_group_name?: string;

  // DA Farm Metrics
  variety_id?: string;
  farm_area_hectares?: number;
  seed_beds_count?: number;
  planting_date?: string;

  // DA Harvest Data
  harvest_date?: string;
  harvest_amount_kg?: number;
  avg_sacks_harvested?: number;

  status?: string;
  qr_code_path?: string;
  created_at?: string;

  varieties?: {
    id?: string;
    variety_name?: string;
    name?: string;
    type?: string;
  };
}

interface SeedLotManagerProps {
  onOpenAddModal?: () => void;
}

export default function SeedLotManager({ onOpenAddModal }: SeedLotManagerProps) {
  const [seedLots, setSeedLots] = useState<SeedLot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & State
  const [selectedLot, setSelectedLot] = useState<SeedLot | null>(null);
  const [selectedLotForQR, setSelectedLotForQR] = useState<SeedLot | null>(null);
  const [savedVarietyIds, setSavedVarietyIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  useEffect(() => {
    fetchSeedLots();

    const localSaved = localStorage.getItem('saved_rice_varieties');
    if (localSaved) {
      try {
        setSavedVarietyIds(JSON.parse(localSaved));
      } catch (e) {
        console.error('Failed to parse saved varieties', e);
      }
    }
  }, []);

  const fetchSeedLots = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('seed_lots')
      .select(`
        *,
        varieties (*)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSeedLots(data as unknown as SeedLot[]);
    } else if (error) {
      console.error('Error fetching seed lots:', error.message);
    }
    setLoading(false);
  };

  const handleSaveVariety = async (lot: SeedLot) => {
    const varietyId = lot.varieties?.id || lot.variety_id || lot.varieties?.variety_name || lot.varieties?.name;
    const varietyName = lot.varieties?.variety_name || lot.varieties?.name || lot.variety_id || 'Unknown Variety';

    setSaving(true);
    setSaveFeedback('');

    try {
      const { error: dbError } = await supabase
        .from('saved_varieties')
        .insert([{ variety_id: varietyId, variety_name: varietyName }]);

      if (dbError && dbError.code !== '23505') {
        console.warn('Supabase save notice:', dbError.message);
      }

      const updatedList = Array.from(new Set([...savedVarietyIds, varietyId || varietyName]));
      setSavedVarietyIds(updatedList);
      localStorage.setItem('saved_rice_varieties', JSON.stringify(updatedList));

      setSaveFeedback('✓ Variety saved successfully!');
    } catch (err) {
      setSaveFeedback('Saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const filteredLots = seedLots.filter((lot) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const lotCode = (lot.lot_code || lot.id || '').toLowerCase();
    const farmer = (lot.farmer_name || '').toLowerCase();
    const location = (lot.location || '').toLowerCase();
    const varietyName = (lot.varieties?.variety_name || lot.varieties?.name || lot.variety_id || '').toLowerCase();
    const status = (lot.status || '').toLowerCase();

    return lotCode.includes(query) || farmer.includes(query) || location.includes(query) || varietyName.includes(query) || status.includes(query);
  });

  const getVarietyDisplayName = (lot: SeedLot) =>
    lot.varieties?.variety_name || lot.varieties?.name || lot.variety_id || 'N/A';

  const isVarietySaved = (lot: SeedLot) => {
    const varKey = lot.varieties?.id || lot.variety_id || lot.varieties?.variety_name || lot.varieties?.name;
    return varKey ? savedVarietyIds.includes(varKey) : false;
  };

  return (
    <>
      {/* Main Container - Full Width & Clean Spacing */}
      <div className="w-full bg-emerald-950/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-emerald-800 text-white space-y-6 shadow-xl">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Registered DA Rice Seed Lots</h2>
            <p className="text-xs text-emerald-200 mt-1">Track registered farmer batches, yield telemetry, and generate QR passes</p>
          </div>

          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              + Register New Seed Batch
            </button>
          )}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by Farmer Name, Location, Lot Code, or Variety..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-emerald-900/40 border border-emerald-700 text-white placeholder-emerald-400/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
        />

        {/* Main Seed Lots Table */}
        {loading ? (
          <div className="p-12 text-center text-sm text-emerald-300 animate-pulse">
            Loading seed records...
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="p-12 text-center text-sm text-emerald-300 border border-dashed border-emerald-800 rounded-xl">
            No matching DA seed lot records found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-emerald-800/80">
            <table className="w-full text-left text-sm text-emerald-100">
              <thead className="text-xs uppercase bg-emerald-900/90 text-emerald-300 border-b border-emerald-800">
                <tr>
                  <th className="px-5 py-3.5">Lot Code</th>
                  <th className="px-5 py-3.5">Farmer Name</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Rice Variety</th>
                  <th className="px-5 py-3.5">Area (Ha)</th>
                  <th className="px-5 py-3.5">Est. Yield</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-800/50 bg-emerald-950/40">
                {filteredLots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-emerald-900/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-emerald-300 whitespace-nowrap">
                      {lot.lot_code}
                    </td>
                    <td className="px-5 py-4 font-medium text-white whitespace-nowrap">
                      {lot.farmer_name || 'N/A'}{' '}
                      {lot.is_ip && (
                        <span className="text-[10px] bg-amber-900/60 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded ml-1 font-sans">
                          IP
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-emerald-200">
                      {lot.location || 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-emerald-200 font-medium whitespace-nowrap">
                      {getVarietyDisplayName(lot)}
                    </td>
                    <td className="px-5 py-4 text-emerald-200 whitespace-nowrap">
                      {lot.farm_area_hectares ? `${lot.farm_area_hectares} ha` : 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-emerald-200 whitespace-nowrap">
                      {lot.avg_sacks_harvested ? `${lot.avg_sacks_harvested} sacks` : 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLotForQR(lot)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 shadow-sm"
                      >
                        📱 Generate QR
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSaveFeedback('');
                          setSelectedLot(lot);
                        }}
                        className="text-xs text-emerald-300 hover:text-white bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR MODAL */}
      {selectedLotForQR && (
        <SeedLotQRModal
          batchNumber={selectedLotForQR.lot_code}
          seedLotId={selectedLotForQR.id}
          varietyName={getVarietyDisplayName(selectedLotForQR)}
          onClose={() => setSelectedLotForQR(null)}
        />
      )}

      {/* FULL DA TRACEABILITY & DETAILS MODAL - Rendered outside green box */}
      {selectedLot && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  🌾 Seed Lot Traceability Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Registered batch data and harvest yield records
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedLot(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-5 pr-2 my-4 text-xs">
              
              {/* Section 1: Farmer & Location Data */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                  Farmer & Batch Information
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Lot Code:</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">{selectedLot.lot_code}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Farmer Name:</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedLot.farmer_name || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Location:</span>
                    <span className="font-bold text-slate-800">{selectedLot.location || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Contact Number:</span>
                    <span className="font-bold text-slate-800">{selectedLot.contact_number || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Birthday & Gender:</span>
                    <span className="font-bold text-slate-800">
                      {selectedLot.gender || 'N/A'} {selectedLot.birthday ? `(${selectedLot.birthday})` : ''}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">IP Affiliation:</span>
                    <span className="font-bold text-slate-800">
                      {selectedLot.is_ip ? `Yes (${selectedLot.ip_group_name || 'Member'})` : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Cultivation Telemetry */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                    Crop & Farm Telemetry
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleSaveVariety(selectedLot)}
                    disabled={saving || isVarietySaved(selectedLot)}
                    className={`text-[11px] px-3 py-1 rounded-md font-semibold border transition-all ${
                      isVarietySaved(selectedLot)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 cursor-default'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                    }`}
                  >
                    {saving ? 'Saving...' : isVarietySaved(selectedLot) ? '✓ Variety Saved' : '+ Save Variety'}
                  </button>
                </div>

                {saveFeedback && <div className="text-[11px] text-emerald-600 font-medium">{saveFeedback}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Rice Variety:</span>
                    <span className="font-bold text-emerald-700 text-sm">{getVarietyDisplayName(selectedLot)}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Farm Area:</span>
                    <span className="font-bold text-slate-800">{selectedLot.farm_area_hectares ? `${selectedLot.farm_area_hectares} Ha` : 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Seed Beds Count:</span>
                    <span className="font-bold text-slate-800">{selectedLot.seed_beds_count ?? 'N/A'}</span>
                  </div>

                  <div className="sm:col-span-2 bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Planting Date:</span>
                    <span className="font-bold text-slate-800">{selectedLot.planting_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Yield Metrics */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                  Harvest Results
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Harvest Date:</span>
                    <span className="font-bold text-slate-800">{selectedLot.harvest_date || 'Pending'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Total Weight:</span>
                    <span className="font-bold text-slate-800">{selectedLot.harvest_amount_kg ? `${selectedLot.harvest_amount_kg} kg` : 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Sacks Harvested:</span>
                    <span className="font-bold text-slate-800">{selectedLot.avg_sacks_harvested ? `${selectedLot.avg_sacks_harvested} sacks` : 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const current = selectedLot;
                  setSelectedLot(null);
                  setSelectedLotForQR(current);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                📱 Open QR Pass
              </button>

              <button
                type="button"
                onClick={() => setSelectedLot(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors border border-slate-300"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}