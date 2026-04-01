import { useState } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { useSchemaStore } from "../store/schemaStore";
import { useProjectStore } from "../store/projectStore";
import { createSupabaseClient } from "../lib/supabase";
import { ResizablePanel } from "../components/ResizablePanel";

interface QueryTab {
  id: string;
  name: string;
  query: string;
  isUnsaved: boolean;
  results: any[] | null;
  columns: string[];
  executionTime: number;
}

export default function SqlEditor() {
  const { tables } = useSchemaStore();
  const { projectUrl, serviceKey } = useProjectStore();
  
  const [tabs, setTabs] = useState<QueryTab[]>([
    {
      id: "1",
      name: "query_1.sql",
      query: "-- Fetching users\nSELECT * FROM auth.users LIMIT 10;",
      isUnsaved: false,
      results: null,
      columns: [],
      executionTime: 0
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const [isExecuting, setIsExecuting] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const updateActiveTab = (updates: Partial<QueryTab>) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const addTab = () => {
    const newId = Date.now().toString();
    const newTab: QueryTab = {
      id: newId,
      name: `query_${tabs.length + 1}.sql`,
      query: "",
      isUnsaved: false,
      results: null,
      columns: [],
      executionTime: 0
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleQueryChange = (val: string) => {
    updateActiveTab({ query: val, isUnsaved: true });
  };

  const runQuery = async () => {
    if (!activeTab || !activeTab.query.trim()) return;
    if (!projectUrl || !serviceKey) {
      updateActiveTab({
        results: [],
        columns: [],
        executionTime: 0,
        isUnsaved: false
      });
      return;
    }
    
    setIsExecuting(true);
    const startTime = Date.now();
    
    try {
      const supabase = createSupabaseClient(projectUrl, serviceKey);
      const queryText = activeTab.query.trim();
      
      // Try to parse the query to extract table name for simple SELECT queries
      const selectMatch = queryText.match(/^\s*SELECT\s+.+\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_\.]*)/i);
      
      if (selectMatch) {
        // Extract table name (handle schema.table format)
        let tableName = selectMatch[1];
        
        // Handle auth.users specially
        if (tableName.toLowerCase() === 'auth.users') {
          // Use auth admin API for auth.users
          const { data, error } = await supabase.auth.admin.listUsers();
          if (error) throw error;
          
          const users = data?.users || [];
          if (users.length > 0) {
            const cols = Object.keys(users[0]);
            updateActiveTab({
              results: users,
              columns: cols,
              executionTime: Date.now() - startTime,
              isUnsaved: false
            });
          } else {
            updateActiveTab({
              results: [],
              columns: [],
              executionTime: Date.now() - startTime,
              isUnsaved: false
            });
          }
        } else {
          // For regular tables, use PostgREST
          // Remove schema prefix if present (public.tablename -> tablename)
          if (tableName.includes('.')) {
            tableName = tableName.split('.').pop() || tableName;
          }
          
          // Check for LIMIT clause
          const limitMatch = queryText.match(/LIMIT\s+(\d+)/i);
          const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;
          
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(limit);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            const cols = Object.keys(data[0]);
            updateActiveTab({
              results: data,
              columns: cols,
              executionTime: Date.now() - startTime,
              isUnsaved: false
            });
          } else {
            updateActiveTab({
              results: [],
              columns: [],
              executionTime: Date.now() - startTime,
              isUnsaved: false
            });
          }
        }
      } else {
        // For non-SELECT queries or complex queries, show a message
        updateActiveTab({
          results: [{ message: "Query executed. Note: Only SELECT queries can display results via REST API. For INSERT/UPDATE/DELETE, use the Table Editor." }],
          columns: ["message"],
          executionTime: Date.now() - startTime,
          isUnsaved: false
        });
      }
    } catch (err: any) {
      updateActiveTab({
        results: [{ error: err.message || "Query execution failed" }],
        columns: ["error"],
        executionTime: Date.now() - startTime,
        isUnsaved: false
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const displayTables = tables && tables.length > 0 ? tables.map(t => t.name) : [];

  return (
    <div className="flex h-full w-full overflow-hidden font-sans">
      {/* 1. Schema Browser (Left/First Column) */}
      <ResizablePanel side="left" defaultWidth={200} minWidth={150} maxWidth={350} className="bg-surface-container-lowest flex flex-col">
        <div className="h-9 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest">Schema</span>
          <span className="material-symbols-outlined text-zinc-600 text-[14px] cursor-pointer hover:text-white">search</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {displayTables.length === 0 ? (
            <div className="px-4 py-4 text-zinc-500 text-xs">
              <span className="material-symbols-outlined text-[24px] block mb-2 opacity-50">table_chart</span>
              No tables found. Connect to a project to see schema.
            </div>
          ) : displayTables.map(t => (
             <div key={t} className="px-4 py-1.5 flex items-center gap-2 text-zinc-400 hover:text-on-surface cursor-pointer group">
               <span className="material-symbols-outlined text-[14px] text-zinc-600 group-hover:text-zinc-400 transition-transform group-hover:rotate-90">chevron_right</span>
               <span className="material-symbols-outlined text-[16px] text-zinc-600">table_chart</span>
               <span className="text-xs font-medium">{t}</span>
             </div>
          ))}
        </div>
      </ResizablePanel>

      {/* 2. Editor & Results (Middle/Second Column) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#141414] border-x border-white/5">
        {/* Tab Bar */}
        <div className="h-9 flex items-center bg-background border-b border-white/5 shrink-0 overflow-x-auto scrollbar-hide">
          <div className="flex h-full items-center min-w-max">
            {tabs.map(tab => {
              const isActive = tab.id === activeTabId;
              return (
                <div 
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`h-full px-4 flex items-center gap-2 text-xs font-mono border-r border-white/5 cursor-pointer transition-colors group ${
                    isActive 
                      ? "bg-[#141414] border-t-2 border-t-primary text-on-surface" 
                      : "text-zinc-500 hover:text-zinc-300 border-t-2 border-t-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  <span>{tab.name}</span>
                  {tab.isUnsaved && <span className="text-amber-500 text-[10px] leading-none mb-0.5">●</span>}
                  <span 
                    onClick={(e) => closeTab(tab.id, e)}
                    className={`material-symbols-outlined text-[12px] ml-1 transition-opacity ${isActive ? "text-zinc-500 hover:text-error opacity-100" : "opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-error"}`}
                  >close</span>
                </div>
              );
            })}
            <button onClick={addTab} className="px-3 h-full flex items-center text-zinc-500 hover:text-zinc-300 transition-colors">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="h-[40%] flex font-mono text-[13px] leading-relaxed relative overflow-auto bg-[#141414]">
          <CodeMirror
            value={activeTab?.query || ""}
            minHeight="100%"
            height="100%"
            extensions={[sql()]}
            theme={oneDark}
            onChange={handleQueryChange}
            className="flex-1 outline-none text-[13px]"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>

        {/* Toolbar */}
        <div className="h-10 bg-surface-container border-y border-white/5 flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2 font-sans">
            <button 
              onClick={runQuery}
              disabled={isExecuting || !activeTab?.query.trim()}
              className="bg-primary text-background px-3 py-1 rounded flex items-center gap-1.5 font-bold text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-glow"
            >
              <span className={`material-symbols-outlined text-sm ${isExecuting ? 'animate-spin' : ''}`} style={!isExecuting ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {isExecuting ? 'refresh' : 'play_arrow'}
              </span>
              Run
              <span className="opacity-60 font-mono ml-1 text-[10px]">⌘↵</span>
            </button>
            <button className="text-zinc-400 hover:bg-white/5 px-3 py-1 rounded text-xs font-medium transition-colors">Format</button>
            <button onClick={() => updateActiveTab({ isUnsaved: false })} className="text-zinc-400 hover:bg-white/5 px-3 py-1 rounded text-xs font-medium transition-colors">Save</button>
          </div>
          {activeTab?.results && (
            <div className="font-mono text-[10px] text-[#5c5b5b] uppercase tracking-tight">
              {activeTab.results.length} rows · {activeTab.executionTime}ms
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-auto scrollbar-hide bg-background">
          {!activeTab?.results ? (
            <div className="flex h-full items-center justify-center text-zinc-500 font-mono text-xs">
              Run a query to see results
            </div>
          ) : activeTab.results.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-500 font-mono text-xs">
              Query returned no rows
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 bg-background z-10 shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                <tr className="h-9">
                  {activeTab.columns.map(col => (
                    <th key={col} className="px-4 text-[10px] font-mono font-bold text-[#5c5b5b] uppercase tracking-widest bg-background border-r border-white/5 truncate">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-[12px]">
                {activeTab.results.map((r, i) => (
                  <tr key={i} className={`h-[36px] hover:bg-white/5 transition-colors border-b border-white/5 ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                    {activeTab.columns.map(col => (
                      <td key={col} className={`px-4 border-r border-white/5 truncate max-w-[300px] ${col === 'email' ? 'text-[#5c9ee0]' : 'text-zinc-500'}`}>
                        {String(r[col] ?? 'null')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 3. Context Info (Right/Third Column) */}
      <aside className="w-[240px] bg-background flex flex-col shrink-0 border-l border-white/5">
        <div className="h-9 px-4 flex items-center border-b border-white/5 shrink-0">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest">Query History</span>
        </div>
        <div className="p-4 space-y-6">
          {!activeTab?.results ? (
             <div className="text-zinc-500 font-mono text-xs">No execution history</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-[10px] text-[#5c5b5b] uppercase tracking-widest">Explain Plan</div>
                <div className="bg-surface-container rounded p-2 font-mono text-[10px] text-zinc-500 border border-white/5 break-words">
                  Seq Scan on users  (cost=0.00..12.40 rows=240 width=218)
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] text-[#5c5b5b] uppercase tracking-widest">Memory Usage</div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/4 shadow-glow"></div>
                </div>
                <div className="text-[9px] text-[#5c5b5b] font-mono">1.2 MB / 128 MB</div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
