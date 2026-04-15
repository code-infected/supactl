import { useState, useEffect } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { useProjectsStore } from "../store/projectsStore";
import { createManagementClient } from "../lib/management-api";
import { ResizablePanel } from "../components/ResizablePanel";
import { log } from "../lib/logger";

interface Migration {
  id: string;
  name: string;
  version: string;
  status: 'applied' | 'pending' | 'failed';
  timestamp: string;
  executionTimeMs: number;
  tables: string[];
  sql: string;
  diff: {
    added: string[];
    removed: string[];
  };
}

export default function MigrationsTracker() {
  const activeProject = useProjectsStore((state) => state.getActiveProject());
  const projectUrl = activeProject?.projectUrl;
  const serviceKey = activeProject?.serviceKey;
  const managementToken = activeProject?.managementToken;
  const projectRef = activeProject?.projectRef;
  const [activeMigrationId, setActiveMigrationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'sql' | 'diff'>('sql');
  
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = projectUrl && serviceKey;
  const hasManagementApi = managementToken && projectRef;

  // Fetch migrations when management token is available
  useEffect(() => {
    if (!hasManagementApi) {
      setMigrations([]);
      return;
    }

    const fetchMigrations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const client = createManagementClient(managementToken!, projectRef!);
        const data = await client.listMigrations();
        
        // Transform API response to our Migration interface
        const transformed: Migration[] = data.map((m) => ({
          id: m.version,
          name: m.name || `Migration ${m.version}`,
          version: m.version,
          status: 'applied' as const, // API only returns applied migrations
          timestamp: m.version, // Version is timestamp-based
          executionTimeMs: 0, // Not provided by API
          tables: [], // Would need to parse SQL to extract
          sql: m.statements?.join('\n\n') || '-- No SQL content available',
          diff: {
            added: m.statements || [],
            removed: [],
          },
        }));
        
        setMigrations(transformed);
        
        // Auto-select first migration
        if (transformed.length > 0 && !activeMigrationId) {
          setActiveMigrationId(transformed[0].id);
        }
      } catch (err: any) {
        log.error('Failed to fetch migrations', err);
        setError(err.message || 'Failed to fetch migrations');
        setMigrations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMigrations();
  }, [hasManagementApi, managementToken, projectRef]);

  const activeMigration = migrations.find(m => m.id === activeMigrationId) || null;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'applied': return 'bg-primary/20 text-primary border border-primary/20';
      case 'pending': return 'bg-amber-500/20 text-amber-500 border border-amber-500/20';
      case 'failed': return 'bg-error/20 text-error border border-error/20';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background font-sans">
      
      {/* 1. Left Timeline Panel */}
      <ResizablePanel side="left" defaultWidth={300} minWidth={220} maxWidth={450} className="bg-surface-container flex flex-col border-r border-white/5 relative z-10">
        <div className="p-4 border-b border-white/5 shrink-0">
          <button className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-glow">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Migration
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto w-full p-4 relative pt-6">
          <div className="absolute left-[27px] top-6 bottom-4 w-px bg-white/10 -z-10"></div>
          
          <div className="space-y-6">
            {!isConnected ? (
              <div className="p-4 text-zinc-500 text-xs text-center">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">update</span>
                Connect to a project to see migrations.
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
                Loading migrations...
              </div>
            ) : error ? (
              <div className="p-4 text-error text-xs text-center">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">error</span>
                <p className="mb-2">{error}</p>
                <p className="text-[10px] text-zinc-500">Check your Management API token.</p>
              </div>
            ) : migrations.length === 0 ? (
              <div className="p-4 text-zinc-500 text-xs text-center">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">schema</span>
                <p className="mb-2">No migrations found.</p>
                <p className="text-[10px]">Use the Supabase CLI to create migrations.</p>
              </div>
            ) : migrations.map(m => {
              const isActive = activeMigrationId === m.id;
              return (
                <div 
                  key={m.id}
                  onClick={() => setActiveMigrationId(m.id)}
                  className={`relative flex gap-4 cursor-pointer group ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className={`mt-1.5 w-3 h-3 rounded-full shrink-0 outline outline-4 outline-surface-container z-10 ${m.status === 'applied' ? 'bg-primary' : m.status === 'pending' ? 'bg-amber-500' : 'bg-error'} ${isActive ? (m.status === 'applied' ? 'shadow-glow' : 'shadow-[0_0_8px_rgba(245,158,11,0.4)]') : ''}`}></div>
                  
                  <div className={`flex-1 min-w-0 bg-[#0e0e0e] rounded-lg border p-3 transition-colors ${isActive ? 'border-primary/50 bg-[#131313]' : 'border-white/5 group-hover:border-white/20'}`}>
                    <div className="text-xs font-mono text-slate-200 truncate mb-1.5" title={m.name}>{m.name}</div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {m.status === 'pending' ? 'Not synced' : m.version}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ResizablePanel>

      {/* 2. Main Viewer */}
      <section className="flex-1 bg-[#0e0e0e] flex flex-col overflow-hidden relative">
        {!activeMigration ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <span className="material-symbols-outlined text-[48px] block mb-4 opacity-50">schema</span>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Migration Selected</h3>
              <p className="text-xs max-w-sm">
                {!isConnected 
                  ? "Connect to a project to view migrations."
                  : "Select a migration from the sidebar or create a new one using the Supabase CLI."
                }
              </p>
            </div>
          </div>
        ) : (
        <>
        {/* Toolbar */}
        <header className="px-6 py-4 border-b border-white/5 shrink-0 bg-[#131313] flex items-center justify-between">
          <div className="flex flex-col min-w-0 mr-4">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-base font-mono font-medium text-white truncate max-w-xl">{activeMigration.name}</h1>
              <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-bold shrink-0 ${getStatusBadge(activeMigration.status)}`}>
                {activeMigration.status}
              </span>
            </div>
            <div className="text-xs font-mono text-zinc-500">{activeMigration.timestamp}</div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center bg-surface-container rounded-lg border border-white/5 p-1 text-xs font-mono">
              <button 
                onClick={() => setViewMode('sql')}
                className={`px-3 py-1 rounded transition-colors ${viewMode === 'sql' ? 'bg-surface-container-high text-white' : 'text-zinc-500 hover:text-slate-300'}`}
              >
                SQL
              </button>
              <button 
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1 rounded transition-colors ${viewMode === 'diff' ? 'bg-surface-container-high text-white' : 'text-zinc-500 hover:text-slate-300'}`}
              >
                Diff
              </button>
            </div>
            
            {activeMigration.status === 'applied' ? (
              <button className="border border-error/50 text-error hover:bg-error/10 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                Rollback
              </button>
            ) : activeMigration.status === 'pending' ? (
              <button className="bg-primary text-background hover:brightness-110 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-glow">
                Apply Migration
              </button>
            ) : null}
          </div>
        </header>

        {/* Viewer Content */}
        <div className="flex-1 overflow-auto bg-[#141414] font-mono text-[13px] relative">
          {viewMode === 'sql' ? (
            <div className="absolute inset-0">
              <CodeMirror
                 value={activeMigration.sql}
                 height="100%"
                 extensions={[sql()]}
                 theme={oneDark}
                 readOnly={true}
                 editable={false}
                 className="h-full text-[13px]"
                 style={{ backgroundColor: 'transparent' }}
              />
            </div>
          ) : (
            <div className="p-4 space-y-4 font-mono text-xs">
              <div className="opacity-50 text-zinc-400 p-2 border border-white/5 rounded-lg bg-surface-container">
                -- Computed Diff (Approximation based on parsing metadata)
              </div>
              
              <div className="border border-red-500/20 rounded-lg overflow-hidden">
                <div className="bg-red-500/10 px-4 py-1 text-error text-[10px] uppercase tracking-widest font-bold">Removed</div>
                {activeMigration.diff.removed.length > 0 ? (
                  <div className="bg-[#0e0e0e] text-red-400">
                    {activeMigration.diff.removed.map((line, i) => (
                       <div key={i} className="flex hover:bg-red-500/5">
                         <div className="w-10 text-right pr-2 text-error/30 select-none bg-red-500/5 py-0.5">{i+1}</div>
                         <div className="w-8 text-center text-error border-r border-white/5 py-0.5">-</div>
                         <div className="flex-1 px-4 py-0.5 whitespace-pre">{line}</div>
                       </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0e0e0e] text-zinc-500 text-center py-4 italic">No lines removed</div>
                )}
              </div>

              <div className="border border-primary/20 rounded-lg overflow-hidden mt-4">
                <div className="bg-primary/10 px-4 py-1 text-primary text-[10px] uppercase tracking-widest font-bold">Added</div>
                {activeMigration.diff.added.map((line, i) => (
                   <div key={i} className="flex hover:bg-primary/5 bg-[#0e0e0e] text-primary/80">
                     <div className="w-10 text-right pr-2 text-primary/30 select-none bg-primary/5 py-0.5">{i+1}</div>
                     <div className="w-8 text-center text-primary border-r border-white/5 py-0.5">+</div>
                     <div className="flex-1 px-4 py-0.5 whitespace-pre font-mono">{line}</div>
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </section>

      {/* 3. Right Metadata Panel */}
      <ResizablePanel side="right" defaultWidth={280} minWidth={220} maxWidth={400} className="bg-background flex flex-col border-l border-white/5 overflow-y-auto z-10">
        <div className="h-16 px-6 flex items-center border-b border-white/5 shrink-0 bg-[#131313]">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Metadata</span>
        </div>
        
        {!activeMigration ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">info</span>
              Select a migration to view details.
            </div>
          </div>
        ) : (
        <div className="p-6 space-y-8">
          
          <div className="space-y-3">
             <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Affected Tables</div>
             {activeMigration.tables.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeMigration.tables.map(t => (
                    <span key={t} className="px-2 py-1 bg-surface-container rounded-md border border-white/5 text-xs text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">table_chart</span>
                      {t}
                    </span>
                  ))}
                </div>
             ) : <div className="text-zinc-500 text-xs italic font-mono">- None detected -</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Execution Time</div>
              <div className="text-sm font-light text-white font-mono">{activeMigration.status === 'pending' ? '--' : `${activeMigration.executionTimeMs} ms`}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-1">Row Counts</div>
              <div className="text-sm font-light text-white font-mono flex gap-2">
                <span className="text-error">{activeMigration.status === 'pending' ? '-' : '0'}</span> / <span className="text-primary">{activeMigration.status === 'pending' ? '-' : '+(computed)'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Dependency Chain</div>
             
             <div className="relative pl-3 border-l border-white/10 space-y-4">
               {migrations.filter(m => m.id !== activeMigrationId).reverse().map((m, i) => (
                 <div key={m.id} className="relative">
                   <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-surface-container-highest border-2 border-[#131313]"></div>
                   <div className="text-[10px] font-mono text-zinc-500 truncate">{m.name}</div>
                   {i === 0 && <div className="text-[9px] text-zinc-600 font-mono">Parent</div>}
                 </div>
               ))}
               <div className="relative">
                 <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#131313] shadow-glow"></div>
                 <div className="text-[10px] font-mono text-primary truncate font-bold">{activeMigration.name}</div>
                 <div className="text-[9px] text-primary/70 font-mono">Current</div>
               </div>
             </div>
          </div>

        </div>
        )}
      </ResizablePanel>

    </div>
  );
}
