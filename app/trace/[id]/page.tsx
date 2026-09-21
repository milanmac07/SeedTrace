import { createClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase } from '../../../utils/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

// Service role client bypasses RLS rules when available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : defaultSupabase;

export default async function PublicTracePage({ params }: Props) {
  const { id } = await params;

  // UUID pattern check to determine search strategy
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let lot: any = null;

  // 1. Fetch seed_lots record
  if (isUuid) {
    const { data } = await supabase
      .from('seed_lots')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    lot = data;
  }

  if (!lot) {
    const { data } = await supabase
      .from('seed_lots')
      .select('*')
      .eq('lot_code', id)
      .maybeSingle();
    lot = data;
  }

  // Not Found fallback UI
  if (!lot) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full space-y-2">
          <p className="text-sm font-bold text-slate-800">Seed Lot Record Not Found</p>
          <p className="text-xs text-slate-500">
             No registration record exists for identifier: <span className="font-mono text-slate-700 font-bold">{id}</span>
          </p>
        </div>
      </div>
    );
  }

  // 2. Query related environmental telemetry logs
  const { data: envLogs } = await supabase
    .from('environmental_data')
    .select('*')
    .eq('seed_lot_id', lot.id);

  // Field Resolution & Formatter Mapping
  const cropEstablishmentLabel =
    lot.crop_establishment === 'D'
      ? 'Direct Sown (D)'
      : lot.crop_establishment === 'T'
      ? 'Transplanted (T)'
      : lot.crop_establishment || 'N/A';

  const seedClassLabel =
    lot.seed_class === 'CS'
      ? 'Certified Seed (CS)'
      : lot.seed_class === 'H'
      ? 'Hybrid (H)'
      : lot.seed_class === 'F'
      ? 'Foundation (F)'
      : lot.seed_class || 'Registered';

  const harvestBags = lot.total_harvest_bags ?? null;
  const bagWeight = lot.harvest_weight_per_bag_kg ?? 50;
  const calculatedTotalKg = harvestBags ? harvestBags * bagWeight : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-lg mx-auto space-y-4">
        
        {/* Banner Header */}
        <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-md text-center space-y-2">
          <span className="text-[10px] bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full font-mono uppercase tracking-wider font-semibold">
            🌾 DA Seed Batch Traceability
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            {lot.rice_variety_received || lot.planted_variety || 'Registered Rice Seed'}
          </h1>
          <p className="text-xs text-emerald-100 font-mono">
            Batch Code: <span className="font-bold text-white">{lot.lot_code}</span>
          </p>
        </div>

        {/* Section 1: Farmer & Location Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            1. Farmer & Location Profile
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block">Farmer Name:</span>
              <span className="font-semibold text-slate-800 text-sm">{lot.farmer_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Farm Location:</span>
              <span className="font-semibold text-slate-800">{lot.location || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Municipal Area:</span>
              <span className="font-semibold text-slate-800">{lot.registered_municipal_area || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Parcels:</span>
              <span className="font-semibold text-slate-800">{lot.total_parcel_count ?? 1}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block">Area to be Planted:</span>
              <span className="font-semibold text-slate-800">
                {lot.area_to_be_planted_ha ? `${lot.area_to_be_planted_ha} hectares` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Distribution & Sowing Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            2. Distribution & Sowing Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block">Status:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block mt-0.5">
                {lot.status || 'Registered'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Bags Allocated:</span>
              <span className="font-semibold text-slate-800">
                {lot.number_of_bags ? `${lot.number_of_bags} Bags (20kg/bag)` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Variety Received:</span>
              <span className="font-semibold text-slate-800">{lot.rice_variety_received || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Crop Establishment:</span>
              <span className="font-semibold text-slate-800">{cropEstablishmentLabel}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Expected Sowing Date:</span>
              <span className="font-semibold text-slate-800">{lot.expected_sowing_date || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Date Received:</span>
              <span className="font-semibold text-slate-800">{lot.date_received || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Major Seed & Harvest Production */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            3. Major Seed & Harvest Production
          </h3>
          <div className="grid grid-cols-2 gap-3 pb-2">
            <div>
              <span className="text-slate-400 block">Seed Class:</span>
              <span className="font-semibold text-slate-800">{seedClassLabel}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Planted Variety:</span>
              <span className="font-semibold text-slate-800">{lot.planted_variety || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Harvested Area</span>
              <span className="font-bold text-slate-800 text-xs">
                {lot.area_harvested_ha ? `${lot.area_harvested_ha} ha` : 'Pending'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Harvest</span>
              <span className="font-bold text-emerald-700 text-xs">
                {harvestBags ? `${harvestBags} Bags` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Calculated Weight</span>
              <span className="font-bold text-slate-800 text-xs">
                {calculatedTotalKg ? `${calculatedTotalKg} kg` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Environmental Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex justify-between items-center">
            <span>Environmental Telemetry Logs</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
              {envLogs?.length || 0}
            </span>
          </h3>
          {envLogs && envLogs.length > 0 ? (
            <div className="space-y-2">
              {envLogs.map((log: any) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span><strong>Region:</strong> {log.region || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    <strong>Soil pH:</strong> {log.current_soil_ph ?? 'N/A'} | <strong>Rainfall:</strong> {log.avg_monthly_rainfall_mm ?? 'N/A'}mm
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-[11px]">No environmental telemetry recorded for this seed batch.</p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 pt-2">
          Department of Agriculture Seed Traceability System • Public Verification
        </p>
      </div>
    </div>
  );
}
