/**
 * cDia inline-md parser (the §43/§44 richer parser · bold + autolink) — parseInline + ProseInline.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { parseInline } from '../../src/components/cDia/inlineMd'
import ProseInline from '../../src/components/cDia/ProseInline.vue'

describe('parseInline', () => {
    it('splits **bold** into a bold segment', () => {
        const s = parseInline('DAS Ei – Theaterpädagogisches **Zentrum Nürnberg** e.V.')
        expect(s.some((x) => x.type === 'bold' && x.value === 'Zentrum Nürnberg')).toBe(true)
    })

    it('autolinks a URL, scheme stripped for display', () => {
        const s = parseInline('https://dasei.eu')
        const link = s.find((x) => x.type === 'link')
        expect(link?.href).toBe('https://dasei.eu')
        expect(link?.value).toBe('dasei.eu')
    })

    it('leaves plain text as text', () => {
        expect(parseInline('Fürther Str. 174')).toEqual([{ type: 'text', value: 'Fürther Str. 174' }])
    })
})

describe('ProseInline', () => {
    it('renders **bold** as <strong> and a URL as <a href>', () => {
        const w = mount(ProseInline, { props: { text: 'see **DAS Ei** at https://dasei.eu' } })
        expect(w.find('strong').text()).toBe('DAS Ei')
        const a = w.find('a')
        expect(a.attributes('href')).toBe('https://dasei.eu')
        expect(a.text()).toBe('dasei.eu')
    })
})
