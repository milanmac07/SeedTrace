'use client';

import React from 'react';

export default function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            System Overview
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          About Project SeedTrace
        </h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          <strong>SeedTrace</strong> is a digital platform designed to bridge smart technology and sustainable agriculture in San Jose. By combining field logging, environmental telemetry, and seed lineage tracking, it provides transparent and efficient agricultural resource management.
        </p>
      </div>

      {/* Mission & Vision Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
            🌱
          </div>
          <h3 className="text-lg font-bold text-slate-800">Our Mission</h3>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            To provide a transparent, data-driven framework for tracking seed distributions, verifying grain lineages, and helping agricultural offices allocate resources effectively.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
            🎯
          </div>
          <h3 className="text-lg font-bold text-slate-800">Our Vision</h3>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            A digitized agricultural ecosystem where real-time environmental metrics and lineage tracking empower municipal agricultural offices and local farming communities.
          </p>
        </div>
      </div>

      {/* Access Roles Breakdown */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
          Authorization & Core Modules
        </h3>

        <div className="grid md:grid-cols-3 gap-6 text-xs md:text-sm">
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-lg">🏛️</div>
            <h4 className="font-bold text-slate-800">DA Head</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Full administrative oversight, access to analytical decision support tools, system logs, and resource allocation controls.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-lg">📋</div>
            <h4 className="font-bold text-slate-800">DA Staff</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Operational access to field data logging, variety maintenance, and verifying farmer distribution records.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-lg">🌾</div>
            <h4 className="font-bold text-slate-800">Farmers</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Public portal access for viewing seed lineage histories, weather metrics, and reading registered crop varieties.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}