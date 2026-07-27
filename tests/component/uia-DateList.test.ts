/**
 * UiaDateList — the 15-Mittwoch run, and the one rule that keeps it readable.
 *
 * Scope note: the *agenda rows* are `ItemList :items` fed from `agendaItems`
 * (see tests/unit/uia-items.test.ts). This component keeps only the job ItemList
 * cannot do — a run of dates where each one carries its own §4 status.
 *
 * `_CUTTER-PROMPT.md` §4/§status-colour: taxonomy and status share three hues, so
 * they are separated **by form** (bahn.de grammar) —
 *
 *   taxonomy → the band / frame / rule                (chrome)
 *   status   → coloured text or a dot, on ONE field   (never the whole row)
 *
 * That is a claim about the rendered DOM, not about a comment, so it is tested
 * here: the row rule reads the taxonomy var, the status field reads the status
 * var, and neither ever reaches the other.
 */

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiaDateList from '@/views/Uia/UiaDateList.vue'
import { live } from '@/views/Uia/content/agenda'

/** All future relative to any plausible run-date of this suite. */
const FUTURE = ['23.09.99', '30.09.99', '07.10.99']
/** All past, likewise. */
const PAST = ['05.01.22', '12.01.22']

function mountList(props: Record<string, unknown> = {}) {
    return mount(UiaDateList, { props: { dates: FUTURE, ...props } })
}

describe('UiaDateList · rows', () => {
    it('renders one row per date, in file order', () => {
        const w = mountList()
        expect(w.findAll('.uia-datelist-row')).toHaveLength(FUTURE.length)
        // 23.09.2099 happens to be a Wednesday too.
        expect(w.findAll('.uia-datelist-date')[0]?.text()).toBe('MI 23.09.99')
    })

    it('renders the whole run — all 15 Mittwochs, not a truncated sample', () => {
        const w = mountList({ dates: live.dates })
        expect(w.findAll('.uia-datelist-row')).toHaveLength(15)
        expect(w.findAll('.uia-datelist-date')[0]?.text()).toBe('MI 23.09.26')
        expect(w.findAll('.uia-datelist-date')[14]?.text()).toBe('MI 20.01.27')
    })

    it('carries the shared time-of-day only when the content gives one', () => {
        expect(mountList().find('.uia-datelist-time').exists()).toBe(false)
        expect(mountList({ time: '19:00 – 21:00 Uhr' }).find('.uia-datelist-time').text())
            .toBe('19:00 – 21:00 Uhr')
    })
})

describe('UiaDateList · §4 taxonomy stays on the chrome', () => {
    it('binds the Veranstaltungen (negative/red) token as the taxonomy var', () => {
        const style = mountList().attributes('style') ?? ''
        expect(style).toContain('--uia-taxonomy-bg: var(--color-negative-bg)')
    })

    it('never hardcodes a colour — theme 3 has to stay switchable (§3)', () => {
        const html = mountList().html()
        expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
        expect(html).not.toMatch(/\b(rgb|hsl|oklch)\(/)
    })
})

describe('UiaDateList · §4 status stays on one field', () => {
    it('puts the status on its own field, with a dot AND its word', () => {
        const status = mountList().findAll('.uia-datelist-status')[0]
        expect(status?.find('.uia-datelist-status-dot').exists()).toBe(true)
        // Colour alone must never carry the signal.
        expect(status?.find('.uia-datelist-status-label').text()).toBe('findet statt')
    })

    it('colours the status field from the status token, not the taxonomy token', () => {
        const style = mountList().findAll('.uia-datelist-status')[0]?.attributes('style') ?? ''
        expect(style).toContain('--uia-status-bg: var(--color-positive-bg)')
        expect(style).not.toContain('taxonomy')
    })

    it('does not put a status var on the row itself — never the whole row', () => {
        expect(mountList().findAll('.uia-datelist-row')[0]?.attributes('style')).toBeUndefined()
    })

    it('marks a past beat „abgeschlossen" and keeps it green', () => {
        const w = mountList({ dates: PAST })
        expect(w.findAll('.uia-datelist-row')[0]?.classes()).toContain('uia-datelist-row-past')
        expect(w.findAll('.uia-datelist-status-label')[0]?.text()).toBe('abgeschlossen')
        // §4: a completed thing is not an error state.
        expect(w.findAll('.uia-datelist-status')[0]?.attributes('style'))
            .toContain('var(--color-positive-bg)')
    })

    it('never renders the two states that would need a live source', () => {
        const labels = mountList({ dates: live.dates })
            .findAll('.uia-datelist-status-label')
            .map((n) => n.text())
        expect(labels).not.toContain('Schwelle noch nicht erreicht')
        expect(labels).not.toContain('Anmeldung geschlossen')
    })
})
