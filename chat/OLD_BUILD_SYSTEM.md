# Old Build System Documentation (FAILED APPROACH)

**Date**: October 27, 2025  
**Status**: ❌ FAILED - This build approach does NOT work  
**Issue**: Browser tries to load TypeScript source files instead of built bundles

---

## Build Architecture

### Dual Build System (Vite + Nitro)

The old system attempted to use **two separate build tools** to create a full-stack application:

1. **Vite** - Frontend SPA bundler
2. **Nitro 3.0** - Backend server framework

### Build Configuration

#### package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm:dev:backend\" \"pnpm:dev:frontend\" --names \"backend,frontend\" --prefix-colors \"blue,green\"",
    "dev:frontend": "vite",
    "dev:backend": "nitro dev",
    "build": "nitro build && vite build",
    "build:vite": "vite build",
    "build:nitro": "nitro build",
    "start": "node .output/server/index.mjs",
    "preview": "nitro preview",
    "prepare": "nitro prepare"
  }
}
```

#### Vite Configuration (vite.config.ts)

```typescript
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

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

  // Build configuration for SPA
  build: {
    outDir: '.output/public',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: './index.html'
    }
  },

  // Development server
  server: {
    port: 3001,
    proxy: {
      // Proxy API calls to Nitro server during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },

  // Path resolution
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

**Key Points:**
- Vite builds Vue SPA to `.output/public/`
- Output includes `index.html` and bundled JS/CSS in `assets/` folder
- Dev server runs on port 3001
- Proxies `/api` requests to Nitro backend (port 3000)

#### Nitro Configuration (nitro.config.ts)

```typescript
export default {
  // Development server settings
  devServer: {
    port: 3000
  },

  // Enable Vite for development (processes Vue/TS files)
  experimental: {
    viteNode: true
  },

  // API routes directory
  apiDir: 'server/api',

  // Server handlers directory 
  handlersDir: 'server',

  // Build settings for production
  output: {
    dir: '.output',
    serverDir: '.output/server'
  },

  // Disable public asset generation (Vite handles frontend build)
  publicAssets: [],

  // Disable prerendering to avoid H3 compatibility issues
  prerender: {
    enabled: false
  },

  // Routes configuration
  routeRules: {
    // API routes with CORS headers
    '/api/**': {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  },

  // TypeScript support
  typescript: {
    generateTsConfig: false
  }
}
```

**Key Points:**
- Nitro builds API server to `.output/server/`
- `publicAssets: []` prevents Nitro from managing public files
- `experimental.viteNode: true` allows processing Vue/TS files in dev
- API routes are in `server/api/`
- No SSR configured (should serve static files from `.output/public/`)

### Build Order

The build sequence was:

```bash
pnpm build
# Executes: nitro build && vite build
```

1. **Nitro builds first** → Creates `.output/server/` and empty `.output/public/`
2. **Vite builds second** → Fills `.output/public/` with SPA assets

### Output Structure

After successful build:

```
.output/
├── nitro.json          # Nitro build manifest
├── public/             # Frontend assets (built by Vite)
│   ├── index.html      # SPA entry point
│   └── assets/         # Bundled JS/CSS/fonts
│       ├── index-CRmqajtA.js
│       ├── index-dy16x940.css
│       └── [various font files]
└── server/             # Backend server (built by Nitro)
    ├── index.mjs       # Server entry point
    ├── package.json
    └── chunks/         # Server code chunks
        ├── nitro/
        └── routes/     # API routes
```

### The index.html

The built `index.html` looks correct:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Crearis Demo Data Server</title>
    <script type="module" crossorigin src="/assets/index-CRmqajtA.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-dy16x940.css">
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

---

## Why It Failed

### The Problem

When starting the production server with:

```bash
node .output/server/index.mjs
```

And accessing `http://localhost:3000/`, the browser receives the `index.html` correctly, but then tries to load:

```
http://localhost:3000/src/app.ts
```

**Error in browser console:**

```
Loading module from "http://localhost:3000/src/app.ts" was blocked 
because of a disallowed MIME type ("text/html").
```

### Root Cause Analysis

1. **Missing Static File Serving**: Nitro is NOT configured to serve static files from `.output/public/`
2. **No Catch-All Route**: No route handler to serve `index.html` for SPA routes
3. **Wrong Module References**: Browser is somehow trying to load source TS files instead of built bundles

### What Should Happen

1. User requests `http://localhost:3000/`
2. Server serves `.output/public/index.html`
3. Browser loads `/assets/index-CRmqajtA.js` (bundled JS)
4. Vue app boots up and handles client-side routing
5. API calls go to `/api/*` endpoints handled by Nitro

### What Actually Happens

1. User requests `http://localhost:3000/`
2. Server serves `.output/public/index.html` ✅
3. Browser tries to load `/src/app.ts` (SOURCE FILE) ❌
4. Nitro doesn't serve static files, returns 404 or HTML fallback
5. Browser rejects non-JavaScript MIME type

---

## Missing Nitro 3.0 Configuration

Based on Nitro 3.0 documentation, the following are **MISSING**:

### 1. Public Assets Serving

**Problem**: `publicAssets: []` tells Nitro to NOT serve any public assets.

**Solution**: Nitro should automatically serve files from `server/public/` directory. We need to either:
- Move Vite build output to `server/public/` before Nitro build
- Configure Nitro to serve from `.output/public/` after it's created by Vite
- Use Nitro's built-in public asset handling

### 2. Catch-All Route for SPA

**Problem**: No route handler for client-side routes like `/projects`, `/heroes`, etc.

**Solution**: Create `server/routes/[...].ts` to serve `index.html` for all non-API routes:

```typescript
// server/routes/[...].ts
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export default defineEventHandler(async (event) => {
  // Don't catch API routes
  if (getRequestPath(event).startsWith('/api')) {
    return
  }
  
  // Don't catch static assets
  if (getRequestPath(event).startsWith('/assets')) {
    return
  }
  
  // Serve index.html for SPA routing
  const html = await readFile(
    resolve('.output/public/index.html'), 
    'utf-8'
  )
  
  setHeader(event, 'Content-Type', 'text/html')
  return html
})
```

### 3. Static Asset Middleware

**Problem**: Nitro doesn't know to serve files from `.output/public/assets/`

**Solution**: Configure `publicAssets` properly or use Nitro's built-in static serving:

```typescript
export default defineNitroConfig({
  publicAssets: [
    {
      baseURL: '/',
      dir: 'public',
      maxAge: 60 * 60 * 24 * 365 // 1 year for assets
    }
  ]
})
```

---

## Development vs Production

### Development Mode

```bash
pnpm dev
# Runs concurrently:
# - nitro dev (port 3000) - API server
# - vite (port 3001) - Frontend dev server with HMR
```

**How it works:**
- Vite serves frontend at `localhost:3001`
- Nitro serves API at `localhost:3000`
- Vite proxies `/api/*` to Nitro
- Hot module replacement works
- TypeScript files are processed on-the-fly

**Status**: ✅ Development mode works correctly

### Production Mode

```bash
pnpm build
pnpm start
```

**How it should work:**
- Single Node.js server on port 3000
- Serves both API and static frontend
- No separate frontend server

**Status**: ❌ Production mode FAILS

---

## Directory Structure

```
crearis-vue/
├── src/                    # Vue 3 source code
│   ├── assets/             # Static assets (images, fonts)
│   ├── components/         # Vue components
│   ├── composables/        # Vue composables
│   ├── router/             # Vue Router configuration
│   ├── stores/             # Pinia stores
│   ├── views/              # Page components
│   ├── app.ts              # Vue app initialization
│   └── main.ts             # Entry point
├── server/                 # Nitro backend
│   ├── api/                # API routes (prefixed with /api/)
│   ├── database/           # Database utilities
│   ├── middleware/         # Server middleware
│   ├── plugins/            # Nitro plugins
│   └── utils/              # Server utilities
├── index.html              # SPA entry HTML
├── vite.config.ts          # Vite configuration
├── nitro.config.ts         # Nitro configuration
├── package.json            # Dependencies and scripts
└── .output/                # Build output (generated)
    ├── public/             # Frontend build (Vite)
    └── server/             # Backend build (Nitro)
```

---

## Technology Stack

- **Frontend**: Vue 3 + TypeScript + Vue Router + Pinia
- **Backend**: Nitro 3.0 + H3
- **Database**: PostgreSQL (production) / SQLite (dev)
- **Build Tools**: Vite 5.4 (frontend) + Nitro 3.0 (backend)
- **Runtime**: Node.js >= 20.10.0

---

## Key Learnings

1. **Dual build systems are complex**: Coordinating Vite and Nitro requires careful configuration
2. **Nitro 3.0 changed significantly**: Old patterns from Nitro 2.x don't work
3. **Static file serving is not automatic**: Must explicitly configure public asset handling
4. **SPA routing needs catch-all**: Server must return index.html for all non-API routes
5. **Build order matters**: Nitro first creates directories, Vite fills them

---

## Next Steps (Required)

To make this work, we need to:

1. **Study Nitro 3.0 documentation thoroughly**
   - How to serve static files properly
   - How to configure public assets
   - How to handle SPA routing

2. **Choose one of two approaches**:
   - **Option A**: Keep dual build (Vite + Nitro) - requires proper static serving config
   - **Option B**: Use Nitro only - let Nitro handle Vue build via plugins

3. **Implement proper route handling**:
   - Catch-all route for SPA
   - Static asset serving
   - API route protection

4. **Test deployment workflow**:
   - Verify `.output/` is self-contained
   - Test on production-like environment
   - Validate PM2 process management

---

## References

- [Nitro 3.0 Guide](https://nitro.build/guide)
- [Nitro Routing](https://nitro.build/guide/routing)
- [Nitro Assets](https://nitro.build/guide/assets)
- [Nitro Node.js Runtime](https://nitro.build/deploy/runtimes/node)
- [H3 Event Handlers](https://v1.h3.dev/guide/event-handler)

---

**Author**: GitHub Copilot  
**Repository**: theaterpedia/crearis-vue  
**Branch**: beta_project
