/**
 * cQuadrant — the held 2×2 grid-stage family. A component that sits BETWEEN the blackboard
 * (CardsCanvas · lane-positioned post-its + heading) and the Dia (cDia · the held plate + the
 * Shutter's cross-lines). NOT magnifica-local — view-agnostic, magnifica consumes it.
 *
 * The shape (names from the GEOMETRY · not Dia/Figur · per HP-spec 2026-06-16):
 *   · QuadrantStage — the assembler (the held grid + the sweeping seam + the scroll-reveals)
 *   · Quadrant      — one cell (q1..q4 · background always-shown · content reveal-gated)
 *   · QuadrantSeam  — the 50vH blade carrying the CROSS-HAIR (the 2×2 divider) · emits edge-events
 *   · SeamLine      — the cross sub-element (the line-geometry lifted from cDia/Shutter, NOT the
 *                     whole Shutter · per spec "maybe some sub-elements")
 *
 * ── load-bearing constraints inherited from the family (backslide §9.1/§12/§34.3) ──
 *   · ANCESTOR-PURITY — the stage + EVERY ancestor stay plain blocks (no transform/filter/overflow-
 *     non-visible/contain/will-change) so the held quadrant's `position: sticky` never un-pins.
 *   · STANDARDS-FLOOR — var(--color-*) · square (no border-radius) · OKLCH · route-local theme.
 *   · --mag-bound/96rem — the shared geometry-token for `bounded`.
 *
 * ── the one principled divergence (the gap-test for THIS family · HP-sanctioned 2026-06-16) ──
 *   cDia's law is "JS configures, CSS runs". The Quadrant's reveal IS its choreography, so JS here
 *   ALSO drives a BOUNDED visibility toggle: the seam emits edge-events (IntersectionObserver on its
 *   own top/bottom · NOT a per-frame scroll-driver) and the stage flips row-visibility. The no-JS /
 *   reduced-motion floor = everything visible (never a hidden-forever trap).
 */

/** focal · Hero's aspect-engine vocab → background-position (via the prop, NEVER :deep · cDia gotcha #1). */
export type QuadrantAlignX = 'left' | 'center' | 'right'
export type QuadrantAlignY = 'top' | 'center' | 'bottom'

/** bg-color token (the magnifica theme-palette · maps to the OKLCH --color-*-bg pairs). */
export type QuadrantTheme = 'yellow' | 'green' | 'pink' | 'dim'

/** which side the heading sits in the cell (the blackboard heading-left/right gene). */
export type HeadingSide = 'left' | 'right'

/**
 * The LINE scale (length × weight) — lifted verbatim from cDia/Shutter's §Außenkreis-r2 ordinal
 * scale so the cross reads as one family-vocabulary. `full..small` = LENGTH levels; `thick/thin/
 * hairline` = WEIGHT (full length); `none` = off.
 */
export type LineSize =
    | 'full'
    | 'prominent'
    | 'medium'
    | 'small'
    | 'thickline'
    | 'thinline'
    | 'hairline'
    | 'none'

/* ── the line formula (ported from cDia/Shutter.vue · the cross is two of these) ───────────────── */
const LINE_LEN_LEVEL: Record<LineSize, number> = {
    full: 4, prominent: 3, medium: 2, small: 1, thickline: 4, thinline: 4, hairline: 4, none: 0,
}
const LINE_WEIGHT: Record<LineSize, string> = {
    full: '2px', prominent: '2px', medium: '2px', small: '2px',
    thickline: '4px', thinline: '1px', hairline: '0.5px', none: '0',
}
/** length as % of the box dimension, indexed by level 0..4. */
const LEN_PCT = ['0', '40%', '60%', '80%', '100%'] as const

/** A drawn line: its length (% of the box) + its weight (px). `none` → both 0 (invisible). */
export interface LineGeometry {
    len: string
    weight: string
}

export function lineGeometry(size: LineSize): LineGeometry {
    const lvl = LINE_LEN_LEVEL[size]
    if (lvl <= 0) return { len: '0', weight: '0' }
    return { len: LEN_PCT[Math.min(lvl, 4)] as string, weight: LINE_WEIGHT[size] }
}

/** A colour-token → its CSS var (`bg` → --color-bg · else → --color-{token}-bg). */
export function colorVar(token: string | undefined, fallback: string): string {
    if (!token) return fallback
    return token === 'bg' ? 'var(--color-bg)' : `var(--color-${token}-bg)`
}

/**
 * One **Quadrant** — a cell of the 2×2 grid (q1/q2 top-row · q3/q4 bottom-row · top-left first).
 * The BACKGROUND (image and/or theme-colour) is always shown; the CONTENT (heading + the in-place
 * sub-element) is what the scroll-reveal gates visible (HP-A3: in-place, revealed · not floating).
 */
export interface QuadrantSpec {
    /** anchor / key (q1..q4 by default · index-derived if omitted). */
    id?: string
    /** background image · element-anchored (omit → colour-only cell). */
    image?: string
    imageAlt?: string
    /** focal · the image always FILLS the cell (cover · cut-off · the mobile 1:1 always-fill intent). */
    imgTmpAlignX?: QuadrantAlignX
    imgTmpAlignY?: QuadrantAlignY
    /** background colour-token (the theme-palette · omit → page bg / transparent over the image). */
    theme?: QuadrantTheme
    /** the cell heading · crearis-md "overline **HEADLINE** subline" → HeadingParser (blackboard-style). */
    heading?: string
    /** heading level (the spec's H3/H4) · default h3. */
    headingAs?: 'h3' | 'h4'
    /** which side the heading sits (the blackboard heading-left/right gene · default left). */
    headingSide?: HeadingSide
}
