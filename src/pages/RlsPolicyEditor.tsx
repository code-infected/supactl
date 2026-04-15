import { useState, useEffect } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { useSchemaStore } from "../store/schemaStore";
import { useProjectsStore } from "../store/projectsStore";
import { createSupabaseClient } from "../lib/supabase";
import { ResizablePanel } from "../components/ResizablePanel";
import { log } from "../lib/logger";

interface Policy {
  id: string;
  name: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  roles: string[];
  qual: string | null;
  with_check: string | null;
}

interface TablePolicyMeta {
  table_name: string;
  rls_enabled: boolean;
  policies: Policy[];
}

export default function RlsPolicyEditor() {
  const { tables } = useSchemaStore();
  const activeProject = useProjectsStore((state) => state.getActiveProject());
  const projectUrl = activeProject?.projectUrl;
  const serviceKey = activeProject?.serviceKey;
  
  const [tablePolicies, setTablePolicies] = useState<Record<string, TablePolicyMeta>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTables = tables && tables.length > 0 ? tables.map(t => t.name) : [];
  const [activeTable, setActiveTable] = useState<string>("");

  // Set initial active table when tables load
  useEffect(() => {
    if (displayTables.length > 0 && !activeTable) {
      setActiveTable(displayTables[0]);
    }
  }, [displayTables, activeTable]);

  // Fetch RLS policies for all tables
  useEffect(() => {
    async function fetchPolicies() {
      if (!projectUrl || !serviceKey || displayTables.length === 0) {
        setTablePolicies({});
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createSupabaseClient(projectUrl, serviceKey);
        
        // Initialize policies map for all tables
        const policiesMap: Record<string, TablePolicyMeta> = {};
        
        for (const tableName of displayTables) {
          policiesMap[tableName] = {
            table_name: tableName,
            rls_enabled: false,
            policies: []
          };
        }
        
        // Fetch RLS status and policies via raw SQL query
        // Using pg_policies and pg_tables system views
        let rlsData = null;
        let rlsError = null;
        try {
          const result = await supabase.rpc('exec_sql', {
            sql: `
              SELECT 
                t.tablename as table_name,
                t.rowsecurity as rls_enabled
              FROM pg_tables t
              WHERE t.schemaname = 'public'
            `
          });
          rlsData = result.data;
          rlsError = result.error;
        } catch (e) {
          rlsError = { message: 'exec_sql not available' };
        }

        // Update RLS status if available
        if (rlsData && !rlsError && Array.isArray(rlsData)) {
          for (const row of rlsData) {
            if (policiesMap[row.table_name]) {
              policiesMap[row.table_name].rls_enabled = row.rls_enabled === true;
            }
          }
        }

        // Try to fetch policies from pg_policies
        let policiesData = null;
        let policiesError = null;
        try {
          const result = await supabase.rpc('exec_sql', {
            sql: `
              SELECT 
                schemaname,
                tablename as table_name,
                policyname as name,
                permissive,
                roles,
                cmd as command,
                qual,
                with_check
              FROM pg_policies
              WHERE schemaname = 'public'
            `
          });
          policiesData = result.data;
          policiesError = result.error;
        } catch (e) {
          policiesError = { message: 'exec_sql not available' };
        }
        
        if (policiesData && !policiesError && Array.isArray(policiesData)) {
          for (const policy of policiesData) {
            if (policiesMap[policy.table_name]) {
              policiesMap[policy.table_name].rls_enabled = true;
              policiesMap[policy.table_name].policies.push({
                id: `${policy.table_name}_${policy.name}`,
                name: policy.name,
                command: policy.command?.toUpperCase() || 'ALL',
                roles: Array.isArray(policy.roles) ? policy.roles : [policy.roles || 'public'],
                qual: policy.qual,
                with_check: policy.with_check
              });
            }
          }
        }
        
        setTablePolicies(policiesMap);
      } catch (err: any) {
        log.error('Failed to fetch policies', err);
        // Don't set error - just show tables without policy data
        // The RPC might not exist and that's ok
        const policiesMap: Record<string, TablePolicyMeta> = {};
        for (const tableName of displayTables) {
          policiesMap[tableName] = {
            table_name: tableName,
            rls_enabled: false,
            policies: []
          };
        }
        setTablePolicies(policiesMap);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPolicies();
  }, [projectUrl, serviceKey, displayTables]);

  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyCmd, setNewPolicyCmd] = useState("SELECT");
  const [newPolicyUsing, setNewPolicyUsing] = useState("");
  const [newPolicyCheck, setNewPolicyCheck] = useState("");

  const activeMeta = tablePolicies[activeTable] || { table_name: activeTable, rls_enabled: false, policies: [] };

  const getCmdColor = (cmd: string) => {
    switch (cmd) {
      case 'SELECT': return 'border-l-blue-500 bg-blue-500/10 text-blue-500 ring-blue-500/20';
      case 'INSERT': return 'border-l-primary bg-primary/10 text-primary ring-primary/20';
      case 'UPDATE': return 'border-l-amber-500 bg-amber-500/10 text-amber-500 ring-amber-500/20';
      case 'DELETE': 
      case 'ALL': return 'border-l-error bg-error/10 text-error ring-error/20';
      default: return 'border-l-white/20 bg-white/5 text-white ring-white/10';
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background font-sans">
      
      {/* 1. Left Table List Panel */}
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400} className="bg-surface-container-lowest flex flex-col border-r border-white/5">
        <div className="p-4 border-b border-white/5 shrink-0 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Tables</span>
          <span className="material-symbols-outlined text-[16px] text-zinc-500">search</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto w-full py-2 space-y-1 p-2">
          {loading ? (
            <div className="p-4 text-zinc-500 text-xs text-center">Loading policies...</div>
          ) : displayTables.length === 0 ? (
            <div className="p-4 text-zinc-500 text-xs text-center">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">shield</span>
              No tables found. Connect to a project to see RLS policies.
            </div>
          ) : displayTables.map(t => {
            const meta = tablePolicies[t] || { policies: [] };
            const isActive = t === activeTable;
            const policyCount = meta.policies.length;

            return (
              <div 
                key={t}
                onClick={() => setActiveTable(t)}
                className={`p-2 rounded-lg cursor-pointer transition-colors group flex items-start justify-between ${
                  isActive ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-surface-container"
                }`}
              >
                <div className="flex items-start gap-2 overflow-hidden">
                  <span className={`material-symbols-outlined text-[16px] mt-0.5 ${isActive ? "text-primary shadow-glow" : "text-zinc-500"}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>shield</span>
                  <div className="flex flex-col">
                    <span className={`text-sm tracking-tight truncate ${isActive ? "text-white font-medium" : "text-zinc-300 group-hover:text-white"}`}>
                      {t}
                    </span>
                    {policyCount === 0 && (
                      <span className="text-[9px] text-amber-500 font-mono mt-0.5 uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">warning</span> No RLS
                      </span>
                    )}
                  </div>
                </div>
                
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  policyCount > 0 
                  ? (isActive ? "bg-primary text-background shadow-glow" : "bg-primary/20 text-primary")
                  : "bg-surface-container-highest text-zinc-500"
                }`}>
                  {policyCount}
                </span>
              </div>
            );
          })}
        </nav>
      </ResizablePanel>

      {/* 2. Main Content (Policies List + Form) */}
      <section className="flex-1 bg-surface-container flex flex-col overflow-y-auto">
        <header className="p-6 border-b border-white/5 shrink-0 bg-[#131313] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium tracking-tight text-white font-mono">{activeTable}</h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${activeMeta.rls_enabled ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-500"}`}>
              {activeMeta.rls_enabled ? "RLS Enabled" : "RLS Disabled"}
            </span>
          </div>
          <button className="bg-primary text-background px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all shadow-glow">
            <span className="material-symbols-outlined text-[14px]">add</span>
            New Policy
          </button>
        </header>

        <div className="p-6 space-y-8 flex-1 bg-[#141414]">
          {/* Policy List */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono mb-2">Existing Policies ({activeMeta.policies.length})</h3>
            
            {activeMeta.policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500 border border-dashed border-white/10 rounded-lg">
                <span className="material-symbols-outlined text-4xl opacity-50 mb-3 block">shield</span>
                <p className="text-sm">No policies defined for this table</p>
              </div>
            ) : (
              activeMeta.policies.map(policy => {
                const colors = getCmdColor(policy.command);
                return (
                  <div key={policy.id} className={`bg-[#131313] border-l-[3px] border-r border-y border-white/5 rounded-lg rounded-l-sm overflow-hidden ${colors.split(' ')[0]}`}>
                    <div className="p-4 border-b border-white/5 flex items-start justify-between bg-surface-container-lowest">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-slate-200">{policy.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${colors.split(' ')[1]} ${colors.split(' ')[2]}`}>
                          {policy.command}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-zinc-500 hover:text-white transition-colors p-1"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button className="text-zinc-500 hover:text-error transition-colors p-1"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#0e0e0e] space-y-4 text-xs font-mono">
                      <div className="flex gap-4">
                        <div className="w-[100px] text-zinc-500 mt-1">Target Roles:</div>
                        <div className="flex gap-2">
                          {policy.roles.map(r => (
                            <span key={r} className="px-2 py-1 bg-surface-container text-slate-300 rounded-md border border-white/5">{r}</span>
                          ))}
                        </div>
                      </div>

                      {policy.qual && (
                        <div className="flex gap-4">
                          <div className="w-[100px] text-zinc-500 mt-2">USING <span className="text-[9px] block">expression</span></div>
                          <div className="flex-1 bg-[#1a1919] p-2 rounded-md border border-white/5 text-[#c678dd]">
                            {policy.qual}
                          </div>
                        </div>
                      )}

                      {policy.with_check && (
                        <div className="flex gap-4">
                          <div className="w-[100px] text-zinc-500 mt-2">WITH CHECK <span className="text-[9px] block">expression</span></div>
                          <div className="flex-1 bg-[#1a1919] p-2 rounded-md border border-white/5 text-[#98c379]">
                            {policy.with_check}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <hr className="border-white/5 border-dashed" />

          {/* Create Form */}
          <div className="bg-[#131313] border border-white/5 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white tracking-tight mb-6">Create New Policy</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">Policy Name</label>
                  <input 
                    type="text" 
                    value={newPolicyName}
                    onChange={(e) => setNewPolicyName(e.target.value)}
                    placeholder="e.g. Users can update their own rows" 
                    className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">Command</label>
                  <select 
                    value={newPolicyCmd}
                    onChange={(e) => setNewPolicyCmd(e.target.value)}
                    className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-primary/50"
                  >
                    <option value="SELECT">SELECT</option>
                    <option value="INSERT">INSERT</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                    <option value="ALL">ALL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">USING Expression (SQL)</label>
                <div className="h-[80px] bg-[#0e0e0e] border border-white/10 rounded-lg overflow-hidden text-sm">
                  <CodeMirror
                    value={newPolicyUsing}
                    height="80px"
                    extensions={[sqlLang()]}
                    theme={oneDark}
                    onChange={setNewPolicyUsing}
                    className="h-full"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">This expression evaluates to true or false. If true, the row is visible/accessible.</p>
              </div>

              {(newPolicyCmd === 'INSERT' || newPolicyCmd === 'UPDATE' || newPolicyCmd === 'ALL') && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono block">WITH CHECK Expression (SQL)</label>
                  <div className="h-[80px] bg-[#0e0e0e] border border-white/10 rounded-lg overflow-hidden text-sm">
                    <CodeMirror
                      value={newPolicyCheck}
                      height="80px"
                      extensions={[sqlLang()]}
                      theme={oneDark}
                      onChange={setNewPolicyCheck}
                      className="h-full"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button className="bg-primary text-background px-4 py-2 rounded-lg font-bold text-sm shadow-glow hover:brightness-110 transition-colors">
                  Save Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Right Context Panel */}
      <ResizablePanel side="right" defaultWidth={300} minWidth={220} maxWidth={450} className="bg-background flex flex-col border-l border-white/5 overflow-y-auto">
        <div className="h-16 px-6 flex items-center border-b border-white/5 shrink-0 bg-[#131313]">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest font-mono">Row Level Security</span>
        </div>
        
        <div className="p-6 space-y-8">
          
          <div className="flex items-center justify-between bg-surface-container border border-white/5 rounded-lg p-4">
            <div>
              <div className="text-sm font-medium text-white mb-0.5">Enable RLS</div>
              <div className="text-[10px] text-zinc-500">For table <span className="font-mono">{activeTable}</span></div>
            </div>
            
            <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${activeMeta.rls_enabled ? "bg-primary" : "bg-surface-container-high"}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${activeMeta.rls_enabled ? "translate-x-4" : "translate-x-0"}`}></div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-500 font-bold mb-1">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              <span className="text-sm">How RLS Works</span>
            </div>
            <p className="text-xs text-amber-500/80 leading-relaxed font-mono">
              Row Level Security allows you to restrict the rows returned by database queries based on the user executing the query.
            </p>
            <p className="text-xs text-amber-500/80 leading-relaxed font-mono">
              When RLS is enabled, tables reject all queries by default until you write explicit policies allowing actions (SELECT, INSERT, etc).
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono">Helper Functions</h4>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 border border-white/5 rounded bg-surface-container opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[#c678dd] block">auth.uid()</span>
                <span className="text-zinc-500 text-[10px]">Returns the ID of the user making the request.</span>
              </div>
              <div className="p-2 border border-white/5 rounded bg-surface-container opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[#c678dd] block">auth.jwt()</span>
                <span className="text-zinc-500 text-[10px]">Returns the JWT object for the user making the request.</span>
              </div>
            </div>
          </div>
          
        </div>
      </ResizablePanel>
    </div>
  );
}
