import { defineEventHandler, sendRedirect, setHeader, createError } from 'h3'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let cachedHtml: string | null = null

export default defineEventHandler((event) => {
    // In production, read from .output/public/index.html
    // In development, Vite handles the frontend
    const isDev = process.env.NODE_ENV !== 'production'

    if (isDev) {
        // In dev, redirect to Vite dev server
        return sendRedirect(event, 'http://localhost:3001', 302)
    }

    // In production, serve the built index.html
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
