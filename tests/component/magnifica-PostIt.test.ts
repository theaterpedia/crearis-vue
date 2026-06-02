/**
 * PostIt component-tests · prop-mapping + custom-property contract.
 *
 * Per CV@wsl dispatch #4 §5: prop-mapping (themeColor → class · rotate →
 * custom-property · slots render).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PostIt from '../../src/components/magnifica/PostIt.vue'
import {
    parseClassesMarginTop,
    parseRotateDeg,
} from '../../src/components/magnifica/types'

describe('parseRotateDeg', () => {
    it('returns 0 for undefined', () => {
        expect(parseRotateDeg(undefined)).toBe(0)
    })

    it('parses numeric input as-is', () => {
        expect(parseRotateDeg(3)).toBe(3)
        expect(parseRotateDeg(-2)).toBe(-2)
    })

    it('parses 2022-style sign-prefixed strings', () => {
        expect(parseRotateDeg('+2')).toBe(2)
        expect(parseRotateDeg('-3')).toBe(-3)
        expect(parseRotateDeg('1')).toBe(1)
    })

    it('returns 0 for non-numeric strings', () => {
        expect(parseRotateDeg('bogus')).toBe(0)
    })
})

describe('parseClassesMarginTop', () => {
    it('parses 2022 Tailwind mt-N tokens to rem', () => {
        expect(parseClassesMarginTop('mt-32')).toBe('8rem')
        expect(parseClassesMarginTop('mt-48')).toBe('12rem')
        expect(parseClassesMarginTop('mt-96')).toBe('24rem')
        expect(parseClassesMarginTop('mt-12')).toBe('3rem')
    })

    it('returns undefined for non-mt tokens (no surprise transform)', () => {
        expect(parseClassesMarginTop('something-else')).toBeUndefined()
        expect(parseClassesMarginTop('')).toBeUndefined()
        expect(parseClassesMarginTop(undefined)).toBeUndefined()
    })
})

describe('PostIt component', () => {
    it("maps themeColor 'yellow' to .bb-postit--yellow", () => {
        const w = mount(PostIt, { props: { themeColor: 'yellow', headline: 'h' } })
        expect(w.classes()).toContain('bb-postit')
        expect(w.classes()).toContain('bb-postit--yellow')
    })

    it("maps 2022 alias 'primary' to .bb-postit--yellow (back-compat per howto §7)", () => {
        const w = mount(PostIt, { props: { themeColor: 'primary', headline: 'h' } })
        expect(w.classes()).toContain('bb-postit--yellow')
    })

    it("maps 2022 alias 'secondary' to .bb-postit--green", () => {
        const w = mount(PostIt, { props: { themeColor: 'secondary', headline: 'h' } })
        expect(w.classes()).toContain('bb-postit--green')
    })

    it("maps 2022 alias 'accent' to .bb-postit--pink", () => {
        const w = mount(PostIt, { props: { themeColor: 'accent', headline: 'h' } })
        expect(w.classes()).toContain('bb-postit--pink')
    })

    it("maps 2022 alias 'warn' to .bb-postit--dim", () => {
        const w = mount(PostIt, { props: { themeColor: 'warn', headline: 'h' } })
        expect(w.classes()).toContain('bb-postit--dim')
    })

    it('sets --bb-top / --bb-left / --bb-rotate as inline CSS custom-properties', () => {
        const w = mount(PostIt, {
            props: {
                headline: 'h',
                top: '32%',
                left: '18%',
                rotate: '-1',
            },
        })
        const style = w.attributes('style') ?? ''
        expect(style).toContain('--bb-top: 32%')
        expect(style).toContain('--bb-left: 18%')
        expect(style).toContain('--bb-rotate: -1deg')
    })

    it("forwards 2022 'classes' mt-N token to margin-top in rem", () => {
        const w = mount(PostIt, {
            props: { headline: 'h', classes: 'mt-32' },
        })
        const style = w.attributes('style') ?? ''
        expect(style).toContain('margin-top: 8rem')
    })

    it('renders overline + headline + bodyText when provided', () => {
        const w = mount(PostIt, {
            props: {
                overline: 'OL',
                headline: 'HL',
                bodyText: 'BT',
            },
        })
        expect(w.find('.bb-postit-overline').text()).toBe('OL')
        expect(w.find('.bb-postit-headline').text()).toBe('HL')
        expect(w.find('.bb-postit-body').text()).toBe('BT')
    })

    it('renders default slot content alongside / instead of bodyText', () => {
        const w = mount(PostIt, {
            props: { headline: 'h' },
            slots: { default: '<p>slot-content</p>' },
        })
        expect(w.find('.bb-postit-slot').exists()).toBe(true)
        expect(w.find('.bb-postit-slot').html()).toContain('slot-content')
    })

    it('renders image with alt when image prop provided', () => {
        const w = mount(PostIt, {
            props: { headline: 'h', image: '/img/x.jpg', imageAlt: 'X' },
        })
        const img = w.find('.bb-postit-image')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('/img/x.jpg')
        expect(img.attributes('alt')).toBe('X')
    })

    it('does NOT render image element when image prop omitted', () => {
        const w = mount(PostIt, { props: { headline: 'h' } })
        expect(w.find('.bb-postit-image').exists()).toBe(false)
    })

    it("defaults themeColor to 'yellow' when prop omitted", () => {
        const w = mount(PostIt, { props: { headline: 'h' } })
        expect(w.classes()).toContain('bb-postit--yellow')
    })
})
