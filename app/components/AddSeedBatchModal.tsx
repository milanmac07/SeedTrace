'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

interface AddSeedBatchModalProps {
  onBatchCreated?: () => void;
}

export default function AddSeedBatchModal({ onBatchCreated }: AddSeedBatchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [varieties, setVarieties] = useState<any[]>([]);

  // 1. Farmer Demographics
  const [batchId, setBatchId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('Male');
  const [isIp, setIsIp] = useState(false);
  const [ipGroupName, setIpGroupName] = useState('');

  // 2. Farm & Seed Metrics
  const [varietyInput, setVarietyInput] = useState('');
  const [farmAreaHectares, setFarmAreaHectares] = useState('');
  const [seedBedsCount, setSeedBedsCount] = useState('');
  const [plantedDate, setPlantedDate] = useState('');

  // 3. Harvest Data
  const [harvestDate, setHarvestDate] = useState('');
  const [harvestAmountKg, setHarvestAmountKg] = useState('');
  const [avgSacksHarvested, setAvgSacksHarvested] = useState('');
  const [status, setStatus] = useState('Registered');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      supabase
        .from('varieties')
        .select('*')
        .then(({ data, error }) => {
          if (error) console.error('Error fetching varieties:', error);
          if (data) setVarieties(data);
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const matchedVariety = varieties.find(
      (v) =>
        v.id === varietyInput ||
        (v.variety_name || v.name || '').toLowerCase() === varietyInput.trim().toLowerCase()
    );

    const finalVarietyValue = matchedVariety ? matchedVariety.id : varietyInput.trim();

    // Insert all DA fields into seed_lots
    const { error } = await supabase.from('seed_lots').insert([
      {
        lot_code: batchId.trim().toUpperCase(),
        farmer_name: farmerName,
        contact_number: contactNumber,
        location: location,
        birthday: birthday || null,
        gender: gender,
        is_ip: isIp,
        ip_group_name: isIp ? ipGroupName : null,
        variety_id: finalVarietyValue || null,
        farm_area_hectares: farmAreaHectares ? parseFloat(farmAreaHectares) : null,
        seed_beds_count: seedBedsCount ? parseInt(seedBedsCount, 10) : null,
        planting_date: plantedDate || null,
        harvest_date: harvestDate || null,
        harvest_amount_kg: harvestAmountKg ? parseFloat(harvestAmountKg) : null,
        avg_sacks_harvested: avgSacksHarvested ? parseInt(avgSacksHarvested, 10) : null,
        status: status,
      },
    ]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('✓ Seed batch added successfully!');
      
      // Reset Form Fields
      setBatchId('');
      setFarmerName('');
      setContactNumber('');
      setLocation('');
      setBirthday('');
      setGender('Male');
      setIsIp(false);
      setIpGroupName('');
      setVarietyInput('');
      setFarmAreaHectares('');
      setSeedBedsCount('');
      setPlantedDate('');
      setHarvestDate('');
      setHarvestAmountKg('');
      setAvgSacksHarvested('');

      if (onBatchCreated) onBatchCreated();
      
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 800);
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
      >
        + Register New Seed Batch
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl text-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Sticky/Fixed Header */}
            <div className="flex justify-between items-center border-b p-5 shrink-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-800">🌾 DA Seed Batch Registration</h3>
                <p className="text-xs text-slate-500">Record rice seed distribution & farmer telemetry</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto p-6 space-y-4">
              {message && (
                <p className={`text-xs p-2.5 rounded-lg font-medium ${message.startsWith('✓') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {message}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Section 1: Demographics */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">1. Farmer Demographic Profile</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Batch Code Identifier</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., LOT-2026-A1"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Farmer Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Juan Dela Cruz"
                        value={farmerName}
                        onChange={(e) => setFarmerName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Location / Barangay</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Brgy. San Jose"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Contact Number</label>
                      <input
                        type="tel"
                        placeholder="e.g., 09123456789"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Birthday</label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={isIp}
                          onChange={(e) => setIsIp(e.target.checked)}
                          className="rounded accent-emerald-600 w-4 h-4"
                        />
                        Indigenous People (IP) Member?
                      </label>
                      {isIp && (
                        <input
                          type="text"
                          placeholder="Specify IP Tribe / Community"
                          value={ipGroupName}
                          onChange={(e) => setIpGroupName(e.target.value)}
                          className="flex-1 border border-slate-300 rounded p-1.5 outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Farm Metrics */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">2. Planting & Farm Metrics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Rice Variety Used <span className="font-normal text-slate-400">(Select or type custom)</span>
                      </label>
                      <input
                        type="text"
                        required
                        list="variety-options"
                        placeholder="e.g., NSIC Rc 222 or custom..."
                        value={varietyInput}
                        onChange={(e) => setVarietyInput(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                      <datalist id="variety-options">
                        {varieties.map((v) => (
                          <option key={v.id} value={v.variety_name || v.name}>
                            {v.type || v.variety_name}
                          </option>
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Farm Area (Hectares)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1.5"
                        value={farmAreaHectares}
                        onChange={(e) => setFarmAreaHectares(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Seed Beds / Dapog Count</label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={seedBedsCount}
                        onChange={(e) => setSeedBedsCount(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Planted Date</label>
                      <input
                        type="date"
                        value={plantedDate}
                        onChange={(e) => setPlantedDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="Registered">Registered</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Inspection Passed">Inspection Passed</option>
                        <option value="Ready for Distribution">Ready for Distribution</option>
                        <option value="Distributed">Distributed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Harvest Metrics */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px]">3. Harvest Production Data</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Harvest Date</label>
                      <input
                        type="date"
                        value={harvestDate}
                        onChange={(e) => setHarvestDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Total Harvest (KG)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 4500"
                        value={harvestAmountKg}
                        onChange={(e) => setHarvestAmountKg(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Avg Sacks Harvested</label>
                      <input
                        type="number"
                        placeholder="e.g. 90"
                        value={avgSacksHarvested}
                        onChange={(e) => setAvgSacksHarvested(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 transition-colors shadow-md"
                  >
                    {loading ? 'Saving Record...' : 'Save Seed Batch'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}