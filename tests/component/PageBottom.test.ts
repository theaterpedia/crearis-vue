/**
 * PageBottom — T1-γ consulting lane visibility tests.
 *
 * Covers the per-site config-shape matrix from Canvas-2c:
 *   einstiege:            call=15-mins + email=true
 *   freundes-kreis.de:    call=30-mins + email=true
 *   theaterpedia.org:     call=none    + email=true
 *   raumlauf.de:          call=none    + email=true (emailHref overridden)
 *
 * Plus graceful defaults + fallbackEmail path.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageBottom from '@/components/PageBottom.vue'

function makeConfig(call: string, email: boolean, extras: Record<string, unknown> = {}) {
    return { pageBottom: { consulting: { call, email, ...extras } } }
}

describe('PageBottom visibility from project.config.pageBottom.consulting', () => {
    it('renders nothing when config missing', () => {
        const wrapper = mount(PageBottom, { props: { projectConfig: null } })
        expect(wrapper.find('.page-bottom').exists()).toBe(false)
    })

    it('renders nothing when pageBottom key missing', () => {
        const wrapper = mount(PageBottom, { props: { projectConfig: { other: 'stuff' } } })
        expect(wrapper.find('.page-bottom').exists()).toBe(false)
    })

    it('hides call lane when call=none', () => {
        const wrapper = mount(PageBottom, {
            props: { projectConfig: makeConfig('none', false) },
        })
        expect(wrapper.find('.page-bottom__lane--call').exists()).toBe(false)
    })

    it('shows 15-min label when call=15-mins', () => {
        const wrapper = mount(PageBottom, {
            props: { projectConfig: makeConfig('15-mins', false) },
        })
        const call = wrapper.find('.page-bottom__lane--call')
        expect(call.exists()).toBe(true)
        expect(call.text()).toContain('15-min Gespräch')
    })

    it('shows 30-min label when call=30-mins', () => {
        const wrapper = mount(PageBottom, {
            props: { projectConfig: makeConfig('30-mins', false) },
        })
        const call = wrapper.find('.page-bottom__lane--call')
        expect(call.exists()).toBe(true)
        expect(call.text()).toContain('30-min Gespräch')
    })

    it('hides email lane when email=false', () => {
        const wrapper = mount(PageBottom, {
            props: { projectConfig: makeConfig('15-mins', false) },
        })
        expect(wrapper.find('.page-bottom__lane--email').exists()).toBe(false)
    })

    it('hides email lane when email=true but no fallback + no emailHref', () => {
        const wrapper = mount(PageBottom, {
            props: { projectConfig: makeConfig('none', true) },
        })
        expect(wrapper.find('.page-bottom__lane--email').exists()).toBe(false)
    })

    it('shows email lane with fallback email when email=true', () => {
        const wrapper = mount(PageBottom, {
            props: {
                projectConfig: makeConfig('none', true),
                fallbackEmail: 'hello@example.org',
            },
        })
        const email = wrapper.find('.page-bottom__lane--email')
        expect(email.exists()).toBe(true)
        expect(email.attributes('href')).toBe('mailto:hello@example.org')
    })

    it('prefers explicit emailHref over fallbackEmail', () => {
        const wrapper = mount(PageBottom, {
            props: {
                projectConfig: makeConfig('none', true, {
                    emailHref: 'mailto:override@example.org',
                }),
                fallbackEmail: 'hello@example.org',
            },
        })
        expect(wrapper.find('.page-bottom__lane--email').attributes('href')).toBe(
            'mailto:override@example.org',
        )
    })

    it('uses explicit callHref when provided', () => {
        const wrapper = mount(PageBottom, {
            props: {
                projectConfig: makeConfig('30-mins', false, {
                    callHref: 'https://cal.example/30',
                }),
            },
        })
        expect(wrapper.find('.page-bottom__lane--call').attributes('href')).toBe(
            'https://cal.example/30',
        )
    })

    it('disables call lane when label visible but no href', () => {
        const wrapper = mount(PageBottom, {
            props: { projectConfig: makeConfig('15-mins', false) },
        })
        const call = wrapper.find('.page-bottom__lane--call')
        expect(call.attributes('aria-disabled')).toBe('true')
    })
})

describe('PageBottom — per-site shape matrix (T1-γ acceptance)', () => {
    it('freundes-kreis.de: 30-mins call + email both visible', () => {
        const wrapper = mount(PageBottom, {
            props: {
                projectConfig: makeConfig('30-mins', true),
                fallbackEmail: 'hallo@freundes-kreis.de',
            },
        })
        expect(wrapper.find('.page-bottom__lane--call').text()).toContain('30-min')
        expect(wrapper.find('.page-bottom__lane--email').exists()).toBe(true)
    })

    it('einstiege: 15-mins call + email both visible', () => {
        const wrapper = mount(PageBottom, {
            props: {
                projectConfig: makeConfig('15-mins', true),
                fallbackEmail: 'einstiege@dasei.eu',
            },
        })
        expect(wrapper.find('.page-bottom__lane--call').text()).toContain('15-min')
        expect(wrapper.find('.page-bottom__lane--email').exists()).toBe(true)
    })

    it('theaterpedia.org: call hidden, email only', () => {
        const wrapper = mount(PageBottom, {
            props: {
                projectConfig: makeConfig('none', true),
                fallbackEmail: 'contact@theaterpedia.org',
            },
        })
        expect(wrapper.find('.page-bottom__lane--call').exists()).toBe(false)
        expect(wrapper.find('.page-bottom__lane--email').exists()).toBe(true)
    })
})
