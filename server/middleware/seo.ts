/**
 * seo.ts — Option-A meta-injection middleware (SSO-StepB §3.3).
 *
 * Per CV@wsl-1 architecture-investigation TUE 2026-05-19: pure Vue 3 + Vite
 * SPA + Nitro standalone serves a single `server/public/index.html` shell with
 * static `<title>Crearis Demo Data Server</title>` for every non-`/api/*`
 * route. Crawlers/social-unfurlers see the empty shell — degraded social-
 * share-unfurl and suboptimal indexing.
 *
 * This middleware solves that cheaply WITHOUT going full SSR:
 *   1. Match SPA routes that carry meta (sites · sites/posts · sites/events)
 *   2. Look up `project.config.seo_*` via direct DB query (domaincode-keyed)
 *   3. Rewrite the static index.html via `linkedom` — replace `<title>` +
 *      `<meta name=description>` + OG-tags + Twitter-Card-tags
 *   4. Send the rewritten HTML; SPA hydrates normally client-side
 *
 * Non-matched routes pass through untouched. No tracking-pixels injected
 * (DSGVO-safe — meta-only · audit-trail-zero).
 *
 * In dev, Vite serves index.html directly (port 3001); this middleware only
 * fires in the Nitro-served prod path (built SPA from .output/public/).
 *
 * Per CTO-WED-package §3.3 + CV@wsl-1 Option-A-recommendation 2026-05-19.
 */

import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseHTML } from 'linkedom'
import { db } from '../database/init'

const SPA_ROUTE_PATTERN =
    /^\/sites\/([^/]+)(?:\/(?:posts|events)\/[^/]+)?\/?$/

/** Subset of `project.config` we read for meta-injection. */
export interface ProjectSeoMeta {
    seo_title?: string
    seo_description?: string
    seo_keywords?: string
    seo_image?: string
    og_title?: string
    og_description?: string
    og_image?: string
    twitter_card?: string
}

/** Project fields needed beyond config (fallbacks for seo_title etc.). */
export interface ProjectMetaBase {
    name?: string
    heading?: string
    teaser?: string
    description?: string
    cimg?: string
    domaincode: string
    config?: ProjectSeoMeta | null
}

/** Pure helper — does this URL match an SPA route that warrants meta-injection? */
export function matchSeoRoute(pathname: string): { domaincode: string } | null {
    const match = SPA_ROUTE_PATTERN.exec(pathname)
    if (!match || !match[1]) return null
    return { domaincode: match[1] }
}

/** Resolve a project row by domaincode — returns null when not found. */
async function lookupProjectByDomaincode(
    domaincode: string,
): Promise<ProjectMetaBase | null> {
    const row = (await db.get(
        `SELECT name, heading, teaser, description, cimg, domaincode, config
         FROM projects
         WHERE domaincode = ?
         LIMIT 1`,
        [domaincode],
    )) as
        | (Omit<ProjectMetaBase, 'config'> & { config?: string | ProjectSeoMeta | null })
        | undefined
    if (!row) return null
    // JSONB sometimes comes through as parsed object (postgres) or string (sqlite)
    let config: ProjectSeoMeta | null | undefined = null
    if (row.config) {
        if (typeof row.config === 'string') {
            try {
                config = JSON.parse(row.config) as ProjectSeoMeta
            } catch {
                config = null
            }
        } else {
            config = row.config as ProjectSeoMeta
        }
    }
    return { ...row, config }
}

/** Build the resolved meta-tag set from project + config — pure. */
export function resolveMetaTags(project: ProjectMetaBase): {
    title: string
    description: string
    keywords?: string
    ogTitle: string
    ogDescription: string
    ogImage?: string
    twitterCard: string
} {
    const cfg = project.config ?? {}
    const title =
        cfg.seo_title ||
        project.heading ||
        project.name ||
        project.domaincode
    const description =
        cfg.seo_description || project.teaser || project.description || ''
    return {
        title: `${title} - Theaterpedia`,
        description,
        keywords: cfg.seo_keywords,
        ogTitle: cfg.og_title || title,
        ogDescription: cfg.og_description || description,
        ogImage: cfg.og_image || cfg.seo_image || project.cimg,
        twitterCard: cfg.twitter_card || 'summary_large_image',
    }
}

