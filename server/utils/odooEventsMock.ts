/**
 * Mock for `/api/odoo/events` — the devbox's stand-in for Odoo `event.event`.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * HD 2026-07-28: **"the devbox never reaches Odoo, we only mock this."** Odoo will
 * not run on this box, and the prod GraphQL/XML-RPC surface is not being opened
 * for external access. But uia's public agenda (task A) reads Odoo events, so
 * without a stand-in it could not be built or seen locally at all.
 *
 * ── The one rule this file follows ───────────────────────────────────────────
 * **The mock's shape is the real endpoint's OUTPUT shape, field for field.**
 * Every key below exists because `server/api/odoo/events.get.ts` emits it in its
 * `transformed` map — including the `{ id, name }` objects it builds out of Odoo's
 * many2one `[id, name]` tuples. If this drifted from that transform, the views
 * built against it would break on the first real prod response, which would make
 * the mock worse than nothing.
 *
 * So: when the frontend is later pointed at live Odoo, that is a config change,
 * not a rewrite. Anything the views need that is missing here is a signal the
 * real endpoint does not return it either.
 *
 * ── Content provenance ──────────────────────────────────────────────────────
 * Derived from `src/views/Uia/content/agenda.ts` — the collective's own authored
 * material, so what renders locally is the real agenda and not lorem. Dates go
 * through `parseUiaDate` (the same `DD.MM.YY` parser the frontend uses) so the
 * mock and the views cannot disagree about which Wednesday a date is.
 *
 * ⚠ Two things deliberately NOT invented here:
 *   · `cimg` stays null — every image in the content is still `'TODO HP'` (§8).
 *   · seats/registration counts are null, not plausible-looking numbers. uia has
 *     no threshold source (the „Schwelle" is unknown), and inventing
 *     `seats_reserved: 7` would fabricate exactly the state the cutter-prompt
 *     says not to fake.
 */

import { live, closedArcs } from '../../src/views/Uia/content/agenda'
import { parseUiaDate } from '../../src/views/Uia/uiaDates'

/** The Odoo `website` row for uia · id=10, confirmed live (7 clean website rows). */
export const UIA_WEBSITE = { id: 10, name: 'utopiaxaction' } as const

/** A many2one as the real endpoint renders it. */
interface Many2One {
    id: number
    name: string
}

/** Exactly the object `events.get.ts` puts in its `events` array. */
export interface OdooEventShape {
    id: number
    odoo_id: number
    name: string
    date_begin: string | null
    date_end: string | null
    timezone: string | null
    stage_id: Many2One | null
    kanban_state: string
    seats_max: number | null
    seats_available: number | null
    seats_reserved: number | null
    seats_used: number | null
    seats_limited: boolean | null
    location: Many2One | null
    organizer: Many2One | null
    responsible: Many2One | null
    event_type_id: Many2One | null
    domain_code: Many2One | null
    description: string | null
    note: string | null
    active: boolean
    is_published: boolean
    website_url: string | null
    cid: string | null
    rectitle: string
    teasertext: string | null
    cimg: string | null
    md: string | null
    schedule: string | null
    header_type: string
    header_size: string
    edit_mode: string
    version: number
}

/**
 * `'19:00 – 21:00 Uhr'` → `['19:00:00', '21:00:00']`.
 *
 * Odoo stores naive UTC datetimes as `'YYYY-MM-DD HH:MM:SS'`; the tz lives in
 * `date_tz`. Returns null when the content's time-string is not a range, rather
 * than guessing a duration.
 */
function parseTimeRange(time: string | undefined): [string, string] | null {
    if (!time) return null
    // The content uses an en-dash, and a hyphen is plausible from a future edit.
    const match = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/.exec(time)
    if (!match) return null
    const pad = (s: string) => s.padStart(2, '0')
    return [`${pad(match[1]!)}:${match[2]}:00`, `${pad(match[3]!)}:${match[4]}:00`]
}

/** `Date` + `'19:00:00'` → `'2026-09-23 19:00:00'` (Odoo's naive-datetime format). */
function odooDateTime(day: Date, clock: string | null): string {
    const y = day.getUTCFullYear()
    const m = String(day.getUTCMonth() + 1).padStart(2, '0')
    const d = String(day.getUTCDate()).padStart(2, '0')
    return clock ? `${y}-${m}-${d} ${clock}` : `${y}-${m}-${d} 00:00:00`
}

