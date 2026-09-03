'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

// Expanded Variety Interface to account for schema variations in Supabase
export interface Variety {
  id: string; // PK Variety_ID
  name: string; // Variety_Name
  ecosystem_category?: string;
  ecosystem?: string;
  type?: string;
  establishment_method?: string;
  maturity_days?: string | number;
  average_yield?: string | number;
  avg_yield?: string | number;
  yield?: string | number;
  description?: string;
  created_at?: string;
}

interface SeedVarietyManagerProps {
  userRole?: 'da_head' | 'da_staff' | 'farmer';
}

export default function SeedVarietyManager({ userRole }: SeedVarietyManagerProps) {
  // Form State for Creating New Variety
  const [name, setName] = useState('');
  const [ecosystemCategory, setEcosystemCategory] = useState('Inbred - Irrigated Lowland');
  const [establishmentMethod, setEstablishmentMethod] = useState('Transplanted');
  const [maturityDays, setMaturityDays] = useState('');
  const [averageYield, setAverageYield] = useState('');
  const [description, setDescription] = useState('');

  // Search & List State
  const [searchQuery, setSearchQuery] = useState('');
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal & Edit State
  const [selectedSeed, setSelectedSeed] = useState<Variety | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Variety>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Helper functions for safe fallback resolution
  const getEcosystemDisplay = (seed: Variety) => {
    return seed.ecosystem_category || seed.ecosystem || seed.type || null;
  };

  const getYieldDisplay = (seed: Variety) => {
    const yieldVal = seed.average_yield ?? seed.avg_yield ?? seed.yield;
    if (!yieldVal) return null;
    return typeof yieldVal === 'number' || !yieldVal.toString().includes('t/ha')
      ? `${yieldVal} t/ha`
      : yieldVal;
  };

  // Fetch or Search varieties from Supabase DB Catalog
  const fetchVarieties = async (query = '') => {
    setLoading(true);
    setFetchError(null);

    let request = supabase.from('varieties').select('*');

    if (query.trim()) {
      request = request.ilike('name', `%${query.trim()}%`);
    }

    const { data, error } = await request.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching varieties:', error);
      setFetchError(error.message);
    } else {
      setVarieties(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVarieties();
  }, []);

  // Open Modal and pre-fill Edit Form
  const handleOpenModal = (seed: Variety) => {
    setSelectedSeed(seed);
    setEditForm(seed);
    setIsEditing(false);
  };

  // Save New Seed Variety to Supabase (DA Staff & DA Head Only)
  const handleSaveVariety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMessage(null);

    const newVariety = {
      name: name.trim(),
      ecosystem_category: ecosystemCategory,
      establishment_method: establishmentMethod,
      maturity_days: maturityDays.trim() || null,
      average_yield: averageYield.trim() || null,
      description: description.trim() || null,
    };

    const { error } = await supabase.from('varieties').insert([newVariety]);

    if (error) {
      setMessage({ text: `Failed to save: ${error.message}`, isError: true });
    } else {
      setMessage({ text: `✓ Successfully saved "${name}" to SeedTrace Catalog!`, isError: false });
      setName('');
      setMaturityDays('');
      setAverageYield('');
      setDescription('');
      setEstablishmentMethod('Transplanted');
      fetchVarieties(searchQuery);
    }
    setSaving(false);
  };

  // Update Existing Variety (DA Head / Staff)
  const handleUpdateVariety = async () => {
    if (!selectedSeed || !editForm.name?.trim()) return;

    setEditSaving(true);

    const updatePayload: Record<string, any> = {
      name: editForm.name.trim(),
      establishment_method: editForm.establishment_method,
      maturity_days: editForm.maturity_days ? String(editForm.maturity_days).trim() : null,
      description: editForm.description ? editForm.description.trim() : null,
    };

    // Update ecosystem field depending on which key exists
    if ('ecosystem_category' in selectedSeed) updatePayload.ecosystem_category = editForm.ecosystem_category;
    if ('ecosystem' in selectedSeed) updatePayload.ecosystem = editForm.ecosystem || editForm.ecosystem_category;
    if ('type' in selectedSeed) updatePayload.type = editForm.type || editForm.ecosystem_category;

    // Update yield field depending on which key exists
    const rawYield = editForm.average_yield ?? editForm.avg_yield ?? editForm.yield;
    const cleanYield = rawYield ? String(rawYield).trim() : null;
    if ('average_yield' in selectedSeed) updatePayload.average_yield = cleanYield;
    if ('avg_yield' in selectedSeed) updatePayload.avg_yield = cleanYield;
    if ('yield' in selectedSeed) updatePayload.yield = cleanYield;

    const { error } = await supabase
      .from('varieties')
      .update(updatePayload)
      .eq('id', selectedSeed.id);

    if (error) {
      alert(`Failed to update variety: ${error.message}`);
    } else {
      const updatedItem = { ...selectedSeed, ...editForm } as Variety;
      setSelectedSeed(updatedItem);
      setIsEditing(false);
      fetchVarieties(searchQuery);
    }
    setEditSaving(false);
  };

  const isStaffOrHead = userRole === 'da_head' || userRole === 'da_staff';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto relative">
      
      {/* 1. SEED REGISTRATION FORM */}
      {isStaffOrHead ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">🌱 Register Seed Variety</h2>
            <p className="text-xs text-slate-500">Manage master database catalog for SeedTrace System.</p>
          </div>

          {message && (
            <p className={`text-xs p-3 rounded-lg border ${message.isError ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
              {message.text}
            </p>
          )}

          <form onSubmit={handleSaveVariety} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Variety Name / Code *</label>
              <input 
                type="text" 
                required
                placeholder="e.g., NSIC Rc 222 (Tubigan 18)" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ecosystem Category</label>
                <select
                  value={ecosystemCategory}
                  onChange={(e) => setEcosystemCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Inbred - Irrigated Lowland">Inbred - Irrigated Lowland</option>
                  <option value="Inbred - Submergence Tolerant">Inbred - Submergence Tolerant</option>
                  <option value="Inbred - Rainfed / Drought Tolerant">Inbred - Rainfed / Drought Tolerant</option>
                  <option value="Inbred - Saline Tolerant">Inbred - Saline Tolerant</option>
                  <option value="Hybrid Rice">Hybrid Rice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Establishment Method *</label>
                <select
                  value={establishmentMethod}
                  onChange={(e) => setEstablishmentMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Transplanted">Transplanted</option>
                  <option value="Direct-seeded">Direct-seeded</option>
                  <option value="Both / Either">Both / Either</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Maturity Days</label>
                <input 
                  type="text" 
                  placeholder="e.g., 114" 
                  value={maturityDays}
                  onChange={(e) => setMaturityDays(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Average Yield (t/ha)</label>
                <input 
                  type="text" 
                  placeholder="e.g., 6.1 t/ha" 
                  value={averageYield}
                  onChange={(e) => setAverageYield(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Notes</label>
              <textarea 
                rows={2}
                placeholder="e.g., Resistant to leaf blast and bacterial leaf blight." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Variety to DB'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl space-y-3">
            <span className="text-2xl">🌾</span>
            <h3 className="text-base font-bold text-emerald-900">Farmer Variety DB Catalog View</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Explore officially verified seed varieties registered by DA Staff to optimize your soil & weather conditions.
            </p>
          </div>
        </div>
      )}

      {/* 2. VARIETY DB CATALOG & SEARCH */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">🔍 Variety DB Catalog</h2>
          <p className="text-xs text-slate-500">Query seed catalog for suitability verification and traceability.</p>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search by variety name..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              fetchVarieties(e.target.value);
            }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="border border-slate-100 rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
          {loading ? (
            <p className="text-xs text-slate-400 p-4 text-center">Loading registered varieties...</p>
          ) : fetchError ? (
            <div className="p-4 text-center space-y-1 bg-rose-50 border-rose-100">
              <p className="text-xs font-semibold text-rose-700">Failed to fetch seed varieties</p>
              <p className="text-[11px] text-rose-500">{fetchError}</p>
            </div>
          ) : varieties.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No seed varieties found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {varieties.map((item) => {
                const ecosystem = getEcosystemDisplay(item);
                return (
                  <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                      <div className="flex flex-wrap gap-1">
                        {ecosystem && (
                          <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {ecosystem}
                          </span>
                        )}
                        {item.establishment_method && (
                          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {item.establishment_method}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenModal(item)}
                      className="shrink-0 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                    >
                      👁️ View Info
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL: PROFILE */}
      {selectedSeed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">
                  {isEditing ? 'Edit Seed Variety' : 'SEED VARIETY PROFILE'}
                </span>
                {!isEditing ? (
                  <h3 className="text-lg font-bold text-slate-800">{selectedSeed.name}</h3>
                ) : (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-base font-bold text-slate-800 border border-slate-300 rounded px-2 py-1 w-full mt-1"
                  />
                )}
              </div>
              <button 
                onClick={() => { setSelectedSeed(null); setIsEditing(false); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 font-medium mb-0.5">Ecosystem Category</span>
                    <p className="font-semibold text-slate-800">{getEcosystemDisplay(selectedSeed) || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 font-medium mb-0.5">Establishment Method</span>
                    <p className="font-semibold text-slate-800">{selectedSeed.establishment_method || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="block text-emerald-600 font-medium mb-0.5">⏱️ Maturity Days</span>
                    <p className="font-bold text-emerald-900">{selectedSeed.maturity_days ? `${selectedSeed.maturity_days} Days` : 'N/A'}</p>
                  </div>
                  <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    <span className="block text-amber-700 font-medium mb-0.5">🌾 Average Yield</span>
                    <p className="font-bold text-amber-900">{getYieldDisplay(selectedSeed) || 'N/A'}</p>
                  </div>
                </div>

                {selectedSeed.description && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <span className="block text-slate-400 font-medium">Description / Characteristics</span>
                    <p className="text-slate-600 leading-relaxed">{selectedSeed.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ecosystem Category</label>
                    <select
                      value={getEcosystemDisplay(editForm as Variety) || ''}
                      onChange={(e) => setEditForm({ ...editForm, ecosystem_category: e.target.value, ecosystem: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Inbred - Irrigated Lowland">Inbred - Irrigated Lowland</option>
                      <option value="Inbred - Submergence Tolerant">Inbred - Submergence Tolerant</option>
                      <option value="Inbred - Rainfed / Drought Tolerant">Inbred - Rainfed / Drought Tolerant</option>
                      <option value="Inbred - Saline Tolerant">Inbred - Saline Tolerant</option>
                      <option value="Hybrid Rice">Hybrid Rice</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Establishment Method</label>
                    <select
                      value={editForm.establishment_method || 'Transplanted'}
                      onChange={(e) => setEditForm({ ...editForm, establishment_method: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Transplanted">Transplanted</option>
                      <option value="Direct-seeded">Direct-seeded</option>
                      <option value="Both / Either">Both / Either</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Maturity Days</label>
                    <input
                      type="text"
                      value={editForm.maturity_days || ''}
                      onChange={(e) => setEditForm({ ...editForm, maturity_days: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Average Yield</label>
                    <input
                      type="text"
                      value={editForm.average_yield ?? editForm.avg_yield ?? editForm.yield ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, average_yield: e.target.value, avg_yield: e.target.value, yield: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setSelectedSeed(null)}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                  >
                    Close Info
                  </button>
                  {isStaffOrHead && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                    >
                      ✏️ Edit Variety
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateVariety}
                    disabled={editSaving}
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}