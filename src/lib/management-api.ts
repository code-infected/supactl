/**
 * Supabase Management API Client
 * 
 * Uses the Supabase Management API to access project-level settings,
 * edge functions, migrations, and other management features.
 * 
 * API Docs: https://supabase.com/docs/reference/api/introduction
 */

const MANAGEMENT_API_URL = 'https://api.supabase.com/v1';

interface ManagementApiOptions {
  token: string;
  projectRef: string;
}

interface EdgeFunction {
  id: string;
  slug: string;
  name: string;
  status: 'ACTIVE' | 'REMOVED' | 'THROTTLED';
  version: number;
  created_at: string;
  updated_at: string;
}

interface EdgeFunctionLog {
  id: string;
  timestamp: number;
  event_message: string;
  event_type: 'uncaughtException' | 'log';
  metadata: {
    level: string;
    function_id: string;
    execution_id: string;
  };
}

interface Migration {
  version: string;
  name: string | null;
  statements: string[] | null;
}

export class ManagementApiClient {
  private token: string;
  private projectRef: string;

  constructor(options: ManagementApiOptions) {
    this.token = options.token;
    this.projectRef = options.projectRef;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${MANAGEMENT_API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 401) {
          throw new Error('Invalid or expired Management API token. Please generate a new token from supabase.com/dashboard/account/tokens');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Check that your token has access to this project.');
        }
        if (response.status === 404) {
          throw new Error('Resource not found. Check your project reference.');
        }
        throw new Error(`API error (${response.status}): ${errorBody}`);
      }

      return response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Network error. Check your internet connection or the Management API might be blocking browser requests.');
      }
      throw err;
    }
  }

  /**
   * List all edge functions for the project
   */
  async listEdgeFunctions(): Promise<EdgeFunction[]> {
    return this.request<EdgeFunction[]>(`/projects/${this.projectRef}/functions`);
  }

  /**
   * Get logs for a specific edge function
   */
  async getEdgeFunctionLogs(functionSlug: string): Promise<EdgeFunctionLog[]> {
    // The Management API uses a different endpoint structure for logs
    // We need to query the logs endpoint with the function filter
    const params = new URLSearchParams({
      // Last 24 hours
      iso_timestamp_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      iso_timestamp_end: new Date().toISOString(),
    });
    
    return this.request<EdgeFunctionLog[]>(
      `/projects/${this.projectRef}/analytics/endpoints/logs.all?${params}`
    );
  }

  /**
   * List all migrations for the project
   */
  async listMigrations(): Promise<Migration[]> {
    return this.request<Migration[]>(`/projects/${this.projectRef}/database/migrations`);
  }

  /**
   * Get project settings/info
   */
  async getProject(): Promise<{
    id: string;
    name: string;
    organization_id: string;
    region: string;
    status: string;
    created_at: string;
  }> {
    return this.request(`/projects/${this.projectRef}`);
  }

  /**
   * Test if the token and project ref are valid
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getProject();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a Management API client instance
 */
export function createManagementClient(token: string, projectRef: string): ManagementApiClient {
  return new ManagementApiClient({ token, projectRef });
}
