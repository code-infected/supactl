import { useState, useEffect } from "react";
import { useProjectsStore } from "../../store/projectsStore";
import { useSchemaStore } from "../../store/schemaStore";
import { createSupabaseClient } from "../../lib/supabase";

export function StatusBar() {
  const activeProject = useProjectsStore((state) => state.getActiveProject());
  const isConnecting = useProjectsStore((state) => state.isConnecting);
  const projectUrl = activeProject?.projectUrl;
  const projectRef = activeProject?.projectRef;
  const serviceKey = activeProject?.serviceKey;
  const isConnected = !!activeProject;
  const { isLoading: schemaLoading, error: schemaError } = useSchemaStore();
  const [postgresVersion, setPostgresVersion] = useState<string | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);

  // Derive display states
  const showLoading = isConnecting || schemaLoading;
  const hasError = schemaError && isConnected;

  // Extract hostname for display
  const displayHost = projectRef 
    ? `${projectRef}.supabase.co`
    : projectUrl 
      ? new URL(projectUrl).hostname 
      : 'Not connected';

  // Fetch Postgres version when connected
  useEffect(() => {
    if (!isConnected || !projectUrl || !serviceKey) {
      setPostgresVersion(null);
      return;
    }

    const fetchVersion = async () => {
      setVersionLoading(true);
      try {
        const supabase = createSupabaseClient(projectUrl, serviceKey);
        // Try to get version via exec_sql RPC if available
        let versionStr: string | null = null;
        try {
          const { data } = await supabase.rpc('exec_sql', {
            sql: "SELECT version()"
          });
          if (data && Array.isArray(data) && data.length > 0) {
            versionStr = data[0].version as string;
          }
        } catch {
          // exec_sql not available, will use fallback
        }

        if (versionStr) {
          // Extract version string like "PostgreSQL 15.1 ..."
          const match = versionStr.match(/PostgreSQL\s+(\d+\.?\d*)/);
          setPostgresVersion(match ? `Postgres ${match[1]}` : 'PostgreSQL');
        } else {
          // Fallback: just show it's connected without version
          setPostgresVersion('PostgreSQL');
        }
      } catch {
        setPostgresVersion('PostgreSQL');
      } finally {
        setVersionLoading(false);
      }
    };

    fetchVersion();
  }, [isConnected, projectUrl, serviceKey]);

  return (
    <div className="h-[24px] w-full bg-surface-low border-t border-DEFAULT flex items-center justify-between px-3 font-mono text-[10px] shrink-0 text-muted select-none">
      <div className="flex items-center gap-4">
        {showLoading ? (
          <>
            <div className="flex items-center gap-2 text-muted">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Connecting...
            </div>
            <span className="text-dimmer">Establishing connection</span>
          </>
        ) : isConnected ? (
          <>
            <div className="flex items-center gap-2 text-white" title={hasError ? 'Schema fetch failed' : 'Connected to Supabase'}>
              <span className={`w-2 h-2 rounded-full shadow-glow ${hasError ? 'bg-amber-500' : 'bg-primary'}`}></span>
              {hasError ? 'Connected (Schema Error)' : 'Connected'}
            </div>
            <span>{versionLoading ? 'Loading...' : postgresVersion || 'PostgreSQL'}</span>
            <span className="truncate max-w-[200px]" title={displayHost}>{displayHost}</span>
            {hasError && <span className="text-error truncate max-w-[150px]" title={schemaError}>Schema: {schemaError}</span>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-error">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              Disconnected
            </div>
            <span className="text-dimmer">Connect via /connect</span>
          </>
        )}
      </div>
      <div className="flex gap-4">
        <span>v0.1.0</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
