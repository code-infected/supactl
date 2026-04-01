export function StatusBar() {
  const isConnected = true; // Hardcoded for now until store is integrated

  return (
    <div className="h-[24px] w-full bg-surface-low border-t border-DEFAULT flex items-center justify-between px-3 font-mono text-[10px] shrink-0 text-muted select-none">
      <div className="flex items-center gap-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
              Connected
            </div>
            <span>Postgres 15.3</span>
            <span>project-host.supabase.co</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-error">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              Disconnected
            </div>
            <span>Last seen: Just now</span>
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