/** Pure HTML-rewrite — accepts the static shell, returns the meta-injected variant. */
export function injectMetaIntoHtml(
    html: string,
    tags: ReturnType<typeof resolveMetaTags>,
): string {
    const { document } = parseHTML(html)
    const head = document.head
    if (!head) return html

    // <title>
    let titleEl = head.querySelector('title')
    if (!titleEl) {
        titleEl = document.createElement('title')
        head.appendChild(titleEl)
    }
    titleEl.textContent = tags.title

    const upsertMeta = (selector: string, attrs: Record<string, string>) => {
        let el = head.querySelector(selector)
        if (!el) {
            el = document.createElement('meta')
            head.appendChild(el)
        }
        for (const [k, v] of Object.entries(attrs)) {
            if (v) el.setAttribute(k, v)
        }
    }

    if (tags.description) {
        upsertMeta('meta[name="description"]', {
            name: 'description',
            content: tags.description,
        })
    }
    if (tags.keywords) {
        upsertMeta('meta[name="keywords"]', {
            name: 'keywords',
            content: tags.keywords,
        })
    }

    // Open Graph
    upsertMeta('meta[property="og:title"]', {
        property: 'og:title',
        content: tags.ogTitle,
    })
    upsertMeta('meta[property="og:description"]', {
        property: 'og:description',
        content: tags.ogDescription,
    })
    upsertMeta('meta[property="og:type"]', {
        property: 'og:type',
        content: 'website',
    })
    if (tags.ogImage) {
        upsertMeta('meta[property="og:image"]', {
            property: 'og:image',
            content: tags.ogImage,
        })
    }

    // Twitter
    upsertMeta('meta[name="twitter:card"]', {
        name: 'twitter:card',
        content: tags.twitterCard,
    })
    upsertMeta('meta[name="twitter:title"]', {
        name: 'twitter:title',
        content: tags.ogTitle,
    })
    upsertMeta('meta[name="twitter:description"]', {
        name: 'twitter:description',
        content: tags.ogDescription,
    })
    if (tags.ogImage) {
        upsertMeta('meta[name="twitter:image"]', {
            name: 'twitter:image',
            content: tags.ogImage,
        })
    }

    return document.toString()
}

/** Disk read of the SPA shell — separated so tests can swap with an in-memory value. */
async function readIndexHtmlShell(): Promise<string | null> {
    // Priority-order per the file's doc-header: `.output/public/index.html` is
    // the canonical Nitro-standalone prod read-source (built SPA). The
    // `server/public/index.html` fallback covers dev-mode shape; in prod
    // `server/` is genuine legacy debris from a pre-`.output`-deploy pattern
    // and must NOT take precedence (otherwise a stale legacy shell wins over
    // the current build and asset-references 404 → white-page hydrate-fail).
    //
    // Per CV@prod barrier-3 dispatch 2026-05-22 (meta@5232caa): HM probe-4
    // surfaced exactly this — `/opt/crearis/live/server/public/index.html`
    // at mtime 2025-11-20 referenced a bundle filename that no longer
    // existed in the current build · the `.output/public/index.html`
    // mirror with the fresh reference was never reached because of the
    // pre-patch ordering.
    const candidates = [
        resolve(process.cwd(), '.output', 'public', 'index.html'),
        resolve(process.cwd(), 'server', 'public', 'index.html'),
    ]
    for (const path of candidates) {
        try {
            return await readFile(path, 'utf-8')
        } catch {
            // try next
        }
    }
    return null
}

export default defineEventHandler(async (event) => {
    const url = getRequestURL(event)
    const match = matchSeoRoute(url.pathname)
    if (!match) return

    const project = await lookupProjectByDomaincode(match.domaincode)
    if (!project) return // pass through — non-matched domaincode

    const shell = await readIndexHtmlShell()
    if (!shell) return // no shell on disk — fall through to default Nitro serving

    const tags = resolveMetaTags(project)
    const rewritten = injectMetaIntoHtml(shell, tags)

    // Use h3's `setResponseHeader` (not `event.node.res.setHeader`) so the
    // Content-Type sticks through h3's GET response-finalize pipeline.
    //
    // Per CV@prod barrier-3b dispatch (`meta@bf1aad8` · 2026-05-22 15:40):
    // HEAD returned `text/html` correctly but GET responses came back as
    // `text/plain` because `event.node.res.setHeader` writes to the raw
    // node:http ServerResponse, bypassing h3's response-state — h3's
    // response-serializer then auto-detected text/plain from the returned
    // string and applied that as the default on GET. Browsers receiving
    // text/plain render the HTML body as raw text, the `<script type=
    // "module">` never executes, the SPA never mounts, and the page looks
    // blank-with-text-only — the visible symptom of HM's probe-4.
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    return rewritten
})
