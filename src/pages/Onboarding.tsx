import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/projectStore";
import { useSchemaStore } from "../store/schemaStore";
import { saveCredentials } from "../lib/storage";
import { createSupabaseClient } from "../lib/supabase";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [managementToken, setManagementToken] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  
  const navigate = useNavigate();
  const setCredentials = useProjectStore((state) => state.setCredentials);
  const setConnected = useProjectStore((state) => state.setConnected);
  const fetchSchema = useSchemaStore((state) => state.fetchSchema);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsTesting(true);

    try {
      // Basic validation
      if (!url.startsWith('https://')) {
        throw new Error("URL must start with https://");
      }
      
      const supabase = createSupabaseClient(url, key);
      
      // Perform a lightweight check to ensure valid credentials. 
      // Querying the auth.users or fetching a non-existent table limit 0.
      // Let's just try to list an item from an arbitrary table (with limit 0 it's fast)
      // If the key is invalid, Supabase Returns 401. 
      const { error: dbError } = await supabase.from('non_existent_table_check').select('*').limit(0);
      
      // Error code 'PGRST116' means table not found, which means connection succeeded!
      // If it's a 401 invalid key, it's a different error.
      if (dbError && dbError.code !== 'PGRST116' && dbError.code !== '42P01') {
         // Some other errors might occur, but if it's unauthorized it will show
         if (dbError.message.toLowerCase().includes('jw')) {
             throw new Error("Invalid Service Role Key");
         }
      }

      await saveCredentials(url, key, anonKey || undefined, managementToken || undefined);
      setCredentials(url, key, anonKey || undefined, managementToken || undefined);
      setConnected(true);
      
      // Fetch database schema after connecting
      await fetchSchema(url, key);
      
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the project");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-64px)] p-6">
      {step === 1 && (
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[32px] text-primary">dynamic_form</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Supactl</h1>
          <p className="text-muted text-sm mb-8">
            The native desktop client for Supabase. Manage your database, auth, storage, and edge functions.
          </p>
          <button 
            onClick={() => setStep(2)}
            className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded shadow-glow w-full hover:bg-primary/90 transition-all font-sans"
          >
            Get Started
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col w-full max-w-md">
          <h1 className="text-xl font-bold mb-2 text-center">Connect Project</h1>
          <p className="text-muted text-sm text-center mb-8">
            Enter your Supabase project details to connect.
          </p>
          
          <form onSubmit={handleConnect} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Project URL</label>
              <input 
                type="url" 
                required
                placeholder="https://xyz.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-surface-high border border-DEFAULT hover:border-hover focus:border-primary focus:outline-none rounded px-3 py-2 text-sm transition-colors"
                autoFocus
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">Service Role Key</label>
              <div className="relative flex items-center">
                <input 
                  type={showKey ? "text" : "password"} 
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="bg-surface-high border border-DEFAULT hover:border-hover focus:border-primary focus:outline-none rounded px-3 py-2 text-sm w-full pr-10 transition-colors"
                />
                <button 
                  type="button" 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 text-muted hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showKey ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-[#e0a85c] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Never expose this key client-side. Fortunately, this is a native app.
              </p>
            </div>

            {/* Advanced Options Toggle */}
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-muted hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showAdvanced ? 'expand_less' : 'expand_more'}
              </span>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>

            {showAdvanced && (
              <div className="flex flex-col gap-5 p-4 bg-surface-high/50 rounded-lg border border-white/5">
                {/* Anon Key (optional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">
                    Anon Key <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="bg-surface-high border border-DEFAULT hover:border-hover focus:border-primary focus:outline-none rounded px-3 py-2 text-sm transition-colors"
                  />
                  <p className="text-[11px] text-muted">Public key for client-side operations. Displayed in API Keys page.</p>
                </div>

                {/* Management API Token */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#5c5b5b]">
                    Management API Token <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type={showManagement ? "text" : "password"} 
                      placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={managementToken}
                      onChange={(e) => setManagementToken(e.target.value)}
                      className="bg-surface-high border border-DEFAULT hover:border-hover focus:border-primary focus:outline-none rounded px-3 py-2 text-sm w-full pr-10 transition-colors"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowManagement(!showManagement)}
                      className="absolute right-2 text-muted hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showManagement ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted">
                    Enables Edge Functions logs, migrations, and project settings.
                    <a 
                      href="https://supabase.com/dashboard/account/tokens" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-primary hover:underline ml-1"
                    >
                      Get token →
                    </a>
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-error/10 text-error border border-error/20 rounded p-3 text-sm">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isTesting || !url || !key}
              className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded shadow-glow w-full hover:bg-primary/90 transition-all disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
            >
              {isTesting ? (
                <>
                   <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>
                   Connecting...
                </>
              ) : "Connect & Save"}
            </button>
            
            <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noreferrer" className="text-xs text-muted text-center hover:text-white underline decoration-muted/30 underline-offset-4 mb-4">
              How to find your project keys
            </a>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center max-w-sm text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 shadow-glow">
            <span className="material-symbols-outlined text-[32px] text-primary">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Connected Successfully</h1>
          
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-mono text-xs mb-8">
            {url}
          </div>

          <button 
            onClick={() => navigate("/tables")}
            className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded shadow-glow w-full hover:bg-primary/90 transition-all"
          >
            Open Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
