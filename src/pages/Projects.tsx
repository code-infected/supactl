import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../store/projectStore";
import { clearCredentials } from "../lib/storage";

export default function Projects() {
  const navigate = useNavigate();
  const { projectUrl, projectRef, disconnect } = useProjectStore();

  const handleDisconnect = async () => {
    await clearCredentials();
    disconnect();
    navigate("/connect");
  };

  return (
    <div className="flex flex-col h-full w-full bg-background p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-sans text-white">Projects</h1>
          <p className="text-sm text-muted mt-1">Manage your connected Supabase projects</p>
        </div>
        <button 
          className="bg-surface-high hover:bg-surface-highest text-white px-4 py-2 rounded text-sm font-semibold transition-colors border border-DEFAULT flex items-center gap-2"
          onClick={() => {
            // Currently multi-project is not implemented, so just log out
            handleDisconnect();
          }}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Connection
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Project Card */}
        {projectUrl && (
          <div className="bg-surface-low border border-primary/30 rounded-lg p-5 flex flex-col relative overflow-hidden group">
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-start justify-between mb-4 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface border border-DEFAULT flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">database</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">{projectRef || "Local Project"}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ boxShadow: '0 0 8px rgba(62, 207, 142, 0.4)' }}></div>
                    <span className="text-xs text-primary tracking-wide">Connected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6 z-10">
              <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded border border-DEFAULT">
                <span className="material-symbols-outlined text-[14px] text-muted">link</span>
                <span className="text-xs font-mono text-muted truncate">{projectUrl}</span>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-3 z-10 pt-4 border-t border-DEFAULT">
              <button 
                onClick={() => navigate('/tables')}
                className="flex-1 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded text-sm hover:bg-primary/90 transition-colors shadow-glow text-center"
              >
                Open Dashboard
              </button>
              <button 
                onClick={handleDisconnect}
                className="px-3 py-2 rounded bg-surface border border-DEFAULT text-muted hover:text-error hover:border-error/30 hover:bg-error/10 transition-colors"
                title="Disconnect"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State / Add Project placeholder */}
        <div className="bg-surface-low border border-dashed border-DEFAULT rounded-lg p-5 flex flex-col items-center justify-center text-center opacity-50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface border border-DEFAULT flex items-center justify-center">
            <span className="material-symbols-outlined text-muted text-[24px]">construction</span>
          </div>
          <div>
            <h4 className="text-white font-medium text-sm">Multi-Project Support</h4>
            <p className="text-xs text-muted mt-1 max-w-[200px]">Connecting multiple projects simultaneously will be available in Phase 4.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
