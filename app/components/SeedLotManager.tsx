'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import SeedLotQRModal from './SeedLotQRModal';

export interface SeedLot {
  id: string;
  lot_code: string;

  // Farm Registration Telemetry
  farmer_name?: string;
  location?: string;
  registered_municipal_area?: string;
  total_parcel_count?: number;
  area_to_be_planted_ha?: number;
  number_of_bags?: number;
  rice_variety_received?: string;
  crop_establishment?: 'D' | 'T';
  expected_sowing_date?: string;

  // Major Seed & Harvest Telemetry
  seed_class?: 'CS' | 'H' | 'F';
  variety_id?: string;
  planted_variety?: string;
  area_harvested_ha?: number;
  total_harvest_bags?: number;
  harvest_weight_per_bag_kg?: number;
  date_received?: string;

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

  const fetchSeedLots = useCallback(async () => {
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
  }, []);

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
  }, [fetchSeedLots]);

  const handleSaveVariety = async (lot: SeedLot) => {
    const varietyId =
      lot.varieties?.id ||
      lot.variety_id ||
      lot.planted_variety ||
      lot.rice_variety_received ||
      'Unknown Variety';

    const varietyName =
      lot.varieties?.variety_name ||
      lot.varieties?.name ||
      lot.planted_variety ||
      lot.rice_variety_received ||
      'Unknown Variety';

    setSaving(true);
    setSaveFeedback('');

    try {
      const { error: dbError } = await supabase
        .from('saved_varieties')
        .insert([{ variety_id: varietyId, variety_name: varietyName }]);

      if (dbError && dbError.code !== '23505') {
        console.warn('Supabase save notice:', dbError.message);
      }

      const updatedList = Array.from(new Set([...savedVarietyIds, varietyId, varietyName]));
      setSavedVarietyIds(updatedList);
      localStorage.setItem('saved_rice_varieties', JSON.stringify(updatedList));

      setSaveFeedback('✓ Variety saved successfully!');
    } catch {
      setSaveFeedback('Saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const getVarietyDisplayName = (lot: SeedLot) =>
    lot.planted_variety ||
    lot.varieties?.variety_name ||
    lot.varieties?.name ||
    lot.rice_variety_received ||
    'N/A';

  const isVarietySaved = (lot: SeedLot) => {
    const varId = lot.varieties?.id || lot.variety_id;
    const varName = lot.planted_variety || lot.rice_variety_received;
    
    return Boolean(
      (varId && savedVarietyIds.includes(varId)) ||
      (varName && savedVarietyIds.includes(varName))
    );
  };

  const filteredLots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return seedLots;

    return seedLots.filter((lot) => {
      const lotCode = (lot.lot_code || lot.id || '').toLowerCase();
      const farmer = (lot.farmer_name || '').toLowerCase();
      const location = (lot.location || lot.registered_municipal_area || '').toLowerCase();
      const varietyName = getVarietyDisplayName(lot).toLowerCase();

      return (
        lotCode.includes(query) ||
        farmer.includes(query) ||
        location.includes(query) ||
        varietyName.includes(query)
      );
    });
  }, [seedLots, searchQuery]);

  return (
    <>
      <div className="w-full bg-emerald-950/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-emerald-800 text-white space-y-6 shadow-xl">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Digital Rice Seed Lot Records</h2>
            <p className="text-xs text-emerald-200 mt-1">
              Track DA farmer field allotments, seed distributions, and harvest metrics
            </p>
          </div>

          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              + Register Digital Record
            </button>
          )}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by Farmer, Location, Lot Code, or Planted Variety..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-emerald-900/40 border border-emerald-700 text-white placeholder-emerald-400/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
        />

        {/* Main Seed Lots Table */}
        {loading ? (
          <div className="p-12 text-center text-sm text-emerald-300 animate-pulse">
            Loading digital seed records...
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="p-12 text-center text-sm text-emerald-300 border border-dashed border-emerald-800 rounded-xl">
            No matching digital seed lot records found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-emerald-800/80">
            <table className="w-full text-left text-sm text-emerald-100">
              <thead className="text-xs uppercase bg-emerald-900/90 text-emerald-300 border-b border-emerald-800">
                <tr>
                  <th className="px-5 py-3.5">Lot Code</th>
                  <th className="px-5 py-3.5">Farmer Name</th>
                  <th className="px-5 py-3.5">Municipal Area</th>
                  <th className="px-5 py-3.5">Planted Variety</th>
                  <th className="px-5 py-3.5">Seed Class</th>
                  <th className="px-5 py-3.5">Area (Ha)</th>
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
                      {lot.farmer_name || 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-emerald-200">
                      {lot.location || lot.registered_municipal_area || 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-emerald-200 font-medium whitespace-nowrap">
                      {getVarietyDisplayName(lot)}
                    </td>
                    <td className="px-5 py-4 text-emerald-200 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-900/80 border border-emerald-700">
                        {lot.seed_class || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-emerald-200 whitespace-nowrap">
                      {lot.area_to_be_planted_ha ? `${lot.area_to_be_planted_ha} ha` : 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLotForQR(lot)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 shadow-sm"
                      >
                        📱 QR Pass
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSaveFeedback('');
                          setSelectedLot(lot);
                        }}
                        className="text-xs text-emerald-300 hover:text-white bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-700 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center font-medium"
                      >
                        View Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {selectedLotForQR && (
        <SeedLotQRModal
          batchNumber={selectedLotForQR.lot_code}
          seedLotId={selectedLotForQR.id}
          varietyName={getVarietyDisplayName(selectedLotForQR)}
          onClose={() => setSelectedLotForQR(null)}
        />
      )}

      {/* Full Digital Record Modal */}
      {selectedLot && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  🌾 Digital Seed Lot Record
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Complete Field Profile and Harvest Telemetry Log
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
              
              {/* Section 1: Farmer & Land Details */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                  1. Farmer & Area Registration
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Lot Code:</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">{selectedLot.lot_code}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Farmer Name:</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedLot.farmer_name || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Farm Location:</span>
                    <span className="font-bold text-slate-800">{selectedLot.location || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Municipal Area:</span>
                    <span className="font-bold text-slate-800">{selectedLot.registered_municipal_area || selectedLot.location || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Total Parcel Count:</span>
                    <span className="font-bold text-slate-800">{selectedLot.total_parcel_count ?? 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Area to be Planted:</span>
                    <span className="font-bold text-slate-800">{selectedLot.area_to_be_planted_ha ? `${selectedLot.area_to_be_planted_ha} ha` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Distribution & Establishment */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                  2. Seed Allocation & Establishment
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Number of Bags (20kg/bag):</span>
                    <span className="font-bold text-slate-800">{selectedLot.number_of_bags ? `${selectedLot.number_of_bags} bags` : 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Rice Variety Received:</span>
                    <span className="font-bold text-emerald-700">{selectedLot.rice_variety_received || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Crop Estab [D/T]:</span>
                    <span className="font-bold text-slate-800">
                      {selectedLot.crop_establishment === 'D' ? 'Direct Sown (D)' : selectedLot.crop_establishment === 'T' ? 'Transplanted (T)' : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Expected Sowing Date:</span>
                    <span className="font-bold text-slate-800">{selectedLot.expected_sowing_date || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Date Received:</span>
                    <span className="font-bold text-slate-800">{selectedLot.date_received || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Major Seed & Variety Harvested */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                    3. Major Seed & Harvest Production
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Seed Class:</span>
                    <span className="font-bold text-slate-800">
                      {selectedLot.seed_class === 'CS' ? 'Certified Seed (CS)' : selectedLot.seed_class === 'H' ? 'Hybrid (H)' : selectedLot.seed_class === 'F' ? 'Foundation (F)' : 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Planted Variety:</span>
                    <span className="font-bold text-emerald-700 text-sm">{getVarietyDisplayName(selectedLot)}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Area Harvested:</span>
                    <span className="font-bold text-slate-800">{selectedLot.area_harvested_ha ? `${selectedLot.area_harvested_ha} ha` : 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Total Harvest:</span>
                    <span className="font-bold text-slate-800">{selectedLot.total_harvest_bags ? `${selectedLot.total_harvest_bags} bags` : 'N/A'}</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block font-semibold text-[11px] mb-0.5">Harvest Weight / Bag:</span>
                    <span className="font-bold text-slate-800">{selectedLot.harvest_weight_per_bag_kg ? `${selectedLot.harvest_weight_per_bag_kg} kg` : 'N/A'}</span>
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
