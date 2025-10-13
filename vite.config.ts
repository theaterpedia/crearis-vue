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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html'
      }
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
