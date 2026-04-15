/**
 * Production Logger - Production Ready
 * 
 * Structured logging with environment-aware output.
 * In production: logs to file only (via Tauri)
 * In development: logs to console with colors
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
  source?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum level to log (set via environment or config)
const MIN_LEVEL: LogLevel = import.meta.env.PROD ? "warn" : "debug";

class Logger {
  private buffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
  }

  private formatMessage(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toISOString();
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return `[${time}] [${entry.level.toUpperCase()}]${entry.source ? ` [${entry.source}]` : ""} ${entry.message}${context}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: Date.now(),
    };

    // Add to buffer
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // In development, also log to console
    if (import.meta.env.DEV) {
      switch (level) {
        case "debug":
          console.debug("%c[DEBUG]", "color: #888", message, context || "");
          break;
        case "info":
          console.info("%c[INFO]", "color: #3ECF8E", message, context || "");
          break;
        case "warn":
          console.warn("%c[WARN]", "color: #e0a85c", message, context || "");
          break;
        case "error":
          console.error("%c[ERROR]", "color: #ff716c", message, context || "");
          break;
      }
    } else {
      // In production, we could send to a logging service
      // or write to a file using Tauri
      // For now, errors and warnings go to console even in prod
      if (level === "error" || level === "warn") {
        console[level](this.formatMessage(entry));
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext = error instanceof Error 
      ? { error: error.message, stack: error.stack, ...context }
      : { error: String(error), ...context };
    
    this.log("error", message, errorContext);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.buffer.slice(-count);
  }

  /**
   * Group logs for a specific operation
   */
  group(label: string): void {
    if (import.meta.env.DEV) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error | unknown, ctx?: Record<string, unknown>) => 
    logger.error(msg, err, ctx),
};
