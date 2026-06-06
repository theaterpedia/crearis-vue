/**
 * CalloutPhrase component-tests · fpostit-unified callout mechanic (2026-06-06).
 *
 * CalloutPhrase now renders the shared <FloatingPostIt> (hlogic="element", teleported
 * to body) instead of the retired PopOverPostIt. Tests cover the trigger state-machine,
 * the magnifica→fpostit color mapping, and content-forwarding. Positioning math is
 * integration-tested in browser (happy-dom getBoundingClientRect returns zeros).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CalloutPhrase from '../../src/views/Magnifica/CalloutPhrase.vue'
import type { CardsCanvasItem } from '../../src/components/magnifica/types'

const sampleCallout: CardsCanvasItem = {
    props: {
        overline: 'speaking-position',
        headline: 'Elspeth Probyn',
        bodyText: 'Sexing the Self · Routledge 1993',
        themeColor: 'pink',
    },
}

describe('CalloutPhrase trigger', () => {
    it('renders the slot content as a button with aria-haspopup="dialog"', () => {
        const w = mount(CalloutPhrase, { props: { callout: sampleCallout }, slots: { default: 'speaking-position' } })
        const btn = w.find('button.callout-phrase')
        expect(btn.exists()).toBe(true)
        expect(btn.text()).toBe('speaking-position')
        expect(btn.attributes('aria-haspopup')).toBe('dialog')
        expect(btn.attributes('aria-expanded')).toBe('false')
    })

    it('applies the underline theme-class from themeColor', () => {
        const w = mount(CalloutPhrase, { props: { callout: sampleCallout }, slots: { default: 'phrase' } })
        expect(w.find('button.callout-phrase').classes()).toContain('callout-phrase--pink')
    })

    it('normalizes 2022 themeColor alias (accent → pink)', () => {
        const w = mount(CalloutPhrase, { props: { callout: { props: { headline: 'X', themeColor: 'accent' } } }, slots: { default: 'p' } })
        expect(w.find('button.callout-phrase').classes()).toContain('callout-phrase--pink')
    })

    it('defaults theme to yellow when themeColor is omitted', () => {
        const w = mount(CalloutPhrase, { props: { callout: { props: { headline: 'X' } } }, slots: { default: 'p' } })
        expect(w.find('button.callout-phrase').classes()).toContain('callout-phrase--yellow')
    })
})

describe('CalloutPhrase → FloatingPostIt', () => {
    it('opens a floating post-it on click · maps pink→negative · forwards title + body', async () => {
        const w = mount(CalloutPhrase, { props: { callout: sampleCallout }, slots: { default: 'phrase' }, attachTo: document.body })
        expect(document.body.querySelector('.floating-postit')).toBeNull()
        await w.find('button.callout-phrase').trigger('click')
        expect(w.find('button.callout-phrase').attributes('aria-expanded')).toBe('true')
        const card = document.body.querySelector('.floating-postit')
        expect(card).not.toBeNull()
        expect(card?.classList.contains('bg-negative')).toBe(true) // pink → negative (OKLCH token)
        expect(document.body.querySelector('.fpostit-title')?.textContent).toBe('Elspeth Probyn')
        expect(document.body.querySelector('.fpostit-content')?.innerHTML).toContain('Sexing the Self')
        w.unmount()
    })

    it('defaults the popover color to primary when themeColor omitted (yellow→primary)', async () => {
        const w = mount(CalloutPhrase, { props: { callout: { props: { headline: 'X', bodyText: 'b' } } }, slots: { default: 'p' }, attachTo: document.body })
        await w.find('button.callout-phrase').trigger('click')
        expect(document.body.querySelector('.floating-postit')?.classList.contains('bg-primary')).toBe(true)
        w.unmount()
    })

    it('closes (aria-expanded false) when Escape is pressed', async () => {
        const w = mount(CalloutPhrase, { props: { callout: sampleCallout }, slots: { default: 'p' }, attachTo: document.body })
        await w.find('button.callout-phrase').trigger('click')
        expect(w.find('button.callout-phrase').attributes('aria-expanded')).toBe('true')
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await w.vm.$nextTick()
        expect(w.find('button.callout-phrase').attributes('aria-expanded')).toBe('false')
        w.unmount()
    })
})
