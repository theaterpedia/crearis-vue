/**
 * uia · the agenda's data source.
 *
 * Task A per HD 2026-07-28: the public agenda reads **Odoo** `event.event` through
 * `/api/odoo/events`, not CV's `events` table. That is the "events-spearhead" —
 * it launches uia now and lets the dashboard catch up later, instead of waiting on
 * the sysreg/status work (Fork B) that still blocks the CV-side project gate.
 *
 * On the devbox that endpoint is mocked (`ODOO_MOCK=1`), because HD's decision is
 * that this box never reaches Odoo. The mock returns the real endpoint's output
 * shape field-for-field, so this composable is written against the contract, not
 * against the mock.
 *
 * ── Heading composition · why it happens HERE ────────────────────────────────
 * `ItemList` has two modes. Given `entity=`, it fetches and maps entities itself,
 * and that mapping sets `heading = entity.title || entity.name` — a bare title,
 * ignoring `teaser`. Given `items=`, it renders what you hand it.
 *
 * We use `items=`. So the crearis-md heading — `"overline **HEADLINE** subline"`,
 * parsed by `HeadingParser` — is composed here, from the Odoo row's own fields:
 *
 *     date-line   ← date_begin (+ schedule for the time-range)
 *     HEADLINE    ← name
 *     subline     ← teasertext
 *
 * This is worth being precise about, because I previously flagged the bare-title
 * collapse as something `ItemList` would have to learn. It does not, for A: that
 * gap only exists on the `entity=`-fetch path, which is the dashboard's road (B),
 * not this one. No shared component needs changing for the public agenda.
 *
 * ── Fallback · deliberate, and deliberately visible ─────────────────────────
 * If the endpoint fails, the agenda falls back to `content/agenda.ts` →
 * `agendaItems` rather than rendering an error or an empty column. A public
 * agenda that goes blank because a backend hiccuped is worse than one showing the
 * authored truth — and the content files ARE the same authored data.
 *
 * But a silent fallback would let the live agenda drift stale unnoticed, which is
 * the same failure-class as serving mock data in production. So `source` is
 * returned alongside the rows and the failure is logged loudly. Callers can
 * surface it; nothing hides it.
 */

import { computed, ref } from 'vue'
import { toListItems, type UiaListItem } from './uiaItems'
import { formatUiaDay } from './uiaDates'
import { agendaItems } from './content/agenda'

/** The ratified domaincode · CO@prod 2026-05-20, decision-record §2.5. */
export const UIA_DOMAIN_CODE = 'utopiaxaction'

/** Where the rows came from. `'content'` means the endpoint did not answer. */
export type UiaEventsSource = 'odoo' | 'content'

/** The subset of `/api/odoo/events`'s row-shape this view actually consumes. */
interface OdooEventRow {
    id: number
    name: string
    date_begin: string | null
    teasertext: string | null
    schedule: string | null
    cimg: string | null
    stage_id: { id: number; name: string } | null
    domain_code: { id: number; name: string } | null
}

interface OdooEventsResponse {
    success: boolean
    mock?: boolean
    events: OdooEventRow[]
    total: number
}

/**
 * `'2026-09-23 19:00:00'` → `'MI 23.09.26'`.
 *
 * Routed through `formatUiaDay` so the DB path prints dates exactly as the
 * file-backed path does — same weekday abbreviations, same `DD.MM.YY`. If these
 * two ever disagreed, the fallback would be visibly a different site.
 */
function odooDateToUiaDay(dateBegin: string | null): string | null {
    if (!dateBegin) return null
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateBegin)
    if (!match) return null
    const [, year, month, day] = match as unknown as [string, string, string, string]
    return formatUiaDay(`${day}.${month}.${year.slice(2)}`)
}

/**
 * Build the crearis-md heading, as `overline **HEADLINE**`.
 *
 * ── Why there is no subline, though the format documents one ─────────────────
 * `HeadingParser` advertises `"overline **headline** subline"` and calls the
 * three-part form supported. `Heading.vue` cannot render it:
 *
 *     hasSubline = !hasOverline && (subline || tags)
 *
 * — the subline is gated on there being NO overline, and its own prop-doc says
 * "Only shows up, if no overline is provided". So overline and subline are
 * either/or by design, and a three-part heading loses its third part silently.
 * Verified in the browser: rows composed with all three rendered date + headline
 * and dropped the teaser without a trace.
 *
 * Rather than pass data that vanishes, the teaser is used as the overline **only
 * when there is no date-line to lead with**. Nothing is silently discarded, and
 * the result is exactly the row shape the reference design specifies — thumbnail
 * + overline date-line + bold headline (`X_Assets/UI_theaterpedia_homepage.png`,
 * cited by §5). The teaser's home is the project band, not the row.
 *
 * The HeadingParser-vs-Heading contract mismatch is flagged upstream; it is not
 * worked around here, and no shared component is touched for it.
 */
