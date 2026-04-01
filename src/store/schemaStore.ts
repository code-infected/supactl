import { create } from 'zustand';

interface SchemaState {
  tables: string[];
  isLoading: boolean;
  setTables: (tables: string[]) => void;
  setLoading: (status: boolean) => void;
}

export const useSchemaStore = create<SchemaState>((set) => ({
  tables: [],
  isLoading: false,
  setTables: (tables) => set({ tables }),
  setLoading: (status) => set({ isLoading: status }),
}));
