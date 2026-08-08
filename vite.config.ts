import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Enable dev tools in development
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
  // Output to server/public/ so Nitro can copy it to .output/public/
  build: {
    outDir: 'server/public',
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
    /**
     * DEV-ONLY. The route-space contract (thread §3) gives a project's own
     * domain a different URL-shape than the portal — `/` is the project's
     * landing, `/events/:id` needs no `:domaincode`. That branch can only be
     * DRIVEN if the dev server answers to the site's hostname, so map it
     * locally (`--host-resolver-rules="MAP utopia-in-action.de 127.0.0.1"`,
     * or an /etc/hosts line) and let vite accept it.
     *
     * Named hosts only — never `true`: vite's check is a DNS-rebinding guard,
     * and this keeps it for every host but the ones we deliberately test.
     * Production serves the built bundle through nitro + nginx; this list is
     * not part of it. Grows one line per site whose shape someone must drive.
     */
    allowedHosts: ['utopia-in-action.de', 'localhost', '127.0.0.1'],
    proxy: {
      // Proxy API calls to Nitro server during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Enable cookies to be sent between frontend (3001) and backend (3000)
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward cookies from the original request
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie)
            }
          })
        }
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
