import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Clock,
  Database,
  RotateCcw,
  X,
  Layers,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { perfMonitor, PerformanceSummary } from '../../utils/performanceMonitor';
import { testFirestoreConnection, forceFirestoreReconnect } from '../../firebase';
import { useData } from '../../context/DataContext';

interface PerformanceDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceDiagnosticsModal: React.FC<PerformanceDiagnosticsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { syncStatus, lastSyncTime, reloadState } = useData();
  const [summary, setSummary] = useState<PerformanceSummary>(perfMonitor.getSummary());
  const [probeStatus, setProbeStatus] = useState<{ testing: boolean; ok?: boolean; latencyMs?: number; error?: string }>({ testing: false });

  const runProbe = async () => {
    setProbeStatus({ testing: true });
    try {
      const res = await testFirestoreConnection(3500);
      setProbeStatus({ testing: false, ok: res.ok, latencyMs: res.latencyMs, error: res.error });
    } catch (e: any) {
      setProbeStatus({ testing: false, ok: false, error: e?.message || 'Probe failed' });
    }
  };

  const handleReconnect = async () => {
    setProbeStatus({ testing: true });
    await forceFirestoreReconnect();
    await reloadState(true);
    await runProbe();
  };

  useEffect(() => {
    if (!isOpen) return;
    runProbe();
    const unsubscribe = perfMonitor.subscribe((latest) => {
      setSummary(latest);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <span>Database Performance & Diagnostics</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Real-time Firestore query latency, cache efficiency, and write metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close performance diagnostics"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Live Cloud Connection Status Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                probeStatus.testing
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : probeStatus.ok
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {probeStatus.testing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : probeStatus.ok ? (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Cloud Firestore Connection:
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                    probeStatus.testing
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : probeStatus.ok
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${probeStatus.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {probeStatus.testing
                      ? 'Testing probe...'
                      : probeStatus.ok
                      ? `Online & Verified (${probeStatus.latencyMs}ms)`
                      : 'Offline / Reconnecting'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Status: <span className="font-mono font-semibold text-slate-700 uppercase">{syncStatus}</span>
                  {lastSyncTime ? ` · Last server confirmation: ${new Date(lastSyncTime).toLocaleTimeString()}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={runProbe}
                disabled={probeStatus.testing}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${probeStatus.testing ? 'animate-spin' : ''}`} />
                <span>Test Probe</span>
              </button>
              <button
                onClick={handleReconnect}
                disabled={probeStatus.testing}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Reconnect & Sync</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 font-mono">
                <Database className="w-3 h-3 text-blue-600" /> Total Reads
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-1">
                {summary.reads} docs
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Direct queries</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 font-mono">
                <Zap className="w-3 h-3 text-emerald-600" /> Cache Hits
              </span>
              <span className="text-lg font-bold font-mono text-emerald-600 block mt-1">
                {summary.cacheHits} ({summary.cacheHitRatioPercent}%)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Zero-latency hits</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 font-mono">
                <Layers className="w-3 h-3 text-indigo-600" /> Writes & Batches
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-1">
                {summary.writes + summary.batches} ops
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {summary.batches} batch commits
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-amber-600" /> Avg Latency
              </span>
              <span className="text-lg font-bold font-mono text-amber-700 block mt-1">
                {summary.averageLatencyMs} ms
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Roundtrip avg</span>
            </div>
          </div>

          {/* Efficiency Summary Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <p className="font-bold text-slate-900">Performance Optimizations Active:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 text-[11px]">
                <li>Concurrent query deduplication: {summary.deduplicatedQueries} duplicate requests prevented</li>
                <li>Instant persistent cache hydration: {summary.cacheHits} roundtrips avoided ({summary.cacheHitRatioPercent}% hit rate)</li>
                <li>Atomic multi-document batched writes active for stock ledger & bulk imports</li>
                <li>Client-side pagination active to limit DOM node tree and prevent layout lag</li>
              </ul>
            </div>
          </div>

          {/* Recent Operations Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Recent Database Operations Log
              </h4>
              <button
                onClick={() => perfMonitor.reset()}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Counters
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto text-xs font-mono bg-white">
              {summary.recentMetrics.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs font-sans">
                  No operations recorded in this session yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-mono sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Collection / Target</th>
                      <th className="py-2 px-3">Items</th>
                      <th className="py-2 px-3 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {summary.recentMetrics.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-1.5 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-xs text-[10px] font-semibold font-mono ${
                              m.type === 'cache_hit'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : m.type === 'batch'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : m.type === 'write'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : m.type === 'delete'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-800">{m.collection}</td>
                        <td className="py-1.5 px-3 text-slate-500">{m.itemCount ?? 1}</td>
                        <td className="py-1.5 px-3 text-right">
                          <span
                            className={`font-semibold ${
                              m.durationMs === 0
                                ? 'text-emerald-600'
                                : m.isSlow
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {m.durationMs}ms
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
