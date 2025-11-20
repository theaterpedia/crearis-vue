/**
 * Component Tests: StatusBadge
 * 
 * Tests visual status badge component rendering and interactivity.
 * Total: 15 tests covering appearance, variants, and click handling.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/sysreg/StatusBadge.vue'

describe('StatusBadge Component', () => {

    // ============================================================================
    // Rendering - 6 tests
    // ============================================================================

    describe('Rendering', () => {
        it('renders status label', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published'
                }
            })

            expect(wrapper.text()).toContain('Published')
        })

        it('applies correct color for published status', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published'
                }
            })

            expect(wrapper.classes()).toContain('status-published')
        })

        it('applies correct color for raw status', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x00',
                    label: 'Raw'
                }
            })

            expect(wrapper.classes()).toContain('status-raw')
        })

        it('applies correct color for approved status', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x02',
                    label: 'Approved'
                }
            })

            expect(wrapper.classes()).toContain('status-approved')
        })

        it('applies correct color for deprecated status', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x08',
                    label: 'Deprecated'
                }
            })

            expect(wrapper.classes()).toContain('status-deprecated')
        })

        it('renders with custom class', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    customClass: 'my-custom-class'
                }
            })

            expect(wrapper.classes()).toContain('my-custom-class')
        })
    })

    // ============================================================================
    // Size Variants - 3 tests
    // ============================================================================

    describe('Size variants', () => {
        it('renders small size', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    size: 'sm'
                }
            })

            expect(wrapper.classes()).toContain('badge-sm')
        })

        it('renders medium size (default)', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published'
                }
            })

            expect(wrapper.classes()).toContain('badge-md')
        })

        it('renders large size', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    size: 'lg'
                }
            })

            expect(wrapper.classes()).toContain('badge-lg')
        })
    })

    // ============================================================================
    // Interactivity - 4 tests
    // ============================================================================

    describe('Interactivity', () => {
        it('emits click event when clickable', async () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    clickable: true
                }
            })

            await wrapper.trigger('click')

            expect(wrapper.emitted('click')).toBeTruthy()
            expect(wrapper.emitted('click')).toHaveLength(1)
        })

        it('does not emit click when not clickable', async () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    clickable: false
                }
            })

            await wrapper.trigger('click')

            expect(wrapper.emitted('click')).toBeFalsy()
        })

        it('shows hover effect when clickable', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    clickable: true
                }
            })

            expect(wrapper.classes()).toContain('badge-clickable')
        })

        it('passes status value in click event', async () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    clickable: true
                }
            })

            await wrapper.trigger('click')

            expect(wrapper.emitted('click')?.[0]).toEqual(['\\x04'])
        })
    })

    // ============================================================================
    // Icon Display - 2 tests
    // ============================================================================

    describe('Icon display', () => {
        it('renders icon when provided', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published',
                    icon: 'check-circle'
                }
            })

            expect(wrapper.find('.badge-icon').exists()).toBe(true)
        })

        it('does not render icon when not provided', () => {
            const wrapper = mount(StatusBadge, {
                props: {
                    status: '\\x04',
                    label: 'Published'
                }
            })

            expect(wrapper.find('.badge-icon').exists()).toBe(false)
        })
    })
})
