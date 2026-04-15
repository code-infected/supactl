/**
 * Request Cache & Deduplication Layer - Production Ready
 * 
 * Prevents duplicate API calls and caches responses for performance.
 */

import { useRef, useCallback } from "react";

// Cache entry with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache storage
class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();

  /**
   * Generate cache key from request parameters
   */
  generateKey(endpoint: string, params?: Record<string, unknown>): string {
    const sortedParams = params 
      ? JSON.stringify(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)))
      : "";
    return `${endpoint}:${sortedParams}`;
  }

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Check if request is pending (deduplication)
   */
  getPending<T>(key: string): Promise<T> | null {
    return this.pendingRequests.get(key) as Promise<T> | null;
  }

  /**
   * Set pending request
   */
  setPending<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, promise);
    // Clean up when done
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Clear specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; pending: number } {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
    };
  }
}

// Global cache instance
export const globalCache = new RequestCache();

// Default TTL values (ms)
export const TTL = {
  SCHEMA: 300000,      // 5 minutes
  TABLES: 60000,       // 1 minute
  USERS: 30000,        // 30 seconds
  BUCKETS: 60000,      // 1 minute
  FILES: 30000,        // 30 seconds
  FUNCTIONS: 300000,   // 5 minutes
  MIGRATIONS: 300000,  // 5 minutes
  SHORT: 10000,        // 10 seconds
  LONG: 600000,        // 10 minutes
} as const;

/**
 * React hook for cached data fetching
 */
export function useCachedRequest<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  ttl: number = TTL.SHORT
) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<T> => {
    // Check cache first
    const cached = globalCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Check for pending request (deduplication)
    const pending = globalCache.getPending<T>(cacheKey);
    if (pending) {
      return pending;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Create new request
    const requestPromise = fetcher().then((data) => {
      globalCache.set(cacheKey, data, ttl);
      return data;
    });

    globalCache.setPending(cacheKey, requestPromise);
    return requestPromise;
  }, [fetcher, cacheKey, ttl]);

  const invalidate = useCallback(() => {
    globalCache.invalidate(cacheKey);
  }, [cacheKey]);

  return { execute, invalidate };
}

/**
 * Hook for schema-specific caching
 */
export function useSchemaCache(projectId: string | null) {
  const getTableCacheKey = useCallback(
    (tableName: string) => `table:${projectId}:${tableName}`,
    [projectId]
  );

  const getSchemaCacheKey = useCallback(
    () => `schema:${projectId}`,
    [projectId]
  );

  const invalidateTable = useCallback(
    (tableName: string) => {
      globalCache.invalidate(getTableCacheKey(tableName));
    },
    [getTableCacheKey]
  );

  const invalidateAllTables = useCallback(() => {
    globalCache.invalidatePattern(new RegExp(`^table:${projectId}:`));
  }, [projectId]);

  const invalidateSchema = useCallback(() => {
    globalCache.invalidate(getSchemaCacheKey());
    invalidateAllTables();
  }, [getSchemaCacheKey, invalidateAllTables]);

  return {
    getTableCacheKey,
    getSchemaCacheKey,
    invalidateTable,
    invalidateAllTables,
    invalidateSchema,
  };
}
