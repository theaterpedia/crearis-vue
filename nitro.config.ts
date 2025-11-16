export default {
  // Scan server directory for API routes and handlers
  scanDirs: ['server'],

  // Development server settings
  devServer: {
    port: 3000
  },

  // Enable Vite for development (processes Vue/TS files)
  experimental: {
    viteNode: true
  },

  // Public assets configuration
  // Nitro will copy server/public/ and public/ to .output/public/ during build
  publicAssets: [
    {
      dir: 'public', // Vite public folder (favicon.ico, etc.)
      maxAge: 60 * 60 * 24 * 365 // Cache for 1 year
    },
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
        'Access-Control-Allow-Origin': 'http://localhost:3001',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
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