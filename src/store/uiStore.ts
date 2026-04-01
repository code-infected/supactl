import { create } from 'zustand';

interface UiState {
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
