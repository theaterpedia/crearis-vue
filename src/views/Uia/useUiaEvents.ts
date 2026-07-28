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
 * Build the crearis-md heading `HeadingParser` expects.
 *
 * The overline is the date-line; `**name**` is required by the parser; the subline
 * is the teaser. Every part is omitted rather than filled with a placeholder when
 * the row does not carry it — an undated row (uia's provisional Aufführung) leads
 * with its `schedule` text instead of a fabricated date.
 */
export function composeHeading(row: OdooEventRow): string {
    const day = odooDateToUiaDay(row.date_begin)
    const overlineParts = [day, row.schedule].filter((p): p is string => !!p && p !== day)
    if (day) overlineParts.unshift(day)
    const overline = overlineParts.filter(Boolean).join(' · ')
    const subline = row.teasertext?.trim() ?? ''
    // "overline **HEADLINE** subline" — parser contract per migration-069-era docs.
    return `${overline ? `${overline} ` : ''}**${row.name}**${subline ? ` ${subline}` : ''}`
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

    async function load(options: { upcoming?: boolean; limit?: number } = {}) {
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

            items.value = data.events.map(toItem)
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
