import { defineEventHandler, getRequestPath, sendRedirect, setHeader, createError } from 'h3'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let cachedHtml: string | null = null

export default defineEventHandler((event) => {
    const path = getRequestPath(event)

    // Skip API routes - let them handle themselves
    if (path.startsWith('/api/')) {
        return
    }

    // Skip static assets - Nitro serves them automatically from .output/public/
    if (
        path.startsWith('/assets/') ||
        path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt|pdf)$/)
    ) {
        return
    }

    // In development, redirect to Vite dev server
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) {
        return sendRedirect(event, 'http://localhost:3001' + path, 302)
    }

    // In production, serve index.html for all SPA routes
    // This allows Vue Router to handle client-side routing
    if (!cachedHtml) {
        try {
            cachedHtml = readFileSync(
                resolve(process.cwd(), '.output/public/index.html'),
                'utf-8'
            )
        } catch (err) {
            console.error('Failed to read index.html:', err)
            throw createError({
                statusCode: 500,
                message: 'Failed to load application'
            })
        }
    }

    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return cachedHtml
})
