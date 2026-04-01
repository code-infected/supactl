import { create } from 'zustand';

interface ProjectState {
  projectUrl: string | null;
  serviceKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  setCredentials: (url: string, key: string) => void;
  setConnected: (status: boolean) => void;
  setConnecting: (status: boolean) => void;
  disconnect: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectUrl: null,
  serviceKey: null,
  isConnected: false,
  isConnecting: false,
  setCredentials: (url, key) => set({ projectUrl: url, serviceKey: key }),
  setConnected: (status) => set({ isConnected: status }),
  setConnecting: (status) => set({ isConnecting: status }),
  disconnect: () => set({ projectUrl: null, serviceKey: null, isConnected: false }),
}));
