/**
 * projectPreset — THE entry-point for per-project preset resolution.
 *
 * STUB WITH BREADCRUMBS (E-pass, 2026-08-06) — planted on HD's instruction so the
 * MAY horizon has a made entry-point. The breadcrumb IS the spec (episdesign
 * discipline): this header names what arrives here, so nobody re-derives it.
 *
 * ── What was decided in MAY (recovered · hcv/threads/2026-08-presets.md §7) ──
 * Three dashboard-architectures were decided per preset:
 *   schule-project → Cand-3 (block-atom + orbit — Phase-3, DELIBERATELY RESERVED)
 *   classic-project → Cand-2 (row-atom, cross-preset-baseline — Phase-1, live)
 *   weekly-course   → Cand-1 (rail-spine — Phase-2)
 * ⚠ Phase-1 rule (operative NOW): presets carry ONLY labels + dtags + theme-tokens
 * — NOT a different atom-shape. Do not build an atom-selector here before Phase-3.
 * ⚠ Do not build toward the MAY dashboard at /projects/* (mock-fed, off-limits)
 * and never v-if on density — both in hcv/threads/2026-08-negative-spec.md.
 *
 * ── The carrier ──────────────────────────────────────────────────────────────
 * `projects.config.preset` is the ORIGINALLY-INTENDED mechanism (AgendaView.vue:46:
 * „Final preset-resolution lands when project.config.preset is wired through") and
 * the intermediary binding HD sanctioned 2026-08-06 (presets thread §6): a plain
 * key, INTERMEDIARY — presets need consultation against Odoo + HD decisions later;
 * the R1-R8 config_template mechanism absorbs this key when it lands.
 * ⚠ Vocabulary trap (presets §7·2): Odoo `website.config_preset` holds a DIFFERENT
 * value-set (academy/retail/association/agency/minimal). Never conflate the two.
 *
 * ── Who consumes this (the wiring F makes) ───────────────────────────────────
 * - useAgendaPreset: replaces its debug-toggle with resolveProjectPreset()
 * - /start (from scratch, per-preset): initiative = public vs insider agenda ·
 *   schule-project = login into one school's project · default = plain
 * - the site-frame/chrome + theme seams key off the same resolved value
 *   (domainThemeOverrides is the sibling registry, keyed by domaincode)
 */

/**
 * The preset family as ruled 2026-08-06 (presets thread §6):
 * - 'default' — a small project, typically one person, not very specific (HD)
 * - 'initiative' — collective-led · program-driven (uia is the first instance;
 *   what uia decides becomes the class shape)
 * - 'schule-project' — institutional-B2B · per-booking (sfr; 13.11 sibling)
 * - 'regio' — board-at-centre (recorded so nobody thinks the set is a pair;
 *   not this lane)
 */
export type ProjectPresetKind = 'default' | 'initiative' | 'schule-project' | 'regio'

export const PROJECT_PRESET_KINDS: readonly ProjectPresetKind[] =
    ['default', 'initiative', 'schule-project', 'regio'] as const

function isPresetKind(value: unknown): value is ProjectPresetKind {
    return typeof value === 'string' && (PROJECT_PRESET_KINDS as readonly string[]).includes(value)
}

/**
 * Resolve a project's preset from its `config` JSONB (`{ preset: '…' }`).
 * Unset or unknown → 'default' — the everyday shape, never an error.
 *
 * ⚠ F-1 FINDING (2026-08-06, verified against migrations): `projects.config`
 * is NOT JSONB — migration 036 converted it to INTEGER, with GENERATED COLUMNS
 * depending on it (the aside_ · header_ · footer_ column surface). The MAY record's
 * intended carrier (`config.preset` as a JSONB key) ceased to exist at 036;
 * `schema-definitions/v0.0.2.json` is stale on this. Allocating config BITS is
 * Foundation (HM/HD) — parked, flagged in the presets thread. Until HD rules
 * the db carrier, the binding below (domaincode-keyed, same seam and lifecycle
 * as DOMAIN_THEME_OVERRIDES) is the operative intermediary; this function stays
 * as the shape the future carrier plugs into.
 */
export function resolveProjectPreset(config: unknown): ProjectPresetKind {
    if (config && typeof config === 'object') {
        const preset = (config as Record<string, unknown>).preset
        if (isPresetKind(preset)) return preset
    }
    return 'default'
}

/**
 * The operative intermediary binding — domaincode → preset, in code, exactly
 * like DOMAIN_THEME_OVERRIDES next door. One entry per site until the db
 * carrier lands; the registry then becomes a fallback and empties.
 */
export const DOMAIN_PRESETS: Record<string, ProjectPresetKind> = {
    // uia — the first instance of the class; what uia decides becomes the shape
    utopiaxaction: 'initiative',
}

/** Preset for a site, by domaincode. Registry first, then config, then default. */
export function resolvePresetForDomain(
    domaincode: string | null | undefined,
    config?: unknown,
): ProjectPresetKind {
    if (domaincode && DOMAIN_PRESETS[domaincode]) return DOMAIN_PRESETS[domaincode]
    return resolveProjectPreset(config)
}
