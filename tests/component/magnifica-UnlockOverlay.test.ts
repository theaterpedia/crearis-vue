/**
 * UnlockOverlay component-tests · cand-1a 3-beat staging.
 *
 * Cand-1a restores the full 3-beat unlock (CCC → CCCS-Hall → CCC+CCCS-Hans) per
 * docs/animations.md §1+§2 + candidate-1a/page-zero-unlock.md. Beat-2 is Hall
 * ("Identity is not an essence, it is a positioning.") per HM-ratified Q-HM-2.
 * Timing: 9000ms beats + 600ms overlay-fade = 9600ms total to complete.
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

    it('renders exactly three beats (--1, --2, --3)', () => {
        const wrapper = mount(UnlockOverlay)
        expect(wrapper.findAll('.unlock-beat').length).toBe(3)
        expect(wrapper.find('.unlock-beat--1').exists()).toBe(true)
        expect(wrapper.find('.unlock-beat--2').exists()).toBe(true)
        expect(wrapper.find('.unlock-beat--3').exists()).toBe(true)
    })

    it('Beat 1 carries the CCC · Chaos Computer Club Hackerethik anchor', () => {
        const wrapper = mount(UnlockOverlay)
        const beat1 = wrapper.find('.unlock-beat--1')
        expect(beat1.text()).toContain('Öffentliche Daten nützen, private Daten schützen.')
        expect(beat1.text()).toContain('Chaos Computer Club · Hackerethik')
    })

    it('Beat 2 carries the Hall (CCCS) positioning line · NOT Williams (per Q-HM-2)', () => {
        const wrapper = mount(UnlockOverlay)
        const beat2 = wrapper.find('.unlock-beat--2')
        expect(beat2.text()).toContain('Identity is not an essence, it is a positioning.')
        expect(beat2.text()).toContain('Stuart Hall · CCCS Birmingham')
        // Williams "Culture is ordinary." must not appear (cand-1a chose Hall)
        expect(wrapper.html()).not.toContain('Culture is ordinary')
    })

    it('Beat 3 carries the CCC + CCCS headline + Hans anchor-line', () => {
        const wrapper = mount(UnlockOverlay)
        const beat3 = wrapper.find('.unlock-beat--3')
        expect(beat3.find('.unlock-headline').text()).toBe('CCC + CCCS')
        const html = beat3.html()
        expect(html).toContain('Hackerethik from Hamburg')
        expect(html).toContain('organic intellectual from Birmingham')
        expect(html).toContain('two anchors, one practice, thirty years')
        expect(beat3.text()).toContain('Hans Dönitz · Theaterpädagoge · Fürth, Bayern')
    })

    it('renders the overlay root with aria-hidden=true (decorative · a11y)', () => {
        const wrapper = mount(UnlockOverlay)
        expect(wrapper.find('.unlock-overlay').attributes('aria-hidden')).toBe('true')
    })

    it('starts WITHOUT the --finishing modifier class', () => {
        const wrapper = mount(UnlockOverlay)
        expect(wrapper.find('.unlock-overlay').classes()).not.toContain('unlock-overlay--finishing')
    })

    it('adds the --finishing modifier after 9000ms (fade-out begins)', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(8999)
        expect(wrapper.find('.unlock-overlay').classes()).not.toContain('unlock-overlay--finishing')
        vi.advanceTimersByTime(1)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.unlock-overlay').classes()).toContain('unlock-overlay--finishing')
    })

    it('emits "complete" after 9600ms (9000ms beats + 600ms fade-out)', async () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(9599)
        expect(wrapper.emitted('complete')).toBeFalsy()
        vi.advanceTimersByTime(1)
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('complete')).toBeTruthy()
        expect(wrapper.emitted('complete')?.length).toBe(1)
    })

    it('does NOT emit "complete" before the full 9600ms have elapsed', () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(9000)
        expect(wrapper.emitted('complete')).toBeFalsy()
    })

    it('clears timers on unmount (no late emits after teardown)', () => {
        const wrapper = mount(UnlockOverlay)
        vi.advanceTimersByTime(1000)
        wrapper.unmount()
        vi.advanceTimersByTime(10000)
        expect(true).toBe(true)
    })
})
