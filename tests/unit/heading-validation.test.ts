/**
 * crearis-md heading validation.
 *
 * `Heading.vue` renders either an overline or a subline, never both — by design
 * (HD 2026-07-28), because all three would overflow. But `HeadingParser` parses
 * three parts happily and the third is dropped **silently**, so authored words
 * vanish with no error. This validator refuses such a string on write.
 *
 * The risk in a rule like this is over-rejection: the empty-headline forms
 * (`"** **subline"`, `"overline** **"`) are documented conventions and are emitted
 * by `ItemList` for images. Half these tests exist to keep those working.
 */

import { describe, expect, it } from 'vitest'
import { validateCrearisHeading, validateHeadingFields } from '../../server/utils/heading-validation'

describe('rejects the three-part form — the whole point', () => {
    it('rejects overline + headline + subline', () => {
        const r = validateCrearisHeading('ab MI 23.09.26 **Meine Grenzen** ein Tanztheater-Projekt')
        expect(r.ok).toBe(false)
        // The message must name what would be lost, or the author cannot fix it.
        expect(r.reason).toContain('ein Tanztheater-Projekt')
        expect(r.reason).toContain('dropped silently')
    })

    it('rejects even when the parts are short', () => {
        expect(validateCrearisHeading('a **b** c').ok).toBe(false)
    })

    it('rejects when the third part is only punctuation', () => {
        expect(validateCrearisHeading('over **HEAD** ·').ok).toBe(false)
    })
})

describe('accepts every legitimate form', () => {
    it('accepts overline + headline', () => {
        expect(validateCrearisHeading('MI 23.09.26 · 19:00 – 21:00 Uhr **Meine Grenzen**').ok).toBe(true)
    })

    it('accepts headline + subline', () => {
        expect(validateCrearisHeading('**Meine Grenzen** ein Tanztheater-Projekt').ok).toBe(true)
    })

    it('accepts headline alone', () => {
        expect(validateCrearisHeading('**Meine Grenzen**').ok).toBe(true)
    })

    it('accepts plain text with no ** at all — HeadingParser treats it as the headline', () => {
        expect(validateCrearisHeading('Unsere Agenda').ok).toBe(true)
    })

    it('accepts the documented empty-headline forms (Prose.vue:55)', () => {
        // "** **subline" and "overline** **" are conventions, not mistakes.
        expect(validateCrearisHeading('** **ein Bild aus dem Ma(g)dalena-LAB').ok).toBe(true)
        expect(validateCrearisHeading('Foto: Grandhotel** **').ok).toBe(true)
    })

    it('accepts what ItemList emits for images', () => {
        // ItemList.vue:552 · `** **${entity.about}`
        expect(validateCrearisHeading('** **Konstrukt „Frau"').ok).toBe(true)
    })

    it('tolerates whitespace-only sides rather than counting them as a part', () => {
        expect(validateCrearisHeading('   **HEAD**   ').ok).toBe(true)
    })
})

describe('rejects ambiguous marker use', () => {
    it('rejects more than one **…** pair — the extras would render as literal asterisks', () => {
        const r = validateCrearisHeading('**one** and **two**')
        expect(r.ok).toBe(false)
        expect(r.reason).toContain('more than one')
    })
})

describe('absent is not malformed', () => {
    it('accepts null, undefined and empty', () => {
        expect(validateCrearisHeading(null).ok).toBe(true)
        expect(validateCrearisHeading(undefined).ok).toBe(true)
        expect(validateCrearisHeading('').ok).toBe(true)
        expect(validateCrearisHeading('   ').ok).toBe(true)
    })

    it('rejects a non-string', () => {
        expect(validateCrearisHeading(42).ok).toBe(false)
        expect(validateCrearisHeading({}).ok).toBe(false)
    })
})

describe('validateHeadingFields', () => {
    it('passes when every field is fine', () => {
        expect(validateHeadingFields({ heading: '**ok**', subheading: null }).ok).toBe(true)
    })

    it('names the offending field so the operator knows which one to fix', () => {
        const r = validateHeadingFields({ teaser: null, heading: 'a **b** c' })
        expect(r.ok).toBe(false)
        expect(r.reason).toMatch(/^heading: /)
    })

    it('accepts an empty field set', () => {
        expect(validateHeadingFields({}).ok).toBe(true)
    })
})
