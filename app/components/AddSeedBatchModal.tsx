'use client';

import { useState } from 'react';
import { supabase } from '../../utils/supabase';

interface AddSeedBatchModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddSeedBatchModal({ onClose, onSuccess }: AddSeedBatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State matching exact specification
  const [formData, setFormData] = useState({
    lot_code: '',
    farmer_name: '',
    location: '',
    registered_municipal_area: '',
    total_parcel_count: 1,
    area_to_be_planted_ha: '',
    number_of_bags: '',
    rice_variety_received: '',
    crop_establishment: 'D',
    expected_sowing_date: '',
    seed_class: 'CS',
    planted_variety: '',
    area_harvested_ha: '',
    total_harvest_bags: '',
    harvest_weight_per_bag_kg: '50',
    date_received: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        lot_code: formData.lot_code || `LOT-${Date.now().toString().slice(-6)}`,
        farmer_name: formData.farmer_name,
        location: formData.location,
        registered_municipal_area: formData.registered_municipal_area,
        total_parcel_count: Number(formData.total_parcel_count) || 1,
        area_to_be_planted_ha: formData.area_to_be_planted_ha ? Number(formData.area_to_be_planted_ha) : null,
        number_of_bags: formData.number_of_bags ? Number(formData.number_of_bags) : null,
        rice_variety_received: formData.rice_variety_received,
        crop_establishment: formData.crop_establishment,
        expected_sowing_date: formData.expected_sowing_date,
        seed_class: formData.seed_class,
        planted_variety: formData.planted_variety,
        area_harvested_ha: formData.area_harvested_ha ? Number(formData.area_harvested_ha) : null,
        total_harvest_bags: formData.total_harvest_bags ? Number(formData.total_harvest_bags) : null,
        harvest_weight_per_bag_kg: formData.harvest_weight_per_bag_kg ? Number(formData.harvest_weight_per_bag_kg) : 50,
        date_received: formData.date_received || null,
        status: 'Registered',
      };

      const { error } = await supabase.from('seed_lots').insert([payload]);

      if (error) throw error;

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'Failed to register seed batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white text-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              🌾 DA Seed Batch Registration
            </h3>
            <p className="text-xs text-slate-500 mt-1">Record rice seed distribution & farmer field telemetry</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-6 pr-2 my-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Farmer & Field Profile */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
              1. Farmer & Location Profile
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Code Identifier *</label>
                <input
                  type="text"
                  name="lot_code"
                  required
                  placeholder="e.g., LOT-2026-A1"
                  value={formData.lot_code}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Farmer Name *</label>
                <input
                  type="text"
                  name="farmer_name"
                  required
                  placeholder="e.g., Juan Dela Cruz"
                  value={formData.farmer_name}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Farm Location *</label>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g., Brgy. San Jose"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Municipal Rice Area</label>
                <input
                  type="text"
                  name="registered_municipal_area"
                  placeholder="e.g., District 1 / Municipality"
                  value={formData.registered_municipal_area}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Parcel Count</label>
                <input
                  type="number"
                  name="total_parcel_count"
                  min="1"
                  value={formData.total_parcel_count}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Area to be Planted (ha)</label>
                <input
                  type="number"
                  step="0.01"
                  name="area_to_be_planted_ha"
                  placeholder="e.g., 1.5"
                  value={formData.area_to_be_planted_ha}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Distribution & Establishment */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
              2. Distribution & Sowing Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of Bags (20kg/bag)</label>
                <input
                  type="number"
                  name="number_of_bags"
                  placeholder="e.g., 5"
                  value={formData.number_of_bags}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rice Variety Received</label>
                <input
                  type="text"
                  name="rice_variety_received"
                  placeholder="e.g., NSIC Rc 222"
                  value={formData.rice_variety_received}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Crop Estab [D/T]</label>
                <select
                  name="crop_establishment"
                  value={formData.crop_establishment}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                >
                  <option value="D">Direct Sown (D)</option>
                  <option value="T">Transplanted (T)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Sowing Date [Month/Week]</label>
                <input
                  type="text"
                  name="expected_sowing_date"
                  placeholder="e.g., May - Week 2"
                  value={formData.expected_sowing_date}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date Received</label>
                <input
                  type="date"
                  name="date_received"
                  value={formData.date_received}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Major Seed & Variety Planted */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-4">
            <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
              3. Major Seed & Harvest Production
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seed Class (CS/H/F)</label>
                <select
                  name="seed_class"
                  value={formData.seed_class}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                >
                  <option value="CS">Certified Seed (CS)</option>
                  <option value="H">Hybrid (H)</option>
                  <option value="F">Foundation (F)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Planted Variety</label>
                <input
                  type="text"
                  name="planted_variety"
                  placeholder="e.g., PSB Rc 18"
                  value={formData.planted_variety}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Area Harvested (ha)</label>
                <input
                  type="number"
                  step="0.01"
                  name="area_harvested_ha"
                  placeholder="e.g., 1.2"
                  value={formData.area_harvested_ha}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Harvest (Bag)</label>
                <input
                  type="number"
                  name="total_harvest_bags"
                  placeholder="e.g., 120"
                  value={formData.total_harvest_bags}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harvest Weight per Bag (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="harvest_weight_per_bag_kg"
                  placeholder="e.g., 50"
                  value={formData.harvest_weight_per_bag_kg}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors border border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Saving Record...' : 'Save Seed Batch Record'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
