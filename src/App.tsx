import { Component, ErrorInfo, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { TopNav } from "./components/shell/TopNav";
import { Sidebar } from "./components/shell/Sidebar";
import { StatusBar } from "./components/shell/StatusBar";
import { ToastContainer } from "./components/shell/ToastContainer";
import { useProjectsStore } from "./store/projectsStore";
import { useSchemaStore } from "./store/schemaStore";
import { log } from "./lib/logger";

import Onboarding from "./pages/Onboarding";
import TableEditor from "./pages/TableEditor";
import SqlEditor from "./pages/SqlEditor";
import AuthUsers from "./pages/AuthUsers";
import ProjectKeys from "./pages/ProjectKeys";
import StorageBrowser from "./pages/StorageBrowser";
import RlsPolicyEditor from "./pages/RlsPolicyEditor";
import EdgeFunctionLogs from "./pages/EdgeFunctionLogs";
import RealtimeListener from "./pages/RealtimeListener";
import MigrationsTracker from "./pages/MigrationsTracker";
import Projects from "./pages/Projects";

class GlobalErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service in production
    console.error("Global UI Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-white bg-red-900/90 h-screen w-screen flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-6xl mb-4">error</span>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-red-200 mb-6 max-w-md text-center">
            The application encountered an unexpected error. Please reload to continue.
          </p>
          <pre className="bg-black/50 p-4 rounded text-sm overflow-auto max-w-[80vw] max-h-[40vh] text-xs">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-white text-red-900 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLayout() {
  return (
    <div className="flex flex-col h-screen w-screen bg-background text-white overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
      <StatusBar />
      <ToastContainer />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const activeProject = useProjectsStore((state) => state.getActiveProject());
  
  if (!activeProject) {
    return <Navigate to="/connect" replace />;
  }
  
  return <>{children}</>;
}

function RootRedirect() {
  const activeProject = useProjectsStore((state) => state.getActiveProject());
  return activeProject ? <Navigate to="/tables" replace /> : <Navigate to="/connect" replace />;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);
  
  const projects = useProjectsStore((state) => state.projects);
  const hasHydrated = useProjectsStore((state) => state.hasHydrated);
  const setActiveProject = useProjectsStore((state) => state.setActiveProject);
  const setConnecting = useProjectsStore((state) => state.setConnecting);
  const fetchSchema = useSchemaStore((state) => state.fetchSchema);
  const clearSchema = useSchemaStore((state) => state.clear);
  
  // Use ref to avoid stale closure issues in retry handler
  const projectUrlRef = useRef<string | null>(null);
  const serviceKeyRef = useRef<string | null>(null);
  const activeProjectRef = useRef<any>(null);

  // Wait for Zustand rehydration and then load schema
  useEffect(() => {
    // Don't do anything until Zustand has rehydrated from storage
    if (!hasHydrated) return;
    
    const loadSavedProjects = async () => {
      setConnecting(true);
      setStartupError(null);
      
      try {
        if (projects.length > 0) {
          // Find the active project or use the first one
          const active = projects.find(p => p.isActive) || projects[0];
          
          // Store refs for potential retry
          projectUrlRef.current = active.projectUrl;
          serviceKeyRef.current = active.serviceKey;
          activeProjectRef.current = active;
          
          // Set as active in store (ensures activeProjectId is correct)
          setActiveProject(active.id);
          
          // Try to fetch schema - if this fails, we're not truly connected
          try {
            await fetchSchema(active.projectUrl, active.serviceKey);
            log.info('Schema loaded on startup', { project: active.name });
          } catch (schemaErr: any) {
            // Schema fetch failed - partial connection
            log.warn('Schema fetch failed on startup', { error: schemaErr.message });
            setStartupError(`Schema load failed: ${schemaErr.message}. Some features may be limited.`);
          }
        }
      } catch (err: any) {
        log.error('Failed to load saved projects', err);
        setStartupError(err.message || 'Failed to initialize app');
        clearSchema();
      } finally {
        setConnecting(false);
        setIsLoading(false);
      }
    };

    loadSavedProjects();
  }, [hasHydrated, projects]); // Re-run when store rehydrates or projects change

  const handleRetry = async () => {
    if (!projectUrlRef.current || !serviceKeyRef.current) return;
    
    setIsLoading(true);
    setConnecting(true);
    setStartupError(null);
    
    try {
      await fetchSchema(projectUrlRef.current, serviceKeyRef.current);
    } catch (err: any) {
      setStartupError(`Schema load failed: ${err.message}`);
    } finally {
      setConnecting(false);
      setIsLoading(false);
    }
  };

  const handleClearAndReconnect = async () => {
    setActiveProject(null);
    clearSchema();
    window.location.href = '/connect';
  };

  // Show loading while waiting for Zustand to rehydrate from disk
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4 block">autorenew</span>
          <p className="text-sm text-zinc-500">Loading saved projects...</p>
        </div>
      </div>
    );
  }

  // Show loading while connecting to project after hydration
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4 block">autorenew</span>
          <p className="text-sm text-zinc-500">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  // Startup error UI - allows retry or reconnect
  if (startupError) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background text-white p-6">
        <div className="max-w-md w-full bg-surface border border-error/20 rounded-lg p-6">
          <div className="flex items-center gap-3 text-error mb-4">
            <span className="material-symbols-outlined text-2xl">error</span>
            <h1 className="text-lg font-semibold">Connection Issue</h1>
          </div>
          <p className="text-sm text-muted mb-6">{startupError}</p>
          <div className="flex gap-3">
            <button 
              onClick={handleRetry}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Retry Connection
            </button>
            <button 
              onClick={handleClearAndReconnect}
              className="flex-1 bg-surface-high border border-DEFAULT text-white px-4 py-2 rounded text-sm font-medium hover:bg-surface transition-colors"
            >
              Reconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GlobalErrorBoundary>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/connect" element={<Onboarding />} />
            
            {/* Phase 1 - Protected */}
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/tables/:tableName?" element={<ProtectedRoute><TableEditor /></ProtectedRoute>} />
            <Route path="/sql" element={<ProtectedRoute><SqlEditor /></ProtectedRoute>} />
            <Route path="/auth" element={<ProtectedRoute><AuthUsers /></ProtectedRoute>} />
            <Route path="/settings/keys" element={<ProtectedRoute><ProjectKeys /></ProtectedRoute>} />

            {/* Phase 2 - Protected */}
            <Route path="/storage" element={<ProtectedRoute><StorageBrowser /></ProtectedRoute>} />
            <Route path="/rls" element={<ProtectedRoute><RlsPolicyEditor /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><EdgeFunctionLogs /></ProtectedRoute>} />
            <Route path="/realtime" element={<ProtectedRoute><RealtimeListener /></ProtectedRoute>} />
            <Route path="/migrations" element={<ProtectedRoute><MigrationsTracker /></ProtectedRoute>} />

            {/* Catch-all - must be LAST */}
            <Route path="*" element={<RootRedirect />} />
          </Route>
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
}
