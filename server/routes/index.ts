import { defineEventHandler, sendRedirect } from 'h3'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  // Serve the SPA for all non-API routes
  const path = event.path
  
  // Don't handle API routes
  if (path.startsWith('/api/')) {
    return
  }
  
  // Don't handle static assets
  if (path.startsWith('/assets/')) {
    return
  }
  
  // For all other routes, serve index.html
  const indexPath = resolve(process.cwd(), '.output/public/index.html')
  const html = readFileSync(indexPath, 'utf-8')
  
  event.node?.res?.setHeader('Content-Type', 'text/html')
  return html
})
