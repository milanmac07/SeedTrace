import { supabase } from '../../../utils/supabase';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicTracePage({ params }: Props) {
  const { id } = await params;

  // Fetch Seed Lot + Linked Variety + Environmental Logs
  const { data: lot, error } = await supabase
    .from('seed_lots')
    .select('*, varieties(*), environmental_data(*)')
    .eq('id', id)
    .single();

  if (error || !lot) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center max-w-md w-full">
          <p className="text-sm font-semibold text-slate-800">Seed Lot Record Not Found</p>
          <p className="text-xs text-slate-500 mt-1">The scanned QR code or ID does not exist in the database.</p>
        </div>
      </div>
    );
  }

  // Fallbacks for variety name attributes
  const varietyName =
    lot.varieties?.variety_name ||
    lot.varieties?.name ||
    lot.variety_id ||
    'Registered Rice Seed';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-lg mx-auto space-y-4">
        
        {/* Certificate Card Header */}
        <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-md text-center space-y-2">
          <span className="text-[10px] bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full font-mono uppercase tracking-wider font-semibold">
            DA Verified Seed Certificate
          </span>
          <h1 className="text-2xl font-extrabold text-white">{varietyName}</h1>
          <p className="text-xs text-emerald-100 font-mono">
            Lot Code: <span className="font-bold text-white">{lot.lot_code || lot.batch_number || id}</span>
          </p>
        </div>

        {/* 1. Farmer Demographic Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            1. Farmer Demographic Profile
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block">Farmer Name:</span>
              <span className="font-semibold text-slate-800 text-sm">{lot.farmer_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Contact Number:</span>
              <span className="font-semibold text-slate-800">{lot.contact_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Location / Barangay:</span>
              <span className="font-semibold text-slate-800">{lot.location || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Gender & Birthday:</span>
              <span className="font-semibold text-slate-800">
                {lot.gender || 'N/A'} {lot.birthday ? `(${lot.birthday})` : ''}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block">Indigenous People (IP) Member:</span>
              <span className="font-semibold text-slate-800">
                {lot.is_ip ? `Yes ${lot.ip_group_name ? `(${lot.ip_group_name})` : ''}` : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Planting & Farm Metrics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            2. Planting & Farm Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block">Certification Status:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block mt-0.5">
                {lot.status || 'Certified'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Farm Area (Hectares):</span>
              <span className="font-semibold text-slate-800">
                {lot.farm_area_hectares ? `${lot.farm_area_hectares} ha` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Seed Beds / Dapog Count:</span>
              <span className="font-semibold text-slate-800">{lot.seed_beds_count ?? 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Planting Date:</span>
              <span className="font-semibold text-slate-800">{lot.planting_date || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Maturity Days:</span>
              <span className="font-semibold text-slate-800">
                {lot.varieties?.maturity_days ? `${lot.varieties.maturity_days} Days` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Ideal Soil pH:</span>
              <span className="font-semibold text-slate-800">{lot.varieties?.ideal_soil_ph || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* 3. Harvest Production Data */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
            3. Harvest Yield Telemetry
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">Harvest Date</span>
              <span className="font-bold text-slate-800 text-xs">{lot.harvest_date || 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Weight</span>
              <span className="font-bold text-slate-800 text-xs">
                {lot.harvest_amount_kg ? `${lot.harvest_amount_kg} kg` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Yield Sacks</span>
              <span className="font-bold text-emerald-700 text-xs">
                {lot.avg_sacks_harvested ? `${lot.avg_sacks_harvested} Sacks` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Environmental Telemetry Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex justify-between items-center">
            <span>Field Environmental Logs</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
              {lot.environmental_data?.length || 0}
            </span>
          </h3>
          {lot.environmental_data && lot.environmental_data.length > 0 ? (
            <div className="space-y-2">
              {lot.environmental_data.map((log: any) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span><strong>Region:</strong> {log.region || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    <strong>Soil pH:</strong> {log.current_soil_ph} | <strong>Rainfall:</strong> {log.avg_monthly_rainfall_mm}mm
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-[11px]">No environmental telemetry recorded for this lot yet.</p>
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