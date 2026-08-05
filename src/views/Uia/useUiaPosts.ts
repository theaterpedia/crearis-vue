/**
 * uia · the posts data source — the sibling of `useUiaEvents`.
 *
 * Reads CV's own `posts` table via `/api/posts?project=utopiaxaction` (bare
 * array, no envelope — same contract as `/api/events`). Target model (HD
 * 2026-08-06, uia thread §10.7): posts appear on the landing and on /agenda;
 * clicking one opens its fullview, where it is editable for a logged-in owner.
 *
 * ── Heading composition ─────────────────────────────────────────────────────
 * `post_date` (venue-date, DD.MM.YY) or the teaser leads as overline, the name
 * is the HEADLINE. Two slots, never three (`cv-overline-headline`).
 *
 * ── Empty vs failure ────────────────────────────────────────────────────────
 * Same split as the events source since HD's empty-detection ruling:
 * - a SUCCESSFUL empty answer → `source: 'empty'` — the consuming band decides
 *   (landing hides the band; /agenda shows nothing under the heading).
 * - transport failure → `source: 'content'` — the CALLER may render an
 *   authored fallback (the landing's `pastArcs` are exactly that); this
 *   composable itself holds no content, it only reports.
 */

import { computed, ref } from 'vue'
import type { UiaListItem } from './uiaItems'
import { formatUiaDay } from './uiaDates'

export const UIA_DOMAIN_CODE = 'utopiaxaction'

export type UiaPostsSource = 'db' | 'empty' | 'content'

/** The subset of a CV `posts` row this view consumes. `/api/posts` returns raw rows. */
export interface CvPostRow {
    id: number
    name: string
    teaser?: string | null
    subtitle?: string | null
    post_date?: string | null
    md?: string | null
    cimg?: string | null
    img_square?: { url?: string } | null
    img_thumb?: { url?: string } | null
    img_wide?: { url?: string } | null
    domaincode?: string | null
}

/** `'2026-07-24'` → `'FR 24.07.26'` (falls back to the raw date on a parse miss). */
function toPostDay(postDate: string | null | undefined): string | null {
    if (!postDate) return null
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(postDate)
    if (!match) return null
    const [, year, month, day] = match as unknown as [string, string, string, string]
    return formatUiaDay(`${day}.${month}.${year.slice(2)}`)
}

/** Build the crearis-md heading — `overline **HEADLINE**`, two parts, never three. */
export function composePostHeading(row: CvPostRow): string {
    const overline = toPostDay(row.post_date) || row.teaser?.trim() || row.subtitle?.trim() || ''
    return `${overline ? `${overline} ` : ''}**${row.name}**`
}

/** Row image: the registry's square shape first, a plain cimg URL second. */
export function postRowImage(row: CvPostRow): string | undefined {
    const url = row.img_square?.url || row.img_thumb?.url || row.cimg || undefined
    if (!url || url.trim().toUpperCase().startsWith('TODO')) return undefined
    return url
}

function toItem(row: CvPostRow): UiaListItem {
    const item: UiaListItem = { heading: composePostHeading(row) }
    const cimg = postRowImage(row)
    if (cimg) item.cimg = cimg
    return item
}

export function useUiaPosts() {
    const rows = ref<CvPostRow[]>([])
    const items = ref<UiaListItem[]>([])
    const source = ref<UiaPostsSource>('content')
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function load(options: { limit?: number } = {}) {
        loading.value = true
        error.value = null
        const params = new URLSearchParams({ project: UIA_DOMAIN_CODE })

        try {
            const response = await fetch(`/api/posts?${params.toString()}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = (await response.json()) as CvPostRow[]
            if (!Array.isArray(data)) throw new Error('unexpected response shape')

            if (data.length === 0) {
                rows.value = []
                items.value = []
                source.value = 'empty'
                return
            }

            const scoped = options.limit ? data.slice(0, options.limit) : data
            rows.value = scoped
            items.value = scoped.map(toItem)
            source.value = 'db'
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : String(cause)
            rows.value = []
            items.value = []
            source.value = 'content'
            console.warn(`[uia] posts did not load — /api/posts did not answer usefully. Reason: ${error.value}`)
        } finally {
            loading.value = false
        }
    }

    return {
        rows,
        items,
        source,
        loading,
        error,
        load,
        isEmpty: computed(() => source.value === 'empty'),
        /** Transport failure — the caller may render its authored fallback. */
        isFallback: computed(() => source.value === 'content'),
    }
}
