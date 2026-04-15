import { create } from 'zustand';

export interface UiState {
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

/**
 * Zustand store for managing UI state
 * 
 * @example
 * const { sidebarCollapsed } = useUiStore();
 * const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
 */
export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
