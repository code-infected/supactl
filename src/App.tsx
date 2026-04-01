import React, { Component, ErrorInfo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { TopNav } from "./components/shell/TopNav";
import { Sidebar } from "./components/shell/Sidebar";
import { StatusBar } from "./components/shell/StatusBar";
import { useProjectStore } from "./store/projectStore";

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

class GlobalErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Global UI Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-white bg-red-900 h-screen w-screen flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-4">App Crashed</h1>
          <pre className="bg-black/50 p-4 rounded text-sm overflow-auto max-w-[80vw]">
            {this.state.error?.message}
            {"\n"}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-white text-red-900 rounded">Reload App</button>
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
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isConnected = useProjectStore((state) => state.isConnected);
  
  if (!isConnected) {
    return <Navigate to="/connect" replace />;
  }
  
  return <>{children}</>;
}

function RootRedirect() {
  const isConnected = useProjectStore((state) => state.isConnected);
  return isConnected ? <Navigate to="/tables" replace /> : <Navigate to="/connect" replace />;
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
            <Route path="/connect" element={<Onboarding />} />
            
            {/* Phase 1 - Protected */}
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
          </Route>
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
}
