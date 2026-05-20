/**
 * AgendaDayGroup + AgendaLineList — composition tests (cand-2-baseline Phase-A).
 *
 * Covers:
 *   - Day-header label + line-count badge render correctly
 *   - Each line in the group's lines array gets an AgendaLine instance
 *   - Density attribute cascades from list → group → line
 *   - Cross-preset proof: same component-tree renders BOTH schule-project +
 *     initiative mock data identically — only data differs
 *   - Trio-click + line-click event-bubbling through DayGroup → List
 *   - Empty state when dayGroups is []
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AgendaDayGroup from '@/components/agenda/AgendaDayGroup.vue'
import AgendaLineList from '@/components/agenda/AgendaLineList.vue'
import {
    resolveAgendaForPreset,
    type AgendaDayGroupData,
} from '@/composables/useAgendaPreset'

function makeGroup(): AgendaDayGroupData {
    return {
        date: '2026-06-15',
        label: 'MO 2026-06-15',
        lines: [
            {
                id: 'g-1',
                headline: 'Test headline 1',
                timeRange: '08:00',
                status: 'planned',
                trio: { positive: 1, warning: 0, negative: 0 },
            },
            {
                id: 'g-2',
                headline: 'Test headline 2',
                timeRange: '09:00',
                status: 'active',
                trio: { positive: 0, warning: 2, negative: 0 },
            },
        ],
    }
}

describe('AgendaDayGroup', () => {
    it('renders the day-label + count', () => {
        const w = mount(AgendaDayGroup, { props: { group: makeGroup() } })
        expect(w.find('.agenda-day-group__label').text()).toBe('MO 2026-06-15')
        expect(w.find('.agenda-day-group__count').text()).toBe('2')
    })

    it('renders one AgendaLine per line in the group', () => {
        const w = mount(AgendaDayGroup, { props: { group: makeGroup() } })
        expect(w.findAll('.agenda-line')).toHaveLength(2)
    })

    it('passes density="fancy" down to all child AgendaLines via attribute-cascade', () => {
        const w = mount(AgendaDayGroup, {
            props: { group: makeGroup(), density: 'fancy' },
        })
        expect(w.find('.agenda-day-group').attributes('data-density')).toBe('fancy')
        const lines = w.findAll('.agenda-line')
        for (const line of lines) {
            expect(line.attributes('data-density')).toBe('fancy')
        }
    })

    it('passes showShortcode through to children', () => {
        const group = makeGroup()
        group.lines[0]!.shortcode = 'X1'
        const w = mount(AgendaDayGroup, {
            props: { group, showShortcode: true },
        })
        expect(w.find('.agenda-line__shortcode-pill').text()).toBe('X1')
    })

    it('bubbles line-click events up from children', async () => {
        const w = mount(AgendaDayGroup, { props: { group: makeGroup() } })
        await w.find('[data-line-id="g-2"] .agenda-line__body').trigger('click')
        const emitted = w.emitted('line-click')
        expect(emitted).toBeTruthy()
        expect((emitted![0] as [unknown])[0]).toMatchObject({ id: 'g-2' })
    })

    it('bubbles trio-click events up with (lane, line) signature', async () => {
        const w = mount(AgendaDayGroup, { props: { group: makeGroup() } })
        await w
            .find('[data-line-id="g-1"] .agenda-line__trio-slot--positive')
            .trigger('click')
        const emitted = w.emitted('trio-click')
        expect(emitted).toBeTruthy()
        expect(emitted![0]?.[0]).toBe('positive')
    })
})

describe('AgendaLineList', () => {
    it('renders one AgendaDayGroup per day in dayGroups', () => {
        const dayGroups = resolveAgendaForPreset('schule-project')
        const w = mount(AgendaLineList, { props: { dayGroups } })
        expect(w.findAll('.agenda-day-group')).toHaveLength(dayGroups.length)
    })

    it('renders empty-state when dayGroups is []', () => {
        const w = mount(AgendaLineList, { props: { dayGroups: [] } })
        expect(w.find('.agenda-line-list__empty').exists()).toBe(true)
        expect(w.findAll('.agenda-day-group')).toHaveLength(0)
    })

    it('applies [data-density] at list-level so the cascade reaches every leaf', () => {
        const dayGroups = resolveAgendaForPreset('initiative')
        const w = mount(AgendaLineList, {
            props: { dayGroups, density: 'fancy' },
        })
        expect(w.find('.agenda-line-list').attributes('data-density')).toBe('fancy')
        const allLines = w.findAll('.agenda-line')
        for (const line of allLines) {
            expect(line.attributes('data-density')).toBe('fancy')
        }
    })

    it('cross-preset proof: schule-project renders with the same component-tree as initiative', () => {
        const sp = mount(AgendaLineList, {
            props: { dayGroups: resolveAgendaForPreset('schule-project') },
        })
        const init = mount(AgendaLineList, {
            props: { dayGroups: resolveAgendaForPreset('initiative') },
        })
        // Same component-types present in both renders — architectural-claim verification
        expect(sp.findAll('.agenda-day-group').length).toBeGreaterThan(0)
        expect(init.findAll('.agenda-day-group').length).toBeGreaterThan(0)
        expect(sp.findAll('.agenda-line').length).toBeGreaterThan(0)
        expect(init.findAll('.agenda-line').length).toBeGreaterThan(0)
        // Differ in data — first headlines come from different mock sets
        const spFirst = sp.find('.agenda-line__headline').text()
        const initFirst = init.find('.agenda-line__headline').text()
        expect(spFirst).not.toBe(initFirst)
    })

    it('bubbles line-click through DayGroup to List consumer', async () => {
        const dayGroups = resolveAgendaForPreset('schule-project')
        const w = mount(AgendaLineList, { props: { dayGroups } })
        const firstLine = dayGroups[0]!.lines[0]!
        await w.find(`[data-line-id="${firstLine.id}"] .agenda-line__body`).trigger('click')
        const emitted = w.emitted('line-click')
        expect(emitted).toBeTruthy()
        expect((emitted![0] as [unknown])[0]).toMatchObject({ id: firstLine.id })
    })

    it('bubbles trio-click through DayGroup to List consumer with lane', async () => {
        const dayGroups = resolveAgendaForPreset('schule-project')
        const w = mount(AgendaLineList, { props: { dayGroups } })
        const firstLine = dayGroups[0]!.lines[0]!
        await w
            .find(`[data-line-id="${firstLine.id}"] .agenda-line__trio-slot--positive`)
            .trigger('click')
        const emitted = w.emitted('trio-click')
        expect(emitted).toBeTruthy()
        expect(emitted![0]?.[0]).toBe('positive')
    })
})
