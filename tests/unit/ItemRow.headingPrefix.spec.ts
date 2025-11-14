import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemRow from '@/components/clist/ItemRow.vue'

describe('ItemRow - Heading Prefix', () => {
    describe('formatDatePrefix', () => {
        it('formats 2025-11-14 as "FR 14.11 " (Friday)', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Test Event**',
                    dateBegin: '2025-11-14'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toContain('FR 14.11')
        })

        it('formats 2025-11-15 as "SA 15.11 " (Saturday)', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Test Event**',
                    dateBegin: '2025-11-15'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toContain('SA 15.11')
        })

        it('formats 2025-12-25 as "DO 25.12 " (Thursday - Christmas)', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Christmas Event**',
                    dateBegin: '2025-12-25'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toContain('DO 25.12')
        })

        it('formats all day names correctly', () => {
            const dayTests = [
                { date: '2025-11-16', expected: 'SO' }, // Sunday
                { date: '2025-11-10', expected: 'MO' }, // Monday
                { date: '2025-11-11', expected: 'DI' }, // Tuesday
                { date: '2025-11-12', expected: 'MI' }, // Wednesday
                { date: '2025-11-13', expected: 'DO' }, // Thursday
                { date: '2025-11-14', expected: 'FR' }, // Friday
                { date: '2025-11-15', expected: 'SA' }  // Saturday
            ]

            dayTests.forEach(({ date, expected }) => {
                const wrapper = mount(ItemRow, {
                    props: {
                        heading: '**Event**',
                        dateBegin: date
                    }
                })
                expect(wrapper.text()).toContain(expected)
            })
        })
    })

    describe('Heading Injection - Overline Format', () => {
        it('inserts prefix at beginning for overline format', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Theater am See **Hamlet**',
                    headingPrefix: 'FR 14.11 '
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toMatch(/FR 14\.11.*Theater am See.*Hamlet/)
        })

        it('inserts auto-formatted date at beginning for overline format', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Theater am See **Hamlet**',
                    dateBegin: '2025-11-15'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toMatch(/SA 15\.11.*Theater am See.*Hamlet/)
        })
    })

    describe('Heading Injection - Headline-Subline Format', () => {
        it('inserts prefix after second ** for headline-subline format', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Hamlet** Premiere am Theater',
                    headingPrefix: 'FR 14.11 '
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toMatch(/Hamlet.*FR 14\.11.*Premiere am Theater/)
        })

        it('inserts auto-formatted date after second ** for headline-subline format', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Hamlet** Premiere am Theater',
                    dateBegin: '2025-11-15'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toMatch(/Hamlet.*SA 15\.11.*Premiere am Theater/)
        })
    })

    describe('Heading Injection - Plain Text Format', () => {
        it('prepends prefix for plain text heading', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Hamlet Premiere',
                    headingPrefix: 'FR 14.11 '
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toMatch(/FR 14\.11.*Hamlet Premiere/)
        })
    })

    describe('Heading Injection - Priority', () => {
        it('uses explicit headingPrefix over dateBegin', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Hamlet** Premiere',
                    headingPrefix: 'CUSTOM ',
                    dateBegin: '2025-11-15'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toContain('CUSTOM')
            expect(headingText).not.toContain('SA 15.11')
        })

        it('returns original heading when no prefix or dateBegin provided', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Hamlet** Premiere'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toContain('Hamlet')
            expect(headingText).toContain('Premiere')
        })
    })

    describe('Edge Cases', () => {
        it('handles heading with only one ** marker', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Hamlet',
                    headingPrefix: 'FR 14.11 '
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toContain('FR 14.11')
            expect(headingText).toContain('Hamlet')
        })

        it('handles empty dateBegin gracefully', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Event**',
                    dateBegin: ''
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toBe('Event')
        })

        it('handles undefined dateBegin gracefully', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Event**'
                }
            })

            const headingText = wrapper.text()
            expect(headingText).toBe('Event')
        })
    })

    describe('Component Props', () => {
        it('accepts headingPrefix prop', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Test',
                    headingPrefix: 'PREFIX '
                }
            })

            expect(wrapper.props('headingPrefix')).toBe('PREFIX ')
        })

        it('accepts dateBegin prop', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Test',
                    dateBegin: '2025-11-14'
                }
            })

            expect(wrapper.props('dateBegin')).toBe('2025-11-14')
        })
    })
})
