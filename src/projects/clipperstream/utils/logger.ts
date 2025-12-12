/**
 * Clipstream Logger Utility
 * 
 * Production-ready logging with environment-based levels
 * Works across web, iOS, and Android (Expo compatible)
 * 
 * Usage:
 *   logger.debug('Starting process', { data });  // Dev only
 *   logger.info('User action completed');        // Always logged
 *   logger.warn('Non-critical issue', error);    // Always logged
 *   logger.error('Critical failure', error);     // Always logged
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  prefix: string;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    // Automatically detect environment
    const isDevelopment = 
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test' ||
      __DEV__; // Expo/React Native global

    this.config = {
      enableDebug: isDevelopment,
      enableInfo: true, // Always log info in all environments
      prefix: '[Clipstream]'
    };
  }

  /**
   * DEBUG: Detailed diagnostic information
   * Only logged in development mode
   * Use for: Function calls, state changes, API requests
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.enableDebug) {
      console.log(`${this.config.prefix} [DEBUG]`, message, ...args);
    }
  }

  /**
   * INFO: General informational messages
   * Logged in all environments
   * Use for: Important user actions, successful operations
   */
  info(message: string, ...args: any[]): void {
    if (this.config.enableInfo) {
      console.log(`${this.config.prefix} [INFO]`, message, ...args);
    }
  }

  /**
   * WARN: Warning messages for recoverable issues
   * Always logged in all environments
   * Use for: Degraded functionality, fallbacks triggered
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`${this.config.prefix} [WARN]`, message, ...args);
  }

  /**
   * ERROR: Error messages for failures
   * Always logged in all environments
   * Use for: Exceptions, failed operations, critical issues
   */
  error(message: string, ...args: any[]): void {
    console.error(`${this.config.prefix} [ERROR]`, message, ...args);
  }

  /**
   * Group logs together (useful for related operations)
   * Only works in development
   */
  group(label: string, callback: () => void): void {
    if (this.config.enableDebug && console.group) {
      console.group(`${this.config.prefix} ${label}`);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /**
   * Create a scoped logger for a specific module
   * Example: const log = logger.scope('TitleGenerator');
   */
  scope(moduleName: string): ScopedLogger {
    return new ScopedLogger(moduleName, this.config);
  }
}

/**
 * Scoped logger for individual modules/components
 * Automatically prefixes all logs with module name
 */
class ScopedLogger {
  constructor(
    private moduleName: string,
    private config: LoggerConfig
  ) {}

  debug(message: string, ...args: any[]): void {
    if (this.config.enableDebug) {
      console.log(`${this.config.prefix} [${this.moduleName}] [DEBUG]`, message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.config.enableInfo) {
      console.log(`${this.config.prefix} [${this.moduleName}] [INFO]`, message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`${this.config.prefix} [${this.moduleName}] [WARN]`, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`${this.config.prefix} [${this.moduleName}] [ERROR]`, message, ...args);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for advanced usage
export type { LogLevel, ScopedLogger };

