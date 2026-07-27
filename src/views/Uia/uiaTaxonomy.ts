/**
 * uia · the three taxonomies and the tokens that carry them.
 *
 * `_CUTTER-PROMPT.md` §4, in code. Three taxonomies · three colours · three
 * shapes, as drawn in `X_Assets/UI_community_3colors_3taxonomies*.png`.
 *
 * ── The rule this module exists to enforce ───────────────────────────────────
 * Taxonomy and status share the same three hues, so they are separated **by
 * form**, the way the bahn.de display does it (`X_Assets/UI_bahn_1.jpg`):
 *
 *   taxonomy → the band, frame, or dotted rule    (chrome — this module)
 *   status   → coloured text or a dot, ONE field  (see ./uiaDates.ts)
 *
 * Nothing here ever colours a whole row, and nothing in `uiaDates.ts` ever
 * colours chrome. That separation is the entire readability argument.
 */

export type UiaTaxonomy = 'arbeitsformen' | 'veranstaltungen' | 'akteure'

/** Semantic token driving a taxonomy's chrome. Maps to `--color-{token}-bg`. */
export type UiaTaxonomyToken = 'positive' | 'negative' | 'warning'

export const UIA_TAXONOMY: Record<UiaTaxonomy, { label: string; token: UiaTaxonomyToken }> = {
    /** The methods · green · portrait card in a coloured frame. */
    arbeitsformen: { label: 'Arbeitsformen', token: 'positive' },
    /** The dates · red · row-list, title left / date right / grey subline / rules. */
    veranstaltungen: { label: 'Veranstaltungen', token: 'negative' },
    /** The people and the orgs · yellow · wide landscape card. */
    akteure: { label: 'Akteure', token: 'warning' },
}

/**
 * CSS custom-properties for a taxonomy's chrome, for `:style` binding.
 *
 * Returns theme tokens, never literal colours — theme 3 „Institut" is the
 * initial theme but it must stay switchable (§3), so a hardcoded hex here
 * would break the one thing HP wants to compare.
 */
export function taxonomyVars(taxonomy: UiaTaxonomy): Record<string, string> {
    const token = UIA_TAXONOMY[taxonomy].token
    return {
        '--uia-taxonomy-bg': `var(--color-${token}-bg)`,
        '--uia-taxonomy-contrast': `var(--color-${token}-contrast)`,
    }
}
