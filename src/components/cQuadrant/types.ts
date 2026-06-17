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

/**
 * The shutter's OWN height-scale (the cDia/Shutter §Außenkreis-r2 ordinal · `full` = the full
 * shutter, down to `none`). The v-line is HEIGHT-CLAMPED against this so a short shutter never grows
 * a too-tall line — the SAME math as cDia/Shutter, so the two components align visually + the spec
 * (and a future heading/text layer) stays reusable across the family (HP 2026-06-16 · A2).
 */
export type ShutterHeightSize = 'full' | 'prominent' | 'medium' | 'small' | 'none'

/* ── the line formula · ported VERBATIM from cDia/Shutter.vue (§Außenkreis-r2) ─────────────────── */
const HEIGHT_LEVEL: Record<ShutterHeightSize, number> = { full: 4, prominent: 3, medium: 2, small: 1, none: 0 }
/** the shutter's pixel height per ordinal, off the held cell-row height (--q-shutter-h · the stage
 *  writes the real px · this is the no-JS fallback ladder). */
export const SHUTTER_HEIGHT_CSS: Record<ShutterHeightSize, string> = {
    full: 'var(--q-shutter-h, 50vh)',
    prominent: 'calc(var(--q-shutter-h, 50vh) * 0.72)',
    medium: 'calc(var(--q-shutter-h, 50vh) * 0.5)',
    small: 'calc(var(--q-shutter-h, 50vh) * 0.3)',
    none: 'auto',
}
const LINE_LEN_LEVEL: Record<LineSize, number> = {
    full: 4, prominent: 3, medium: 2, small: 1, thickline: 4, thinline: 4, hairline: 4, none: 0,
}
const LINE_WEIGHT: Record<LineSize, string> = {
    full: '2px', prominent: '2px', medium: '2px', small: '2px',
    thickline: '4px', thinline: '1px', hairline: '0.5px', none: '0',
}
/** width-based length % (the h-line · unclamped), indexed by level 0..4. */
const LEN_PCT = ['0', '40%', '60%', '80%', '100%'] as const

/** The drawn cross: vertical arm (height-clamped) + horizontal arm (width-based) · each len + weight. */
export interface CrossGeometry {
    vLen: string
    vWt: string
    hLen: string
    hWt: string
}

/**
 * The cross-hair geometry · the cDia/Shutter formula. The V-LINE is HEIGHT-CLAMPED — effective level
 * = `min(vSize, heightLevel + 1)`; its length = `effective / (heightLevel+1)` of the shutter height
 * (→ 100% "runs all through" at the cap). The H-LINE is WIDTH-based (% of width · not clamped).
 * `thick/thin/hairline` set the weight (full length); `none` = off.
 */
export function crossGeometry(vSize: LineSize, hSize: LineSize, height: ShutterHeightSize): CrossGeometry {
    const hLvl = HEIGHT_LEVEL[height]
    const cap = hLvl + 1

    const vLvl = LINE_LEN_LEVEL[vSize]
    let vLen = '0'
    let vWt = '0'
    if (vLvl > 0) {
        const eff = Math.min(vLvl, cap)
        vLen = `${Math.min(100, Math.round((eff / cap) * 100))}%`
        vWt = LINE_WEIGHT[vSize]
    }

    const hLineLvl = LINE_LEN_LEVEL[hSize]
    const hLen = hLineLvl > 0 ? (LEN_PCT[Math.min(hLineLvl, 4)] as string) : '0'
    const hWt = hLineLvl > 0 ? LINE_WEIGHT[hSize] : '0'

    return { vLen, vWt, hLen, hWt }
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
