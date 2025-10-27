export default {
  // Source directory
  srcDir: '.',

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

  // Public assets configuration
  // Nitro will copy server/public/ to .output/public/ during build
  publicAssets: [
    {
      dir: 'server/public',
      maxAge: 0 // Root files (index.html) should not be cached
    }
  ],

  // Build settings for production
  output: {
    dir: '.output',
    serverDir: '.output/server',
    publicDir: '.output/public'
  },

  // Disable prerendering to avoid H3 compatibility issues
  prerender: {
    enabled: false
  },

  // Routes configuration
  routeRules: {
    // API routes with CORS headers
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'cache-control': 'no-cache'
      }
    },

    // Cache static assets aggressively
    '/assets/**': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable'
      }
    }
  },

  // TypeScript support
  typescript: {
    generateTsConfig: false
  }
}