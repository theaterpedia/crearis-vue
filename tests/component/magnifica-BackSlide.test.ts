/**
 * BackSlide component-tests · image + theme-color + responsive shape.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BackSlide from '../../src/components/magnifica/BackSlide.vue'

describe('BackSlide component', () => {
    it('renders .panel-slide root with image-window + colored panel', () => {
        const w = mount(BackSlide, {
            props: { image: '/img/x.jpg' },
            slots: { default: '<h2>title</h2><p>body</p>' },
        })
        expect(w.find('.panel-slide').exists()).toBe(true)
        expect(w.find('.panel-image').exists()).toBe(true)
        expect(w.find('.panel-side').exists()).toBe(true)
        expect(w.find('.panel-text').exists()).toBe(true)
    })

    it('sets --panel-image inline CSS custom-property on the section', () => {
        const w = mount(BackSlide, {
            props: { image: '/img/spiegelkugel.jpg' },
        })
        const style = w.find('.panel-slide').attributes('style') ?? ''
        expect(style).toMatch(/--panel-image:\s*url\(['"]?\/img\/spiegelkugel\.jpg['"]?\)/)
    })

    it("maps themeColor 'yellow' to .panel-side--yellow", () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', themeColor: 'yellow' } })
        expect(w.find('.panel-side').classes()).toContain('panel-side--yellow')
    })

    it("maps 2022 alias 'secondary' to .panel-side--green (back-compat)", () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', themeColor: 'secondary' } })
        expect(w.find('.panel-side').classes()).toContain('panel-side--green')
    })

    it("maps 2022 alias 'warn' to .panel-side--dim", () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', themeColor: 'warn' } })
        expect(w.find('.panel-side').classes()).toContain('panel-side--dim')
    })

    it('renders default slot content inside .panel-text', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg' },
            slots: { default: '<h2>Closing arc</h2><p>Body text.</p>' },
        })
        const html = w.find('.panel-text').html()
        expect(html).toContain('Closing arc')
        expect(html).toContain('Body text.')
    })

    it('applies image-right variant class when imageRight=true (per howto §5.1)', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', imageRight: true },
        })
        expect(w.find('.panel-slide').classes()).toContain('panel-slide--image-right')
    })

    it('does NOT apply image-right class when imageRight=false (default · image-left)', () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg' } })
        expect(w.find('.panel-slide').classes()).not.toContain('panel-slide--image-right')
    })

    it('exposes the image-window as role=img with the provided aria-label for accessibility', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', imageAlt: 'Spiegelkugel · Theater-Performance' },
        })
        const imageDiv = w.find('.panel-image')
        expect(imageDiv.attributes('role')).toBe('img')
        expect(imageDiv.attributes('aria-label')).toBe('Spiegelkugel · Theater-Performance')
    })

    it('defaults aria-label to empty string when imageAlt omitted (decorative)', () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg' } })
        const imageDiv = w.find('.panel-image')
        expect(imageDiv.attributes('aria-label')).toBe('')
    })

    // Focal vocab · Hero's aspect-engine mapping verbatim (backslide-thread §6 · §9.5 step 2)
    // (the X/Y axes serialize to the `background-position` shorthand "<x> <y>")
    it('defaults the image focal to cover/bottom (center bottom · cover-sized · no hardcoded left)', () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg' } })
        const style = w.find('.panel-image').attributes('style') ?? ''
        expect(style).toMatch(/background-position:\s*center bottom/)
        expect(style).toMatch(/background-size:\s*cover/)
    })

    it('maps a literal focal (left/top) through as the background-position', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', imgTmpAlignX: 'left', imgTmpAlignY: 'top' },
        })
        const style = w.find('.panel-image').attributes('style') ?? ''
        expect(style).toMatch(/background-position:\s*left top/)
        expect(style).toMatch(/background-size:\s*cover/)
    })

    it('maps stretch to edge-position + 100% size on that axis (fill, not cover)', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', imgTmpAlignX: 'stretch', imgTmpAlignY: 'stretch' },
        })
        const style = w.find('.panel-image').attributes('style') ?? ''
        expect(style).toMatch(/background-position:\s*left top/)
        expect(style).toMatch(/background-size:\s*100%\s+100%/)
    })

    // Panel + panelMode · HeadingParser path + the four shapes (backslide-thread §3 · §9.5 step 3)
    it('renders the panel heading from the `panel` md prop via HeadingParser (default panelMode)', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', panel: 'Anfang der Digitalisierung **GUTE WEBSITES**' },
        })
        expect(w.find('.panel-side').exists()).toBe(true)
        const html = w.find('.panel-text').html()
        expect(html).toContain('GUTE WEBSITES')
        expect(html).toContain('Anfang der Digitalisierung')
    })

    it('keeps the raw <slot/> escape-hatch when `panel` is omitted', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg' },
            slots: { default: '<h2>Raw heading</h2>' },
        })
        expect(w.find('.panel-text').html()).toContain('Raw heading')
    })

    it('omits the panel entirely for panelMode="none" (image only)', () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', panelMode: 'none' } })
        expect(w.find('.panel-side').exists()).toBe(false)
        expect(w.find('.panel-image').exists()).toBe(true)
        expect(w.find('.panel-slide').classes()).toContain('panel-slide--mode-none')
    })

    it('renders a text-less colored strip for panelMode="handle"', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', panelMode: 'handle' },
            slots: { default: '<h2>should not render</h2>' },
        })
        expect(w.find('.panel-side').exists()).toBe(true)
        expect(w.find('.panel-text').exists()).toBe(false)
    })

    it('applies the panelMode modifier class (lane)', () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', panelMode: 'lane' } })
        expect(w.find('.panel-slide').classes()).toContain('panel-slide--mode-lane')
    })
})
