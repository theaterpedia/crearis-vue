/**
 * useAgendaPreset — mock-resolver + reactive composable tests (cand-2-baseline Phase-A).
 *
 * Cross-preset proof-target verification: same composable surface returns
 * data for both schule-project (freundes-kreis) + initiative (uia) presets.
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import {
    resolveAgendaForPreset,
    useAgendaPreset,
    AGENDA_PRESET_MOCKS,
    type AgendaPresetKind,
} from '@/composables/useAgendaPreset'

describe('resolveAgendaForPreset (pure resolver)', () => {
    it('returns the schule-project mock dataset', () => {
        const groups = resolveAgendaForPreset('schule-project')
        expect(groups.length).toBeGreaterThan(0)
        expect(groups[0]?.lines[0]?.headline).toContain('KREIS')
    })

    it('returns the initiative mock dataset', () => {
        const groups = resolveAgendaForPreset('initiative')
        expect(groups.length).toBeGreaterThan(0)
        // Initiative uses UiA Forum-Theater Workshop-#1 anchor content
        const all = groups.flatMap((g) => g.lines)
        expect(all.some((l) => l.headline.includes('Forum-Theater'))).toBe(true)
    })

    it('schule-project mock has at least 2 day-groups (multi-day workshop)', () => {
        const groups = resolveAgendaForPreset('schule-project')
        expect(groups.length).toBeGreaterThanOrEqual(2)
    })

    it('initiative mock has at least 3 day-groups (Kernprogramm Mittwochs-rhythm)', () => {
        const groups = resolveAgendaForPreset('initiative')
        expect(groups.length).toBeGreaterThanOrEqual(3)
    })

    it('every line carries the canonical row-data fields', () => {
        const allLines = [
            ...resolveAgendaForPreset('schule-project').flatMap((g) => g.lines),
            ...resolveAgendaForPreset('initiative').flatMap((g) => g.lines),
        ]
        for (const line of allLines) {
            expect(line.id).toBeTruthy()
            expect(line.headline).toBeTruthy()
            expect(line.timeRange).toBeTruthy()
            expect(line.status).toBeTruthy()
        }
    })

    it('every line uses one of the 5 canonical status values', () => {
        const validStatuses = new Set([
            'planned',
            'active',
            'confirmed',
            'cancelled',
            'documented',
        ])
        const allLines = [
            ...resolveAgendaForPreset('schule-project').flatMap((g) => g.lines),
            ...resolveAgendaForPreset('initiative').flatMap((g) => g.lines),
        ]
        for (const line of allLines) {
            expect(validStatuses.has(line.status)).toBe(true)
        }
    })

    it('AGENDA_PRESET_MOCKS keys exactly match AgendaPresetKind union', () => {
        const keys: AgendaPresetKind[] = ['schule-project', 'initiative']
        expect(Object.keys(AGENDA_PRESET_MOCKS).sort()).toEqual(keys.sort())
    })
})

describe('useAgendaPreset (reactive composable)', () => {
    it('exposes dayGroups + lineCount that update when preset ref changes', () => {
        const preset = ref<AgendaPresetKind>('schule-project')
        const { dayGroups, lineCount } = useAgendaPreset(preset)

        const initialCount = lineCount.value
        expect(initialCount).toBeGreaterThan(0)
        const initialFirst = dayGroups.value[0]?.label
        expect(initialFirst).toBeTruthy()

        preset.value = 'initiative'
        expect(lineCount.value).toBeGreaterThan(0)
        const newFirst = dayGroups.value[0]?.label
        expect(newFirst).toBeTruthy()
        // The two preset's first-day labels differ (sanity-check actual swap)
        expect(newFirst).not.toBe(initialFirst)
    })

    it('lineCount equals sum of lines across all day-groups', () => {
        const preset = ref<AgendaPresetKind>('schule-project')
        const { dayGroups, lineCount } = useAgendaPreset(preset)
        const summed = dayGroups.value.reduce((s, g) => s + g.lines.length, 0)
        expect(lineCount.value).toBe(summed)
    })
})
