# Debug Utility

Centralized debugging system for the application. Keeps logs available in production (alpha state) for troubleshooting.

## Usage

### Component-level debugging (recommended)

```typescript
import { createDebugger } from '@/utils/debug'

const debug = createDebugger('ComponentName')

// Regular logs (shown in production)
debug.log('Fetching data', { count: 10 })

// Warnings (always shown)
debug.warn('Invalid state detected', state)

// Errors (always shown)
debug.error('API call failed', error)

// Dev-only logs (only in development)
debug.dev('Expensive debug operation', data)

// Check if debugging is enabled
if (debug.isEnabled()) {
  // Expensive debug operations
}
```

### Direct usage

```typescript
import { debug } from '@/utils/debug'

debug.log('ComponentName', 'Message', data)
debug.warn('ComponentName', 'Warning', data)
debug.error('ComponentName', 'Error', error)
```

## Environment Variables

```env
# Disable all debug logs in production (not recommended in alpha)
VITE_DISABLE_DEBUG=true

# Enable component-specific debugging
VITE_DEBUG_ITEMLIST=true
VITE_DEBUG_IMGSHAPE=true
```

## Migration from `const debug = false`

**Before:**
```typescript
const debug = false
if (debug) console.log('ItemList', 'Message', data)
```

**After:**
```typescript
import { createDebugger } from '@/utils/debug'
const debug = createDebugger('ItemList')
debug.log('Message', data)
```

## Alpha State Philosophy

In alpha/beta state, debug logs remain enabled in production by default. This allows quick troubleshooting of issues in the live environment without requiring a rebuild.

For stable release, set `VITE_DISABLE_DEBUG=true` in production environment.
