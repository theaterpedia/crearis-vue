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
 * Per CTO-cand-2-implementation-brief §3 deliverables-shape · negative-spec
 * §3.1 row-atom decomposition · §3.4 left-edge-tint status-canonical.
 */

import { computed, type Ref } from 'vue'

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
