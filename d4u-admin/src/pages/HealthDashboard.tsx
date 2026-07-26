import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Database,
  GitBranch,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Users,
  Bell,
  Mail,
  Zap,
  ListTodo,
} from 'lucide-react';
import { apiFetch } from '../utils/api';

interface HealthData {
  status: string;
  timestamp: string;
  resources: {
    cpu_load: string;
    cpu_cores: number;
    mem_usage_pct: number;
    mem_total_gb: string;
    mem_used_gb: string;
  };
  db: {
    status: string;
    latency_ms: number;
    size_mb: string;
    connections: number;
    backup: string;
  };
  auth: {
    active_sessions: number;
    failed_logins: number;
    token_health: string;
  };
  subscriptions: {
    active: number;
    expired: number;
    status: string;
  };
  modules: Record<string, string>;
  services: Record<string, string>;
  audits: any[];
  warnings: string[];
  counts: any;
  requested_by: string;
}

type StatusCode = 'PASS' | 'WARN' | 'SLOW' | 'FAIL' | 'LOADING' | 'ERROR';

function StatusBadge({ status }: { status: StatusCode }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    PASS:    { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: <CheckCircle2 size={13} />, label: 'PASS' },
    WARN:    { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',       icon: <AlertTriangle size={13} />, label: 'WARN' },
    SLOW:    { cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30',    icon: <Clock size={13} />,        label: 'SLOW' },
    FAIL:    { cls: 'bg-red-500/15 text-red-300 border-red-500/30',             icon: <XCircle size={13} />,      label: 'FAIL' },
    LOADING: { cls: 'bg-slate-700 text-slate-400 border-slate-600',             icon: <RefreshCw size={13} className="animate-spin" />, label: '...' },
    ERROR:   { cls: 'bg-red-500/15 text-red-300 border-red-500/30',             icon: <XCircle size={13} />,      label: 'ERROR' },
  };
  const c = cfg[status] ?? cfg.FAIL;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

function ProgressGauge({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div className={`bg-${color}-500 h-1.5 rounded-full`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

export default function HealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiFetch('/system/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        setLastRefresh(new Date());
      } else {
        setFetchError('Failed to fetch health data. You may not have permission.');
      }
    } catch {
      setFetchError('Network error while fetching health data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusColor = (status: string) => {
    if (status === 'OPERATIONAL' || status === 'PASS') return 'text-emerald-400';
    if (status === 'DEGRADED' || status === 'WARN' || status === 'SLOW') return 'text-amber-400';
    return 'text-red-400';
  };

  const getStatusBorder = (status: string) => {
    if (status === 'OPERATIONAL' || status === 'PASS') return 'border-emerald-500/25 bg-emerald-500/10';
    if (status === 'DEGRADED' || status === 'WARN' || status === 'SLOW') return 'border-amber-500/25 bg-amber-500/10';
    return 'border-red-500/25 bg-red-500/10';
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Activity className="text-emerald-400" size={24} />
            Enterprise Health Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Operational status, live metrics, and security audits
            {lastRefresh && (
              <span className="ml-2 text-slate-500">
                — Last refreshed {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm font-bold flex items-center gap-3">
          <AlertTriangle size={18} />
          {fetchError}
        </div>
      )}

      {/* Main Status & Critical Warnings */}
      {health && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`col-span-1 lg:col-span-1 rounded-2xl border p-6 flex flex-col justify-center gap-2 ${getStatusBorder(health.status)}`}>
            <div className="flex items-center gap-3">
              {health.status === 'OPERATIONAL' ? <CheckCircle2 size={32} className="text-emerald-400" /> : <AlertTriangle size={32} className="text-amber-400" />}
              <div>
                <p className={`font-black text-2xl ${getStatusColor(health.status)}`}>System {health.status}</p>
                <p className="text-sm opacity-80 font-mono mt-1">{new Date(health.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> System Recommendations & Alerts
            </h3>
            {health.warnings.length > 0 ? (
              <div className="space-y-2">
                {health.warnings.map((w, i) => (
                  <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-300 text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 size={18} />
                No critical warnings. System is operating optimally.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Resources */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
              <Cpu size={16} className="text-blue-400" /> System Resources
            </h3>
            <div className="space-y-4">
              <ProgressGauge label="CPU Load" pct={Math.min(100, Math.round((parseFloat(health.resources.cpu_load) / health.resources.cpu_cores) * 100))} color="blue" />
              <ProgressGauge label="Memory" pct={health.resources.mem_usage_pct} color={health.resources.mem_usage_pct > 85 ? 'red' : 'blue'} />
              <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
                <span>RAM: {health.resources.mem_used_gb} / {health.resources.mem_total_gb} GB</span>
                <span>Cores: {health.resources.cpu_cores}</span>
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
              <Database size={16} className="text-indigo-400" /> Database Engine
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Latency</span>
                <span className={`text-sm font-black ${health.db.latency_ms > 200 ? 'text-amber-400' : 'text-white'}`}>{health.db.latency_ms} ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Active Conns</span>
                <span className="text-sm font-black text-white">{health.db.connections}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Storage Size</span>
                <span className="text-sm font-black text-white">{health.db.size_mb} MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Backups</span>
                <StatusBadge status={health.db.backup as StatusCode} />
              </div>
            </div>
          </div>

          {/* Auth & Security */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
              <ShieldCheck size={16} className="text-purple-400" /> Auth & Security
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Active Sessions</span>
                <span className="text-sm font-black text-white">{health.auth.active_sessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Failed Logins</span>
                <span className="text-sm font-black text-white">{health.auth.failed_logins}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Token Health</span>
                <StatusBadge status={health.auth.token_health as StatusCode} />
              </div>
            </div>
          </div>

          {/* Subscriptions */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
              <Activity size={16} className="text-pink-400" /> Subscription Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Active Licenses</span>
                <span className="text-sm font-black text-white">{health.subscriptions.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400">Expired/Suspended</span>
                <span className={`text-sm font-black ${health.subscriptions.expired > 0 ? 'text-red-400' : 'text-white'}`}>{health.subscriptions.expired}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-400">Subsystem State</span>
                <StatusBadge status={health.subscriptions.status as StatusCode} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Status & Audits */}
      {health && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Grid */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
              <GitBranch size={16} className="text-slate-400" /> Live Module Health
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(health.modules).map(([mod, status]) => (
                <div key={mod} className="border border-slate-700 bg-slate-900/50 rounded-lg p-3 flex flex-col justify-center items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 capitalize">{mod}</span>
                  <StatusBadge status={status as StatusCode} />
                </div>
              ))}
            </div>

            <h3 className="text-white font-bold text-sm mt-6 mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
              <Bell size={16} className="text-slate-400" /> Background Services
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(health.services).map(([srv, status]) => (
                <div key={srv} className="border border-slate-700 bg-slate-900/50 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 capitalize">{srv}</span>
                  <StatusBadge status={status as StatusCode} />
                </div>
              ))}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
              <ListTodo size={16} className="text-slate-400" /> System Audit Timeline
            </h3>
            {health.audits.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">
                No recent audit events
              </div>
            ) : (
              <div className="space-y-4">
                {health.audits.map((audit: any, i: number) => (
                  <div key={audit.id} className="relative pl-6">
                    {i !== health.audits.length - 1 && (
                      <div className="absolute left-1.5 top-6 bottom-[-16px] w-px bg-slate-700"></div>
                    )}
                    <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-800"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-300">
                        {audit.action} — <span className="text-blue-400">{audit.entity}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        By {audit.user_name || 'System'} • {new Date(audit.created_at).toLocaleString()}
                      </p>
                      {audit.details && (
                        <div className="mt-2 bg-slate-900 rounded p-2 text-xs font-mono text-slate-400 overflow-x-auto">
                          {JSON.stringify(audit.details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !health && (
        <div className="flex items-center justify-center h-64 text-slate-500 font-bold gap-3">
          <RefreshCw className="animate-spin" /> Gathering enterprise diagnostics...
        </div>
      )}
    </div>
  );
}
