import { create } from 'zustand';
import { log } from '../lib/logger';
import { createSupabaseClient } from '../lib/supabase';

export interface TableInfo {
  name: string;
  schema: string;
  rowCount?: number;
}

export interface SchemaState {
  tables: TableInfo[];
  isLoading: boolean;
  error: string | null;
  setTables: (tables: TableInfo[]) => void;
  setLoading: (status: boolean) => void;
  setError: (error: string | null) => void;
  fetchSchema: (projectUrl: string, serviceKey: string) => Promise<void>;
  clear: () => void;
}

/**
 * Zustand store for managing database schema state
 * 
 * @example
 * const { tables, isLoading } = useSchemaStore();
 * const fetchSchema = useSchemaStore((state) => state.fetchSchema);
 */
export const useSchemaStore = create<SchemaState>((set) => ({
  tables: [],
  isLoading: false,
  error: null,
  setTables: (tables) => set({ tables }),
  setLoading: (status) => set({ isLoading: status }),
  setError: (error) => set({ error }),
  clear: () => set({ tables: [], isLoading: false, error: null }),
  
  fetchSchema: async (projectUrl: string, serviceKey: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const supabase = createSupabaseClient(projectUrl, serviceKey);
      
      // Fetch tables from information_schema
      // Using a raw RPC call or direct query to information_schema.tables
      const { data, error } = await supabase
        .rpc('get_public_tables')
        .select('*');
      
      if (error) {
        // Fallback: Try to get tables via a different method
        // Query pg_catalog for table names (requires custom RPC)
        log.warn('RPC get_public_tables not available, trying alternative method');
        
        // Alternative: Use PostgREST introspection
        // The Supabase client doesn't expose schema introspection directly,
        // but we can try to query well-known system views
        const altResponse = await fetch(`${projectUrl}/rest/v1/`, {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
        });
        
        if (altResponse.ok) {
          const openApiSpec = await altResponse.json();
          // PostgREST returns OpenAPI spec with definitions for each table
          if (openApiSpec.definitions) {
            const tableNames = Object.keys(openApiSpec.definitions)
              .filter(name => !name.startsWith('_')) // Filter internal tables
              .map(name => ({
                name,
                schema: 'public',
              }));
            
            set({ tables: tableNames, isLoading: false, error: null });
            return;
          }
        }
        
        throw new Error('Could not fetch database schema');
      }
      
      const tables: TableInfo[] = (data || []).map((t: any) => ({
        name: t.table_name || t.name,
        schema: t.table_schema || 'public',
      }));
      
      set({ tables, isLoading: false, error: null });
    } catch (err: any) {
      log.error('Failed to fetch schema', err, { projectUrl });
      set({ 
        tables: [], 
        isLoading: false, 
        error: err.message || 'Failed to fetch database schema' 
      });
    }
  },
}));
