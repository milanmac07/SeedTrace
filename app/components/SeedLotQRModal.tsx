'use client';

import { QRCodeCanvas } from 'qrcode.react';

interface SeedLotQRModalProps {
  batchNumber: string;
  seedLotId: string;
  varietyName: string;
  onClose: () => void;
}

export default function SeedLotQRModal({ batchNumber, seedLotId, varietyName, onClose }: SeedLotQRModalProps) {
  // Construct dynamic tracking URL for mobile scanning
  const trackingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/trace/${seedLotId}`
    : `/trace/${seedLotId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-emerald-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center text-slate-100">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            📱 Seed Lot QR Pass
          </h3>
          <p className="text-xs text-emerald-300/80 mt-1">Scan to inspect verified batch lineage</p>
        </div>

        {/* QR CODE CANVAS */}
        <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
          <QRCodeCanvas 
            value={trackingUrl} 
            size={180} 
            level="H"
            includeMargin={true}
          />
        </div>

        {/* METADATA */}
        <div className="text-xs space-y-1.5 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left font-mono">
          <p><strong className="text-emerald-400 font-sans">Lot Code:</strong> {batchNumber}</p>
          <p><strong className="text-emerald-400 font-sans">Variety:</strong> {varietyName}</p>
          <p className="truncate"><strong className="text-emerald-400 font-sans">URL:</strong> {trackingUrl}</p>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md"
          >
            🖨️ Print Label
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}