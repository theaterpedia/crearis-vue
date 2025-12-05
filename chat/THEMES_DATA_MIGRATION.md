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

Both theme API endpoints have been updated with production-first fallback logic:

**`server/api/themes/index.get.ts`**
```typescript
// Production-first with dev fallback
const productionPath = join(process.cwd(), 'server/data/themes')
const devPath = join(process.cwd(), 'server/themes')

let themesDir = productionPath
try {
    await access(productionPath, constants.R_OK)
} catch {
    themesDir = devPath  // Fallback to git-tracked defaults
}
```

**`server/api/themes/[id].get.ts`**
```typescript
// Same fallback pattern
const productionPath = join(process.cwd(), 'server/data/themes')
const devPath = join(process.cwd(), 'server/themes')

let themesDir = productionPath
try {
    await access(productionPath, constants.R_OK)
} catch {
    themesDir = devPath
}
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
- **Production Flexibility**: Allows custom themes on production while maintaining defaults
- **Dev Simplicity**: No symlink required in development (falls back to git-tracked themes)
- **Safe Fallback**: Production always has repo defaults as backup

## Development Box Setup

### Option 1: No Setup Required (Recommended for Dev)

The API endpoints now use fallback logic, so development works out of the box:

```bash
# Just run the dev server
pnpm run dev

# API automatically uses server/themes/ (git-tracked)
# No symlink needed in development!
```

The API will:
1. Try `server/data/themes/` first (doesn't exist in dev)
2. Fallback to `server/themes/` (git-tracked defaults) ✓

### Option 2: Custom Themes in Development (Optional)

If you want to test custom themes locally:

**1. Create Local Data Directory:**
```bash
mkdir -p ~/crearis-data/themes
```

**2. Copy Themes to Data Directory:**
```bash
cp -r /path/to/crearis-vue/server/themes/* ~/crearis-data/themes/
```

**3. Create Symlink:**
```bash
cd /path/to/crearis-vue
ln -s ~/crearis-data server/data
```

**4. Verify Setup:**
```bash
ls -la server/data/themes/
# Should show: index.json, theme-*.json files
```

Now the API will use `server/data/themes/` (your custom themes) instead of the git-tracked defaults.

### Editing Themes in Development

**Default Setup (Option 1):**
```bash
# Edit git-tracked themes directly
nano server/themes/theme-0.json
# Changes immediately available via Vite HMR
```

**Custom Setup (Option 2):**
```bash
# Edit custom themes in data directory
nano ~/crearis-data/themes/theme-0.json
# Changes immediately available via Vite HMR
```

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

### "ENOENT: no such file or directory" in Development

**Cause**: Both `server/data/themes/` and `server/themes/` are missing or inaccessible

**Fix**:
```bash
# Check if git-tracked themes exist
ls -la server/themes/
# Should show: index.json, theme-*.json

# If missing, restore from git
git checkout server/themes/

# If using custom themes, check symlink
ls -la server/data
# Should point to data directory (if using Option 2)
```

### "ENOENT: no such file or directory" in Production

**Cause**: Production data directory missing themes

**Fix**:
```bash
# Check production themes exist
ls -la /opt/crearis/data/themes/

# If missing, copy from source
sudo -u pruvious cp -r /opt/crearis/source/server/themes/* /opt/crearis/data/themes/

# Verify symlink
ls -la /opt/crearis/live/server/data
# Should point to /opt/crearis/data
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

## Migration History

### Phase 1: Data Directory Migration (November 17, 2025)
- Moved theme files from source-only to persistent data directory
- Added production path: `server/data/themes/`
- Status: ✅ Working

### Phase 2: Fallback Logic (November 18, 2025)
- Added production-first, dev-fallback path resolution
- Eliminated symlink requirement for development
- Production: `server/data/themes/` (customizable)
- Dev fallback: `server/themes/` (git-tracked defaults)
- Status: ✅ Working
