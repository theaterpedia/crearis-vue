/**
 * useAgendaPreset — mock agenda-data composable (cand-2-baseline Phase-A).
 *
 * Surfaces day-grouped agenda lines for the two preset-instances cand-2
 * proves render-cleanly with the same row-family architecture:
 *   - preset='schule-project' → freundes-kreis cojc-#AccessDenied content
 *   - preset='initiative'      → uia Utopia-in-Action Workshop-#1 content
 *
 * Mock-data only. When graphql-client matures (T3a-Basic upstream connectivity
 * + agenda query), this composable swaps to a real fetch behind the same
 * return-shape — consumers don't change.
 *
 * BREADCRUMB (E-pass 2026-08-06): preset-resolution's entry-point now exists —
 * `src/utils/projectPreset.ts` (`resolveProjectPreset(project.config)`), the
 * originally-intended carrier per AgendaView.vue:46. The swap wires BOTH: the
 * debug toggle → the resolver, and the mock arrays → the real events store
 * (`/api/events`, mapping per hcv/threads/2026-08-sysreg.md §2: planned <512 ·
 * confirmed 512-tier · active 4096-tier · documented 8192/past · cancelled 12288).
 * Phase-1 rule: presets vary labels + dtags + themes — never the atom-shape
 * (hcv/threads/2026-08-presets.md §7·5).
 *
 * Per CTO-cand-2-implementation-brief §3 deliverables-shape · negative-spec
 * §3.1 row-atom decomposition · §3.4 left-edge-tint status-canonical.
 */

import { computed, ref, type Ref } from 'vue'
import { STATUS, lifecycleStatus } from '@/utils/status-constants'
import { carriesOffset, parseToVenueWallClock } from '@/utils/displayTimezone'

/** Status-state for the row-edge-tint. Cross-NavStop canonical. */
export type AgendaLineStatus =
    | 'planned'      // empty marker · neutral tint (default)
    | 'active'       // filled marker · positive tint (currently-running)
    | 'confirmed'    // confirmed-ready · positive tint (announced)
    | 'cancelled'    // X marker · negative tint
    | 'documented'   // half-filled · muted tint (past, archived)

/** Trio post-it counts per row (positive / warning / negative lanes). */
export interface AgendaLineTrioCounts {
    positive: number
    warning: number
    negative: number
}

/** Canonical row-data shape consumed by AgendaLine. */
export interface AgendaLineData {
    id: string
    shortcode?: string         // optional pill prefix (A1, KP-1, ...)
    headline: string           // bold pull (headline-overline-subline canon)
    overline?: string          // small contextual tag above headline
    timeRange: string          // "08:00 – 11:30" or "08:00"
    location?: string          // "Raum-3" · "Online-Jitsi" · "Aula"
    who?: string               // "HM" · "Franzi" · "BuT-team"
    status: AgendaLineStatus
    trio?: AgendaLineTrioCounts
    /** Not anonymous-readable — guests get the SILHOUETTE (form, no content). */
    internal?: boolean
    /** Registry image (wide preferred) — consumed by the promoted-first panel. */
    image?: string
}

/** Day-group wrapper bundling lines under a single date. */
export interface AgendaDayGroupData {
    date: string               // ISO yyyy-mm-dd
    label: string              // "MO 2026-06-15" or German short-form
    lines: AgendaLineData[]
}

/** Preset discriminator — cross-preset proof-target. */
export type AgendaPresetKind = 'schule-project' | 'initiative'

/** Mock dataset for freundes-kreis cojc workshop (schule-project preset). */
const MOCK_SCHULE_PROJECT: AgendaDayGroupData[] = [
    {
        date: '2026-06-15',
        label: 'MO 2026-06-15',
        lines: [
            {
                id: 'sp-a1',
                shortcode: 'A1',
                overline: 'Kursteinstieg · Modul A',
                headline: 'AM ANFANG WAR DER KREIS',
                timeRange: '08:00 – 09:30',
                location: 'Raum-3',
                who: 'HM',
                status: 'active',
                trio: { positive: 2, warning: 0, negative: 0 },
            },
            {
                id: 'sp-a2',
                shortcode: 'A2',
                overline: 'Vertiefung · Modul A',
                headline: 'SPIEL MIT MASKE — grundformen',
                timeRange: '09:45 – 11:15',
                location: 'Raum-3',
                who: 'Franzi',
                status: 'planned',
                trio: { positive: 1, warning: 1, negative: 0 },
            },
            {
                id: 'sp-a3',
                shortcode: 'A3',
                overline: 'Praxis · Modul A',
                headline: 'STIMMÜBUNGEN atmen-und-tönen',
                timeRange: '11:30 – 12:45',
                location: 'Raum-2',
                who: 'Mattis',
                status: 'planned',
                trio: { positive: 0, warning: 1, negative: 0 },
            },
        ],
    },
    {
        date: '2026-06-16',
        label: 'DI 2026-06-16',
        lines: [
            {
                id: 'sp-a4',
                shortcode: 'A4',
                overline: 'Abschluss · Modul A',
                headline: 'ERGEBNISPRÄSENTATION',
                timeRange: '13:00 – 15:00',
                location: 'Aula',
                who: 'HM + Franzi',
                status: 'confirmed',
                trio: { positive: 3, warning: 1, negative: 1 },
            },
        ],
    },
]

