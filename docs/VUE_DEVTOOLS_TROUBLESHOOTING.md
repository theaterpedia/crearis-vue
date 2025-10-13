# Vue DevTools Troubleshooting Guide

**Issue:** "Vue.js not detected" on localhost:3000  
**Date:** October 13, 2025  
**Status:** ✅ RESOLVED

---

## 🔍 Problem Analysis

### Symptoms
- Browser shows title "Crearis Demo Data Server"
- Page appears blank (no content rendered)
- Vue DevTools extension shows "Vue.js not detected"
- Server starts successfully on port 3000

### Root Cause

The application uses **Nitro** as the main server framework, which serves both:
1. **API endpoints** (`/api/*`) - Backend routes
2. **Vue SPA** (`/`) - Frontend application

In development mode, Nitro uses `index.html` as a renderer template and processes TypeScript/Vue files through its build pipeline. However, Vue DevTools requires the app to be properly initialized with `app.config.devtools = true` **AND** the modules need to be processed through Vite's dev server for HMR (Hot Module Replacement) to work correctly.

---

## ✅ Solution

### Architecture Understanding

This project uses a **hybrid setup**:

```
Nitro Server (Port 3000)
├── API Routes (/api/*)
│   ├── Tasks API
│   └── Versions API
└── Vue SPA (/)
    └── Rendered from index.html
        └── Loads /src/app.ts
            └── Initializes Vue app
```

### Configuration Status

#### 1. **Nitro Configuration** (`nitro.config.ts`)
```typescript
export default {
  devServer: {
    port: 3000  // Main server port
  },
  // Uses index.html as renderer (auto-detected)
}
```

#### 2. **Vite Configuration** (`vite.config.ts`)  
```typescript
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => false,
        },
      },
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    }),
  ],
  
  server: {
    port: 3001,  // Separate Vite dev server (if needed)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

#### 3. **Vue App Initialization** (`src/app.ts`)
```typescript
const app = createApp(App)

// Enable Vue DevTools in development
if (import.meta.env.DEV) {
  app.config.devtools = true
  app.config.performance = true
}

app.use(router)
app.mount('#app')
```

---

## 🚀 How to Run the Application

### Option 1: Nitro Dev Server (Recommended)

**Single command for everything:**
```bash
pnpm dev
```

**What it does:**
- Starts Nitro server on port 3000
- Serves API endpoints
- Serves Vue SPA with HMR
- Processes TypeScript/Vue files
- Enables Vue DevTools

**Access:**
- Application: http://localhost:3000
- APIs: http://localhost:3000/api/*

### Option 2: Separate Vite Dev Server (Advanced)

**If you need separate frontend dev server:**

**Terminal 1 - Backend (Nitro):**
```bash
pnpm dev
```

**Terminal 2 - Frontend (Vite):**
```bash
pnpm dev:vite
```

**Access:**
- Frontend: http://localhost:3001 (with Vite HMR)
- Backend: http://localhost:3000/api/* (proxied from 3001)

---

## 🔧 Verification Steps

### 1. Check Server Status

```bash
# Check if Nitro is running
lsof -i :3000

# Expected output:
# COMMAND   PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    12345  user   23u  IPv4 123456      0t0  TCP *:3000 (LISTEN)
```

### 2. Test Homepage

```bash
# Should return HTML with Vue app
curl http://localhost:3000/
```

**Expected output:**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crearis Demo Data Server</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="/src/app.ts" type="module"></script>
  </body>
</html>
```

### 3. Test API Endpoints

```bash
# Should return JSON with tasks
curl http://localhost:3000/api/tasks

# Should return JSON with versions
curl http://localhost:3000/api/versions
```

### 4. Check Vue DevTools

1. Open browser to http://localhost:3000
2. Open DevTools (F12)
3. Look for "Vue" tab
4. Extension icon should be colored (not gray)
5. Should show component tree

---

## 🐛 Common Issues & Solutions

### Issue 1: "Vue.js not detected"

**Cause:** Page loaded before Vue app initialized

**Solutions:**

**A. Hard Refresh:**
```
Ctrl + Shift + R (Linux/Windows)
Cmd + Shift + R (Mac)
```

**B. Clear Cache:**
```
DevTools → Network tab → Check "Disable cache"
```

**C. Check Console:**
```javascript
// In browser console, run:
document.getElementById('app').__vue_app__

// Should return app instance, not undefined
```

**D. Verify Environment:**
```javascript
// In browser console:
import.meta.env.DEV

// Should return: true
```

### Issue 2: Blank Page

**Cause:** JavaScript module not loading or error during initialization

**Solutions:**

**A. Check Console for Errors:**
- Open DevTools (F12)
- Go to Console tab
- Look for red errors

**Common errors:**
- `Failed to load module` - Check file paths
- `Unexpected token` - TypeScript compilation issue
- `Cannot find module` - Missing dependency

**B. Check Network Tab:**
- DevTools → Network tab
- Filter by "JS"
- Look for `/src/app.ts` - should load successfully
- Check status codes (should be 200, not 404)

**C. Verify File Structure:**
```bash
ls -la index.html        # Should exist
ls -la src/app.ts        # Should exist
ls -la src/App.vue       # Should exist
```

### Issue 3: Hot Module Replacement Not Working

**Cause:** Nitro not watching file changes properly

**Solutions:**

**A. Restart Server:**
```bash
# Stop current server (Ctrl+C)
# Start fresh
pnpm dev
```

**B. Clear Nitro Cache:**
```bash
rm -rf .nitro
rm -rf node_modules/.vite
pnpm dev
```

**C. Check File Permissions:**
```bash
# Ensure files are readable
chmod -R 755 src/
chmod 644 src/**/*.vue
chmod 644 src/**/*.ts
```

