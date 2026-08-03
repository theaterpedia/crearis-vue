/**
 * uia · the agenda's data source.
 *
 * Reads **CV's own `events` table** via `/api/events?project=utopiaxaction`.
 *
 * ── Why this endpoint and not /api/odoo/events (HD 2026-07-28) ───────────────
 * The first cut read `/api/odoo/events`. That was wrong: it is an older
 * admin-only surface — XML-RPC under superuser credentials, unscoped by project,
 * and read-only by design. Fine for `/admin/events`; not uia's road.
 *
 * uia needs one store that the public page can READ and a logged-in editor can
 * WRITE, because `EventPanel` writes to `/api/events`. Reading anywhere else
 * would mean an edit never showing up on the agenda. So: same endpoint, both
 * directions, one truth.
 *
 * Odoo still matters — CV will 2-way-sync events with it — but that sync happens
 * *behind* this endpoint, between the two stores. It is not something the view
 * reaches across. `server/utils/odooEventsMock.ts` remains as the Odoo side of
 * that sync once it is mocked; it is no longer in the agenda's read path.
 *
 * ── Field names differ from the Odoo shape ───────────────────────────────────
 * `/api/events` returns raw `e.*` rows (plus `domaincode`), as a bare array with
 * no envelope. So: `teaser` — not `teasertext`; `date_begin`/`date_end` as TEXT
 * ISO; images in `img_thumb`/`img_square` JSONB rather than a `cimg` URL.
 *
 * ── Heading composition ──────────────────────────────────────────────────────
 * `ItemList` gets `items=`, so the crearis-md heading is composed here:
 *
 *     date-line (+ time-range) → overline · name → **HEADLINE**
 *
 * Two parts, not three. `Heading.vue` gates `hasSubline = !hasOverline && …`, so
 * overline and subline are either/or and a third part vanishes silently (verified
 * in the browser). The teaser is therefore promoted to overline only when there is
 * no date-line to lead with — nothing is passed that cannot render. The reference
 * row shape (`X_Assets/UI_theaterpedia_homepage.png`, §5) is exactly this: overline
 * date-line + bold headline.
 *
 * ── Fallback · deliberate, and deliberately visible ─────────────────────────
 * On failure — or on an empty result — the agenda keeps `content/agenda.ts` →
 * `agendaItems` rather than showing an error or a blank column. A public agenda
 * that blanks because a backend hiccuped is worse than one showing the authored
 * truth, and the content files ARE that truth.
 *
 * Empty counts as failure on purpose: a project-scoping mistake and "no events"
 * are indistinguishable from here, and rendering nothing is the worse of the two.
 * But a silent fallback would let the live agenda drift stale unnoticed, so
 * `source` is returned and the failure is logged loudly. Nothing hides it.
 */

import { computed, ref } from 'vue'
import { toListItems, type UiaListItem } from './uiaItems'
import { formatUiaDay } from './uiaDates'
import { carriesOffset, parseToVenueWallClock } from '@/utils/displayTimezone'
import { agendaItems } from './content/agenda'

/** The ratified domaincode · CO@prod 2026-05-20, decision-record §2.5. */
export const UIA_DOMAIN_CODE = 'utopiaxaction'

/** Where the rows came from. `'content'` means the endpoint did not answer usefully. */
export type UiaEventsSource = 'db' | 'content'

/** The subset of a CV `events` row this view consumes. `/api/events` returns `e.*`. */
export interface CvEventRow {
    id: number
    name: string
    teaser?: string | null
    date_begin?: string | null
    date_end?: string | null
    cimg?: string | null
    domaincode?: string | null
}

/** `'2026-09-23T19:00:00'` or `'2026-09-23 19:00:00'` → `'MI 23.09.26'`. */
/**
 * Normalise to the venue's wall-clock string, so the lexical readers below stay
 * correct for both storage shapes.
 *
 * CV's own rows are naive (`2026-11-04T19:00:00`) and are ALREADY venue-time — reading
 * them lexically is correct. Odoo's wire format carries an offset
 * (`2026-11-04 18:00:00+00:00`, K4) and must be converted, or the UTC clock is printed
 * as though it were the Augsburg clock. Measured before this fix: a 19:00 Berlin event
 * rendered as `07:00 – 09:00 Uhr` in every browser, everywhere.
 *
 * The offset-vs-naive decision itself lives in `utils/displayTimezone` — one rule for
 * the whole platform, not a second copy here. (Same lesson as WORKFLOW_MASK: a
 * predicate two tiers both depend on cannot live in one of them.)
 */
