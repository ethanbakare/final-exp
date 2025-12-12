# Clipstream Logger Utility

## Overview

Production-ready logging system with environment-based log levels. Works seamlessly across:
- ✅ Web (Next.js/React)
- ✅ iOS (React Native/Expo)
- ✅ Android (React Native/Expo)

---

## Quick Start

```typescript
import { logger } from './utils/logger';

// Create a scoped logger for your module
const log = logger.scope('MyComponent');

// Use it
log.debug('Detailed info for development');  // Dev only
log.info('User completed action');           // Always logged
log.warn('Non-critical issue occurred');     // Always logged
log.error('Critical failure', error);        // Always logged
```

---

## Log Levels

| Level | When to Use | Development | Production |
|-------|-------------|-------------|------------|
| **debug** | Function calls, state changes, API requests | ✅ Logged | ❌ Silent |
| **info** | Important user actions, successful operations | ✅ Logged | ✅ Logged |
| **warn** | Recoverable issues, fallbacks triggered | ✅ Logged | ✅ Logged |
| **error** | Exceptions, failures, critical issues | ✅ Logged | ✅ Logged |

---

## Usage Examples

### Basic Logging

```typescript
import { logger } from '@/projects/clipperstream/utils/logger';

const log = logger.scope('TitleGenerator');

export async function generateTitle(text: string) {
  log.debug('Starting title generation', { textLength: text.length });
  
  try {
    const result = await api.call();
    log.info('Title generated successfully', { title: result });
    return result;
  } catch (error) {
    log.error('Title generation failed', error);
    return 'Fallback Title';
  }
}
```

### Component Logging

```typescript
import { logger } from '../../utils/logger';

const log = logger.scope('ClipMasterScreen');

export const ClipMasterScreen: React.FC = () => {
  const handleSave = useCallback(() => {
    log.debug('Save clicked', { clipId: currentClip.id });
    
    try {
      saveClip(currentClip);
      log.info('Clip saved successfully', { id: currentClip.id });
    } catch (error) {
      log.error('Failed to save clip', error);
      showErrorToast();
    }
  }, [currentClip]);
  
  // ...
};
```

### API Route Logging

```typescript
import { logger } from '../../../projects/clipperstream/utils/logger';

const log = logger.scope('API/transcribe');

export default async function handler(req, res) {
  log.debug('Request received', { method: req.method });
  
  try {
    const result = await processRequest(req);
    log.info('Request processed successfully');
    return res.json({ success: true, result });
  } catch (error) {
    log.error('Request failed', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
```

### Grouping Related Logs (Dev Only)

```typescript
logger.group('User Authentication Flow', () => {
  log.debug('Checking credentials');
  log.debug('Validating token');
  log.debug('Loading user profile');
});

// Output in development:
// [Clipstream] User Authentication Flow
//   [Clipstream] [Auth] [DEBUG] Checking credentials
//   [Clipstream] [Auth] [DEBUG] Validating token
//   [Clipstream] [Auth] [DEBUG] Loading user profile
```

---

## Console Output Format

### Development Mode
```
[Clipstream] [TitleGenerator] [DEBUG] Starting title generation { textLength: 123 }
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: "My Title" }
[Clipstream] [API/transcribe] [WARN] Rate limit approaching
[Clipstream] [ClipMasterScreen] [ERROR] Failed to save clip Error: Network timeout
```

### Production Mode
```
[Clipstream] [TitleGenerator] [INFO] Title generated successfully { title: "My Title" }
[Clipstream] [API/transcribe] [WARN] Rate limit approaching
[Clipstream] [ClipMasterScreen] [ERROR] Failed to save clip Error: Network timeout
```

**Notice:** `DEBUG` logs are completely silent in production.

---

## Best Practices

### ✅ DO

```typescript
// Scope your loggers
const log = logger.scope('MyComponent');

// Log important state changes
log.info('User logged in', { userId: user.id });

// Log errors with context
log.error('API call failed', { endpoint, error });

// Use debug for development-only details
log.debug('Processing request', { params });

// Log warnings for degraded functionality
log.warn('Using cached data due to network error');
```

### ❌ DON'T

```typescript
// Don't log sensitive data
log.debug('User credentials', { password }); // ❌ BAD

// Don't use console.log directly
console.log('Something happened'); // ❌ Use logger instead

// Don't log in tight loops (performance impact)
for (let i = 0; i < 10000; i++) {
  log.debug('Processing item', i); // ❌ BAD
}

// Don't log redundant info
log.info('Function called'); // ❌ Not helpful
log.info('User completed checkout', { orderId }); // ✅ Better
```

---

## Environment Detection

The logger automatically detects the environment:

```typescript
// Automatically set based on:
// - process.env.NODE_ENV (Next.js/React)
// - __DEV__ global (React Native/Expo)

const isDevelopment = 
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test' ||
  __DEV__;
```

**Development:** All logs visible  
**Production:** Only `info`, `warn`, `error` visible

---

## Future Enhancements

When needed, you can easily extend this logger:

```typescript
// Add remote logging (Sentry, LogRocket, etc.)
class Logger {
  error(message: string, ...args: any[]): void {
    console.error(`${this.config.prefix} [ERROR]`, message, ...args);
    
    // Send to error tracking service in production
    if (!this.config.enableDebug) {
      Sentry.captureException(args[0]);
    }
  }
}

// Add log filtering by module
logger.setLevel('TitleGenerator', 'warn'); // Only show warnings+

// Add log file persistence (React Native)
logger.enableFileLogging('/path/to/logs');
```

---

## Migration from console.log

**Before:**
```typescript
console.log('User clicked button');
console.error('Failed:', error);
```

**After:**
```typescript
const log = logger.scope('ComponentName');
log.debug('User clicked button');
log.error('Failed', error);
```

---

## Platform Compatibility

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Basic logging | ✅ | ✅ | ✅ |
| Scoped loggers | ✅ | ✅ | ✅ |
| Environment detection | ✅ | ✅ | ✅ |
| Console grouping | ✅ | ❌* | ❌* |

\* `console.group` not supported on mobile, logger handles gracefully

---

## Troubleshooting

**Q: I don't see my debug logs in development**  
**A:** Check that `process.env.NODE_ENV` is set to `'development'`

**Q: How do I test production logging locally?**  
**A:** Run `NODE_ENV=production npm run dev` or `NODE_ENV=production npm run build && npm start`

**Q: Can I disable all logging?**  
**A:** Modify `logger.ts` and set all `enable*` flags to `false`

**Q: Does this work with React Native Debugger?**  
**A:** Yes! Logs will appear in both RN Debugger and terminal.

---

## Summary

- ✅ Production-ready
- ✅ Cross-platform (web, iOS, Android)
- ✅ Automatic environment detection
- ✅ Zero runtime cost for debug logs in production
- ✅ Easy to extend (remote logging, file persistence)
- ✅ Industry-standard pattern

**Your app is now ready for production with professional logging! 🎉**

