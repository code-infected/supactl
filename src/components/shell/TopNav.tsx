import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSchemaStore } from "../../store/schemaStore";
import { useProjectStore } from "../../store/projectStore";

export function TopNav() {
  const [os, setOs] = useState<"mac" | "win" | "linux" | "unknown">("unknown");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { fetchSchema } = useSchemaStore();
  const { isConnected, projectUrl, serviceKey } = useProjectStore();

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) {
      setOs("mac");
    } else if (ua.includes("win")) {
      setOs("win");
    } else if (ua.includes("linux")) {
      setOs("linux");
    }
  }, []);

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleToggleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  const handleRefresh = async () => {
    if (!isConnected) return;
    setIsRefreshing(true);
    try {
      if (projectUrl && serviceKey) {
        await fetchSchema(projectUrl, serviceKey);
      }
      // Dispatch a custom event so other components (like TableEditor) know to reload their data
      window.dispatchEvent(new CustomEvent('app-refresh'));
      
      // Artificial delay for UX so the user can clearly see the refresh happened
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderMacControls = () => (
    <div className="flex gap-2 mr-2">
      <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center group" title="Close">
        <span className="material-symbols-outlined text-[8px] opacity-0 group-hover:opacity-100 text-black">close</span>
      </button>
      <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 flex items-center justify-center group" title="Minimize">
        <span className="material-symbols-outlined text-[8px] opacity-0 group-hover:opacity-100 text-black">remove</span>
      </button>
      <button onClick={handleToggleMaximize} className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 flex items-center justify-center group" title="Maximize">
        <span className="material-symbols-outlined text-[8px] opacity-0 group-hover:opacity-100 text-black">open_in_full</span>
      </button>
    </div>
  );

  const renderWinControls = () => (
    <div className="flex -mr-4 h-full">
      <button onClick={handleMinimize} className="px-4 h-full flex items-center justify-center hover:bg-white/10 transition-colors" title="Minimize">
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
      <button onClick={handleToggleMaximize} className="px-4 h-full flex items-center justify-center hover:bg-white/10 transition-colors" title="Maximize">
        <span className="material-symbols-outlined text-[14px]">check_box_outline_blank</span>
      </button>
      <button onClick={handleClose} className="px-4 h-full flex items-center justify-center hover:bg-error hover:text-white transition-colors" title="Close">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );

  return (
    <div className="h-[40px] w-full bg-background border-b border-DEFAULT flex items-center justify-between px-4 shrink-0 select-none" data-tauri-drag-region="true">
      <div className="flex items-center gap-4" data-tauri-drag-region="true">
        {os === "mac" && renderMacControls()}
        
        <span className="font-bold text-sm text-white mr-2" data-tauri-drag-region="true">Supactl</span>
        
        <nav className="flex items-center gap-4" data-tauri-drag-region="true">
          <Link to="/tables" className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-white transition-colors" data-tauri-drag-region="false">Explorer</Link>
          <Link to="/sql" className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-white transition-colors" data-tauri-drag-region="false">Query</Link>
          <Link to="/logs" className="text-[11px] font-mono uppercase tracking-widest text-muted hover:text-white transition-colors" data-tauri-drag-region="false">Logs</Link>
        </nav>
      </div>
      
      <div className="flex items-center gap-4 text-muted h-full" data-tauri-drag-region="true">
        <button 
          onClick={handleRefresh}
          disabled={!isConnected || isRefreshing}
          className={`hover:text-white transition-colors flex items-center justify-center ${isConnected ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} 
          title="Refresh Data"
        >
          <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
            refresh
          </span>
        </button>
        <button className="hover:text-white transition-colors flex items-center justify-center cursor-default" data-tauri-drag-region="false">
          <span className="material-symbols-outlined text-[18px]">search</span>
        </button>
        <button className="hover:text-white transition-colors flex items-center justify-center cursor-default" data-tauri-drag-region="false">
          <span className="material-symbols-outlined text-[18px]">notifications</span>
        </button>
        <button className="text-primary hover:text-primary/80 transition-colors shadow-glow rounded-full flex items-center justify-center mr-2 cursor-default" data-tauri-drag-region="false">
          <span className="material-symbols-outlined text-[18px]">cloud_done</span>
        </button>
        
        {(os === "win" || os === "linux") && renderWinControls()}
      </div>
    </div>
  );
}