function toVenueWallClock(value: string): string {
    if (!carriesOffset(value)) return value
    const zoned = parseToVenueWallClock(value)
    if (Number.isNaN(zoned.getTime())) return value
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`
        + `T${pad(zoned.getHours())}:${pad(zoned.getMinutes())}:${pad(zoned.getSeconds())}`
}

function toUiaDay(dateBegin: string | null | undefined): string | null {
    if (!dateBegin) return null
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(toVenueWallClock(dateBegin))
    if (!match) return null
    const [, year, month, day] = match as unknown as [string, string, string, string]
    return formatUiaDay(`${day}.${month}.${year.slice(2)}`)
}

/** `'…T19:00:00'` + `'…T21:00:00'` → `'19:00 – 21:00 Uhr'`. En-dash, as the flyer prints it. */
function toTimeRange(begin: string | null | undefined, end: string | null | undefined): string | null {
    const clock = (value: string | null | undefined): string | null => {
        const match = /[T ](\d{2}):(\d{2})/.exec(value ? toVenueWallClock(value) : '')
        return match ? `${match[1]}:${match[2]}` : null
    }
    const from = clock(begin)
    if (!from) return null
    const to = clock(end)
    return to && to !== from ? `${from} – ${to} Uhr` : `${from} Uhr`
}

/**
 * Is this row known to be in the past?
 *
 * Deliberately not "not upcoming". A row with **no** date is unknown, not past —
 * uia's Abschluss-Aufführung is genuinely ahead but carries no firm date
 * ("vsl. 22.01.2027"), and dropping it would hide the climax of the arc.
 *
 * Done client-side rather than by asking the endpoint for future events only:
 * a SQL `date_begin >= now` excludes NULLs too, which would drop exactly that row.
 */
export function isKnownPast(row: CvEventRow, today: Date): boolean {
    if (!row.date_begin) return false
    return row.date_begin.slice(0, 10) < today.toISOString().slice(0, 10)
}

/** Build the crearis-md heading, as `overline **HEADLINE**`. */
export function composeHeading(row: CvEventRow): string {
    const day = toUiaDay(row.date_begin)
    const time = toTimeRange(row.date_begin, row.date_end)
    const dateLine = [day, day ? time : null].filter(Boolean).join(' · ')
    // Falls back to the teaser so an undated row still says something above its
    // headline rather than leading with nothing.
    const overline = dateLine || row.teaser?.trim() || ''
    return `${overline ? `${overline} ` : ''}**${row.name}**`
}

/** Map a CV event row onto the `ListItem` shape `ItemList` renders. */
function toItem(row: CvEventRow): UiaListItem {
    const item: UiaListItem = { heading: composeHeading(row) }
    // Dropped rather than emptied — ItemRow renders `<img v-else-if="cimg">`
    // unguarded, so '' would be a broken image. img_thumb/img_square JSONB are
    // not read here; every uia image is still 'TODO HP' (§8).
    if (row.cimg && !row.cimg.trim().toUpperCase().startsWith('TODO')) item.cimg = row.cimg
    return item
}

export function useUiaEvents() {
    const items = ref<UiaListItem[]>([])
    const source = ref<UiaEventsSource>('content')
    const loading = ref(false)
    const error = ref<string | null>(null)

    /** The authored agenda — the fallback, and the pre-fetch initial state. */
    function useContentFallback(reason?: string) {
        items.value = toListItems(agendaItems)
        source.value = 'content'
        if (reason) {
            console.warn(
                '[uia] agenda fell back to content/agenda.ts — /api/events did not answer usefully. '
                + `Rows are the authored agenda, so the page is correct but will NOT reflect DB edits. Reason: ${reason}`,
            )
        }
    }

    async function load(options: { limit?: number; today?: Date } = {}) {
        loading.value = true
        error.value = null
        const params = new URLSearchParams({ project: UIA_DOMAIN_CODE })

        try {
            const response = await fetch(`/api/events?${params.toString()}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = (await response.json()) as CvEventRow[]
            // Bare array, no envelope — unlike /api/odoo/events.
            if (!Array.isArray(data)) throw new Error('unexpected response shape')

            if (data.length === 0) {
                error.value = 'no events returned'
                useContentFallback(`0 events for project=${UIA_DOMAIN_CODE}`)
                return
            }

            // Finished arcs have their own band („Was schon war", from `closedArcs`).
            // Without this they would appear twice — as cards there and as rows under
            // „Was ansteht", which says the opposite of what they are.
            const ahead = data.filter((row) => !isKnownPast(row, options.today ?? new Date()))
            if (ahead.length === 0) {
                error.value = 'no upcoming events returned'
                useContentFallback(`${data.length} events, none of them ahead`)
                return
            }

            const scoped = options.limit ? ahead.slice(0, options.limit) : ahead
            items.value = scoped.map(toItem)
            source.value = 'db'
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : String(cause)
            useContentFallback(error.value)
        } finally {
            loading.value = false
        }
    }

    // Render the authored agenda immediately, so the band is never empty while the
    // request is in flight.
    useContentFallback()

    return {
        items,
        source,
        loading,
        error,
        load,
        /** For a dev-visible marker; never gates content. */
        isFallback: computed(() => source.value === 'content'),
    }
}
