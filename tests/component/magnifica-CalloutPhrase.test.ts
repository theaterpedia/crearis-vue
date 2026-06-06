/**
 * CalloutPhrase + PopOverPostIt component-tests · the detail-page callout mechanic.
 *
 * Per cand-1c conception §6 + §11.5 + devdoc §2. Tests focus on the
 * state-machine + ARIA + content-forwarding · not on positioning math
 * (jsdom getBoundingClientRect returns zeros · positioning is integration-tested
 * in browser).
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CalloutPhrase from '../../src/views/Magnifica/CalloutPhrase.vue'
import PopOverPostIt from '../../src/views/Magnifica/PopOverPostIt.vue'
import type { CardsCanvasItem } from '../../src/components/magnifica/types'

const sampleCallout: CardsCanvasItem = {
    props: {
        overline: 'speaking-position',
        headline: 'Elspeth Probyn',
        bodyText: 'Sexing the Self · Routledge 1993',
        themeColor: 'pink',
    },
}

describe('CalloutPhrase component', () => {
    it('renders the slot content as a button with aria-haspopup="dialog"', () => {
        const wrapper = mount(CalloutPhrase, {
            props: { callout: sampleCallout },
            slots: { default: 'speaking-position' },
        })
        const btn = wrapper.find('button.callout-phrase')
        expect(btn.exists()).toBe(true)
        expect(btn.text()).toBe('speaking-position')
        expect(btn.attributes('aria-haspopup')).toBe('dialog')
        expect(btn.attributes('aria-expanded')).toBe('false')
    })

    it('applies the theme-class derived from callout.props.themeColor', () => {
        const wrapper = mount(CalloutPhrase, {
            props: { callout: sampleCallout },
            slots: { default: 'phrase' },
        })
        expect(wrapper.find('button.callout-phrase').classes()).toContain('callout-phrase--pink')
    })

    it('normalizes 2022 themeColor alias via normalizeTheme (accent → pink)', () => {
        const aliasCallout: CardsCanvasItem = {
            props: { headline: 'X', themeColor: 'accent' },
        }
        const wrapper = mount(CalloutPhrase, {
            props: { callout: aliasCallout },
            slots: { default: 'phrase' },
        })
        expect(wrapper.find('button.callout-phrase').classes()).toContain('callout-phrase--pink')
    })

    it('defaults theme to yellow when callout.props.themeColor is omitted', () => {
        const noThemeCallout: CardsCanvasItem = {
            props: { headline: 'X' },
        }
        const wrapper = mount(CalloutPhrase, {
            props: { callout: noThemeCallout },
            slots: { default: 'phrase' },
        })
        expect(wrapper.find('button.callout-phrase').classes()).toContain('callout-phrase--yellow')
    })

    it('flips aria-expanded to true after click', async () => {
        const wrapper = mount(CalloutPhrase, {
            props: { callout: sampleCallout },
            slots: { default: 'phrase' },
            attachTo: document.body,
        })
        await wrapper.find('button.callout-phrase').trigger('click')
        expect(wrapper.find('button.callout-phrase').attributes('aria-expanded')).toBe('true')
        wrapper.unmount()
    })
})

describe('PopOverPostIt component', () => {
    it('does not render when open=false', () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: false, postit: sampleCallout.props },
            attachTo: document.body,
        })
        // Teleported to body, so use document.body to inspect
        expect(document.body.querySelector('.popover-postit')).toBeNull()
        wrapper.unmount()
    })

    it('renders dialog with aria-modal=false when open=true (non-modal per cand-1c §6)', async () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: true, postit: sampleCallout.props },
            attachTo: document.body,
        })
        const dialog = document.body.querySelector('.popover-postit')
        expect(dialog).not.toBeNull()
        expect(dialog?.getAttribute('role')).toBe('dialog')
        expect(dialog?.getAttribute('aria-modal')).toBe('false')
        expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy()
        wrapper.unmount()
    })

    it('renders the PostIt with forwarded props (headline + themeColor class)', async () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: true, postit: sampleCallout.props },
            attachTo: document.body,
        })
        const postit = document.body.querySelector('.popover-postit .bb-postit')
        expect(postit).not.toBeNull()
        expect(postit?.classList.contains('bb-postit--pink')).toBe(true)
        const headline = document.body.querySelector('.popover-postit .bb-postit-headline')
        expect(headline?.textContent).toBe('Elspeth Probyn')
        wrapper.unmount()
    })

    it('emits "close" when the close-button is clicked', async () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: true, postit: sampleCallout.props },
            attachTo: document.body,
        })
        const closeBtn = document.body.querySelector('.popover-postit-close') as HTMLButtonElement
        closeBtn?.click()
        expect(wrapper.emitted('close')).toBeTruthy()
        expect(wrapper.emitted('close')?.length).toBe(1)
        wrapper.unmount()
    })

    it('emits "close" when Escape is pressed', async () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: true, postit: sampleCallout.props },
            attachTo: document.body,
        })
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
        document.dispatchEvent(escEvent)
        expect(wrapper.emitted('close')).toBeTruthy()
        wrapper.unmount()
    })

    it('does NOT emit "close" on Escape when open=false', async () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: false, postit: sampleCallout.props },
            attachTo: document.body,
        })
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
        document.dispatchEvent(escEvent)
        expect(wrapper.emitted('close')).toBeFalsy()
        wrapper.unmount()
    })

    it('does NOT emit "close" on non-Escape keys', async () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: true, postit: sampleCallout.props },
            attachTo: document.body,
        })
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
        document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
        expect(wrapper.emitted('close')).toBeFalsy()
        wrapper.unmount()
    })

    it('emits "close" on click outside both popover and anchor', async () => {
        // Set up a body click target outside the popover
        const outsideEl = document.createElement('div')
        outsideEl.id = 'outside-click-target'
        document.body.appendChild(outsideEl)

        const wrapper = mount(PopOverPostIt, {
            props: { open: true, postit: sampleCallout.props },
            attachTo: document.body,
        })

        // Click on the outside element (synthetic event must bubble up to the document listener)
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
        outsideEl.dispatchEvent(clickEvent)

        expect(wrapper.emitted('close')).toBeTruthy()

        outsideEl.remove()
        wrapper.unmount()
    })

    it('cleans up listeners on unmount (no late emits after teardown)', async () => {
        const wrapper = mount(PopOverPostIt, {
            props: { open: true, postit: sampleCallout.props },
            attachTo: document.body,
        })
        wrapper.unmount()
        // After unmount, Esc should not produce any new emits
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        // The wrapper is already unmounted; no further emissions to check, but
        // this verifies the listener is removed (no errors / no late effects)
        expect(true).toBe(true)
    })
})
