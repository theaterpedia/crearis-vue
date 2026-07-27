/**
 * uia · `src/views/Uia/uiaItems.ts` — the adapter between `content/agenda.ts`
 * and `ItemList`.
 *
 * §agenda-shape (revised): reuse `ItemList` with `items`, do not hand-roll a
 * list. One thing has to be adapted on the way in — `ItemRow.vue:61` renders
 * `<img v-else-if="cimg" :src="cimg">` unguarded, so the `cimg: 'TODO HP'`
 * markers `agendaItems` still carries would each become a broken image.
 *
 * These tests pin that strip, and pin that `agendaItems` really is in the shape
 * `ItemList` expects — because that contract is the whole reason no local list
 * component is needed.
 */

import { describe, expect, it } from 'vitest'
import { hasRealImage, toListItems } from '@/views/Uia/uiaItems'
import { agendaItems } from '@/views/Uia/content/agenda'

describe('hasRealImage', () => {
    it('accepts a real URL', () => {
        expect(hasRealImage('https://res.cloudinary.com/x/y.jpg')).toBe(true)
        expect(hasRealImage('/assets/local.png')).toBe(true)
    })

    it('rejects the content-files` TODO markers', () => {
        expect(hasRealImage('TODO HP')).toBe(false)
        expect(hasRealImage('TODO')).toBe(false)
        expect(hasRealImage('todo hp')).toBe(false)
        expect(hasRealImage('  TODO HP  ')).toBe(false)
    })

    it('rejects absent and empty', () => {
        expect(hasRealImage(undefined)).toBe(false)
        expect(hasRealImage('')).toBe(false)
        expect(hasRealImage('   ')).toBe(false)
    })
})

describe('toListItems', () => {
    it('drops the cimg key entirely while it is still a TODO marker', () => {
        const [first] = toListItems([{ heading: 'a **B** c', cimg: 'TODO HP' }])
        expect(first).toBeDefined()
        expect('cimg' in (first as object)).toBe(false)
        expect(first?.heading).toBe('a **B** c')
    })

    it('keeps a real cimg untouched, so the row lights up when HP pastes a URL', () => {
        const url = 'https://res.cloudinary.com/little-papillon/image/upload/x.jpg'
        expect(toListItems([{ heading: 'a **B** c', cimg: url }])[0]?.cimg).toBe(url)
    })

    it('honours `limit` — the landing shows only `agendaTeaser.limit` rows', () => {
        expect(toListItems(agendaItems, 2)).toHaveLength(2)
        expect(toListItems(agendaItems)).toHaveLength(agendaItems.length)
    })

    it('does not mutate the content-file array', () => {
        const before = JSON.stringify(agendaItems)
        toListItems(agendaItems, 1)
        expect(JSON.stringify(agendaItems)).toBe(before)
    })

    it('passes `props` through for ItemRow`s v-bind', () => {
        const items = toListItems([{ heading: 'a **B** c', props: { onActivate: 'none' } }])
        expect(items[0]?.props).toEqual({ onActivate: 'none' })
    })
})

describe('agendaItems · the ItemList contract', () => {
    it('is non-empty and every row has a heading', () => {
        expect(agendaItems.length).toBeGreaterThan(0)
        for (const item of agendaItems) {
            expect(typeof item.heading).toBe('string')
            expect(item.heading.length).toBeGreaterThan(0)
        }
    })

    it('writes every heading in the crearis-md shape HeadingParser expects', () => {
        // "overline **HEADLINE** subline" — the headline is the required part.
        for (const item of agendaItems) {
            const match = /\*\*(.+?)\*\*/.exec(item.heading)
            expect(match, `no **HEADLINE** in: ${item.heading}`).not.toBeNull()
            expect(match?.[1]?.trim().length).toBeGreaterThan(0)
        }
    })

    it('reaches ItemList with no TODO marker left anywhere', () => {
        for (const item of toListItems(agendaItems)) {
            expect(hasRealImage(item.cimg) || item.cimg === undefined).toBe(true)
        }
    })
})
