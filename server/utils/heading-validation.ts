/**
 * Validation for crearis-md heading strings — `"overline **HEADLINE** subline"`.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * `Heading.vue` renders **either** an overline **or** a subline, never both:
 *
 *     hasOverline = overline || (!subline && tags)
 *     hasSubline  = !hasOverline && (subline || tags)
 *
 * and the `subline` prop's own doc says *"Only shows up, if no overline is
 * provided"*. That is **by design** (HD 2026-07-28) — rendering all three would
 * overflow the layout everywhere.
 *
 * But `HeadingParser` happily parses a three-part string and hands all three on,
 * so the third part is dropped **silently**. Nothing upstream stops such a string
 * from being stored in the first place, which is the actual gap: authored words
 * disappear with no error, no warning, and no trace.
 *
 * So: reject on write. HD's call, 2026-07-28 — reject rather than truncate,
 * because truncation silently discards someone's words, and for this project the
 * authored text IS the data.
 *
 * ── Where crearis-md headings are actually stored ────────────────────────────
 * `projects.heading` · `page_sections.heading` · `hero_overrides.heading`.
 * (`events.rectitle` is a different thing — an Odoo-convention display title with
 * a domain prefix — and is deliberately not covered here.)
 *
 * ── What is legitimate, and must keep working ───────────────────────────────
 * Two-part and one-part forms are all valid, including the empty-headline forms
 * that `Prose.vue:55` documents (`"** **subline"`, `"overline** **"`) and that
 * `ItemList.vue:552` emits for images. Plain text with no `**` at all is valid too
 * — `HeadingParser` treats it as headline-only. Only the three-part form is wrong.
 */

/** A heading may carry at most two of {overline, headline, subline}. */
export interface HeadingValidation {
    ok: boolean
    /** Operator-facing explanation. Present only when `ok` is false. */
    reason?: string
}

const OK: HeadingValidation = { ok: true }

/** Same regex `HeadingParser` uses, so validation and parsing cannot disagree. */
const HEADING_PATTERN = /^(.*?)\*\*(.*?)\*\*(.*)$/

/**
 * Validate one crearis-md heading string.
 *
 * Accepts null/undefined/empty — "no heading" is not a malformed heading, and
 * making this the place that enforces required-ness would blur two concerns.
 */
export function validateCrearisHeading(value: unknown): HeadingValidation {
    if (value === null || value === undefined) return OK
    if (typeof value !== 'string') {
        return { ok: false, reason: 'heading must be a string' }
    }
    if (value.trim() === '') return OK

    const match = HEADING_PATTERN.exec(value)
    // No `**` pair at all → HeadingParser treats the whole string as the headline.
    if (!match) return OK

    const [, before, , after] = match as unknown as [string, string, string, string]

    // More than one `**…**` pair: HeadingParser's non-greedy regex would leave the
    // extra markers sitting inside the subline as literal asterisks. Ambiguous
    // input that renders wrongly rather than failing, so it is refused too.
    if (after.includes('**')) {
        return {
            ok: false,
            reason: 'heading contains more than one **…** pair — use exactly one, '
                + 'as "overline **HEADLINE**" or "**HEADLINE** subline"',
        }
    }

    const hasOverline = before.trim() !== ''
    const hasSubline = after.trim() !== ''

    if (hasOverline && hasSubline) {
        return {
            ok: false,
            reason: 'heading has an overline AND a subline; Heading.vue renders only one of '
                + `them, so "${after.trim()}" would be dropped silently. Use either `
                + '"overline **HEADLINE**" or "**HEADLINE** subline".',
        }
    }

    return OK
}

/**
 * Validate several heading-bearing fields at once.
 *
 * @param fields  field-name → value, e.g. `{ heading: body.heading }`
 * @returns the first failure with its field name prefixed, or ok
 */
export function validateHeadingFields(fields: Record<string, unknown>): HeadingValidation {
    for (const [name, value] of Object.entries(fields)) {
        const result = validateCrearisHeading(value)
        if (!result.ok) return { ok: false, reason: `${name}: ${result.reason}` }
    }
    return OK
}
