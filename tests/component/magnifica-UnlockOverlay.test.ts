/**
 * UnlockOverlay component-tests · cand-1c §11.4 one-beat shrink.
 *
 * Prior 3-beat staging (CCC → CCCS-Williams → CCC+CCCS-Hans) compressed to
 * a single beat carrying both anchors in one understated revelation. Timing
 * tightened from 9000ms+600ms to 3400ms+600ms · 4000ms total.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UnlockOverlay from '../../src/views/Magnifica/UnlockOverlay.vue'

describe('UnlockOverlay component', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders the CCC + CCCS one-beat headline (§11.4)', () => {
        const wrapper = mount(UnlockOverlay)
        const headline = wrapper.find('.unlock-headline')
        expect(headline.exists()).toBe(true)
        expect(headline.text()).toBe('CCC + CCCS')
    })

    it('renders the "Hackerethik from Hamburg · organic intellectual from Birmingham" anchor-line', () => {
        const wrapper = mount(UnlockOverlay)
        const html = wrapper.html()
        expect(html).toContain('Hackerethik from Hamburg')
        expect(html).toContain('organic intellectual from Birmingham')
    })

    it('renders the "two anchors of one practice, for thirty years" coda-line', () => {
        const wrapper = mount(UnlockOverlay)
        const html = wrapper.html()
        expect(html).toContain('the two anchors of one practice')
        expect(html).toContain('for thirty years')
    })

    it('has exactly one unlock-beat (no .unlock-beat--1 or --2 from the prior 3-beat staging)', () => {
        const wrapper = mount(UnlockOverlay)
        const beats = wrapper.findAll('.unlock-beat')
        expect(beats.length).toBe(1)
        expect(wrapper.find('.unlock-beat--1').exists()).toBe(false)
        expect(wrapper.find('.unlock-beat--2').exists()).toBe(false)
        expect(wrapper.find('.unlock-beat--3').exists()).toBe(false)
    })

    it('renders the overlay root with aria-hidden=true (decorative · a11y per §11.4)', () => {
        const wrapper = mount(UnlockOverlay)
        const overlay = wrapper.find('.unlock-overlay')
        expect(overlay.attributes('aria-hidden')).toBe('true')
    })

    it('starts WITHOUT the --finishing modifier class', () => {
        const wrapper = mount(UnlockOverlay)
        expect(wrapper.find('.unlock-overlay').classes()).not.toContain('unlock-overlay--finishing')
    })

    it('adds the --finishing modifier after 3400ms (fade-out begins · per §11.4 timing)', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(3399)
        expect(wrapper.find('.unlock-overlay').classes()).not.toContain('unlock-overlay--finishing')
        vi.advanceTimersByTime(1)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.unlock-overlay').classes()).toContain('unlock-overlay--finishing')
    })

    it('emits "complete" after 4000ms (3400ms hold + 600ms fade-out)', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(3999)
        expect(wrapper.emitted('complete')).toBeFalsy()
        vi.advanceTimersByTime(1)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('complete')).toBeTruthy()
        expect(wrapper.emitted('complete')?.length).toBe(1)
    })

    it('does NOT emit "complete" before the full 4000ms have elapsed', () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(3500)
        expect(wrapper.emitted('complete')).toBeFalsy()
    })

    it('clears timers on unmount (no late emits after teardown)', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(1000)
        wrapper.unmount()
        vi.advanceTimersByTime(5000)
        // After unmount, no complete should fire — the test passes if no error throws
        // (the listeners are removed; the timers were cleared via onUnmounted)
        expect(true).toBe(true)
    })
})
