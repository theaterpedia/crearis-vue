# Themes Data Migration

## Overview

Theme JSON files have been migrated from a source-only location to the persistent data directory to ensure they are available in production deployments.

## How It Works

### Architecture

**Previous Setup (Broken in Production):**
```
/opt/crearis/source/server/themes/     # Source only
├── index.json                         # NOT copied to production
└── theme-*.json                       # NOT copied to production
```

**New Setup (Production-Ready):**
```
/opt/crearis/data/themes/              # Persistent data directory
├── index.json                         # Survives deployments
└── theme-*.json                       # Survives deployments

# Accessed via symlink chain:
/opt/crearis/live/server/data → /opt/crearis/data
```

### API Endpoints

Both theme API endpoints have been updated to use the data directory:

**`server/api/themes/index.get.ts`**
```typescript
// Old: join(process.cwd(), 'server/themes')
// New: join(process.cwd(), 'server/data/themes')
const themesDir = join(process.cwd(), 'server/data/themes')
```

**`server/api/themes/[id].get.ts`**
```typescript
// Old: join(process.cwd(), 'server/themes')
// New: join(process.cwd(), 'server/data/themes')
const themesDir = join(process.cwd(), 'server/data/themes')
```

### Path Resolution

In production (`/opt/crearis/live`):
1. API requests `process.cwd() + '/server/data/themes'`
2. Resolves to `/opt/crearis/live/server/data/themes`
3. Symlink points to `/opt/crearis/data/themes`
4. Final path: `/opt/crearis/data/themes/` (persistent storage)

### Why This Pattern?

- **Nitro Build Limitation**: Nitro only copies `public/` assets during build, not server-side data files
- **Deployment Persistence**: Themes survive deployments and rebuilds
- **Consistency**: Matches existing data patterns (bulk imports, user data, etc.)
- **Single Source**: No duplication between source and live directories

## Development Box Setup

On a development machine **without PM2/live directory structure**, follow these steps:

### 1. Create Local Data Directory

```bash
mkdir -p ~/crearis-data/themes
```

### 2. Copy Themes to Data Directory

```bash
cp -r /path/to/crearis-vue/server/themes/* ~/crearis-data/themes/
```

### 3. Create Symlink

```bash
# From your project root
cd /path/to/crearis-vue
ln -s ~/crearis-data server/data
```

Verify the symlink:
```bash
ls -la server/data/themes/
# Should show: index.json, theme-*.json files
```

### 4. Development Workflow

Run the development server normally:
```bash
pnpm run dev
```

The API endpoints will automatically resolve:
- `process.cwd()` = `/path/to/crearis-vue`
- Path: `/path/to/crearis-vue/server/data/themes`
- Symlink: `server/data` → `~/crearis-data`
- Final: `~/crearis-data/themes/` ✓

### 5. Editing Themes

Edit themes in the **data directory**, not the source directory:

```bash
# Edit themes here:
nano ~/crearis-data/themes/theme-default.json

# NOT here (no longer used):
# nano /path/to/crearis-vue/server/themes/theme-*.json
```

Changes are immediately available (Vite HMR applies to API endpoints).

## Production Server (Already Configured)

The production server at `/opt/crearis` already has this setup:

```bash
# Data directory with themes
/opt/crearis/data/themes/

# Symlinks in place
/opt/crearis/source/server/data → /opt/crearis/data
/opt/crearis/live/server/data   → /opt/crearis/data

# API endpoints updated
✓ server/api/themes/index.get.ts
✓ server/api/themes/[id].get.ts

# Deployment script (future)
# Phase 2a will be updated to copy themes during initial setup
```

## Testing Theme API

Test that themes load correctly:

```bash
# Development
curl http://localhost:5173/api/themes

# Production
curl https://theaterpedia.org/api/themes
```

Expected response:
```json
{
  "themes": ["default", "dark", "light", ...]
}
```

## Troubleshooting

### "ENOENT: no such file or directory, open '.../server/themes/index.json'"

**Cause**: Symlink not created or themes not copied to data directory

**Fix**:
```bash
# Check symlink
ls -la server/data

# Should point to data directory
# If broken, recreate:
rm server/data
ln -s ~/crearis-data server/data  # Dev
ln -s /opt/crearis/data server/data  # Production

# Verify themes exist
ls -la server/data/themes/
```

### Themes Not Updating

**Cause**: Editing old source directory instead of data directory

**Fix**: Always edit themes in the data directory:
- Dev: `~/crearis-data/themes/`
- Production: `/opt/crearis/data/themes/`

### Production Changes Not Reflecting

**Cause**: Nitro memory cache (if using `pm2 restart`)

**Fix**: Use the rebuild script (uses `pm2 delete` + `pm2 start`):
```bash
sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh
```

## Related Documentation

- [CACHING_AND_DEPLOYMENT_FINDINGS.md](./CACHING_AND_DEPLOYMENT_FINDINGS.md) - PM2 restart behavior
- [PRODUCTION_MODES.md](./PRODUCTION_MODES.md) - Stable vs Fast-Changing modes
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Initial server setup

## Migration Date

- **Implemented**: November 17, 2025
- **Production**: Already deployed and tested
- **Status**: ✅ Working
