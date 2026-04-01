import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSchemaStore } from "../store/schemaStore";
import { createSupabaseClient } from "../lib/supabase";
import { useProjectStore } from "../store/projectStore";

export default function TableEditor() {
  const { tableName } = useParams<{ tableName: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  
  const { tables: schemaTables } = useSchemaStore();
  const { projectUrl, serviceKey } = useProjectStore();
  
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fallback to mock tables if schema is empty
  const displayTables = schemaTables.length > 0 ? schemaTables : ["users", "profiles", "audit_log", "settings"];

  useEffect(() => {
    async function fetchTableData() {
      if (!tableName || !projectUrl || !serviceKey) return;
      
      setLoading(true);
      try {
        const supabase = createSupabaseClient(projectUrl, serviceKey);
        // We'll fetch just 50 rows for the preview
        const { data, error } = await supabase.from(tableName).select('*').limit(50);
        
        if (error) {
          console.error("Error fetching table data:", error);
          setRows([]);
        } else if (data) {
          setRows(data);
          if (data.length > 0) {
            setColumns(Object.keys(data[0]));
          } else {
            setColumns(["id", "created_at"]); // Default fallback purely for UI
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTableData();
  }, [tableName, projectUrl, serviceKey]);

  return (
    <div className="flex h-full w-full overflow-hidden font-sans bg-background">
      
      {/* 1. Schema Browser (Left Column) */}
      <aside className="w-[200px] bg-background flex flex-col shrink-0 border-r border-white/5">
        <div className="h-9 px-4 flex items-center justify-between border-b border-white/5 shrink-0">
          <span className="text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest">Schema</span>
          <span className="material-symbols-outlined text-zinc-600 text-[14px]">search</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {displayTables.map((t) => {
            const isActive = t === tableName;
            return (
              <div 
                key={t}
                onClick={() => navigate(`/tables/${t}`)}
                className={`px-4 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${
                  isActive 
                    ? "text-primary bg-surface-container" 
                    : "text-zinc-400 hover:text-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-[14px] ${isActive ? "rotate-90" : "text-zinc-600"}`}>chevron_right</span>
                <span className={`material-symbols-outlined text-[16px] ${isActive ? "" : "text-zinc-600"}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>table_chart</span>
                <span className={`text-xs ${isActive ? "font-bold" : "font-medium"}`}>{t}</span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* 2. Table Editor Canvas (Center Panel) */}
      <section className="flex-1 flex flex-col bg-surface-container overflow-hidden">
        {/* Toolbar */}
        <header className="h-14 border-b border-white/5 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <nav className="flex items-center text-xs font-medium font-mono">
              <span className="text-[#5c5b5b] uppercase tracking-widest text-[10px]">public</span>
              <span className="material-symbols-outlined text-zinc-600 mx-1 text-[14px]">chevron_right</span>
              <span className="text-on-surface">{tableName || "Select a table"}</span>
            </nav>
            <div className="h-4 w-[1px] bg-white/5 mx-2"></div>
            <div className="flex items-center gap-2">
              <button disabled={!tableName} className="bg-primary-container text-on-primary-container disabled:opacity-50 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 hover:brightness-110 transition-all shadow-glow">
                <span className="material-symbols-outlined text-[14px]">add</span>
                Insert Row
              </button>
              <button className="text-zinc-400 hover:bg-surface-container-high px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors">
                <span className="material-symbols-outlined text-[14px]">filter_list</span>
                Filter
              </button>
              <button className="text-zinc-400 hover:bg-surface-container-high px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors">
                <span className="material-symbols-outlined text-[14px]">sort</span>
                Sort
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-[14px]">search</span>
              <input 
                className="bg-surface-container-lowest border-none text-xs font-mono rounded px-8 py-1.5 w-48 focus:ring-1 focus:ring-primary/40 placeholder:text-zinc-600 outline-none text-on-surface" 
                placeholder="Search..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Spreadsheet Grid */}
        <div className="flex-1 overflow-auto scrollbar-hide relative bg-[#141414]">
          {!tableName ? (
            <div className="flex items-center justify-center h-full text-zinc-500 flex-col gap-4">
              <span className="material-symbols-outlined text-4xl opacity-50">table_chart</span>
              <p>Select a table to view its contents</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-[13px] relative font-mono">
              <thead className="sticky top-0 z-20 bg-surface-container shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                <tr className="h-9">
                  <th className="w-10 border-r border-white/5 p-0 bg-surface-container-lowest"></th>
                  {columns.map(col => (
                    <th key={col} className="border-r border-white/5 px-3 py-2 text-left font-medium min-w-[150px]">
                      <div className="flex flex-col">
                        <span className="text-on-surface">{col}</span>
                        <span className="text-[10px] text-[#5c5b5b] uppercase tracking-widest text-ellipsis overflow-hidden">type</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {loading ? (
                   <tr className="h-[36px]"><td colSpan={columns.length + 1} className="text-center text-zinc-500 py-4">Loading data...</td></tr>
                ) : rows.length === 0 ? (
                  <tr className="h-[36px]"><td colSpan={columns.length + 1} className="text-center text-zinc-500 py-4">No rows found in "{tableName}"</td></tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={idx} className="h-[36px] border-b border-white/5 hover:bg-surface-container-highest transition-colors">
                      <td className="text-center text-zinc-600 bg-surface-container-lowest border-r border-white/5">{idx + 1}</td>
                      {columns.map((col, colIdx) => {
                        let value = row[col];
                        let cellClass = "text-zinc-400";
                        
                        if (value === null) {
                          cellClass = "text-zinc-500 italic";
                          value = "null";
                        } else if (typeof value === 'boolean') {
                          cellClass = value ? "text-primary shadow-glow" : "text-error";
                          value = String(value);
                        } else if (typeof value === 'object') {
                          cellClass = "text-zinc-500 italic";
                          value = JSON.stringify(value).substring(0, 30) + "...";
                        } else if (String(value).includes('@')) {
                          cellClass = "text-[#5c9ee0]";
                        } else if (colIdx === 0) {
                           // primary key highlight guess
                           cellClass = "text-primary shadow-glow";
                        }
  
                        return (
                          <td key={col} className={`px-3 border-r border-white/5 ${cellClass} truncate max-w-[300px]`}>
                            {String(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Grid Footer */}
        <footer className="h-9 border-t border-white/5 bg-surface-container px-4 flex items-center justify-between shrink-0 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-4">
            <span>Showing {rows.length} rows</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-surface-container-high rounded disabled:opacity-30 transition-colors" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="text-on-surface">Page 1 of 1</span>
            <button className="p-1 hover:bg-surface-container-high rounded disabled:opacity-30 transition-colors" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </footer>
      </section>

      {/* 3. Table Info (Right Panel) */}
      <aside className="w-[200px] h-full bg-surface-container-lowest border-l border-white/5 p-4 shrink-0 overflow-y-auto scrollbar-hide">
        <h3 className="text-[10px] uppercase tracking-widest text-[#5c5b5b] font-mono mb-4">Table Info</h3>
        {tableName ? (
          <div className="space-y-6 font-mono">
            <section>
              <div className="text-[10px] text-[#5c5b5b] uppercase tracking-widest mb-1">Entity</div>
              <div className="text-sm font-semibold text-on-surface">{tableName}</div>
              <div className="text-[11px] text-zinc-500">schema: public</div>
            </section>
            
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Row Count</span>
                <span className="text-xs text-on-surface">~ {rows.length}</span>
              </div>
            </section>
            
            <section>
              <div className="text-[10px] text-[#5c5b5b] uppercase tracking-widest mb-2">Indexes</div>
              <ul className="space-y-1">
                <li className="text-[11px] bg-surface-container p-2 rounded border border-white/5 text-zinc-400">
                  {tableName}_pkey <span className="text-[10px] opacity-50 block mt-0.5">primary key</span>
                </li>
              </ul>
            </section>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 text-center mt-10">
            No table selected
          </div>
        )}
      </aside>
    </div>
  );
}
