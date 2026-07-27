/**
 * UiaDateList — the agenda rows, and the one rule that keeps them readable.
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

const DATES = ['23.09.26', '30.09.26', '07.10.26', '14.10.26']

function mountList(props: Record<string, unknown> = {}) {
    return mount(UiaDateList, {
        props: { dates: DATES, title: 'Meine Grenzen', ...props },
        global: { stubs: { RouterLink: true } },
    })
}

describe('UiaDateList · rows', () => {
    it('renders one row per date, in file order', () => {
        const w = mountList()
        const rows = w.findAll('.uia-datelist-row')
        expect(rows).toHaveLength(DATES.length)
        expect(w.findAll('.uia-datelist-date')[0]?.text()).toBe('MI 23.09.26')
    })

    it('leads each row with the weekday-prefixed date and repeats the title', () => {
        const w = mountList({ time: '19:00 – 21:00 Uhr' })
        const first = w.findAll('.uia-datelist-row')[0]
        expect(first?.find('.uia-datelist-date').text()).toBe('MI 23.09.26')
        expect(first?.find('.uia-datelist-time').text()).toBe('19:00 – 21:00 Uhr')
        expect(first?.find('.uia-datelist-title').text()).toBe('Meine Grenzen')
    })

    it('honours `limit` — the landing shows only `agendaTeaser.limit` rows', () => {
        expect(mountList({ limit: 3 }).findAll('.uia-datelist-row')).toHaveLength(3)
    })

    it('renders the grey subline only when the content provides one', () => {
        expect(mountList().find('.uia-datelist-subline').exists()).toBe(false)
        expect(mountList({ subline: 'Ballettakademie assemblé' }).find('.uia-datelist-subline').text())
            .toBe('Ballettakademie assemblé')
    })
})

describe('UiaDateList · §4 taxonomy stays on the chrome', () => {
    it('binds the Veranstaltungen (negative/red) token as the taxonomy var', () => {
        const style = mountList().find('.uia-datelist').attributes('style') ?? ''
        expect(style).toContain('--uia-taxonomy-bg: var(--color-negative-bg)')
    })

    it('never hardcodes a colour — theme 3 has to stay switchable (§3)', () => {
        const html = mountList({ variant: 'teaser' }).html()
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
        const status = mountList().findAll('.uia-datelist-status')[0]
        const style = status?.attributes('style') ?? ''
        expect(style).toContain('--uia-status-bg: var(--color-positive-bg)')
        expect(style).not.toContain('taxonomy')
    })

    it('does not put a status var on the row itself — never the whole row', () => {
        const row = mountList().findAll('.uia-datelist-row')[0]
        expect(row?.attributes('style')).toBeUndefined()
    })

    it('marks a past beat „abgeschlossen" and keeps it green', () => {
        // These are all in 2022, so they are past no matter when this runs.
        const w = mount(UiaDateList, {
            props: { dates: ['05.01.22', '12.01.22'], title: 'Meine Grenzen' },
        })
        const rows = w.findAll('.uia-datelist-row')
        expect(rows[0]?.classes()).toContain('uia-datelist-row-past')
        expect(w.findAll('.uia-datelist-status-label')[0]?.text()).toBe('abgeschlossen')
        // §4: a completed thing is not an error state.
        expect(w.findAll('.uia-datelist-status')[0]?.attributes('style'))
            .toContain('var(--color-positive-bg)')
    })
})

describe('UiaDateList · variants', () => {
    it('compact carries no thumbnails — the rules do the work', () => {
        const w = mountList({ variant: 'compact' })
        expect(w.find('.uia-datelist-thumb').exists()).toBe(false)
        expect(w.classes()).toContain('uia-datelist-compact')
    })

    it('teaser carries the thumbnail plus the taxonomy corner-triangle', () => {
        const w = mountList({ variant: 'teaser', limit: 3 })
        expect(w.findAll('.uia-datelist-thumb')).toHaveLength(3)
        expect(w.findAll('.uia-datelist-corner')).toHaveLength(3)
    })

    it('shows the „Bild folgt" placeholder while every image is still `TODO HP` (§8)', () => {
        const w = mountList({ variant: 'teaser', limit: 1, image: 'TODO HP', imageAlt: 'zwei Figuren' })
        expect(w.find('.uia-image-img').exists()).toBe(false)
        const placeholder = w.find('.uia-image-placeholder')
        expect(placeholder.exists()).toBe(true)
        // The alt-text renders, so HP can see which source belongs in which slot.
        expect(placeholder.attributes('aria-label')).toBe('zwei Figuren')
    })

    it('renders the real image with its declared focal once a URL exists', () => {
        const w = mountList({
            variant: 'teaser',
            limit: 1,
            image: 'https://example.test/meine_grenzen1.jpg',
            imageAlt: 'zwei Figuren',
            focal: '50% 35%',
        })
        const img = w.find('.uia-image-img')
        expect(img.attributes('src')).toBe('https://example.test/meine_grenzen1.jpg')
        expect(img.attributes('alt')).toBe('zwei Figuren')
        // §8: declare the focal, do not trust the default — the two hands must hold.
        expect(img.attributes('style')).toContain('object-position: 50% 35%')
    })
})
