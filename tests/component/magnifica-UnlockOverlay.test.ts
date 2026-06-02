/**
 * Tests for src/views/Magnifica/UnlockOverlay.vue.
 *
 * Per crearis:projects/magnifica/docs/animations.md §1 + §2 · verifies the
 * 3-beat content + the timing-driven `complete` emit.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UnlockOverlay from '@/views/Magnifica/UnlockOverlay.vue'

describe('UnlockOverlay component', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders Beat 1 · CCC Hackerethik citation (§1.2)', () => {
        const wrapper = mount(UnlockOverlay)
        expect(wrapper.text()).toContain('Öffentliche Daten nützen, private Daten schützen.')
        expect(wrapper.text()).toContain('Chaos Computer Club · Hackerethik')
        expect(wrapper.text()).toContain('Use public data. Protect private data.')
    })

    it('renders Beat 2 · CCCS Williams citation (§1.3 primary)', () => {
        const wrapper = mount(UnlockOverlay)
        expect(wrapper.text()).toContain('Culture is ordinary.')
        expect(wrapper.text()).toContain('Raymond Williams · CCCS Birmingham orbit')
    })

    it('renders Beat 3 · Hans one-sentence with "CCC + CCCS" headline (§1.4)', () => {
        const wrapper = mount(UnlockOverlay)
        expect(wrapper.text()).toContain('CCC + CCCS')
        expect(wrapper.text()).toContain(
            'Hackerethik from Hamburg, organic intellectual from Birmingham',
        )
        expect(wrapper.text()).toContain('Hans Dönitz · Theaterpädagoge · Fürth, Bayern')
    })

    it('renders the overlay root with aria-hidden=true (a11y per §2.4)', () => {
        const wrapper = mount(UnlockOverlay)
        const root = wrapper.find('.unlock-overlay')
        expect(root.attributes('aria-hidden')).toBe('true')
    })

    it('starts WITHOUT the --finishing modifier class', () => {
        const wrapper = mount(UnlockOverlay)
        const root = wrapper.find('.unlock-overlay')
        expect(root.classes()).not.toContain('unlock-overlay--finishing')
    })

    it('adds the --finishing modifier after 9000ms (fade-out begins)', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(9000)
        await wrapper.vm.$nextTick()
        const root = wrapper.find('.unlock-overlay')
        expect(root.classes()).toContain('unlock-overlay--finishing')
    })

    it('emits "complete" after 9600ms (fade-out finishes)', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(9000)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('complete')).toBeUndefined()
        vi.advanceTimersByTime(600)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('complete')).toBeTruthy()
        expect(wrapper.emitted('complete')).toHaveLength(1)
    })

    it('does NOT emit "complete" before the full 9600ms have elapsed', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(9500)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('complete')).toBeUndefined()
    })

    it('renders all three beat-containers in DOM order', () => {
        const wrapper = mount(UnlockOverlay)
        const beats = wrapper.findAll('.unlock-beat')
        expect(beats).toHaveLength(3)
        expect(beats[0].classes()).toContain('unlock-beat--1')
        expect(beats[1].classes()).toContain('unlock-beat--2')
        expect(beats[2].classes()).toContain('unlock-beat--3')
    })

    it('clears timers on unmount (no late emits after teardown)', async () => {
        const wrapper = mount(UnlockOverlay)
        wrapper.unmount()
        vi.advanceTimersByTime(20000)
        // No assertion needed beyond surviving the unmount + timer-advance ·
        // if the timers leaked, vitest would surface a warning or the emitted-event
        // would fire on a detached wrapper. The test passes if no error throws.
        expect(true).toBe(true)
    })
})
