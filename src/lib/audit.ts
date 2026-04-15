/**
 * Audit Logging System - Production Ready
 * 
 * Tracks sensitive operations for security and compliance.
 * Logs to local storage with rotation and export capability.
 */

import { load } from "@tauri-apps/plugin-store";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "PROJECT_CONNECT"
  | "PROJECT_DISCONNECT"
  | "USER_CREATE"
  | "USER_DELETE"
  | "USER_UPDATE"
  | "USER_BAN"
  | "USER_UNBAN"
  | "POLICY_CREATE"
  | "POLICY_UPDATE"
  | "POLICY_DELETE"
  | "TABLE_INSERT"
  | "TABLE_UPDATE"
  | "TABLE_DELETE"
  | "STORAGE_UPLOAD"
  | "STORAGE_DELETE"
  | "RLS_TOGGLE"
  | "MIGRATION_RUN"
  | "MIGRATION_ROLLBACK"
  | "SETTINGS_CHANGE"
  | "EXPORT_DATA"
  | "ERROR";

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  projectId?: string;
  projectRef?: string;
  userId?: string;
  targetId?: string; // ID of affected entity (user, row, etc.)
  targetType?: string; // Type of affected entity
  details: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string; // If available
  userAgent?: string;
}

interface AuditStore {
  logs: AuditLogEntry[];
  lastRotation: number;
}

const AUDIT_STORE_KEY = "audit_logs";
const MAX_LOGS = 1000; // Keep last 1000 entries

class AuditLogger {
  private storePromise: ReturnType<typeof load>;
  private memoryBuffer: AuditLogEntry[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.storePromise = load("audit.bin");
  }

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Write log entry
   */
  async log(
    action: AuditAction,
    details: Record<string, unknown> = {},
    options: {
      projectId?: string;
      projectRef?: string;
      userId?: string;
      targetId?: string;
      targetType?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      action,
      details,
      success: options.success ?? true,
      ...options,
    };

    // Add to memory buffer
    this.memoryBuffer.push(entry);

    // Schedule flush
    this.scheduleFlush();

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log("[AUDIT]", action, details);
    }
  }

  /**
   * Schedule buffer flush to storage
   */
  private scheduleFlush(): void {
    if (this.flushTimeout) return;

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, 1000); // Batch writes every second
  }

  /**
   * Flush memory buffer to storage
   */
  private async flush(): Promise<void> {
    if (this.memoryBuffer.length === 0) return;

    try {
      const store = await this.storePromise;
      const data = await store.get<AuditStore>(AUDIT_STORE_KEY);
      
      const existingLogs = data?.logs || [];
      const allLogs = [...existingLogs, ...this.memoryBuffer];
      
      // Rotate if needed (keep under max size)
      const trimmedLogs = allLogs.length > MAX_LOGS 
        ? allLogs.slice(-MAX_LOGS) 
        : allLogs;
      
      await store.set(AUDIT_STORE_KEY, {
        logs: trimmedLogs,
        lastRotation: Date.now(),
      });
      await store.save();

      // Clear buffer
      this.memoryBuffer = [];
    } catch (error) {
      console.error("Failed to write audit logs:", error);
    } finally {
      this.flushTimeout = null;
    }
  }


  /**
   * Get all logs (for export/viewing)
   */
  async getLogs(
    filters: {
      action?: AuditAction;
      projectId?: string;
      startTime?: number;
      endTime?: number;
      success?: boolean;
    } = {}
  ): Promise<AuditLogEntry[]> {
    // Flush any pending logs first
    await this.flush();

    try {
      const store = await this.storePromise;
      const data = await store.get<AuditStore>(AUDIT_STORE_KEY);
      let logs = data?.logs || [];

      // Apply filters
      if (filters.action) {
        logs = logs.filter((l) => l.action === filters.action);
      }
      if (filters.projectId) {
        logs = logs.filter((l) => l.projectId === filters.projectId);
      }
      if (filters.startTime) {
        logs = logs.filter((l) => l.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        logs = logs.filter((l) => l.timestamp <= filters.endTime!);
      }
      if (filters.success !== undefined) {
        logs = logs.filter((l) => l.success === filters.success);
      }

      return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Failed to read audit logs:", error);
      return [];
    }
  }

  /**
   * Export logs as JSON
   */
  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear all logs
   */
  async clearLogs(): Promise<void> {
    try {
      const store = await this.storePromise;
      await store.set(AUDIT_STORE_KEY, { logs: [], lastRotation: Date.now() });
      await store.save();
      this.memoryBuffer = [];
    } catch (error) {
      console.error("Failed to clear audit logs:", error);
    }
  }

  /**
   * Get summary statistics
   */
  async getStats(): Promise<{
    total: number;
    byAction: Record<string, number>;
    recentErrors: number;
  }> {
    const logs = await this.getLogs({ startTime: Date.now() - 24 * 60 * 60 * 1000 }); // Last 24h
    
    const byAction: Record<string, number> = {};
    let recentErrors = 0;

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      if (!log.success) recentErrors++;
    }

    return {
      total: logs.length,
      byAction,
      recentErrors,
    };
  }
}

// Global audit logger instance
export const auditLogger = new AuditLogger();

// Convenience function for quick logging
export const audit = (
  action: AuditAction,
  details?: Record<string, unknown>,
  options?: Parameters<AuditLogger["log"]>[2]
) => auditLogger.log(action, details, options);
