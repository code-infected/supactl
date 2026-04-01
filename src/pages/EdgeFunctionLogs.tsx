import React, { useState, useEffect } from "react";
import { useProjectStore } from "../store/projectStore";
import { createManagementClient } from "../lib/management-api";
import { ResizablePanel } from "../components/ResizablePanel";

interface EdgeFunction {
  id: string;
  slug: string;
  name: string;
  status: 'ACTIVE' | 'REMOVED' | 'THROTTLED';
  version: number;
  created_at: string;
  updated_at: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  function: string;
  status_code: number;
  duration_ms: number;
  message: string;
  details: string;
}

export default function EdgeFunctionLogs() {
  const { projectUrl, serviceKey, managementToken, projectRef } = useProjectStore();
  const [activeFunc, setActiveFunc] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = projectUrl && serviceKey;
  const hasManagementApi = managementToken && projectRef;

  // Fetch edge functions when management token is available
  useEffect(() => {
    if (!hasManagementApi) {
      setFunctions([]);
      return;
    }

    const fetchFunctions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const client = createManagementClient(managementToken!, projectRef!);
        const data = await client.listEdgeFunctions();
        setFunctions(data);
        
        // Auto-select first function
        if (data.length > 0 && !activeFunc) {
          setActiveFunc(data[0].slug);
        }
      } catch (err: any) {
        console.error('Failed to fetch edge functions:', err);
        setError(err.message || 'Failed to fetch edge functions');
        setFunctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFunctions();
  }, [hasManagementApi, managementToken, projectRef]);

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'ACTIVE':
      case 'online': return 'bg-primary shadow-glow';
      case 'THROTTLED':
      case 'warning': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      case 'REMOVED':
      case 'error': return 'bg-error shadow-[0_0_8px_rgba(255,113,108,0.4)]';
      default: return 'bg-surface-container-high';
    }
  };

  const getStatusCodePill = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-primary/20 text-primary border border-primary/20';
    if (code >= 400 && code < 500) return 'bg-amber-500/20 text-amber-500 border border-amber-500/20';
    if (code >= 500) return 'bg-error/20 text-error border border-error/20';
    return 'bg-zinc-800 text-zinc-400 border border-white/5';
  };

  const filteredLogs = logs.filter(log => {
    if (activeFilter === '2xx') return log.status_code >= 200 && log.status_code < 300;
    if (activeFilter === '4xx') return log.status_code >= 400 && log.status_code < 500;
    if (activeFilter === '5xx') return log.status_code >= 500;
    return true;
  });

  return (
    <div className="flex h-full w-full overflow-hidden bg-background font-sans text-on-surface">
      
      {/* 1. Left Function List */}
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={380} className="bg-surface-container-lowest flex flex-col border-r border-white/5">
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[14px]">search</span>
            <input 
              type="text" 
              placeholder="Search functions..." 
              className="w-full bg-[#1c1b1b] border-none rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono"
            />
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto w-full py-2 px-2 space-y-1">
          <div className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono px-2 mt-2 mb-3">Edge Functions</div>
          
          {!isConnected ? (
            <div className="p-4 text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">functions</span>
              Connect to a project to see Edge Functions.
            </div>
          ) : !hasManagementApi ? (
            <div className="p-4 text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">key</span>
              <p className="mb-2">Management API token required.</p>
              <p className="text-[10px]">Add your token in Project Connection settings.</p>
              <a 
                href="https://supabase.com/dashboard/account/tokens" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline text-[10px] mt-2 inline-block"
              >
                Get token →
              </a>
            </div>
          ) : loading ? (
            <div className="p-4 text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50 animate-spin">autorenew</span>
              Loading functions...
            </div>
          ) : error ? (
            <div className="p-4 text-error text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">error</span>
              <p className="mb-2">{error}</p>
              <p className="text-[10px] text-zinc-500">Check your Management API token.</p>
            </div>
          ) : functions.length === 0 ? (
            <div className="p-4 text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">functions</span>
              <p className="mb-2">No Edge Functions deployed.</p>
              <p className="text-[10px]">Deploy functions using the Supabase CLI.</p>
            </div>
          ) : functions.map(f => {
            const isActive = f.slug === activeFunc;
            return (
              <div 
                key={f.id}
                onClick={() => setActiveFunc(f.slug)}
                className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${
                  isActive ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(f.status)}`}></span>
                  <span className={`text-sm tracking-tight truncate font-mono ${isActive ? "text-primary" : "text-zinc-300 group-hover:text-white"}`}>
                    {f.slug}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">v{f.version}</span>
              </div>
            );
          })}
        </nav>
      </ResizablePanel>

      {/* 2. Main Log Stream */}
      <section className="flex-1 bg-surface-container flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="px-6 h-14 border-b border-white/5 shrink-0 flex items-center justify-between bg-[#131313]">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-surface-container-lowest border border-white/5 px-3 py-1.5 rounded-lg hover:border-white/20 transition-colors">
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              Last 1 hour
              <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
            </button>
            <div className="h-4 w-[1px] bg-white/5"></div>
            
            <div className="flex items-center bg-[#0e0e0e] rounded-lg border border-white/5 p-1 text-xs font-mono">
              {['All', '2xx', '4xx', '5xx'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded transition-colors ${activeFilter === filter ? 'bg-surface-container-high text-white' : 'text-zinc-500 hover:text-slate-300'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[14px]">filter_alt</span>
            <input 
              type="text" 
              placeholder="Filter logs by message..." 
              className="w-64 bg-[#1c1b1b] border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/40 font-mono"
            />
          </div>
        </header>

        {/* Dense Log Table */}
        <div className="flex-1 overflow-auto bg-[#0e0e0e] font-mono text-[12px] scrollbar-hide">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <span className="material-symbols-outlined text-4xl opacity-50 mb-3">terminal</span>
              <p className="text-sm mb-2">No logs available</p>
              <p className="text-xs text-zinc-600 max-w-xs text-center">
                {!hasManagementApi 
                  ? "Add a Management API token to view function logs."
                  : "Logs will appear here when your Edge Functions are invoked."
                }
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0e0e0e] z-10 shadow-[0_1px_0_rgba(255,255,255,0.05)] text-[10px] text-[#5c5b5b] uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-2 font-medium w-28 border-r border-white/5">Timestamp</th>
                  <th className="px-4 py-2 font-medium w-36 border-r border-white/5">Function</th>
                  <th className="px-4 py-2 font-medium w-16 text-center border-r border-white/5">Status</th>
                  <th className="px-4 py-2 font-medium w-20 text-right border-r border-white/5">Duration</th>
                  <th className="px-4 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLog === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className={`h-[32px] cursor-pointer hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-white/[0.04]' : ''}`}
                      >
                        <td className="px-4 text-zinc-500 border-r border-white/5 truncate">{log.timestamp}</td>
                        <td className="px-4 text-primary border-r border-white/5 truncate">{log.function}</td>
                        <td className="px-4 text-center border-r border-white/5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getStatusCodePill(log.status_code)}`}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="px-4 text-right text-zinc-500 border-r border-white/5">{log.duration_ms}ms</td>
                        <td className="px-4 text-slate-300 truncate max-w-xl group relative">
                          {log.message}
                          <span className={`position-absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[14px] text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : 'opacity-0 group-hover:opacity-100'}`}>
                            expand_more
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#131313] shadow-[inset_0_4px_6px_rgba(0,0,0,0.3)]">
                          <td colSpan={5} className="p-4 border-b border-white/5">
                            <div className="bg-[#0e0e0e] border border-white/5 rounded-lg p-4 font-mono text-[11px] text-zinc-400 overflow-x-auto">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(JSON.parse(log.details), null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* 3. Right Stats Panel */}
      <ResizablePanel side="right" defaultWidth={280} minWidth={220} maxWidth={400} className="bg-surface-container flex flex-col border-l border-white/5">
        <div className="p-6 border-b border-white/5 shrink-0">
          <h3 className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono mb-6">Execution Stats</h3>
          
          <div className="space-y-4">
            {!isConnected ? (
              <div className="text-zinc-500 text-xs text-center py-8">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">analytics</span>
                Connect to a project to see stats.
              </div>
            ) : !hasManagementApi ? (
              <div className="text-zinc-500 text-xs text-center py-8">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">key</span>
                <p className="mb-2">Add Management API token for stats.</p>
              </div>
            ) : functions.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-[#0e0e0e] border border-white/5 rounded-lg p-4">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">Functions</div>
                  <div className="text-xl font-light text-primary font-mono">{functions.length}</div>
                </div>
                <div className="bg-[#0e0e0e] border border-white/5 rounded-lg p-4">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">Active</div>
                  <div className="text-xl font-light text-primary font-mono">
                    {functions.filter(f => f.status === 'ACTIVE').length}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs text-center py-8">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">info</span>
                <p>No functions to display stats.</p>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>
    </div>
  );
}
