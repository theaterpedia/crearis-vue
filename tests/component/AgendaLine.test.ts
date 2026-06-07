/**
 * AgendaLine — row-atom anatomy tests (cand-2-baseline Phase-A).
 *
 * Covers the cross-NavStop-canonical row-anatomy + negative-spec compliance:
 *   - Headline-overline rendered when both present (HM canon)
 *   - Left-edge-tint class set per status (cross-NavStop canonical)
 *   - Density-morph driven by [data-density] attribute (NOT v-if)
 *   - Shortcode-pill gated by showShortcode prop (useTemplateCode upstream)
 *   - Trio-inline-right-end emits per-lane click (single-fpostit-on-click,
 *     orbit-cloud NOT used per negative-spec §3.1)
 *   - Trio-count visible only when count > 0
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AgendaLine from '@/components/agenda/AgendaLine.vue'
import type { AgendaLineData } from '@/composables/useAgendaPreset'

function makeLine(overrides: Partial<AgendaLineData> = {}): AgendaLineData {
    return {
        id: 'test-1',
        shortcode: 'A1',
        overline: 'Kursteinstieg · Modul A',
        headline: 'KREIS einführung',
        timeRange: '08:00 – 09:30',
        location: 'Raum-3',
        who: 'HM',
        status: 'planned',
        trio: { positive: 2, warning: 1, negative: 0 },
        ...overrides,
    }
}

describe('AgendaLine', () => {
    it('renders headline + overline + meta-strip', () => {
        const w = mount(AgendaLine, { props: { line: makeLine() } })
        expect(w.find('.agenda-line__headline').text()).toBe('KREIS einführung')
        expect(w.find('.agenda-line__overline').text()).toContain('Modul A')
        expect(w.find('.agenda-line__time').text()).toBe('08:00 – 09:30')
        expect(w.find('.agenda-line__location').text()).toBe('Raum-3')
        expect(w.find('.agenda-line__who').text()).toBe('HM')
    })

    it('omits overline when not provided', () => {
        const w = mount(AgendaLine, {
            props: { line: makeLine({ overline: undefined }) },
        })
        expect(w.find('.agenda-line__overline').exists()).toBe(false)
    })

    it('sets the status-class for the left-edge-tint (planned)', () => {
        const w = mount(AgendaLine, { props: { line: makeLine({ status: 'planned' }) } })
        expect(w.find('.agenda-line').classes()).toContain('status-planned')
    })

    it('sets the status-class for cancelled (cross-NavStop-canonical)', () => {
        const w = mount(AgendaLine, { props: { line: makeLine({ status: 'cancelled' }) } })
        expect(w.find('.agenda-line').classes()).toContain('status-cancelled')
    })

    it('renders the edge-element (3px tint bar) always', () => {
        const w = mount(AgendaLine, { props: { line: makeLine() } })
        expect(w.find('.agenda-line__edge').exists()).toBe(true)
    })

    it('hides shortcode-pill when showShortcode=false (useTemplateCode default)', () => {
        const w = mount(AgendaLine, {
            props: { line: makeLine(), showShortcode: false },
        })
        expect(w.find('.agenda-line__shortcode').exists()).toBe(false)
    })

    it('shows shortcode-pill when showShortcode=true and line.shortcode present', () => {
        const w = mount(AgendaLine, {
            props: { line: makeLine(), showShortcode: true },
        })
        expect(w.find('.agenda-line__shortcode-pill').text()).toBe('A1')
    })

    it('hides shortcode area when showShortcode=true but line.shortcode is absent', () => {
        const w = mount(AgendaLine, {
            props: { line: makeLine({ shortcode: undefined }), showShortcode: true },
        })
        expect(w.find('.agenda-line__shortcode').exists()).toBe(false)
    })

    it('applies [data-density="tiny"] by default', () => {
        const w = mount(AgendaLine, { props: { line: makeLine() } })
        expect(w.find('.agenda-line').attributes('data-density')).toBe('tiny')
    })

    it('applies [data-density="fancy"] when density prop is fancy', () => {
        const w = mount(AgendaLine, {
            props: { line: makeLine(), density: 'fancy' },
        })
        expect(w.find('.agenda-line').attributes('data-density')).toBe('fancy')
    })

    it('renders all three trio-slots (positive · warning · negative)', () => {
        const w = mount(AgendaLine, { props: { line: makeLine() } })
        const slots = w.findAll('.agenda-line__trio-slot')
        expect(slots).toHaveLength(3)
        expect(slots[0]?.classes()).toContain('agenda-line__trio-slot--positive')
        expect(slots[1]?.classes()).toContain('agenda-line__trio-slot--warning')
        expect(slots[2]?.classes()).toContain('agenda-line__trio-slot--negative')
    })

    it('shows count badge only when count > 0', () => {
        const w = mount(AgendaLine, {
            props: { line: makeLine({ trio: { positive: 3, warning: 0, negative: 1 } }) },
        })
        const counts = w.findAll('.agenda-line__trio-count')
        expect(counts).toHaveLength(2)
        expect(counts[0]?.text()).toBe('3')
        expect(counts[1]?.text()).toBe('1')
    })

    it('omits all count badges when trio is undefined (defaults to zeros)', () => {
        const w = mount(AgendaLine, {
            props: { line: makeLine({ trio: undefined }) },
        })
        expect(w.findAll('.agenda-line__trio-count')).toHaveLength(0)
    })

    it('emits trio-click with the lane key + line on slot click (single-fpostit discipline)', async () => {
        const line = makeLine()
        const w = mount(AgendaLine, { props: { line } })
        await w.find('.agenda-line__trio-slot--warning').trigger('click')
        const emitted = w.emitted('trio-click')
        expect(emitted).toBeTruthy()
        expect(emitted![0]).toEqual(['warning', line])
    })

    it('does not propagate trio-click to row-click handler (stop-propagation)', async () => {
        const line = makeLine()
        const w = mount(AgendaLine, { props: { line } })
        await w.find('.agenda-line__trio-slot--positive').trigger('click')
        expect(w.emitted('click')).toBeFalsy()
    })

    it('emits row-click on body-click (drives mode-switch upstream)', async () => {
        const line = makeLine()
        const w = mount(AgendaLine, { props: { line } })
        await w.find('.agenda-line__body').trigger('click')
        expect(w.emitted('click')?.[0]).toEqual([line])
    })

    it('exposes data-line-id on the root for downstream selection-state', () => {
        const w = mount(AgendaLine, { props: { line: makeLine({ id: 'sp-a7' }) } })
        expect(w.find('.agenda-line').attributes('data-line-id')).toBe('sp-a7')
    })
})
