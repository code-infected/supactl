import { useState } from "react";
import { useProjectStore } from "../store/projectStore";

export default function ProjectKeys() {
  const { projectUrl, serviceKey, anonKey } = useProjectStore();
  const [showAnon, setShowAnon] = useState(false);
  const [showService, setShowService] = useState(false);
  
  const isConnected = projectUrl && serviceKey;

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
                  value={anonKey || "(Not configured)"} 
                  className="flex-1 bg-[#131313] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono focus:outline-none"
                />
                <button 
                  onClick={() => setShowAnon(!showAnon)}
                  className="h-10 w-10 bg-[#131313] border border-white/10 hover:border-white/20 transition-colors rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                  disabled={!anonKey}
                >
                  <span className="material-symbols-outlined text-[16px]">{showAnon ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button 
                  onClick={() => handleCopy(anonKey || "")}
                  className="h-10 px-4 bg-[#131313] border border-white/10 hover:border-white/20 transition-colors rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
                  disabled={!anonKey}
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span className="ml-2 text-xs font-medium font-sans">Copy</span>
                </button>
              </div>
              {!anonKey && (
                <p className="text-[11px] text-zinc-500 mt-1">Anon key not saved. Add it in Project Connection settings.</p>
              )}
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

          {/* Bottom: JWT Settings Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-light tracking-tight text-white headline-sm">JWT Settings</h2>
              <p className="text-sm text-zinc-500 mt-1">JWT configuration is managed via the Supabase Dashboard.</p>
            </div>
            
            <div className="bg-surface-container-lowest border border-white/5 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-zinc-500 mt-0.5">info</span>
                <div>
                  <p className="text-xs text-zinc-400">
                    JWT secrets and expiry settings can be viewed and modified in your Supabase project dashboard under 
                    <span className="text-primary"> Settings → API</span>.
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-2">
                    These settings require Management API access which is not available via the service_role key.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Right Context Panel */}
      <aside className="w-[260px] bg-background border-l border-white/5 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 space-y-8">
          
          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono">Connection Status</h3>
            
            {!isConnected ? (
              <div className="text-zinc-500 text-xs text-center py-4">
                <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">link_off</span>
                Not connected to a project.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-zinc-500">cloud</span>
                    <span className="text-xs text-slate-300">Project</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
                </div>
                <p className="text-[10px] text-zinc-500 break-all">{projectUrl}</p>
              </div>
            )}
          </section>

          <hr className="border-white/5" />

          <section className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono">Quick Links</h3>
            
            <div className="space-y-2">
              <a href="https://supabase.com/docs/guides/api" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group">
                <span className="text-xs text-primary group-hover:underline">Managing API Keys</span>
                <span className="material-symbols-outlined text-[14px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_outward</span>
              </a>
              <a href="https://supabase.com/docs/guides/auth/row-level-security" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group">
                <span className="text-xs text-primary group-hover:underline">Understanding RLS</span>
                <span className="material-symbols-outlined text-[14px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_outward</span>
              </a>
              <a href="https://supabase.com/docs/guides/auth/jwts" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group">
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
