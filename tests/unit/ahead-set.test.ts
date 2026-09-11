/**
 * The ahead-implementation set — decision-encoding tests (system-architecture
 * R·4, 2026-08-10). Each block pins a decision, not a behaviour: changing what
 * it asserts reverses a ruling from the research round, so read the reason
 * before touching the expectation.
 *
 * Covered here: R·4·5 (a parser must refuse rather than guess) and R·4·6's
 * pure halves (path-classification and the bucketed p95). R·4·4's predicate is
 * already pinned by `status-borders.test.ts`; R·4·3 lives in the server
 * middleware and is exercised by the SEO suite.
 */

import { describe, expect, it, vi } from 'vitest'
import { parseXmlid } from '@/utils/xmlid'
import { classifyPath, record, timingSnapshot } from '../../server/utils/request-timing'

describe('R·4·5 · the xmlid parser refuses unknown shapes instead of guessing', () => {
    it('returns null for the Odoo domainuser cid — it is not a CV xmlid', () => {
        // `{domain}.user-{role}.{id}` — the DOT-before-id outlier (§15·8).
        // A generic parser assuming `__` is the exact case R·4·5 names.
        expect(parseXmlid('tp.user-team.42')).toBeNull()
        expect(parseXmlid('utopiaxaction.user-exec.7')).toBeNull()
    })

    it('does NOT coerce a word that merely starts with an entity name', () => {
        // Before: `postcard` → { entity: 'post', template: 'ard' } — a parse
        // invented out of a prefix. The compound form always carries `_`.
        expect(parseXmlid('tp.postcard.summer')).toBeNull()
        expect(parseXmlid('tp.eventual.thing')).toBeNull()
    })

    it('still parses the shapes it genuinely knows', () => {
        expect(parseXmlid('utopiaxaction.event__meine-grenzen')).toMatchObject({
            domaincode: 'utopiaxaction', entity: 'event', slug: 'meine-grenzen',
        })
        expect(parseXmlid('utopiaxaction.event-workshop__mischpult')).toMatchObject({
            entity: 'event', template: 'workshop',
        })
        // Legacy compound keeps working — the boundary is what was required.
        expect(parseXmlid('tp.post_news.hello')).toMatchObject({
            entity: 'post', template: 'news',
        })
    })

    it('warns rather than silently assuming, when a shape names no entity', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        parseXmlid('tp.some-unknown-thing')
        expect(warn).toHaveBeenCalled()
        warn.mockRestore()
    })
})

describe('R·4·6 · cheap-path timing — classification and the bucketed p95', () => {
    it('separates the graphql path from the rest of the api', () => {
        // The whole claim rests on the difference between paths; a blended
        // figure answers no question anyone is asking (CM-A6·4).
        expect(classifyPath('/api/odoo/graphql')).toBe('graphql')
        expect(classifyPath('/api/events?project=utopiaxaction')).toBe('api')
        expect(classifyPath('/assets/index-abc.js')).toBe('asset')
        expect(classifyPath('/sites/utopiaxaction')).toBe('shell')
    })

    it('reports p95 as the bucket upper bound, and null before any sample', () => {
        const before = timingSnapshot().classes.find((c) => c.class === 'graphql')
        expect(before?.sampled).toBe(0)
        expect(before?.p95Ms).toBeNull()

        for (let i = 0; i < 19; i++) record('graphql', 3)
        record('graphql', 900)

        const after = timingSnapshot().classes.find((c) => c.class === 'graphql')
        expect(after?.sampled).toBe(20)
        // p95 RESISTS a single outlier — with 20 samples it is the 19th value,
        // which is still fast. That is the property being bought: a monitored
        // series should not swing on one slow request. `maxMs` is where the
        // outlier stays visible, which is why both are reported.
        expect(after?.p95Ms).toBe(5)
        expect(after?.maxMs).toBe(900)

        // …and it DOES move once the slow tail is genuinely 5% of traffic.
        for (let i = 0; i < 4; i++) record('graphql', 900)
        const tail = timingSnapshot().classes.find((c) => c.class === 'graphql')
        expect(tail?.p95Ms).toBe(1000)
    })

    it('names itself as one half of the comparison', () => {
        // The snapshot is the thing a future reader will copy into a blog post.
        // It must carry its own scope, or the cheap/expensive ratio gets
        // derived from half the data (CM-A6·4's named trap).
        expect(timingSnapshot().note).toMatch(/CHEAP PATH ONLY/)
    })
})
