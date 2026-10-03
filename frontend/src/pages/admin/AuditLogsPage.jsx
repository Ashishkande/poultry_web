import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, User } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, [entityFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs(100, entityFilter || undefined);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable chronological record of administrator approvals, manager entries, and farm operations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="">All Entity Types</option>
            <option value="User">User</option>
            <option value="Farm">Farm</option>
            <option value="Shade">Shade</option>
            <option value="Batch">Batch</option>
            <option value="MortalityRecord">Mortality Record</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Retrieving secure audit records..." />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <History className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Audit Logs Found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Modifications / Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-sans text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-sans">
                      <p className="font-bold text-slate-900">{log.user_name}</p>
                      <p className="text-[10px] text-slate-400">{log.user_email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-sans">
                      <span className="text-xs font-semibold text-slate-700">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-[10px] text-slate-400 block">ID: #{log.entity_id}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-sm truncate text-[11px] text-slate-600 font-mono">
                      {log.new_data || log.old_data || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
