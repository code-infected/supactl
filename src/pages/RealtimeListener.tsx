import { useState, useEffect, useRef } from "react";
import { useProjectsStore } from "../store/projectsStore";
import { createSupabaseClient } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ResizablePanel } from "../components/ResizablePanel";

interface RealtimeEvent {
  id: string;
  timestamp: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'BROADCAST';
  table: string | null;
  payload: any;
}

export default function RealtimeListener() {
  const activeProject = useProjectsStore((state) => state.getActiveProject());
  const projectUrl = activeProject?.projectUrl;
  const serviceKey = activeProject?.serviceKey;
  const [isConnected, setIsConnected] = useState(false);
  const [channelInput, setChannelInput] = useState("public:*");
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, inserts: 0, updates: 0, deletes: 0 });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const addEvent = (type: RealtimeEvent['type'], table: string | null, payload: any) => {
    const newEvent: RealtimeEvent = {
      id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      table,
      payload
    };
    
    setEvents(prev => [newEvent, ...prev].slice(0, 100));
    setStats(s => ({
      total: s.total + 1,
      inserts: s.inserts + (type === 'INSERT' ? 1 : 0),
      updates: s.updates + (type === 'UPDATE' ? 1 : 0),
      deletes: s.deletes + (type === 'DELETE' ? 1 : 0),
    }));
  };

  const toggleConnection = async () => {
    if (isConnected) {
      // Disconnect
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setIsConnected(false);
    } else {
      // Connect
      if (!projectUrl || !serviceKey) {
        addEvent('BROADCAST', null, { error: 'No project connected. Please connect to a Supabase project first.' });
        return;
      }

      try {
        const supabase = createSupabaseClient(projectUrl, serviceKey);
        
        // Parse channel input - format: schema:table or just table
        const parts = channelInput.split(':');
        const schema = parts.length > 1 ? parts[0] : 'public';
        const table = parts.length > 1 ? parts[1] : parts[0];
        
        const channel = supabase
          .channel('realtime-listener')
          .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: schema,
              table: table === '*' ? undefined : table
            },
            (payload) => {
              const eventType = payload.eventType.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE';
              addEvent(eventType, payload.table, {
                new: payload.new,
                old: payload.old
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              addEvent('BROADCAST', null, { message: `Connected to ${schema}:${table}` });
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              addEvent('BROADCAST', null, { error: 'Channel error - check your connection settings' });
            }
          });

        channelRef.current = channel;
      } catch (err: any) {
        addEvent('BROADCAST', null, { error: err.message || 'Failed to connect' });
        setIsConnected(false);
      }
    }
  };

  const getEventBadge = (type: string) => {
    switch(type) {
      case 'INSERT': return 'bg-primary/20 text-primary border-primary/30';
      case 'UPDATE': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'DELETE': return 'bg-error/20 text-error border-error/30';
      case 'BROADCAST': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-zinc-800 text-zinc-400 border-white/5';
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden font-sans">
      
      {/* 1. Top Toolbar */}
      <header className="h-14 px-6 border-b border-white/5 bg-[#131313] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">cell_tower</span>
            <input 
              type="text" 
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              className="w-80 bg-[#1c1b1b] border border-white/5 rounded-lg pl-10 pr-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/40 font-mono transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={toggleConnection}
                className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-glow ${isConnected ? 'bg-error/10 text-error hover:bg-error/20 border border-error/20' : 'bg-primary text-background hover:brightness-110'}`}
             >
               <span className="material-symbols-outlined text-[16px]">{isConnected ? 'stop' : 'play_arrow'}</span>
               {isConnected ? 'Disconnect' : 'Connect'}
             </button>
             <button 
                onClick={() => { setEvents([]); setStats({ total:0, inserts:0, updates:0, deletes:0 }); }}
                className="px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 text-xs font-semibold transition-colors"
             >
               Clear
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-primary shadow-glow animate-pulse' : 'bg-zinc-600'}`}></span>
          <span className="text-xs font-mono tracking-widest uppercase text-[#5c5b5b] font-bold">
            {isConnected ? 'Listening' : 'Offline'}
          </span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        
        {/* 2. Left Subscriptions Panel */}
        <ResizablePanel side="left" defaultWidth={260} minWidth={200} maxWidth={400} className="bg-surface-container-lowest flex flex-col border-r border-white/5">
          <div className="p-4 border-b border-white/5 shrink-0 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Subscriptions</span>
          </div>
          <div className="p-4 shrink-0">
            <button className="w-full bg-surface-container border border-white/5 hover:border-white/20 text-slate-300 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Subscription
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto w-full py-2 space-y-2 px-4">
            {isConnected ? (
              <div className="bg-[#131313] border border-primary/30 rounded-lg p-3 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-glow"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-200 mb-1">{channelInput}</div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                      <span className="bg-surface-container px-1 py-0.5 rounded border border-white/5">postgres_changes</span>
                      <span className="bg-primary/10 text-primary px-1 py-0.5 rounded">listening</span>
                    </div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow animate-pulse mt-1.5"></span>
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs text-center py-8">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">cell_tower</span>
                <p>Connect to start listening</p>
                <p className="text-[10px] mt-1">Click Connect to subscribe to changes</p>
              </div>
            )}
          </nav>
        </ResizablePanel>

        {/* 3. Main Event Stream */}
        <section className="flex-1 bg-[#0e0e0e] flex flex-col overflow-hidden relative">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            {isConnected && events.length > 0 && (
               <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-mono shadow-glow animate-pulse inline-block cursor-pointer">
                 Waiting for events...
               </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 font-mono text-[12px] scrollbar-hide flex flex-col items-center">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-4 animate-pulse">cell_tower</span>
                <span>{isConnected ? "Listening for realtime events..." : "Connect to a channel to start"}</span>
              </div>
            ) : (
              <div className="w-full max-w-4xl space-y-2">
                {events.map((e) => {
                  const expanded = expandedEventId === e.id;
                  return (
                    <div key={e.id} className="w-full flex flex-col border border-white/5 rounded-lg bg-[#141414] overflow-hidden hover:border-white/10 transition-colors">
                      <div 
                        onClick={() => setExpandedEventId(expanded ? null : e.id)}
                        className="px-4 py-2.5 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-500 text-[10px]">{new Date(e.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) + '.' + new Date(e.timestamp).getMilliseconds()}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest ${getEventBadge(e.type)}`}>
                            {e.type}
                          </span>
                          {e.table && (
                             <span className="text-slate-300">
                               public.<span className="text-primary">{e.table}</span>
                             </span>
                          )}
                          {!e.table && <span className="text-zinc-500 italic">custom broadcast</span>}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-500 text-[10px] truncate max-w-[200px]">
                            {JSON.stringify(e.payload).substring(0, 40)}...
                          </span>
                          <span className={`material-symbols-outlined text-[16px] text-zinc-600 transition-transform ${expanded ? 'rotate-180' : 'group-hover:text-zinc-400'}`}>
                            expand_more
                          </span>
                        </div>
                      </div>
                      
                      {expanded && (
                        <div className="border-t border-white/5 bg-[#0e0e0e] p-4 text-[11px] text-zinc-400">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(e.payload, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 4. Right Counters Panel */}
        <ResizablePanel side="right" defaultWidth={280} minWidth={220} maxWidth={400} className="bg-surface-container flex flex-col border-l border-white/5 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono mb-6">Metrics</h3>
            
            <div className="space-y-4">
              <div className="bg-[#1a1919] border border-white/5 rounded-lg p-4 text-center">
                 <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono mb-2">Total Events</div>
                 <div className="text-3xl font-light text-white font-mono">{stats.total.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1919] border border-white/5 rounded-lg p-3 text-center border-t-2 border-t-primary">
                  <div className="text-[9px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Inserts</div>
                  <div className="text-lg font-mono text-primary">{stats.inserts.toLocaleString()}</div>
                </div>
                <div className="bg-[#1a1919] border border-white/5 rounded-lg p-3 text-center border-t-2 border-t-amber-500">
                  <div className="text-[9px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Updates</div>
                  <div className="text-lg font-mono text-amber-500">{stats.updates.toLocaleString()}</div>
                </div>
                <div className="bg-[#1a1919] border border-white/5 rounded-lg p-3 text-center border-t-2 border-t-error">
                  <div className="text-[9px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Deletes</div>
                  <div className="text-lg font-mono text-error">{stats.deletes.toLocaleString()}</div>
                </div>
                <div className="bg-[#1a1919] border border-white/5 rounded-lg p-3 text-center border-t-2 border-t-blue-500">
                  <div className="text-[9px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Broadcasts</div>
                  <div className="text-lg font-mono text-blue-500">{(stats.total - stats.inserts - stats.updates - stats.deletes).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

      </div>
    </div>
  );
}