/** Slug for the `cid` / xmlid tail. Mirrors migration-069's `__{slug}` convention. */
function slugify(input: string): string {
    return input
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

function baseEvent(overrides: Partial<OdooEventShape> & { id: number; name: string }): OdooEventShape {
    return {
        odoo_id: overrides.id,
        date_begin: null,
        date_end: null,
        timezone: 'Europe/Berlin',
        stage_id: null,
        kanban_state: 'normal',
        // Null, not invented. uia has no participant-count source; a plausible
        // number here would fake the „Schwelle" state the content must not claim.
        seats_max: null,
        seats_available: null,
        seats_reserved: null,
        seats_used: null,
        seats_limited: null,
        location: null,
        organizer: null,
        responsible: null,
        event_type_id: null,
        domain_code: { ...UIA_WEBSITE },
        description: null,
        note: null,
        active: true,
        is_published: true,
        website_url: null,
        cid: null,
        rectitle: overrides.name,
        teasertext: null,
        cimg: null, // every content image is still 'TODO HP' (§8)
        md: null,
        schedule: null,
        header_type: 'simple',
        header_size: 'mini',
        edit_mode: 'content',
        version: 1,
        ...overrides,
    }
}

/**
 * The uia agenda as Odoo would return it.
 *
 * Granularity: **one event per Mittwoch** (15) plus the Abschluss-Aufführung plus
 * the two closed arcs. Flat, no parent/child — per HD's scoping of A ("renders
 * flat, no event-sub-events hierarchy so far"). CV-TDD owns the equivalent
 * question for the CV-side seed; this side follows A's stated shape.
 */
export function buildUiaMockEvents(): OdooEventShape[] {
    const events: OdooEventShape[] = []
    const clock = parseTimeRange(live.time)
    const projectSlug = slugify(live.headline)
    let id = 1000

    // ── the 15 Mittwochs of the live project ────────────────────────────────
    live.dates.forEach((raw, index) => {
        const day = parseUiaDate(raw)
        if (!day) return // a malformed date is dropped, not guessed at
        events.push(baseEvent({
            id: id++,
            name: live.headline,
            date_begin: odooDateTime(day, clock ? clock[0] : null),
            date_end: odooDateTime(day, clock ? clock[1] : null),
            stage_id: { id: 2, name: 'Booked' },
            location: { id: 501, name: live.venue },
            event_type_id: { id: 31, name: 'Tanztheater-Projekt' },
            teasertext: live.subline,
            // 069-shaped: {domaincode}.event__{slug}. Termin index keeps them unique.
            cid: `${UIA_WEBSITE.name}.event__${projectSlug}-${String(index + 1).padStart(2, '0')}`,
            schedule: live.time,
        }))
    })

    // ── the public close of the arc ─────────────────────────────────────────
    // live.performance.date is 'vsl. 22.01.2027' — deliberately NOT run through
    // parseUiaDate (the 'vsl.' is part of the owners' statement, and the parser
    // correctly rejects it). Carried as text in `schedule` instead of a fake
    // date_begin, so nothing downstream treats a provisional date as firm.
    events.push(baseEvent({
        id: id++,
        name: `${live.headline} · ${live.performance.label}`,
        stage_id: { id: 1, name: 'Unconfirmed' },
        event_type_id: { id: 32, name: 'Aufführung' },
        teasertext: live.performance.date,
        schedule: live.performance.date,
        cid: `${UIA_WEBSITE.name}.event-auffuehrung__${projectSlug}`,
    }))

    // ── the finished arcs ───────────────────────────────────────────────────
    closedArcs.forEach((arc) => {
        events.push(baseEvent({
            id: id++,
            name: arc.headline,
            stage_id: { id: 4, name: 'Ended' },
            event_type_id: { id: 31, name: 'Tanztheater-Projekt' },
            teasertext: arc.subline,
            description: arc.body,
            schedule: arc.overline,
            active: true,
            cid: `${UIA_WEBSITE.name}.event__${slugify(arc.headline)}`,
        }))
    })

    return events
}

/**
 * Apply the same query-filters the real endpoint applies, so the mock exercises
 * the contract rather than just returning a blob.
 *
 * `now` is injected so tests are not clock-dependent.
 */
export function filterMockEvents(
    all: OdooEventShape[],
    opts: { domainCode?: string; upcoming?: boolean; limit?: number; offset?: number; now?: Date } = {},
): { events: OdooEventShape[]; total: number } {
    let rows = all.filter((e) => e.active)

    if (opts.domainCode) {
        rows = rows.filter((e) => e.domain_code?.name === opts.domainCode)
    }

    if (opts.upcoming) {
        const cutoff = odooDateTime(opts.now ?? new Date(), '00:00:00')
        // Undated rows (the provisional Aufführung) are not "upcoming" — they
        // have no date to compare, and claiming otherwise would order them wrongly.
        rows = rows.filter((e) => !!e.date_begin && e.date_begin >= cutoff)
    }

    // Same ordering as the real call's `order: 'date_begin asc'`. Undated rows
    // sort last rather than first, which is where a reader expects them.
    rows.sort((a, b) => (a.date_begin ?? '9999').localeCompare(b.date_begin ?? '9999'))

    const total = rows.length
    const offset = Math.max(0, opts.offset ?? 0)
    const limit = Math.min(100, Math.max(1, opts.limit ?? 50))
    return { events: rows.slice(offset, offset + limit), total }
}
