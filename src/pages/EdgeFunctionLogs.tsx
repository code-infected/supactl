import React, { useState } from "react";

interface EdgeFunction {
  id: string;
  name: string;
  count: string;
  status: 'online' | 'error' | 'warning';
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
  const [activeFunc, setActiveFunc] = useState<string>("process-payment");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const mockFunctions: EdgeFunction[] = [
    { id: "1", name: "process-payment", count: "124k", status: "online" },
    { id: "2", name: "send-welcome-email", count: "8.2k", status: "online" },
    { id: "3", name: "generate-report", count: "432", status: "warning" },
    { id: "4", name: "sync-external-api", count: "12k", status: "error" },
  ];

  const mockLogs: LogEntry[] = [
    { id: "l1", timestamp: "14:22:01.452", function: "process-payment", status_code: 200, duration_ms: 145, message: "Payment processed successfully for user_84", details: '{"user_id": "user_84", "amount": 4500, "currency": "usd", "stripe_tx": "ch_23984729"}' },
    { id: "l2", timestamp: "14:21:58.112", function: "process-payment", status_code: 201, duration_ms: 120, message: "Customer profile created in Stripe", details: '{"event": "customer.created", "provider": "stripe"}' },
    { id: "l3", timestamp: "14:21:40.005", function: "process-payment", status_code: 500, duration_ms: 4500, message: "Timeout waiting for external gateway", details: '{"error": "Gateway Timeout", "stack": "Error: Gateway Timeout\\n  at fetchExternal (/var/task/index.ts:14:15)"}' },
    { id: "l4", timestamp: "14:20:12.991", function: "process-payment", status_code: 400, duration_ms: 45, message: "Invalid payment payload received", details: '{"validation_error": "amount is required"}' },
    { id: "l5", timestamp: "14:19:55.234", function: "process-payment", status_code: 200, duration_ms: 134, message: "Webhook payload verified", details: '{"webhook_id": "wh_498573"}' },
  ];

  const getStatusDot = (status: string) => {
    switch(status) {
      case 'online': return 'bg-primary shadow-glow';
      case 'error': return 'bg-error shadow-[0_0_8px_rgba(255,113,108,0.4)]';
      case 'warning': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      default: return 'bg-surface-container-high';
    }
  };

  const getStatusCodePill = (code: number) => {
    if (code >= 200 && code < 300) return 'bg-primary/20 text-primary border border-primary/20';
    if (code >= 400 && code < 500) return 'bg-amber-500/20 text-amber-500 border border-amber-500/20';
    if (code >= 500) return 'bg-error/20 text-error border border-error/20';
    return 'bg-zinc-800 text-zinc-400 border border-white/5';
  };

  const filteredLogs = mockLogs.filter(log => {
    if (activeFilter === '2xx') return log.status_code >= 200 && log.status_code < 300;
    if (activeFilter === '4xx') return log.status_code >= 400 && log.status_code < 500;
    if (activeFilter === '5xx') return log.status_code >= 500;
    return true;
  });

  return (
    <div className="flex h-full w-full overflow-hidden bg-background font-sans text-on-surface">
      
      {/* 1. Left Function List */}
      <aside className="w-[240px] bg-surface-container-lowest flex flex-col shrink-0 border-r border-white/5">
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
          
          {mockFunctions.map(f => {
            const isActive = f.name === activeFunc;
            return (
              <div 
                key={f.id}
                onClick={() => setActiveFunc(f.name)}
                className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${
                  isActive ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-surface-container"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(f.status)}`}></span>
                  <span className={`text-sm tracking-tight truncate font-mono ${isActive ? "text-primary" : "text-zinc-300 group-hover:text-white"}`}>
                    {f.name}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">{f.count}</span>
              </div>
            );
          })}
        </nav>
      </aside>

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
        </div>
      </section>

      {/* 3. Right Stats Panel */}
      <aside className="w-[280px] bg-surface-container flex flex-col shrink-0 border-l border-white/5">
        <div className="p-6 border-b border-white/5 shrink-0">
          <h3 className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono mb-6">Execution Stats</h3>
          
          <div className="space-y-4">
            {/* Mock Sparkline Card */}
            <div className="bg-[#0e0e0e] border border-white/5 rounded-lg p-4">
               <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-2">Invocations (1h)</div>
               <div className="text-xl font-light text-primary font-mono mb-4">4,529</div>
               <div className="h-10 w-full flex items-end gap-1">
                 {[40,60,30,80,50,90,70,100,50,40,60,20,50,80].map((h, i) => (
                   <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
                 ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0e0e0e] border border-white/5 rounded-lg p-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Avg Latency</div>
                <div className="text-sm font-mono text-slate-200">142ms</div>
              </div>
              <div className="bg-error/5 border border-error/20 rounded-lg p-3">
                <div className="text-[10px] text-error/80 uppercase tracking-widest font-mono mb-1">Error Rate</div>
                <div className="text-sm font-mono text-error">1.2%</div>
              </div>
            </div>

            <div className="bg-[#0e0e0e] border border-white/5 rounded-lg p-4 mt-6">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-3">Deployment Info</div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Version</span>
                  <span className="text-slate-300">v42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Region</span>
                  <span className="text-slate-300">aws-us-east-1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Deployed</span>
                  <span className="text-slate-300">2 days ago</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </aside>
    </div>
  );
}
