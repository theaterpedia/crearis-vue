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

  // Static assets serving
  publicAssets: [
    {
      baseURL: '/assets',
      dir: 'src/assets'
    }
  ],

  // Build settings for production
  output: {
    dir: '.output'
  },

  // Disable prerendering to avoid H3 compatibility issues
  prerender: {
    enabled: false
  },

  // Routes for SPA mode
  routeRules: {
    // All pages as SPA (no SSR)
    '/**': { ssr: false },
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