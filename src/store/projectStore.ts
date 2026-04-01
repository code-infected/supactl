import { create } from 'zustand';

interface ProjectState {
  projectUrl: string | null;
  projectRef: string | null; // The project ID (xxxxxx from xxxxxx.supabase.co)
  serviceKey: string | null;
  anonKey: string | null;
  managementToken: string | null; // Supabase Management API access token
  isConnected: boolean;
  isConnecting: boolean;
  setCredentials: (url: string, serviceKey: string, anonKey?: string, managementToken?: string) => void;
  setConnected: (status: boolean) => void;
  setConnecting: (status: boolean) => void;
  disconnect: () => void;
}

// Extract project ref from URL (e.g., "abc123" from "https://abc123.supabase.co")
function extractProjectRef(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[1] === 'supabase') {
      return parts[0];
    }
    return null;
  } catch {
    return null;
  }
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectUrl: null,
  projectRef: null,
  serviceKey: null,
  anonKey: null,
  managementToken: null,
  isConnected: false,
  isConnecting: false,
  setCredentials: (url, serviceKey, anonKey, managementToken) => set({ 
    projectUrl: url, 
    projectRef: extractProjectRef(url),
    serviceKey, 
    anonKey: anonKey || null,
    managementToken: managementToken || null,
  }),
  setConnected: (status) => set({ isConnected: status }),
  setConnecting: (status) => set({ isConnecting: status }),
  disconnect: () => set({ 
    projectUrl: null, 
    projectRef: null,
    serviceKey: null, 
    anonKey: null, 
    managementToken: null,
    isConnected: false 
  }),
}));
