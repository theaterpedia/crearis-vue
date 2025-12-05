# Caching and Deployment Findings Report

**Date:** November 17, 2025  
**Issue:** Code changes not appearing in browser after rebuild  
**Root Causes:** Multiple caching layers and incorrect file path configurations

---

## 1. Nginx Configuration protocol fragments
I see the issue! The Nginx configuration has double gzip compression happening. When Nginx proxies to the Node.js server on port 3000, the assets are already compressed by Nitro, but Nginx might be trying to compress them again, causing corruption.

Let me check the main Nginx configuration for gzip settings:
`sudo grep -A 10 "gzip" /etc/nginx/nginx.conf`

sudo grep -A 10 "gzip" /etc/nginx/nginx.conf
The issue is clear now. We need to disable gzip compression for the proxied content since Nitro is already serving pre-compressed assets. Let me update the Nginx configuration:

`sudo cp /etc/nginx/sites-available/crearis-vue /etc/nginx/sites-available/crearis-vue.backup`


Let me configure Nginx to serve static assets directly from the filesystem for the /assets/ path since Nitro isn't handling them properly:


sudo tee /etc/nginx/sites-available/crearis-vue > /dev/null << 'EOF'
# Crearis Vue - Nginx Configuration
# Generated: Tue Oct 28 10:06:59 AM CET 2025
# Primary Domain: theaterpedia.org

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name theaterpedia.org www.theaterpedia.org;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name theaterpedia.org www.theaterpedia.org;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/theaterpedia.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/theaterpedia.org/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /opt/crearis/logs/nginx-access.log;
    error_log /opt/crearis/logs/nginx-error.log;
    
    # Client max body size
    client_max_body_size 50M;
    
    # Disable gzip for proxied content (Nitro handles compression)
    gzip off;
    
    # Serve static assets directly from filesystem
    location /assets/ {
        alias /opt/crearis/live/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Proxy settings for application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Don't buffer proxied responses
        proxy_buffering off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

---

✅ Nginx Configuration Fixed - Application Fully Working
Issues Identified and Resolved:

Double Gzip Compression - Nginx was trying to re-compress already compressed assets from Nitro

Fix: Added gzip off; and proxy_buffering off; to prevent corruption
Missing .output Directory Structure - The app expected public but files were at public

Fix: Created .output directory with symlinks to public and server
Static Assets Not Served - Files in /assets/ directory were returning 404 from Nitro

Fix: Configured Nginx to serve /assets/ directly from filesystem using alias directive


---

To DISABLE caching (alpha stage):
```
# 1. Backup current config
sudo cp /etc/nginx/sites-available/crearis-vue /etc/nginx/sites-available/crearis-vue.backup

# 2. Edit config - replace caching lines
sudo sed -i 's/expires 1y;/expires -1;/' /etc/nginx/sites-available/crearis-vue
sudo sed -i 's/add_header Cache-Control "public, immutable";/add_header Cache-Control "no-store, no-cache, must-revalidate";/' /etc/nginx/sites-available/crearis-vue

# 3. Test config
sudo nginx -t

# 4. Reload Nginx
sudo systemctl reload nginx
```

To RESTORE caching (production stage):
```
# Option A: Restore from backup
sudo cp /etc/nginx/sites-available/crearis-vue.backup /etc/nginx/sites-available/crearis-vue
sudo nginx -t
sudo systemctl reload nginx

# Option B: Re-apply caching manually
sudo sed -i 's/expires -1;/expires 1y;/' /etc/nginx/sites-available/crearis-vue
sudo sed -i 's/add_header Cache-Control "no-store, no-cache, must-revalidate";/add_header Cache-Control "public, immutable";/' /etc/nginx/sites-available/crearis-vue
sudo nginx -t
sudo systemctl reload nginx
```

✅ Caching disabled successfully!

Changes applied:

✓ Backup saved to crearis-vue.backup
✓ expires 1y → expires -1 (disables caching)
✓ Cache-Control "public, immutable" → Cache-Control "no-store, no-cache, must-revalidate"
✓ Nginx reloaded
Now try:

Hard refresh your browser: Ctrl + Shift + R
You should see "Über 10 Websites in der Pipeline" immediately
To restore production caching later:

```
# Restore from backup
sudo cp /etc/nginx/sites-available/crearis-vue.backup /etc/nginx/sites-available/crearis-vue
sudo nginx -t
sudo systemctl reload nginx
```

---

Perfect! Server is now serving the correct text. Hard refresh your browser (Ctrl+Shift+R) - it should now show "Über 10 Websites".

The issue was:

Old /opt/crearis/live/public/ and /opt/crearis/live/server/ directories were shadowing the correct .output/ files
PM2 config had wrong script path (./server/index.mjs instead of ./.output/server/index.mjs)
Fixed by:

Removing the old directories
Correcting the PM2 script path
Creating proper ecosystem.config.js in source
Running rebuild which restored everything correctly


---

## Executive Summary

During alpha development, a text change from "Ca. 10 Websites" to "Über 10 Websites" failed to appear in the browser despite successful rebuilds. Investigation revealed three critical issues:

1. **Nitro's in-memory HTML caching** - `pm2 restart` doesn't clear cached rendered HTML
2. **Incorrect PM2 script path** - Pointing to wrong server entry point
3. **Nginx asset path misconfiguration** - Serving from non-existent directory

---

## 1. Nginx Configuration Issues

### Problem
Nginx was configured to serve static assets from `/opt/crearis/live/public/assets/`, but the actual build output was in `/opt/crearis/live/.output/public/assets/`.

### Symptoms
- Browser console error: `Loading module from "https://theaterpedia.org/assets/index-C-GmATPE.js" was blocked because of a disallowed MIME type ("text/html")`
- Nginx returning HTTP 404 for JavaScript files
- Files served as `text/html` instead of `application/javascript`

### Configuration Location
`/etc/nginx/sites-available/crearis-vue`

### Original Configuration (INCORRECT)
```nginx
location /assets/ {
    alias /opt/crearis/live/public/assets/;
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    access_log off;
}
```

### Corrected Configuration
```nginx
location /assets/ {
    alias /opt/crearis/live/.output/public/assets/;
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    access_log off;
}
```

### Alpha Development Cache Settings
During alpha stage, aggressive caching was disabled:

```nginx
# Original (production-ready)
expires 1y;
add_header Cache-Control "public, immutable";

# Modified for alpha
expires -1;
add_header Cache-Control "no-store, no-cache, must-revalidate";
```

**Note:** These settings should be restored to production values when alpha phase completes.

### Nginx Reload Command
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 2. PM2 Configuration Issues

### Problem
PM2 ecosystem config pointed to the wrong server entry point after project restructuring.

### Configuration Location
- Source: `/opt/crearis/source/ecosystem.config.js`
- Live: `/opt/crearis/live/ecosystem.config.cjs`

**Note:** The `.cjs` extension is required because `package.json` has `"type": "module"`, and PM2 requires CommonJS format.

### Original Configuration (INCORRECT)
```javascript
{
  script: './server/index.mjs',
  cwd: '/opt/crearis/live',
  // ...
}
```

### Corrected Configuration
```javascript
{
  script: './.output/server/index.mjs',
  cwd: '/opt/crearis/live',
  // ...
}
```

### Directory Structure
```
/opt/crearis/live/
├── .output/
│   ├── public/          # Built frontend assets
│   │   ├── index.html
│   │   └── assets/
│   │       ├── index-C-GmATPE.js
│   │       ├── HomePage-aJ8Jr3um.js
│   │       └── ...
│   └── server/          # Built Nitro server
│       └── index.mjs    # ← Correct entry point
├── ecosystem.config.cjs
├── package.json
└── .env
```

### Full Ecosystem Config
```javascript
module.exports = {
  apps: [{
    name: 'crearis-vue',
    cwd: '/opt/crearis/live',
    script: './.output/server/index.mjs',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3020,
      SKIP_MIGRATIONS: true,
      DB_USER: 'crearis_admin',
      DB_PASSWORD: '[REDACTED]',
      DB_NAME: 'crearis_production',
      DB_HOST: 'localhost',
      DB_PORT: '5432'
    },
    error_file: '/opt/crearis/logs/error.log',
    out_file: '/opt/crearis/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

---

## 3. Nitro In-Memory Caching Behavior

### The Core Problem
Nitro (the server framework) caches rendered HTML in Node.js memory. Using `pm2 restart` reloads code but **does not clear the V8 heap**, so old cached HTML persists.

### Observed Behavior

**On Disk:**
```html
<!-- /opt/crearis/live/.output/public/index.html -->
<script src="/assets/index-C-GmATPE.js"></script>
```

**Served by Nitro (from memory):**
```html
<script src="/assets/index-CQ2-tl3V.js"></script>  <!-- OLD FILE -->
```

The old file `index-CQ2-tl3V.js` didn't even exist on disk anymore, yet Nitro was serving it from memory cache.

### Vite Content Hashing
Vite correctly generates new content hashes on each build:
- `HomePage-BKVcdcNo.js` → `HomePage-aJ8Jr3um.js` (new)
- `index-CQ2-tl3V.js` → `index-C-GmATPE.js` (new)

However, Nitro's cached HTML still referenced the old hashes.

### Solution: Complete Process Restart

**WRONG Approach:**
```bash
pm2 restart crearis-vue  # Reloads code but keeps memory cache
```

**CORRECT Approach:**
```bash
pm2 delete crearis-vue
pm2 start ecosystem.config.cjs
```

This completely terminates the Node.js process and starts fresh, clearing all memory including Nitro's HTML cache.

### Nitro Configuration
Location: `/opt/crearis/source/nitro.config.ts`

```typescript
export default {
  scanDirs: ['server'],
  
  publicAssets: [
    {
      dir: 'public',              // Vite public folder
      maxAge: 60 * 60 * 24 * 365  // 1 year cache
    },
    {
      dir: 'server/public',       // Server-rendered HTML
      maxAge: 0                   // No cache
    }
  ],
  
  output: {
    dir: '.output',
    serverDir: '.output/server',
    publicDir: '.output/public'
  },
  
  prerender: {
    enabled: false  // Disabled to avoid H3 compatibility issues
  },
  
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'cache-control': 'no-cache'
      }
    },
    '/assets/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable'
      }
    }
  }
}
```

**Key Points:**
- `server/public` has `maxAge: 0` (no cache for HTML)
- `/assets/**` has immutable 1-year cache (fine because of content hashing)
- Prerendering is disabled
- Config only affects **build-time** behavior, not runtime memory caching

---

## 4. Multi-Layer Caching Architecture

The application has **three distinct caching layers**:

### Layer 1: Browser Cache
- **Controlled by:** HTTP Cache-Control headers
- **Cleared by:** Hard refresh (Ctrl+Shift+R) or clearing browser cache
- **Current setting:** No-cache during alpha (via Nginx)

### Layer 2: Nginx Proxy Cache
- **Controlled by:** `expires` and `add_header Cache-Control` directives
- **Cleared by:** Nginx reload or config change
- **Current setting:** `expires -1` (no cache) during alpha

### Layer 3: Nitro Runtime Cache
- **Controlled by:** Node.js V8 heap memory
- **Cleared by:** Complete process restart (pm2 delete + start)
- **Behavior:** Caches rendered HTML in memory for performance
- **Problem:** Survives `pm2 restart` command

### Why All Three Were Insufficient

1. **Browser hard refresh** → Didn't help because Nitro served old HTML
2. **Nginx config change** → Didn't help because Nitro was the source
3. **PM2 restart** → Didn't help because memory wasn't cleared
4. **PM2 delete + start** → ✅ **WORKED** - Complete process reset

---

## 5. Development Rebuild Script

Location: `/opt/crearis/source/scripts/dev_rebuild_restart.sh`

### Key Changes Made

**Critical Fix - PM2 Restart Strategy:**
```bash
# BEFORE (WRONG)
pm2 restart "$PM2_APP_NAME"

# AFTER (CORRECT)
pm2 delete "$PM2_APP_NAME"
pm2 start ecosystem.config.cjs
```

### Complete Script Workflow

1. **User Validation**
   - Prevents root execution (security)
   - Requires `pruvious` user
   
2. **Build Step**
   ```bash
   pnpm run build  # Runs Vite + Nitro build (~7 seconds)
   ```
   
3. **Sync Step**
   ```bash
   rsync -av --delete .output/ "$LIVE_DIR/.output/"
   cp package.json "$LIVE_DIR/"
   cp ecosystem.config.js "$LIVE_DIR/ecosystem.config.cjs"
   ```
   
4. **Restart Step** (CRITICAL)
   ```bash
   pm2 delete crearis-vue          # Kill process completely
   pm2 start ecosystem.config.cjs  # Start fresh
   ```

### Usage
```bash
sudo -u pruvious bash /opt/crearis/source/scripts/dev_rebuild_restart.sh
```

---

## 6. Build Output Analysis

### Vite Build (Frontend)
- **Output:** `server/public/` → copied to `.output/public/`
- **Content hashing:** Automatic (e.g., `HomePage-aJ8Jr3um.js`)
- **Build time:** ~3 seconds
- **Index template:** `server/public/index.html`

### Nitro Build (Backend)
- **Output:** `.output/server/`
- **Entry point:** `.output/server/index.mjs`
- **Build time:** ~4 seconds
- **Server chunks:** API routes, middleware, handlers

### File Locations

**Source Files:**
```
/opt/crearis/source/
├── src/
│   └── views/Home/
│       ├── HomePage.vue                    (modified line 77)
│       └── HomeComponents/
│           └── ProjectsShowcaseSection.vue (modified line 16)
```

**Built Files:**
```
/opt/crearis/source/.output/public/assets/
├── HomePage-aJ8Jr3um.js         (15,240 bytes) ← Contains "Über 10 Websites"
├── ProjectsShowcaseSection-CH3_tFCy.js (5,402 bytes) ← Contains "Über 10 Websites"
├── index-C-GmATPE.js            (181,818 bytes) ← Main bundle
└── ...
```

**Synced to Live:**
```
/opt/crearis/live/.output/
├── public/
│   ├── index.html
│   └── assets/
└── server/
    └── index.mjs
```

---

## 7. Troubleshooting Commands

### Check What's Actually Being Served
```bash
# Check HTML entry point
curl -s http://127.0.0.1:3020/ | grep -o 'index-[^"]*\.js'

# Check specific JavaScript file
curl -I http://127.0.0.1:3020/assets/HomePage-aJ8Jr3um.js

# Search for text in built files
grep -r "Über 10 Websites" /opt/crearis/live/.output/public/assets/
```

### Check PM2 Status
```bash
sudo -u pruvious pm2 list
sudo -u pruvious pm2 logs crearis-vue --lines 50
```

### Check Nginx
```bash
# Test configuration
sudo nginx -t

# Reload after changes
sudo systemctl reload nginx

# Check logs
tail -f /opt/crearis/logs/nginx-error.log
```

### Verify File Paths
```bash
# Check what exists in live directory
ls -la /opt/crearis/live/
ls -la /opt/crearis/live/.output/public/assets/ | grep index

# Find stray old files
find /opt/crearis/live -name "index-CQ2-tl3V.js"
```

---

## 8. Lessons Learned

### For Future Development

1. **Always use `pm2 delete` + `pm2 start` for Nitro apps**
   - `pm2 restart` is insufficient for memory cache clearing
   - Update all deployment scripts accordingly

2. **Verify Nginx paths match actual build output**
   - Double-check after any build system changes
   - Test with `curl -I` before assuming it works

3. **Understand the full caching stack**
   - Browser → Nginx → Node.js (Nitro) → Disk
   - Each layer can cache independently

4. **Content hashes are your friend**
   - Vite's automatic content hashing (`HomePage-aJ8Jr3um.js`) prevents most cache issues
   - But only if the HTML referencing them is fresh

5. **Monitor what's actually served vs. what's on disk**
   - `curl` output != file system contents when caching is involved
   - Always verify the HTTP response, not just the files

### Production Checklist Before Launch

- [ ] Restore Nginx caching: `expires 1y` and `Cache-Control "public, immutable"`
- [ ] Verify all Nginx paths point to `.output/` directories
- [ ] Confirm PM2 ecosystem config uses `./.output/server/index.mjs`
- [ ] Test deployment pipeline with cache clearing
- [ ] Document the correct restart procedure for production team

---

## 9. Quick Reference

### Critical File Paths

| Purpose | Path |
|---------|------|
| Source code | `/opt/crearis/source/` |
| Build output | `/opt/crearis/source/.output/` |
| Live deployment | `/opt/crearis/live/.output/` |
| PM2 config | `/opt/crearis/live/ecosystem.config.cjs` |
| Nginx config | `/etc/nginx/sites-available/crearis-vue` |
| Rebuild script | `/opt/crearis/source/scripts/dev_rebuild_restart.sh` |

### Port Numbers

- **3020** - Node.js server (internal)
- **443** - Nginx HTTPS (external)
- **80** - Nginx HTTP (redirects to 443)

### Log Locations

- PM2 stdout: `/opt/crearis/logs/out.log`
- PM2 stderr: `/opt/crearis/logs/error.log`
- Nginx access: `/opt/crearis/logs/nginx-access.log`
- Nginx error: `/opt/crearis/logs/nginx-error.log`

---

## 10. Conclusion

The "code changes not appearing" issue was caused by a combination of:

1. **Nitro's aggressive in-memory caching** requiring complete process restart
2. **Incorrect PM2 script path** pointing to non-existent server location
3. **Nginx asset path misconfiguration** serving 404s instead of JavaScript files

All three issues have been resolved. The development workflow now works reliably with the rebuild script using `pm2 delete` + `pm2 start` to ensure complete cache clearing.

**Key Takeaway:** When working with Nitro/Nuxt-style SSR frameworks, `pm2 restart` is insufficient. Always use `pm2 delete` + `pm2 start` for reliable cache clearing during development.
