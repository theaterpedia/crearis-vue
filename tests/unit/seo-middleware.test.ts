/**
 * seo.ts middleware tests — Option-A meta-injection (SSO-StepB §3.3).
 *
 * Covers the pure helpers:
 *   - matchSeoRoute: URL pattern matching for /sites/:domaincode and nested
 *     post/event routes; negative cases (non-SPA routes pass through)
 *   - resolveMetaTags: precedence between config.seo_* and project fallbacks
 *   - injectMetaIntoHtml: linkedom rewrite of <title> + meta + OG + Twitter
 *
 * Spec test-cases (per CTO-WED-package §3.3):
 *   - Smoke: /sites/uia.augsburg → uia-specific <title> + meta tags
 *   - Per-route: posts + events get their own meta (delegates to project-level
 *     here; richer per-entity overrides land in a follow-up)
 *   - Negative: non-matched routes pass through unchanged
 *   - DSGVO-safe: no tracking-pixels injected — meta-only
 */

import { describe, it, expect } from 'vitest'
import {
    matchSeoRoute,
    resolveMetaTags,
    injectMetaIntoHtml,
    type ProjectMetaBase,
} from '../../server/middleware/seo'

const STATIC_SHELL = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <title>Crearis Demo Data Server</title>
</head>
<body><div id="app"></div></body>
</html>`

describe('matchSeoRoute', () => {
    it('matches /sites/:domaincode (root SPA route)', () => {
        expect(matchSeoRoute('/sites/uia.augsburg')).toEqual({
            domaincode: 'uia.augsburg',
        })
    })

    it('matches with trailing slash', () => {
        expect(matchSeoRoute('/sites/uia.augsburg/')).toEqual({
            domaincode: 'uia.augsburg',
        })
    })

    it('matches /sites/:domaincode/posts/:identifier', () => {
        expect(matchSeoRoute('/sites/freundeskreis/posts/some-post-slug')).toEqual({
            domaincode: 'freundeskreis',
        })
    })

    it('matches /sites/:domaincode/events/:identifier', () => {
        expect(matchSeoRoute('/sites/uia.augsburg/events/workshop-1')).toEqual({
            domaincode: 'uia.augsburg',
        })
    })

    it('passes through (null) for /api/* routes', () => {
        expect(matchSeoRoute('/api/projects/123')).toBeNull()
        expect(matchSeoRoute('/api/auth/verify')).toBeNull()
    })

    it('passes through (null) for /projects/* routes (logged-in dashboard)', () => {
        expect(matchSeoRoute('/projects/freundeskreis/agenda')).toBeNull()
    })

    it('passes through (null) for /login / /home / /start etc.', () => {
        expect(matchSeoRoute('/login')).toBeNull()
        expect(matchSeoRoute('/home')).toBeNull()
        expect(matchSeoRoute('/start')).toBeNull()
    })

    it('does not match deeper nesting beyond posts/events', () => {
        expect(matchSeoRoute('/sites/uia.augsburg/posts/slug/extra')).toBeNull()
    })
})

describe('resolveMetaTags', () => {
    const base: ProjectMetaBase = {
        domaincode: 'uia.augsburg',
        name: 'UiA Augsburg',
        heading: 'Utopia in Action',
        teaser: 'Forum-theater for change',
        description: 'A long description fallback',
        cimg: '/img/uia.jpg',
    }

    it('uses config.seo_title when set; appends Theaterpedia suffix', () => {
        const tags = resolveMetaTags({
            ...base,
            config: { seo_title: 'UiA — landing' },
        })
        expect(tags.title).toBe('UiA — landing - Theaterpedia')
    })

    it('falls back to heading then name then domaincode for title', () => {
        expect(resolveMetaTags({ ...base, config: null }).title).toBe(
            'Utopia in Action - Theaterpedia',
        )
        expect(
            resolveMetaTags({ ...base, heading: undefined, config: null }).title,
        ).toBe('UiA Augsburg - Theaterpedia')
        expect(
            resolveMetaTags({
                domaincode: 'minimal',
                config: null,
            }).title,
        ).toBe('minimal - Theaterpedia')
    })

    it('prefers config.seo_description then teaser then project.description', () => {
        expect(
            resolveMetaTags({
                ...base,
                config: { seo_description: 'cfg desc' },
            }).description,
        ).toBe('cfg desc')
        expect(resolveMetaTags({ ...base, config: null }).description).toBe(
            'Forum-theater for change',
        )
        expect(
            resolveMetaTags({
                ...base,
                teaser: undefined,
                config: null,
            }).description,
        ).toBe('A long description fallback')
    })

    it('og:title falls back to raw title (no Theaterpedia suffix — social-share-specific)', () => {
        // Matches ProjectSite.vue precedent: document.title gets the suffix,
        // og:title does not (suffix is noise in social-unfurl).
        const tags = resolveMetaTags({ ...base, config: { seo_title: 'X' } })
        expect(tags.ogTitle).toBe('X')
        // And the browser-title still does get the suffix
        expect(tags.title).toBe('X - Theaterpedia')
    })

    it('og:image prefers config.og_image > config.seo_image > project.cimg', () => {
        expect(
            resolveMetaTags({
                ...base,
                config: { og_image: '/o.jpg', seo_image: '/s.jpg' },
            }).ogImage,
        ).toBe('/o.jpg')
        expect(
            resolveMetaTags({ ...base, config: { seo_image: '/s.jpg' } }).ogImage,
        ).toBe('/s.jpg')
        expect(resolveMetaTags({ ...base, config: null }).ogImage).toBe('/img/uia.jpg')
    })

    it('defaults twitter_card to summary_large_image when unset', () => {
        expect(resolveMetaTags({ ...base, config: null }).twitterCard).toBe(
            'summary_large_image',
        )
    })

    it('respects custom twitter_card from config', () => {
        expect(
            resolveMetaTags({ ...base, config: { twitter_card: 'summary' } })
                .twitterCard,
        ).toBe('summary')
    })
})

describe('injectMetaIntoHtml', () => {
    const TAGS = {
        title: 'UiA Augsburg - Theaterpedia',
        description: 'Forum-theater for change',
        keywords: 'theater,workshop',
        ogTitle: 'UiA Augsburg - Theaterpedia',
        ogDescription: 'Forum-theater for change',
        ogImage: '/img/uia.jpg',
        twitterCard: 'summary_large_image',
    }

    it('replaces the static <title> with the resolved title', () => {
        const out = injectMetaIntoHtml(STATIC_SHELL, TAGS)
        expect(out).toContain('<title>UiA Augsburg - Theaterpedia</title>')
        expect(out).not.toContain('Crearis Demo Data Server')
    })

    it('injects meta[name="description"] when description is non-empty', () => {
        const out = injectMetaIntoHtml(STATIC_SHELL, TAGS)
        expect(out).toContain('name="description"')
        expect(out).toContain('content="Forum-theater for change"')
    })

    it('injects OG tags (title + description + type + image)', () => {
        const out = injectMetaIntoHtml(STATIC_SHELL, TAGS)
        expect(out).toContain('property="og:title"')
        expect(out).toContain('property="og:description"')
        expect(out).toContain('property="og:type"')
        expect(out).toContain('content="website"')
        expect(out).toContain('property="og:image"')
        expect(out).toContain('content="/img/uia.jpg"')
    })

    it('injects Twitter-card tags (card + title + description + image)', () => {
        const out = injectMetaIntoHtml(STATIC_SHELL, TAGS)
        expect(out).toContain('name="twitter:card"')
        expect(out).toContain('content="summary_large_image"')
        expect(out).toContain('name="twitter:title"')
        expect(out).toContain('name="twitter:description"')
        expect(out).toContain('name="twitter:image"')
    })

    it('skips description meta when description is empty', () => {
        const out = injectMetaIntoHtml(STATIC_SHELL, {
            ...TAGS,
            description: '',
            ogDescription: '',
        })
        expect(out).not.toContain('name="description"')
    })

    it('preserves the viewport + charset meta (does not strip existing head)', () => {
        const out = injectMetaIntoHtml(STATIC_SHELL, TAGS)
        expect(out).toContain('width=device-width')
        expect(out).toContain('charset="UTF-8"')
    })

    it('injects no tracking-pixels (DSGVO-safe — meta-only · no script tags added)', () => {
        const out = injectMetaIntoHtml(STATIC_SHELL, TAGS)
        // The shell contains no <script> at injection-time; we add none either.
        expect(out).not.toMatch(/<script\b/)
    })
})