/** Mock dataset for uia Utopia-in-Action Workshop-#1 (initiative preset). */
const MOCK_INITIATIVE: AgendaDayGroupData[] = [
    {
        date: '2026-05-21',
        label: 'MI 2026-05-21',
        lines: [
            {
                id: 'in-kp1',
                shortcode: 'KP-1',
                overline: 'Kernprogramm',
                headline: 'Forum-Theater für Lehrer:innen — Auftakt',
                timeRange: '18:00 – 20:30',
                location: 'UiA-Werkstatt',
                who: 'Trägerkreis',
                status: 'confirmed',
                trio: { positive: 4, warning: 0, negative: 0 },
            },
        ],
    },
    {
        date: '2026-05-28',
        label: 'MI 2026-05-28',
        lines: [
            {
                id: 'in-kp2',
                shortcode: 'KP-2',
                overline: 'Kernprogramm · Methodik',
                headline: 'Boal-Konzept · Madalena-Erweiterung',
                timeRange: '18:00 – 20:30',
                location: 'UiA-Werkstatt',
                who: 'Greg + Mattis',
                status: 'planned',
                trio: { positive: 1, warning: 0, negative: 0 },
            },
            {
                id: 'in-zp1',
                shortcode: 'ZP-1',
                overline: 'Zusatzprogramm',
                headline: 'Stimmen aus der Praxis — offene Runde',
                timeRange: '21:00 – 22:30',
                location: 'UiA-Werkstatt',
                who: 'Jolanda',
                status: 'planned',
                trio: { positive: 0, warning: 2, negative: 0 },
            },
        ],
    },
    {
        date: '2026-06-04',
        label: 'MI 2026-06-04',
        lines: [
            {
                id: 'in-kp3',
                shortcode: 'KP-3',
                overline: 'Kernprogramm · Praxis',
                headline: 'Szenenarbeit — Schulklasse-Szenarien',
                timeRange: '18:00 – 20:30',
                location: 'UiA-Werkstatt',
                who: 'Trägerkreis',
                status: 'planned',
                trio: { positive: 0, warning: 1, negative: 0 },
            },
        ],
    },
]

/** Lookup table for direct testing of the mock-resolver. */
export const AGENDA_PRESET_MOCKS: Record<AgendaPresetKind, AgendaDayGroupData[]> = {
    'schule-project': MOCK_SCHULE_PROJECT,
    initiative: MOCK_INITIATIVE,
}

/** Pure resolver — used by both the composable and unit tests. */
export function resolveAgendaForPreset(preset: AgendaPresetKind): AgendaDayGroupData[] {
    return AGENDA_PRESET_MOCKS[preset]
}

/** Reactive composable for view-components. */
export function useAgendaPreset(preset: Ref<AgendaPresetKind>) {
    const dayGroups = computed<AgendaDayGroupData[]>(() =>
        resolveAgendaForPreset(preset.value),
    )
    const lineCount = computed<number>(() =>
        dayGroups.value.reduce((sum, g) => sum + g.lines.length, 0),
    )
    return { dayGroups, lineCount }
}

// ─── F-2 · the real-store path (2026-08-06) ─────────────────────────────────
// The swap the header promised: same return-shape, fed from /api/events.
// The mock stays above as the offline fixture + the no-domaincode fallback;
// /start (F-3) is the first consumer. /projects' AgendaView deliberately stays
// on the mock (negative-spec: do not build toward /projects).

/** The subset of a CV `events` row this mapping consumes (bare-array contract). */
export interface AgendaEventRow {
    id: number
    name: string
    teaser?: string | null
    date_begin?: string | null
    date_end?: string | null
    location?: string | null
    status?: number | null
    /**
     * Trigger-computed visibility (r_* matrix). `false` = not anonymous-readable
     * — the /start Schwelle renders such lines as SILHOUETTES for guests
     * (design-thread §3·3). `null`/`undefined` = unknown → treated as public.
     */
    r_anonym?: boolean | number | null
    /** Registry shapes (img_id propagation) — the featured panel's image rider. */
    img_wide?: { url?: string } | null
    img_square?: { url?: string } | null
}

