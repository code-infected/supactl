import { useState } from "react";
import { useProjectStore } from "../store/projectStore";

export default function ProjectKeys() {
  const { projectUrl, serviceKey } = useProjectStore();
  const [showAnon, setShowAnon] = useState(false);
  const [showService, setShowService] = useState(false);
  const [showJwt, setShowJwt] = useState(false);

  // Mocking anon key since we might not have it in projectStore yet
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9...";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text || "");
    // Normally would show a toast here
  };

  return (
    <div className="flex w-full h-full overflow-hidden bg-background font-sans text-on-surface">
      {/* Left Settings Sub-Nav */}
      <aside className="w-[200px] bg-surface-container-lowest flex flex-col shrink-0 border-r border-white/5">
        <div className="h-10 px-4 flex items-center border-b border-white/5">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Project Settings</span>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          <a className="px-4 py-2 flex items-center gap-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm">
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Generals
          </a>
          <a className="px-4 py-2 flex items-center gap-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm">
            <span className="material-symbols-outlined text-[16px]">dns</span>
            Database
          </a>
          <a className="px-4 py-2 flex items-center gap-3 text-primary bg-surface-container border-l-2 border-primary shadow-glow cursor-pointer text-sm font-medium">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
            API Keys
          </a>
          <a className="px-4 py-2 flex items-center gap-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm">
            <span className="material-symbols-outlined text-[16px]">webhook</span>
            Webhooks
          </a>
        </nav>
      </aside>

      {/* Main Form */}
      <section className="flex-1 overflow-y-auto bg-surface-container relative">
        <div className="max-w-3xl mx-auto py-8 px-8 flex flex-col gap-8">
          
          <header>
            <h1 className="text-2xl font-light tracking-tight text-white headline-sm mb-2">API Keys & URLs</h1>
            <p className="text-sm text-zinc-500">Manage your project's connection strings and secrets.</p>
          </header>

          {/* Warning Banner */}
          <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-error mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <h3 className="text-sm font-bold text-error">Service Role Key Exposure</h3>
              <p className="text-xs text-error/80 mt-1">
                You are currently managing a high-privilege Service Role key locally. 
                Never expose this key in client-side code or public repositories.
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-6">
            
            {/* Project URL */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">Project URL</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={projectUrl || "https://xxxxxx.supabase.co"} 
                  className="flex-1 bg-[#131313] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono focus:outline-none"
                />
                <button 
                  onClick={() => handleCopy(projectUrl || "https://xxxxxx.supabase.co")}
                  className="h-10 px-4 bg-[#131313] border border-white/10 hover:border-white/20 transition-colors rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
            </div>

            {/* Anon Key */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">Project API Key (anon, public)</label>
              <div className="flex items-center gap-2">
                <input 
                  type={showAnon ? "text" : "password"}
                  readOnly 
                  value={anonKey} 
                  className="flex-1 bg-[#131313] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono focus:outline-none"
                />
                <button 
                  onClick={() => setShowAnon(!showAnon)}
                  className="h-10 w-10 bg-[#131313] border border-white/10 hover:border-white/20 transition-colors rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">{showAnon ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button 
                  onClick={() => handleCopy(anonKey)}
                  className="h-10 px-4 bg-[#131313] border border-white/10 hover:border-white/20 transition-colors rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span className="ml-2 text-xs font-medium font-sans">Copy</span>
                </button>
              </div>
            </div>

            {/* Service Role Key */}
            <div className="bg-error/5 border border-white/5 border-l-2 border-l-error/40 p-5 rounded-r-lg space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">Service Role Key (secret)</label>
                <p className="text-[11px] text-zinc-500 mt-1">This key has the ability to bypass Row Level Security. Never share it.</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type={showService ? "text" : "password"}
                  readOnly 
                  value={serviceKey || ""} 
                  className="flex-1 bg-[#131313] border border-error/20 rounded-lg px-4 py-2.5 text-sm text-error font-mono focus:outline-none"
                />
                <button 
                  onClick={() => setShowService(!showService)}
                  className="h-10 w-10 bg-[#131313] border border-error/20 hover:border-error/40 transition-colors rounded-lg flex items-center justify-center text-error hover:text-error"
                >
                  <span className="material-symbols-outlined text-[16px]">{showService ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button 
                  onClick={() => handleCopy(serviceKey || "")}
                  className="h-10 px-4 bg-[#131313] border border-error/20 hover:border-error/40 bg-error/10 hover:bg-error/20 transition-colors rounded-lg flex items-center justify-center text-error font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span className="ml-2 text-xs font-medium font-sans">Copy secret</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-error mt-2">
                <span className="material-symbols-outlined text-[12px]">security</span>
                <span className="text-[11px] font-bold">Bypasses all RLS</span>
              </div>
            </div>
            
          </div>

          <hr className="border-white/5 my-4" />

          {/* Bottom: JWT Settings */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-light tracking-tight text-white headline-sm">JWT Settings</h2>
              <p className="text-sm text-zinc-500 mt-1">Configure your JSON Web Tokens attributes.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">JWT Secret</label>
              <div className="flex items-center gap-2">
                <input 
                  type={showJwt ? "text" : "password"}
                  readOnly 
                  value="super-secret-jwt-token-from-supabase" 
                  className="flex-1 bg-[#131313] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono focus:outline-none"
                />
                <button 
                  onClick={() => setShowJwt(!showJwt)}
                  className="h-10 w-10 bg-[#131313] border border-white/10 hover:border-white/20 transition-colors rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">{showJwt ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 w-1/2">
              <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">JWT Expiry (seconds)</label>
              <input 
                type="number" 
                defaultValue={3600} 
                className="w-full bg-[#131313] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <button className="bg-primary text-background px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-glow mt-2">
                Save JWT Settings
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Right Context Panel */}
      <aside className="w-[260px] bg-background border-l border-white/5 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 space-y-8">
          
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono">System Health</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-zinc-500">lock</span>
                  <span className="text-xs text-slate-300">Auth</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-zinc-500">api</span>
                  <span className="text-xs text-slate-300">PostgREST</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-zinc-500">bolt</span>
                  <span className="text-xs text-slate-300">Realtime</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-zinc-500">database</span>
                  <span className="text-xs text-slate-300">Database</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
              </div>
              <div className="text-[10px] text-amber-500/80 -mt-1 ml-6 leading-tight">CPU utilization high (82%)</div>
            </div>
          </section>

          <hr className="border-white/5" />

          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono">Quick Links</h3>
            
            <div className="space-y-2">
              <a href="#" className="flex items-center justify-between group">
                <span className="text-xs text-primary group-hover:underline">Managing API Keys</span>
                <span className="material-symbols-outlined text-[14px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_outward</span>
              </a>
              <a href="#" className="flex items-center justify-between group">
                <span className="text-xs text-primary group-hover:underline">Understanding RLS</span>
                <span className="material-symbols-outlined text-[14px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_outward</span>
              </a>
              <a href="#" className="flex items-center justify-between group">
                <span className="text-xs text-primary group-hover:underline">JWT Configuration</span>
                <span className="material-symbols-outlined text-[14px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_outward</span>
              </a>
            </div>
          </section>

        </div>
      </aside>

    </div>
  );
}
