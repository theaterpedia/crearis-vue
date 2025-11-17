# Production Modes Documentation

## Overview

The deployment system supports two operational modes optimized for different stages of the product lifecycle:

1. **Stable Production** - Maximum performance, infrequent updates
2. **Fast-Changing Production** - Rapid iteration, near-HMR experience

---

## Mode Comparison

| Feature | Stable Production | Fast-Changing Production |
|---------|------------------|-------------------------|
| **Nginx Caching** | `expires 1y`, immutable | `expires -1`, no-cache |
| **PM2 Restart Strategy** | `pm2 restart` (fast) | `pm2 delete` + `pm2 start` (memory clear) |
| **Browser Behavior** | Heavy caching, needs hard refresh | No caching, immediate updates |
| **Server Load** | Low (cached assets) | Higher (no cache) |
| **Deployment Speed** | ~2 seconds (restart only) | ~3-4 seconds (full process restart) |
| **Content Visibility** | 5-60 seconds (cache TTL) | Immediate (no cache) |
| **Best For** | Production releases | Alpha/beta, active development |

---

## Mode 1: Stable Production

### When to Use
- ✅ Production release is live
- ✅ Code changes are infrequent (weekly/monthly)
- ✅ Performance and CDN optimization are priorities
- ✅ Users can tolerate hard refresh after updates

### Configuration Details

**Nginx Settings:**
```nginx
location /assets/ {
    alias /opt/crearis/live/.output/public/assets/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

**PM2 Restart:**
```bash
pm2 restart crearis-vue --update-env
```

**Rebuild Script Behavior:**
- Build: ~7 seconds (Vite + Nitro)
- Sync: rsync to live directory
- Restart: Standard PM2 reload (~1-2 seconds)
- **Total deployment time: ~10 seconds**

### Advantages
- ⚡ Maximum performance (assets served from browser cache)
- 📉 Minimal server load
- 🌍 CDN-friendly (long cache times)
- 🔄 Fast deployments (no process termination)
- 💰 Reduced bandwidth costs

### Disadvantages
- ⏱️ Users need hard refresh to see updates
- 🐛 Harder to verify changes immediately
- 📦 Cache invalidation across distributed users takes time

### Switch Command
```bash
sudo bash /opt/crearis/source/scripts/switch-to-stable-production.sh
```

---

## Mode 2: Fast-Changing Production

### When to Use
- ✅ Alpha/beta testing phase
- ✅ Making frequent code changes (multiple times per day)
- ✅ Need immediate visibility of changes
- ✅ Development speed > performance optimization
- ✅ Testing with real users who need latest version

### Configuration Details

**Nginx Settings:**
```nginx
location /assets/ {
    alias /opt/crearis/live/.output/public/assets/;
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    access_log off;
}
```

**PM2 Restart:**
```bash
pm2 delete crearis-vue
pm2 start ecosystem.config.cjs
```

**Rebuild Script Behavior:**
- Build: ~7 seconds (Vite + Nitro)
- Sync: rsync to live directory
- Restart: PM2 delete + start (~3-4 seconds, clears memory)
- **Total deployment time: ~12 seconds**

### Advantages
- 🚀 Near-HMR experience (changes visible immediately)
- ✅ No hard refresh needed for users
- 🐛 Easy bug verification and testing
- 🧹 Clears Nitro's in-memory HTML cache
- 👥 Perfect for alpha testers

### Disadvantages
- 📈 Higher server load (no caching)
- ⏱️ Slightly longer deployment (process restart)
- 💸 Higher bandwidth usage
- 🔄 Brief connection interruption during restart

### Switch Command
```bash
sudo bash /opt/crearis/source/scripts/switch-to-fast-changing.sh
```

---

## Technical Deep Dive

### Why Two Modes Are Necessary

**The Nitro Caching Problem:**

Nitro (the server framework) caches rendered HTML in Node.js memory. This includes the `index.html` file that references JavaScript bundles:

```html
<script src="/assets/index-C-GmATPE.js"></script>
```

**In Stable Production Mode:**
- Nitro's cached HTML might reference old bundle hashes
- `pm2 restart` reloads code but doesn't clear memory
- Users get old HTML pointing to old bundles
- **Solution:** Aggressive browser caching + content hashing means old bundles still work

**In Fast-Changing Production Mode:**
- Nitro's cached HTML is cleared on every deployment
- `pm2 delete` terminates the process completely
- New process starts with fresh memory
- **Result:** HTML always references the latest bundle hashes

### Content Hash Behavior

Vite automatically generates content-based hashes for all assets:

```
HomePage-BKVcdcNo.js  →  HomePage-aJ8Jr3um.js  (after code change)
index-CQ2-tl3V.js     →  index-C-GmATPE.js     (after code change)
```

**Stable Production:**
- Old hashes remain cached in browser
- HTML might reference old hash (from Nitro cache)
- Still works because old files exist on server
- Users need hard refresh to get new hash

**Fast-Changing Production:**
- HTML always has latest hash (memory cleared)
- Browser fetches new files (no cache)
- Changes visible immediately

---

## Deployment Workflow

### Current State Check
```bash
# Check Nginx caching status
sudo grep -A 3 "location /assets/" /etc/nginx/sites-available/crearis-vue

# Check PM2 restart method in rebuild script
grep -A 5 "Restart PM2" /opt/crearis/source/scripts/dev_rebuild_restart.sh
```

### Switching Modes

**To Stable Production:**
```bash
# 1. Switch mode
sudo bash /opt/crearis/source/scripts/switch-to-stable-production.sh

# 2. Deploy (uses new settings)
sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh

# 3. Verify
curl -I https://theaterpedia.org/assets/index-C-GmATPE.js | grep -i cache-control
# Should show: Cache-Control: public, immutable
```

**To Fast-Changing Production:**
```bash
# 1. Switch mode
sudo bash /opt/crearis/source/scripts/switch-to-fast-changing.sh

# 2. Deploy (uses new settings)
sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh

# 3. Verify
curl -I https://theaterpedia.org/assets/index-C-GmATPE.js | grep -i cache-control
# Should show: Cache-Control: no-store, no-cache, must-revalidate
```

---

## Recommended Lifecycle

### Phase 1: Initial Development (Local)
- Work on `localhost:3000`
- True HMR via Vite dev server
- No deployment needed

### Phase 2: Alpha Testing (Fast-Changing Mode)
```bash
sudo bash /opt/crearis/source/scripts/switch-to-fast-changing.sh
```
- Deploy multiple times per day
- Changes visible immediately to testers
- Easy bug verification

### Phase 3: Beta Testing (Fast-Changing Mode)
- Continue with fast-changing mode
- Gradually reduce deployment frequency
- Monitor server load

### Phase 4: Pre-Production (Transition)
```bash
sudo bash /opt/crearis/source/scripts/switch-to-stable-production.sh
```
- Switch to stable mode
- Test cache behavior
- Verify CDN integration
- Confirm users can hard refresh

### Phase 5: Production (Stable Mode)
- Keep stable mode active
- Deploy weekly/monthly
- Communicate updates to users (release notes)
- Monitor cache hit rates

### Phase 6: Hotfixes (Temporary Fast-Changing)
```bash
# Quick fix needed
sudo bash /opt/crearis/source/scripts/switch-to-fast-changing.sh
# Deploy hotfix
sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh
# Switch back after verification
sudo bash /opt/crearis/source/scripts/switch-to-stable-production.sh
```

---

## Monitoring & Verification

### Check Current Mode

**Nginx Caching:**
```bash
sudo grep -A 2 "expires" /etc/nginx/sites-available/crearis-vue | grep -A 1 "/assets/"
```

**PM2 Restart Strategy:**
```bash
grep "pm2 delete\|pm2 restart" /opt/crearis/source/scripts/dev_rebuild_restart.sh
```

### Test Cache Behavior

**From Client:**
```bash
# Stable mode should show long cache time
curl -I https://theaterpedia.org/assets/index-C-GmATPE.js

# Look for:
# expires: [date 1 year from now]
# cache-control: public, immutable
```

**From Server:**
```bash
# Check Nginx logs
tail -f /opt/crearis/logs/nginx-access.log

# Look for cache hits vs misses
```

### Performance Metrics

**Stable Production:**
- Avg response time: 5-20ms (cached)
- Server load: Low
- Bandwidth: Low after initial cache

**Fast-Changing Production:**
- Avg response time: 50-200ms (no cache)
- Server load: Medium-High
- Bandwidth: Full asset size per request

---

## Troubleshooting

### Problem: Changes not appearing after switching to stable mode

**Cause:** Browser has old cached assets

**Solution:**
```bash
# User must hard refresh (Ctrl+Shift+R)
# Or clear browser cache completely
```

### Problem: High server load in stable mode

**Cause:** Something preventing browser caching

**Check:**
```bash
# Verify Nginx is sending correct headers
curl -I https://theaterpedia.org/assets/index-C-GmATPE.js | grep -i cache

# Should see: Cache-Control: public, immutable
```

### Problem: Deployments failing in fast-changing mode

**Cause:** PM2 process won't delete (still serving requests)

**Solution:**
```bash
# Force kill and restart
sudo -u pruvious pm2 delete crearis-vue
sudo -u pruvious pm2 start /opt/crearis/live/ecosystem.config.cjs
```

### Problem: Nitro still serving old HTML in stable mode

**Cause:** Memory cache not cleared (expected in stable mode)

**Solution:**
```bash
# If critical, temporarily switch to fast-changing
sudo bash /opt/crearis/source/scripts/switch-to-fast-changing.sh
sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh
# Switch back
sudo bash /opt/crearis/source/scripts/switch-to-stable-production.sh
```

---

## Quick Reference

### Files Modified by Mode Scripts

1. `/etc/nginx/sites-available/crearis-vue` - Nginx caching headers
2. `/opt/crearis/source/scripts/dev_rebuild_restart.sh` - PM2 restart method

### Backup Files Created

- `/etc/nginx/sites-available/crearis-vue.stable-production`
- `/etc/nginx/sites-available/crearis-vue.fast-changing`

### Commands

| Action | Command |
|--------|---------|
| Switch to stable | `sudo bash /opt/crearis/source/scripts/switch-to-stable-production.sh` |
| Switch to fast-changing | `sudo bash /opt/crearis/source/scripts/switch-to-fast-changing.sh` |
| Deploy changes | `sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh` |
| Check mode | `sudo grep expires /etc/nginx/sites-available/crearis-vue \| grep assets` |

---

## Best Practices

1. **Always switch modes explicitly** - Don't manually edit configs
2. **Test after switching** - Verify headers with curl
3. **Document mode changes** - Add to deployment notes
4. **Monitor server load** - Watch for unexpected spikes
5. **Plan mode transitions** - Switch during low-traffic periods
6. **Keep backups** - Mode scripts create backups automatically
7. **Communicate with users** - Inform about cache behavior in each mode

---

## Summary

- **Stable Production** = Maximum performance, use for production releases
- **Fast-Changing Production** = Near-HMR experience, use for alpha/beta
- Switch between modes based on development phase
- Both modes use the same rebuild script (script adapts automatically)
- Mode switchers handle Nginx + PM2 configuration changes
- Always verify mode change with curl after switching
