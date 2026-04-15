/**
 * Multi-Project Store - Production Ready
 * 
 * Supports managing multiple Supabase projects simultaneously.
 * Each project has isolated state and can be switched between.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTauriPersistStorage } from './tauriStorage';

export interface Project {
  id: string;                    // Unique identifier (uuid)
  name: string;                  // User-friendly name
  projectUrl: string;          // Supabase project URL
  projectRef: string;           // Project reference (xyz from xyz.supabase.co)
  serviceKey: string;         // Service role key (encrypted at rest)
  anonKey?: string;           // Anon/public key
  managementToken?: string;   // Management API token
  createdAt: number;          // When project was added
  lastConnectedAt: number;  // Last successful connection
  isActive: boolean;          // Currently connected project
  color?: string;             // UI color for project identification
}

export interface ProjectsState {
  projects: Project[];
  activeProjectId: string | null;
  isConnecting: boolean;
  connectionError: string | null;
  hasHydrated: boolean; // Track if store has been rehydrated from disk
  
  // Actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'lastConnectedAt' | 'isActive'>) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  getActiveProject: () => Project | null;
  getProjectById: (id: string) => Project | null;
  setConnecting: (status: boolean) => void;
  setConnectionError: (error: string | null) => void;
  markConnected: (id: string) => void;
  setHasHydrated: (status: boolean) => void;
  reorderProjects: (projectIds: string[]) => void;
}

// Extract project ref from URL
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

// Generate UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate random color for project identification
function generateProjectColor(): string {
  const colors = [
    '#3ECF8E', // Primary green
    '#5cb8e0', // Blue
    '#cf8aef', // Purple
    '#e0a85c', // Orange
    '#ff716c', // Red
    '#7ee0c5', // Teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isConnecting: false,
      connectionError: null,
      hasHydrated: false,

      addProject: (projectData) => {
        const id = generateId();
        const projectRef = extractProjectRef(projectData.projectUrl);
        
        const newProject: Project = {
          ...projectData,
          id,
          projectRef: projectRef || 'unknown',
          createdAt: Date.now(),
          lastConnectedAt: Date.now(),
          isActive: true, // Auto-activate new project
          color: generateProjectColor(),
        };

        set((state) => {
          // Deactivate all other projects
          const updatedProjects = state.projects.map(p => ({ ...p, isActive: false }));
          
          return {
            projects: [...updatedProjects, newProject],
            activeProjectId: id,
            connectionError: null,
          };
        });

        return id;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      removeProject: (id) => {
        set((state) => {
          const filtered = state.projects.filter((p) => p.id !== id);
          const wasActive = state.activeProjectId === id;
          
          return {
            projects: filtered,
            activeProjectId: wasActive 
              ? (filtered[0]?.id || null) 
              : state.activeProjectId,
          };
        });
      },

      setActiveProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) => ({
            ...p,
            isActive: p.id === id,
          })),
          activeProjectId: id,
          connectionError: null,
        }));
      },

      getActiveProject: () => {
        const state = get();
        if (!state.activeProjectId) return null;
        return state.projects.find((p) => p.id === state.activeProjectId) || null;
      },

      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id) || null;
      },

      setConnecting: (status) => {
        set({ isConnecting: status });
      },

      setConnectionError: (error) => {
        set({ connectionError: error });
      },

      setHasHydrated: (status) => {
        set({ hasHydrated: status });
      },

      markConnected: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, lastConnectedAt: Date.now(), isActive: true } : p
          ),
        }));
      },

      reorderProjects: (projectIds) => {
        set((state) => {
          const ordered = projectIds
            .map((id) => state.projects.find((p) => p.id === id))
            .filter((p): p is Project => p !== undefined);
          
          // Add any projects not in the ordered list
          const remaining = state.projects.filter(
            (p) => !projectIds.includes(p.id)
          );
          
          return { projects: [...ordered, ...remaining] };
        });
      },
    }),
    {
      name: 'supactl-projects',
      storage: createTauriPersistStorage(),
      // Encrypt sensitive data in storage
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
      // Ensure store is rehydrated before components try to access data
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          console.log('Projects store rehydrated:', state.projects.length, 'projects');
        }
      },
      skipHydration: typeof window === 'undefined', // Skip during SSR
    }
  )
);
