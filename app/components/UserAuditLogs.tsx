'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

interface AuditLog {
  id: string;
  user_email: string;
  role: string;
  action: string;
  details?: string;
  created_at: string;
}

export default function UserAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('user_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterRole !== 'all') {
      query = query.eq('role', filterRole);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filterRole]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            🛡️ System Audit & Activity Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time user logins, system interactions, and administrative actions.
          </p>
        </div>

        {/* Role Filter & Refresh */}
        <div className="flex items-center gap-3">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-2 font-medium focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Roles</option>
            <option value="da_head">DA Head</option>
            <option value="da_staff">DA Staff</option>
            <option value="farmer">Farmer</option>
          </select>

          <button
            onClick={fetchLogs}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 text-xs">Loading activity logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">No activity logs recorded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3">Timestamp</th>
                <th className="p-3">User Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 whitespace-nowrap text-slate-500 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{log.user_email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      log.role === 'da_head' 
                        ? 'bg-purple-100 text-purple-800' 
                        : log.role === 'da_staff' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {log.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-900">{log.action}</td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{log.details || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}