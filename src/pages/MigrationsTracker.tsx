import { useState } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';

interface Migration {
  id: string;
  name: string;
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
  const [activeMigrationId, setActiveMigrationId] = useState<string>("m1");
  const [viewMode, setViewMode] = useState<'sql' | 'diff'>('sql');

  const mockMigrations: Migration[] = [
    {
      id: "m1",
      name: "20231024143000_create_profiles.sql",
      status: 'pending',
      timestamp: "Pending local application",
      executionTimeMs: 0,
      tables: ["profiles", "audit_log"],
      sql: `-- Migration to create the standard profiles table attached to auth.users
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone default now(),
  username text unique,
  avatar_url text,
  status text check (status in ('online', 'offline', 'away')),
  primary key (id)
);

-- Turn on RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
      diff: {
        added: [
          "CREATE TABLE public.profiles (",
          "  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,",
          "  created_at timestamp with time zone default now(),",
          "  username text unique,",
          "  avatar_url text,",
          "  status text check (status in ('online', 'offline', 'away')),",
          "  primary key (id)",
          ");",
          "",
          "ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"
        ],
        removed: []
      }
    },
    {
      id: "m2",
      name: "20230915120000_update_schema.sql",
      status: 'applied',
      timestamp: "2023-09-15 12:00:05",
      executionTimeMs: 245,
      tables: ["settings"],
      sql: "ALTER TABLE settings \nADD COLUMN is_active boolean default true;\n",
      diff: {
        added: ["ADD COLUMN is_active boolean default true;"],
        removed: ["-- No columns removed in this migration"]
      }
    },
    {
      id: "m3",
      name: "20230801100000_initial_setup.sql",
      status: 'applied',
      timestamp: "2023-08-01 10:00:15",
      executionTimeMs: 1450,
      tables: ["users", "teams"],
      sql: "CREATE TABLE extensions (name text);\n-- Seed data created",
      diff: {
        added: ["CREATE TABLE extensions (name text);", "-- Seed data created"],
        removed: []
      }
    }
  ];

  const activeMigration = mockMigrations.find(m => m.id === activeMigrationId) || mockMigrations[0];

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
      <aside className="w-[300px] bg-surface-container flex flex-col shrink-0 border-r border-white/5 relative z-10">
        <div className="p-4 border-b border-white/5 shrink-0">
          <button className="w-full bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-glow">
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Migration
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto w-full p-4 relative pt-6">
          <div className="absolute left-[27px] top-6 bottom-4 w-px bg-white/10 -z-10"></div>
          
          <div className="space-y-6">
            {mockMigrations.map(m => {
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
                        {m.status === 'pending' ? 'Not synced' : new Date(m.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 2. Main Viewer */}
      <section className="flex-1 bg-[#0e0e0e] flex flex-col overflow-hidden relative">
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
      </section>

      {/* 3. Right Metadata Panel */}
      <aside className="w-[280px] bg-background flex flex-col shrink-0 border-l border-white/5 overflow-y-auto z-10">
        <div className="h-16 px-6 flex items-center border-b border-white/5 shrink-0 bg-[#131313]">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Metadata</span>
        </div>
        
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
               {mockMigrations.filter(m => m.id !== activeMigrationId).reverse().map((m, i) => (
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
      </aside>

    </div>
  );
}