export function composeHeading(row: OdooEventRow): string {
    const day = odooDateToUiaDay(row.date_begin)
    // Prefer the date-line. `schedule` joins it when it adds something (the
    // time-range); on an undated row it stands in for the date entirely.
    const dateLine = [day, row.schedule && row.schedule !== day ? row.schedule : null]
        .filter(Boolean)
        .join(' · ')
    // Falls back to the teaser so an undated, unscheduled row still says something
    // above its headline instead of leading with nothing.
    const overline = dateLine || row.teasertext?.trim() || ''
    return `${overline ? `${overline} ` : ''}**${row.name}**`
}

/**
 * Is this row known to be in the past?
 *
 * Deliberately not the same as "not upcoming". A row with **no** date is unknown,
 * not past — uia's Abschluss-Aufführung is genuinely ahead but carries no firm
 * date ("vsl. 22.01.2027"), and dropping it would hide the climax of the arc.
 *
 * Filtering happens here rather than via the endpoint's `?upcoming=true` on
 * purpose: that translates to Odoo's `['date_begin', '>=', now]`, which excludes
 * NULL dates too. Doing it client-side keeps the mock and live-Odoo paths
 * identical instead of quietly diverging on the undated row.
 */
function isKnownPast(row: OdooEventRow, today: Date): boolean {
    if (!row.date_begin) return false
    const todayStamp = today.toISOString().slice(0, 10)
    return row.date_begin.slice(0, 10) < todayStamp
}

/** Map an Odoo row onto the `ListItem` shape `ItemList` renders. */
function toItem(row: OdooEventRow): UiaListItem {
    const item: UiaListItem = { heading: composeHeading(row) }
    // cimg is dropped when absent rather than passed empty — ItemRow renders
    // `<img v-else-if="cimg">` unguarded, so an empty string would be a broken image.
    if (row.cimg) item.cimg = row.cimg
    return item
}

export function useUiaEvents() {
    const items = ref<UiaListItem[]>([])
    const source = ref<UiaEventsSource>('content')
    const loading = ref(false)
    const error = ref<string | null>(null)
    /** True when the endpoint answered with fabricated data (devbox `ODOO_MOCK=1`). */
    const isMock = ref(false)

    /** The authored agenda — the fallback, and the pre-fetch initial state. */
    function useContentFallback(reason?: string) {
        items.value = toListItems(agendaItems)
        source.value = 'content'
        if (reason) {
            console.warn(
                `[uia] agenda fell back to content/agenda.ts — the Odoo events endpoint did not answer. `
                + `Rows are the authored agenda, so the page is correct but will not reflect DB edits. Reason: ${reason}`,
            )
        }
    }

    async function load(options: { upcoming?: boolean; limit?: number; today?: Date } = {}) {
        loading.value = true
        error.value = null
        const params = new URLSearchParams({ domain_code: UIA_DOMAIN_CODE })
        if (options.upcoming) params.set('upcoming', 'true')
        if (options.limit) params.set('limit', String(options.limit))

        try {
            const response = await fetch(`/api/odoo/events?${params.toString()}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = (await response.json()) as OdooEventsResponse
            if (!data.success || !Array.isArray(data.events)) throw new Error('unexpected response shape')

            if (data.events.length === 0) {
                // An empty result is not an error, but for a live collective it is
                // almost certainly wrong — a scoping mistake reads identically to
                // "no events". Fall back rather than render an empty agenda.
                error.value = 'no events returned'
                useContentFallback(`0 events for domain_code=${UIA_DOMAIN_CODE}`)
                return
            }

            // Finished arcs have their own band on the agenda page („Was schon
            // war", rendered from `closedArcs`). Without this they appeared twice —
            // once as cards there, and once as rows under „Was ansteht", which
            // says the opposite of what they are.
            const ahead = data.events.filter((row) => !isKnownPast(row, options.today ?? new Date()))
            if (ahead.length === 0) {
                error.value = 'no upcoming events returned'
                useContentFallback(`${data.events.length} events, none of them ahead`)
                return
            }

            items.value = ahead.map(toItem)
            source.value = 'odoo'
            isMock.value = !!data.mock
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : String(cause)
            useContentFallback(error.value)
        } finally {
            loading.value = false
        }
    }

    // Render the authored agenda immediately, so the band is never empty while
    // the request is in flight.
    useContentFallback()

    return {
        items,
        source,
        isMock,
        loading,
        error,
        load,
        /** For a dev-visible marker; never gates content. */
        isFallback: computed(() => source.value === 'content'),
    }
}