/** Venue wall-clock normalisation — same discipline as useUiaEvents. */
function toVenueWallClock(value: string): string {
    if (!carriesOffset(value)) return value
    const zoned = parseToVenueWallClock(value)
    if (Number.isNaN(zoned.getTime())) return value
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`
        + `T${pad(zoned.getHours())}:${pad(zoned.getMinutes())}:${pad(zoned.getSeconds())}`
}

/**
 * The BLESSED sysreg → AgendaLineStatus mapping (sysreg thread §2, HD):
 * cancelled = 12288 (the composite — checked FIRST, it sorts above 8192) ·
 * documented = 8192-tier or known-past · active = 4096-tier · confirmed =
 * 512-tier · planned below. Masked lifecycle, never the raw value.
 */
export function agendaLineStatus(status: number | null | undefined, knownPast: boolean): AgendaLineStatus {
    const lifecycle = lifecycleStatus(status || 0)
    if (lifecycle === 12288) return 'cancelled'
    if (lifecycle >= 8192 || knownPast) return 'documented'
    if (lifecycle >= STATUS.RELEASED) return 'active'
    if (lifecycle >= STATUS.CONFIRMED) return 'confirmed'
    return 'planned'
}

const WEEKDAYS_DE = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'] as const

/** `'2026-09-23'` → `'MI 2026-09-23'` — the mock's own label convention. */
function dayLabel(isoDate: string): string {
    const parsed = new Date(`${isoDate}T12:00:00`)
    if (Number.isNaN(parsed.getTime())) return isoDate
    return `${WEEKDAYS_DE[parsed.getDay()]} ${isoDate}`
}

function clockOf(value: string | null | undefined): string | null {
    const match = /[T ](\d{2}):(\d{2})/.exec(value ? toVenueWallClock(value) : '')
    return match ? `${match[1]}:${match[2]}` : null
}

/** Map CV event rows onto the canonical day-group shape the row-family renders. */
export function mapEventsToDayGroups(rows: AgendaEventRow[], today: Date = new Date()): AgendaDayGroupData[] {
    const todayIso = today.toISOString().slice(0, 10)
    const groups = new Map<string, AgendaDayGroupData>()
    /** Undated rows (e.g. the weekly Kernprogramm) — a trailing group, not dropped. */
    const undated: AgendaLineData[] = []

    for (const row of rows) {
        const begin = row.date_begin ? toVenueWallClock(row.date_begin) : null
        const isoDate = begin ? begin.slice(0, 10) : null
        const from = clockOf(row.date_begin)
        const to = clockOf(row.date_end)
        const line: AgendaLineData = {
            id: String(row.id),
            headline: row.name,
            overline: row.teaser?.trim() || undefined,
            timeRange: from ? (to && to !== from ? `${from} – ${to}` : from) : '',
            location: row.location?.trim() || undefined,
            status: agendaLineStatus(row.status, Boolean(isoDate && isoDate < todayIso)),
            // r_anonym === false/0 marks the line internal; null stays public.
            internal: row.r_anonym === false || row.r_anonym === 0 || undefined,
            image: row.img_wide?.url || row.img_square?.url || undefined,
        }
        if (!isoDate) {
            undated.push(line)
            continue
        }
        let group = groups.get(isoDate)
        if (!group) {
            group = { date: isoDate, label: dayLabel(isoDate), lines: [] }
            groups.set(isoDate, group)
        }
        group.lines.push(line)
    }

    const sorted = [...groups.values()].sort((a, b) => a.date.localeCompare(b.date))
    if (undated.length) {
        // Chrome label, FABLE's cut (pulsed): recurring/undated offers close the list.
        sorted.push({ date: '', label: 'laufende Angebote', lines: undated })
    }
    return sorted
}

/**
 * The live composable — same return-shape as useAgendaPreset, fed from the
 * events store. Empty-detection is the CALLER's (F-3 /start renders its own
 * empty state); transport failure yields [] plus `error` — /start is not the
 * public landing, it may say plainly that the store did not answer.
 */
export function useAgendaLive(domaincode: string) {
    const dayGroups = ref<AgendaDayGroupData[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function load(options: { today?: Date } = {}) {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`/api/events?project=${encodeURIComponent(domaincode)}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const data = (await response.json()) as AgendaEventRow[]
            if (!Array.isArray(data)) throw new Error('unexpected response shape')
            dayGroups.value = mapEventsToDayGroups(data, options.today)
        } catch (cause) {
            error.value = cause instanceof Error ? cause.message : String(cause)
            dayGroups.value = []
        } finally {
            loading.value = false
        }
    }

    const lineCount = computed<number>(() =>
        dayGroups.value.reduce((sum, g) => sum + g.lines.length, 0),
    )

    return { dayGroups, lineCount, loading, error, load }
}