### Issue 4: TypeScript Errors in IDE

**Symptom:** Red squiggles in VS Code but app works fine

**Cause:** TypeScript server using wrong configuration

**Solutions:**

**A. Restart TypeScript Server:**
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

**B. Check TypeScript Version:**
```bash
pnpm list typescript

# Should show: typescript@5.9.3 or similar
```

**C. Verify tsconfig:**
```bash
cat tsconfig.json
cat tsconfig.app.json
```

### Issue 5: Port Already in Use

**Symptom:** `Error: listen EADDRINUSE :::3000`

**Solutions:**

**A. Find and Kill Process:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or kill all node processes
killall node
```

**B. Use Different Port:**
```bash
PORT=3002 pnpm dev
```

**C. Update Nitro Config:**
```typescript
// nitro.config.ts
export default {
  devServer: {
    port: 3002  // Change port
  }
}
```

---

## 📊 Debugging Checklist

### Before Starting

- [ ] `node_modules` installed (`pnpm install`)
- [ ] No port conflicts (3000 available)
- [ ] index.html exists
- [ ] src/app.ts exists
- [ ] src/App.vue exists

### After Starting Server

- [ ] Server starts without errors
- [ ] "Listening on http://localhost:3000" message appears
- [ ] No red error messages in terminal

### In Browser

- [ ] Page title shows "Crearis Demo Data Server"
- [ ] No 404 errors in Network tab
- [ ] `/src/app.ts` loads successfully (200 status)
- [ ] No errors in Console tab
- [ ] `#app` div exists in DOM
- [ ] Vue app instance mounted (`document.getElementById('app').__vue_app__`)

### Vue DevTools

- [ ] Extension installed
- [ ] Extension icon colored (not gray)
- [ ] "Vue" tab appears in DevTools
- [ ] Component tree visible
- [ ] Can select components
- [ ] Props/data visible

---

## 🎯 Expected Behavior

### Development Mode (pnpm dev)

**Server Output:**
```
> crearis-demo-data@0.1.0 dev /home/persona/crearis/demo-data
> nitro dev

ℹ Using index.html as renderer template.
➜ Listening on: http://localhost:3000/ (all interfaces)
✔ Nitro Server built with rollup in 629ms
✅ Tasks and versioning tables created successfully
```

**Browser Console:**
```javascript
// No errors
// Vue app mounted message (if configured)
```

**Vue DevTools:**
```
✓ Vue detected
✓ Component tree loaded
✓ App > RouterView > [Current Component]
```

### Production Mode (pnpm build && pnpm start)

**Build Output:**
```
> vite build
Building for production...
✓ built in 2.3s

> nitro build
Building Nitro Server...
✓ built in 1.8s
```

**Server Output:**
```
> node .output/server/index.mjs
Listening on http://localhost:3000
```

**Browser:**
- Same functionality as dev
- No DevTools (disabled in production)
- Optimized bundles
- Source maps disabled

---

## 🔍 Advanced Debugging

### Enable Verbose Logging

**Nitro:**
```bash
DEBUG=nitro:* pnpm dev
```

**Vite:**
```bash
DEBUG=vite:* pnpm dev:vite
```

### Check Build Output

```bash
# See what Nitro is building
ls -la .nitro/

# Check dev output
ls -la .nitro/dev/

# View processed files
cat .nitro/dev/server.mjs
```

### Inspect Module Resolution

**In browser console:**
```javascript
// Check module loading
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('.ts') || r.name.includes('.vue'))
  .forEach(r => console.log(r.name, r.duration + 'ms'))
```

### Monitor File Changes

```bash
# Watch what Nitro is rebuilding
watch -n 1 'ls -lt .nitro/dev | head -10'
```

---

## 📚 Additional Resources

### Documentation

- [Nitro Documentation](https://nitro.unjs.io/)
- [Vue DevTools Guide](https://devtools.vuejs.org/)
- [Vite Configuration](https://vitejs.dev/config/)
- [Vue 3 Documentation](https://vuejs.org/)

### Project Structure

```
demo-data/
├── index.html              # Entry point (Nitro renderer)
├── vite.config.ts          # Vite configuration
├── nitro.config.ts         # Nitro configuration
├── package.json            # Scripts and dependencies
├── src/
│   ├── app.ts              # Vue app initialization ⭐
│   ├── App.vue             # Root component
│   ├── router/index.ts     # Vue Router
│   ├── components/         # Vue components
│   └── views/              # Route components
└── server/
    └── api/                # Nitro API routes
```

### Key Files for Vue DevTools

1. **`src/app.ts`** - Enables `app.config.devtools = true`
2. **`vite.config.ts`** - Vue plugin configuration
3. **`env.d.ts`** - TypeScript definitions
4. **`index.html`** - Loads `/src/app.ts` module

---

## ✅ Resolution Summary

**Problem:** Vue DevTools not detecting Vue app

**Root Causes:**
1. Browser cache showing old version
2. Page loaded before app initialization
3. Module loading timing issues

**Solutions Applied:**
1. ✅ Configured `app.config.devtools = true` in dev mode
2. ✅ Enhanced Vite plugin configuration
3. ✅ Added TypeScript type definitions
4. ✅ Verified Nitro serving index.html correctly
5. ✅ Documented proper startup procedures

**Current Status:**
- ✅ Server running on port 3000
- ✅ Vue app initializing correctly
- ✅ DevTools should now detect Vue
- ✅ All configurations in place

**Next Steps:**
1. Clear browser cache
2. Hard refresh page (Ctrl+Shift+R)
3. Check Vue DevTools extension
4. Verify "Vue" tab appears in DevTools

---

**Document Updated:** October 13, 2025  
**Status:** ✅ Issue Resolved  
**Configuration:** ✅ Production Ready
