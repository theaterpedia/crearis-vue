/**
 * pageStructure — the resolver for page-structural MODES (uia thread §18–§20).
 *
 * STRUCTURALLY DECIDED (HD + F, §18·1): defaults are CODE, data carries only
 * deviations. A page's `page_options` JSONB (the `pages` table — CV-only,
 * never synced to Odoo) may carry `key: 'value'` pairs, written ONLY when
 * deviating; absence declares the default. Modes GATE option-spaces — decide
 * the structure first, compose within it after.
 *
 * THE WORDS (CM §19 + E §20 — lifted, not coined):
 *   site_layout — where the lanes sit. Values = the SiteLayout enum AS IT
 *     STANDS (layoutsettings.ts, single-sourced per G-1). `fullTwo` is what
 *     §18·2 called „2-mains"; the aside-bearing shapes are „main-and-context".
 *   body_type — how the body presents. `'dia-show'` = the vertical sequence
 *     of HELD plates (the Dia family — held, not transitioning). Absence =
 *     fluent flow, spoken as „fluent", WRITTEN NOWHERE.
 *   band_composition — which bands are available. RESERVED (§19·1): the key
 *     is registered, no values yet — the carrier consultation (presets §8·④)
 *     continues.
 *
 * Resolution contract: `undefined` means „the view's current default stands" —
 * landing this module changes NO behaviour until a key is written into data
 * (E §20·4, safe against the deploy clock). Unknown values warn loudly and
 * resolve to undefined — a typo must never restructure a page silently.
 */

import { SITE_LAYOUTS, type SiteLayout } from '@/layoutsettings'

/** Body presentation types. 'fluent' is the spoken default — never written. */
export const BODY_TYPES = ['dia-show'] as const
export type BodyType = (typeof BODY_TYPES)[number]

export interface PageStructure {
    /** undefined → the view's own current default stands. */
    siteLayout?: SiteLayout
    /** undefined → fluent flow (the default, declared by absence). */
    bodyType?: BodyType
}

/**
 * 🔴 The two silent traps the `dia-show` mount OWNS (E §20·3, from the BLENDE
 * record). Constants rather than prose so the consumer imports the requirement:
 *
 * 1. `reducedMotion` defaults to the STATIC reveal — deliberately (HP
 *    screentested it first-class). The full sequence needs
 *    `:reduced-motion="false"`; the OS `prefers-reduced-motion` still forces
 *    the static path — the floor, not the look.
 * 2. Ancestor-purity: the stage and EVERY ancestor stay plain blocks — no
 *    transform / filter / overflow-non-visible / contain / will-change — or
 *    the pin and view() die silently.
 */
export const DIA_SHOW_MOUNT = {
    reducedMotionProp: false,
    ancestorPurity: ['transform', 'filter', 'overflow', 'contain', 'will-change'],
} as const

function isSiteLayout(value: unknown): value is SiteLayout {
    return typeof value === 'string' && (SITE_LAYOUTS as readonly string[]).includes(value)
}

function isBodyType(value: unknown): value is BodyType {
    return typeof value === 'string' && (BODY_TYPES as readonly string[]).includes(value)
}

/**
 * Resolve the structural modes from a page's `page_options` JSON.
 * Pure — callable from views, composables and tests alike.
 */
export function resolvePageStructure(pageOptions: unknown): PageStructure {
    const structure: PageStructure = {}
    if (!pageOptions || typeof pageOptions !== 'object') return structure
    const options = pageOptions as Record<string, unknown>

    if (options.site_layout !== undefined) {
        if (isSiteLayout(options.site_layout)) {
            structure.siteLayout = options.site_layout
        } else {
            console.warn(
                `[pageStructure] unknown site_layout '${String(options.site_layout)}' — `
                + 'falling back to the view default. Valid: ' + SITE_LAYOUTS.join(', '),
            )
        }
    }

    if (options.body_type !== undefined) {
        if (isBodyType(options.body_type)) {
            structure.bodyType = options.body_type
        } else {
            console.warn(
                `[pageStructure] unknown body_type '${String(options.body_type)}' — `
                + 'falling back to fluent flow. Valid: ' + BODY_TYPES.join(', '),
            )
        }
    }

    return structure
}

/**
 * The gate (§18·1·4): which body-composition families a mode makes available.
 * Grows with the component families; today it encodes the one hard gate —
 * dia-show pages compose from the cDia family (held plates), fluent pages
 * from the band/section family.
 */
export function availableBodyFamilies(structure: PageStructure): readonly string[] {
    if (structure.bodyType === 'dia-show') return ['cDia'] as const
    return ['sections'] as const
}
