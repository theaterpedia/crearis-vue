/**
 * ItemRow Date Display Integration Tests
 * 
 * Tests ItemRow component's integration with the dateTimeFormat plugin
 * Verifies that event dates are correctly formatted in row headings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemRow from '@/components/clist/ItemRow.vue'

describe('ItemRow - Date Display Integration', () => {
    beforeEach(() => {
        // Mock current date to 2025-11-16 for consistent testing
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-11-16T12:00:00'))
    })

    describe('Single Date Display', () => {
        it('displays formatted date prefix for single start date', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Test Event',
                    dateBegin: '2025-11-19T14:00:00'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).toContain('MI 20.11')
            expect(heading.text()).toContain('Test Event')
        })

        it('does not display time in heading prefix', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Test Event',
                    dateBegin: '2025-11-19T14:30:00'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).not.toContain('14:30')
        })
    })

    describe('Date Range Display', () => {
        it('displays date range when both start and end provided', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Workshop',
                    dateBegin: '2025-11-19T14:00:00',
                    dateEnd: '2025-11-21T16:00:00'
                }
            })

            const heading = wrapper.find('h5')
            const text = heading.text()
            expect(text).toContain('MI 20.11')
            expect(text).toContain('FR 22')
            expect(text).toContain(' - ')
        })

        it('hides month for end date in same month', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Conference',
                    dateBegin: '2025-11-19T09:00:00',
                    dateEnd: '2025-11-21T17:00:00'
                }
            })

            const heading = wrapper.find('h5')
            const text = heading.text()
            // Start date should have month
            expect(text).toMatch(/MI 20\.11/)
            // End date should not repeat month (just day)
            expect(text).toMatch(/FR 22[^.]/)
        })

        it('shows month for end date in different month', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Year-end Event',
                    dateBegin: '2025-11-28T18:00:00',
                    dateEnd: '2025-12-02T20:00:00'
                }
            })

            const heading = wrapper.find('h5')
            const text = heading.text()
            expect(text).toContain('28.11')
            expect(text).toContain('02.12')
        })
    })

    describe('Heading Structure Integration', () => {
        it('inserts date before plain heading', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Simple Event',
                    dateBegin: '2025-11-19T14:00:00'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).toMatch(/^MI 20\.11 Simple Event/)
        })

        it('inserts date after ** markers in bold format', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Important Event** with details',
                    dateBegin: '2025-11-19T14:00:00'
                }
            })

            const heading = wrapper.find('h5')
            const text = heading.text()
            // Date should come after the bold section
            expect(text).toContain('Important Event')
            expect(text).toContain('MI 20.11')
        })

        it('prefers explicit headingPrefix over dateBegin', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Event',
                    headingPrefix: 'CUSTOM PREFIX ',
                    dateBegin: '2025-11-19T14:00:00'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).toContain('CUSTOM PREFIX')
            expect(heading.text()).not.toContain('MI 20.11')
        })
    })

    describe('Year Display Logic', () => {
        it('does not show year for current year future date', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Future Event',
                    dateBegin: '2025-12-15T10:00:00'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).not.toContain('2025')
        })

        it('shows year for past date', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Past Event',
                    dateBegin: '2025-10-01T10:00:00'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).toContain('2025')
        })

        it('shows year for next year date', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Next Year Event',
                    dateBegin: '2026-02-15T10:00:00'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).toContain('2026')
        })
    })

    describe('No Date Scenarios', () => {
        it('displays heading without prefix when no dates provided', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'No Date Event'
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).toBe('No Date Event')
        })

        it('handles null dateBegin gracefully', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Event',
                    dateBegin: null as any
                }
            })

            const heading = wrapper.find('h5')
            expect(heading.text()).toBe('Event')
        })
    })

    describe('Heading Level Configuration', () => {
        it('uses h5 by default', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Event',
                    dateBegin: '2025-11-19T14:00:00'
                }
            })

            expect(wrapper.find('h5').exists()).toBe(true)
        })

        it('respects custom heading level', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'Event',
                    dateBegin: '2025-11-19T14:00:00',
                    headingLevel: 'h3'
                }
            })

            expect(wrapper.find('h3').exists()).toBe(true)
            expect(wrapper.find('h3').text()).toContain('MI 20.11')
        })
    })

    describe('Real-world Event Scenarios', () => {
        it('formats single-day workshop', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Vue.js Workshop** Beginner Level',
                    dateBegin: '2025-11-19T09:00:00',
                    dateEnd: '2025-11-19T17:00:00'
                }
            })

            const heading = wrapper.find('h5')
            const text = heading.text()
            expect(text).toContain('Vue.js Workshop')
            expect(text).toContain('MI 20.11')
        })

        it('formats multi-day conference', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: '**Annual Conference 2025** International Tech Summit',
                    dateBegin: '2025-11-19T09:00:00',
                    dateEnd: '2025-11-22T18:00:00'
                }
            })

            const heading = wrapper.find('h5')
            const text = heading.text()
            expect(text).toContain('MI 20.11')
            expect(text).toContain('SA 23')
            expect(text).toContain(' - ')
        })

        it('formats year-crossing event', () => {
            const wrapper = mount(ItemRow, {
                props: {
                    heading: 'New Year Festival',
                    dateBegin: '2025-12-30T20:00:00',
                    dateEnd: '2026-01-02T02:00:00'
                }
            })

            const heading = wrapper.find('h5')
            const text = heading.text()
            expect(text).toContain('2025')
            expect(text).toContain('2026')
        })
    })
})
