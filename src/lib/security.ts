/**
 * Security utilities for production-ready application
 */

// Valid PostgreSQL identifier pattern (simplified)
// Must start with letter or underscore, followed by letters, numbers, underscores
const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// Reserved SQL keywords that shouldn't be used as identifiers
const RESERVED_KEYWORDS = [
  'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'table',
  'database', 'schema', 'where', 'from', 'join', 'union', 'order', 'group',
  'having', 'limit', 'offset', 'exec', 'execute', 'script', 'javascript'
];

/**
 * Validates if a string is a safe PostgreSQL identifier
 * Prevents SQL injection by only allowing valid table/column names
 */
export function isValidPostgresIdentifier(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  if (name.length === 0 || name.length > 63) return false; // PG identifier limit
  if (!VALID_IDENTIFIER_REGEX.test(name)) return false;
  if (RESERVED_KEYWORDS.includes(name.toLowerCase())) return false;
  return true;
}

/**
 * Sanitizes a table name by validating it against known schema
 * Returns null if the table name is not in the schema (potential injection)
 */
export function sanitizeTableName(tableName: string, knownTables: string[]): string | null {
  // First check if it's a valid identifier
  if (!isValidPostgresIdentifier(tableName)) {
    return null;
  }
  
  // Then verify it exists in our known schema
  if (!knownTables.includes(tableName)) {
    console.warn(`Attempted to access unknown table: ${tableName}`);
    return null;
  }
  
  return tableName;
}

/**
 * Creates parameterized SQL for exec_sql RPC
 * This prevents SQL injection by using Supabase's parameterized queries
 */
export function createSafeSqlQuery(
  baseQuery: string, 
  params: Record<string, string | number>
): { sql: string; params: Record<string, unknown> } {
  // Replace placeholders with PostgreSQL parameter syntax
  let sql = baseQuery;
  const queryParams: Record<string, unknown> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `:${key}`;
    if (sql.includes(placeholder)) {
      sql = sql.replace(new RegExp(placeholder, 'g'), `$${Object.keys(queryParams).length + 1}`);
      queryParams[key] = value;
    }
  });
  
  return { sql, params: queryParams };
}

/**
 * Validates project URL format
 */
export function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && 
           parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

/**
 * Validates JWT format (basic check)
 */
export function isValidJWT(token: string): boolean {
  // JWT format: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Check if payload is valid base64
    atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes user input for display (XSS prevention)
 */
export function sanitizeDisplayText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
