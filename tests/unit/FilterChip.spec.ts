/**
 * Component Tests: FilterChip
 * 
 * Tests filter chip component for tag selection and removal.
 * Total: 15 tests covering rendering, selection, and removal.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChip from '@/components/sysreg/FilterChip.vue'

describe('FilterChip Component', () => {

    // ============================================================================
    // Rendering - 5 tests
    // ============================================================================

    describe('Rendering', () => {
        it('renders chip label', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01'
                }
            })

            expect(wrapper.text()).toContain('Democracy')
        })

        it('applies selected state', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: true
                }
            })

            expect(wrapper.classes()).toContain('chip-selected')
        })

        it('applies unselected state', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: false
                }
            })

            expect(wrapper.classes()).not.toContain('chip-selected')
        })

        it('renders with count badge', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    count: 15
                }
            })

            expect(wrapper.text()).toContain('15')
        })

        it('does not render count when zero', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    count: 0
                }
            })

            expect(wrapper.find('.chip-count').exists()).toBe(false)
        })
    })

    // ============================================================================
    // Selection Handling - 5 tests
    // ============================================================================

    describe('Selection handling', () => {
        it('emits toggle event on click', async () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: false
                }
            })

            await wrapper.trigger('click')

            expect(wrapper.emitted('toggle')).toBeTruthy()
            expect(wrapper.emitted('toggle')?.[0]).toEqual(['\\x01'])
        })

        it('toggles selection state on click', async () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: false
                }
            })

            await wrapper.trigger('click')

            expect(wrapper.emitted('toggle')).toHaveLength(1)
        })

        it('supports keyboard activation (Enter)', async () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01'
                }
            })

            await wrapper.trigger('keydown.enter')

            expect(wrapper.emitted('toggle')).toBeTruthy()
        })

        it('supports keyboard activation (Space)', async () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01'
                }
            })

            await wrapper.trigger('keydown.space')

            expect(wrapper.emitted('toggle')).toBeTruthy()
        })

        it('has proper ARIA attributes', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: true
                }
            })

            expect(wrapper.attributes('role')).toBe('button')
            expect(wrapper.attributes('aria-pressed')).toBe('true')
            expect(wrapper.attributes('tabindex')).toBe('0')
        })
    })

    // ============================================================================
    // Remove Functionality - 3 tests
    // ============================================================================

    describe('Remove functionality', () => {
        it('shows remove button when removable', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: true,
                    removable: true
                }
            })

            expect(wrapper.find('.chip-remove').exists()).toBe(true)
        })

        it('emits remove event when remove button clicked', async () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: true,
                    removable: true
                }
            })

            await wrapper.find('.chip-remove').trigger('click')

            expect(wrapper.emitted('remove')).toBeTruthy()
            expect(wrapper.emitted('remove')?.[0]).toEqual(['\\x01'])
        })

        it('does not show remove button when not removable', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    selected: true,
                    removable: false
                }
            })

            expect(wrapper.find('.chip-remove').exists()).toBe(false)
        })
    })

    // ============================================================================
    // Color Variants - 2 tests
    // ============================================================================

    describe('Color variants', () => {
        it('applies color variant class', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01',
                    color: 'primary'
                }
            })

            expect(wrapper.classes()).toContain('chip-primary')
        })

        it('applies default color when not specified', () => {
            const wrapper = mount(FilterChip, {
                props: {
                    label: 'Democracy',
                    value: '\\x01'
                }
            })

            expect(wrapper.classes()).toContain('chip-default')
        })
    })
})
