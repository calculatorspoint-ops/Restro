import React, { useState, useMemo } from 'react';
import { History, Search, Download, Filter, User } from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatDateTime } from '../utils/formatters';
import { exportToExcel } from '../utils/excel';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const displayedLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.recordId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;

      return matchesSearch && matchesAction && matchesModule;
    });
  }, [auditLogs, searchTerm, actionFilter, moduleFilter]);

  const modules = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.module))).filter(Boolean);
  }, [auditLogs]);

  const handleExport = () => {
    const exportData = displayedLogs.map((l) => ({
      'Log ID': l.id,
      'Timestamp': formatDateTime(l.timestamp),
      'User Name': l.userName,
      'User Role': l.userRole,
      'Action': l.action,
      'Module': l.module,
      'Record ID': l.recordId,
      'Change Summary': l.summary
    }));
    exportToExcel(exportData, 'System_Audit_Log');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, summary, record..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Actions</option>
            <option value="Created">Created</option>
            <option value="Updated">Updated</option>
            <option value="Deleted">Deleted</option>
            <option value="Transferred">Transferred</option>
            <option value="Imported">Imported</option>
            <option value="Exported">Exported</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExport}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Trail</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Responsible User</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Record Identifier</th>
                <th className="py-3 px-4">Action Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 capitalize block">{log.userRole.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-sm border ${
                        log.action === 'Created'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : log.action === 'Updated'
                          ? 'text-sky-700 bg-sky-50 border-sky-200'
                          : log.action === 'Deleted'
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : 'text-purple-700 bg-purple-50 border-purple-200'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {log.module}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {log.recordId}
                  </td>
                  <td className="py-3 px-4 text-slate-700 min-w-[280px]">
                    {log.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayedLogs.length === 0 && (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit log entries matching filters.
          </div>
        )}
      </div>
    </div>
  );
};
