/**
 * MagnificaMenuCard component-tests · per cand-1c Q5 spec.
 *
 * Thin card-component for the LandingPage engagement-shapes menu. Verifies
 * prop-rendering + slot-rendering + no-button-no-link (invitation-not-push).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MagnificaMenuCard from '../../src/views/Magnifica/MagnificaMenuCard.vue'

describe('MagnificaMenuCard component', () => {
    it('renders titlePrefix and titleAccent inside the title heading', () => {
        const wrapper = mount(MagnificaMenuCard, {
            props: {
                titlePrefix: 'In-presence',
                titleAccent: 'workshops at Anthropic',
            },
            slots: { default: '<p>Body content.</p>' },
        })
        const title = wrapper.find('.menu-card-title')
        expect(title.exists()).toBe(true)
        expect(title.text()).toContain('In-presence')
        expect(title.text()).toContain('workshops at Anthropic')
    })

    it('wraps titleAccent in a .menu-card-accent span (yellow accent)', () => {
        const wrapper = mount(MagnificaMenuCard, {
            props: { titlePrefix: 'In-presence', titleAccent: 'workshops at Anthropic' },
            slots: { default: '<p>Body</p>' },
        })
        const accent = wrapper.find('.menu-card-accent')
        expect(accent.exists()).toBe(true)
        expect(accent.text()).toBe('workshops at Anthropic')
    })

    it('renders only the title-prefix when titleAccent is omitted', () => {
        const wrapper = mount(MagnificaMenuCard, {
            props: { titlePrefix: 'Other shapes you may suggest' },
            slots: { default: '<p>Body</p>' },
        })
        expect(wrapper.find('.menu-card-accent').exists()).toBe(false)
        expect(wrapper.find('.menu-card-title').text()).toContain('Other shapes you may suggest')
    })

    it('renders default slot content inside .menu-card-body', () => {
        const wrapper = mount(MagnificaMenuCard, {
            props: { titlePrefix: 'T', titleAccent: 'A' },
            slots: { default: '<p data-test="body">The body of the card</p>' },
        })
        const body = wrapper.find('.menu-card-body')
        expect(body.exists()).toBe(true)
        expect(body.find('[data-test="body"]').text()).toBe('The body of the card')
    })

    it('renders as an <article> (semantic · not a button or link · invitation-not-push)', () => {
        const wrapper = mount(MagnificaMenuCard, {
            props: { titlePrefix: 'T', titleAccent: 'A' },
            slots: { default: '<p>Body</p>' },
        })
        expect(wrapper.element.tagName.toLowerCase()).toBe('article')
        // Critical: no button + no top-level anchor (the cards are NAMED, not clickable-to-buy)
        expect(wrapper.find('button').exists()).toBe(false)
        // Top-level anchor would be wrong; nested anchors inside slot body are fine
        expect(wrapper.find('article > a').exists()).toBe(false)
    })
})
