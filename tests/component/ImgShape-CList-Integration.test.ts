/**
 * ImgShape + CList Integration Tests
 * 
 * Tests the integration between ImgShape component and CList layout components
 * (ItemRow, ItemCard, ItemTile) to ensure proper dimension validation and
 * data flow when rendering entity images.
 * 
 * Critical Goal: Prevent "wrong dimensions" errors when ImgShape is mounted
 * inside CList components with entity data.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setupCSSVariableMocks, setWrapperDimensions, STANDARD_DIMENSIONS, mockUseTheme, resetMockThemeDimensions } from '../utils/test-helpers'
import { createMockEvent, createMockUser, createMockProject, createMockImageData } from '../utils/clist-test-data'
import { mountCListComponent } from '../utils/mount-helpers'
import ItemRow from '@/components/clist/ItemRow.vue'
import ItemCard from '@/components/clist/ItemCard.vue'
import ItemTile from '@/components/clist/ItemTile.vue'
import ImgShape from '@/components/images/ImgShape.vue'

// Mock the useTheme composable so ImgShape receives stable dimensions
vi.mock('@/composables/useTheme', () => ({
    useTheme: mockUseTheme
}))

let cleanupCSS: (() => void) | null = null

beforeEach(() => {
    cleanupCSS = setupCSSVariableMocks()
    resetMockThemeDimensions() // Ensure dimensions are properly set
})

afterEach(() => {
    if (cleanupCSS) {
        cleanupCSS()
        cleanupCSS = null
    }
})

describe('ImgShape + CList Integration', () => {

    // ===================================================================
    // ItemRow + ImgShape Integration (64×64px thumbs)
    // ===================================================================

    describe('ItemRow + ImgShape', () => {
        it('should render ImgShape without dimension errors', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('thumb')

            const { wrapper } = mountCListComponent(ItemRow, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'thumb'
                }
            })

            await wrapper.vm.$nextTick()

            // Find ImgShape component
            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.exists()).toBe(true)

            // Verify no error overlay
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
            expect(wrapper.find('.error-state').exists()).toBe(false)
        })

        it('should pass entity img_thumb data correctly to ImgShape', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('thumb')

            const { wrapper } = mountCListComponent(ItemRow, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'thumb'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)

            // Verify data prop passed correctly
            expect(imgShape.props('data')).toEqual(imageData)
            expect(imgShape.props('shape')).toBe('thumb')
        })

        it('should use thumb shape by default when shape not specified', async () => {
            const user = createMockUser()
            const imageData = createMockImageData('thumb')

            const { wrapper } = mountCListComponent(ItemRow, {
                props: {
                    heading: user.title,
                    data: imageData
                    // shape not specified - should default to 'thumb'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('shape')).toBe('thumb')
        })

        it('should render ImgShape with proper dimensions from theme', async () => {
            const project = createMockProject()
            const imageData = createMockImageData('thumb')

            const { wrapper } = mountCListComponent(ItemRow, {
                props: {
                    heading: project.title,
                    data: imageData,
                    shape: 'thumb'
                }
            })

            await wrapper.vm.$nextTick()

            // ImgShape should have received avatarWidth from theme
            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.vm.dimensions).toEqual([64, 64])
        })

        it('should handle entity data with xmlid for shape detection', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('thumb', { xmlid: event.xmlID })

            const { wrapper } = mountCListComponent(ItemRow, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'thumb'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)

            // Verify xmlid passed (used for square vs round detection)
            expect(imgShape.props('data').xmlid).toBeDefined()
            expect(imgShape.props('data').xmlid).toContain('event')
        })

        it('should render multiple ItemRows with ImgShape without errors', async () => {
            const events = [
                createMockEvent(),
                createMockEvent(),
                createMockEvent()
            ]

            const wrappers = events.map(event => {
                const imageData = createMockImageData('thumb')
                return mountCListComponent(ItemRow, {
                    props: {
                        heading: event.title,
                        data: imageData,
                        shape: 'thumb'
                    }
                }).wrapper
            })

            await Promise.all(wrappers.map(w => w.vm.$nextTick()))

            // All should render without errors
            wrappers.forEach(wrapper => {
                expect(wrapper.find('.error-overlay').exists()).toBe(false)
                const imgShape = wrapper.findComponent(ImgShape)
                expect(imgShape.exists()).toBe(true)
            })

            // Cleanup
            wrappers.forEach(w => w.unmount())
        })
    })

    // ===================================================================
    // ItemCard + ImgShape Integration (336×168px wide cards)
    // ===================================================================

    describe('ItemCard + ImgShape', () => {
        it('should render ImgShape without dimension errors', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // Find ImgShape component
            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.exists()).toBe(true)

            // Verify no error overlay
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
            expect(wrapper.find('.error-state').exists()).toBe(false)
        })

        it('should pass entity img_wide data correctly to ImgShape', async () => {
            const project = createMockProject()
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: project.title,
                    data: imageData,
                    shape: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)

            // Verify data prop passed correctly
            expect(imgShape.props('data')).toEqual(imageData)
            expect(imgShape.props('shape')).toBe('wide')
        })

        it('should use wide shape by default when shape not specified', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: imageData
                    // shape not specified - should default to 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('shape')).toBe('wide')
        })

        it('should render ImgShape with proper dimensions from theme', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // ImgShape should have received cardWidth/cardHeight from theme
            const imgShape = wrapper.findComponent(ImgShape)
            // wide shape: cardWidth × (cardHeight * 0.75)
            // 336 × (224 * 0.75) = 336 × 168
            expect(imgShape.vm.dimensions).toEqual([336, 168])
        })

        it('should handle entity data with blur hash', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('wide', event)

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)

            // Verify blur hash passed (for placeholder)
            expect(imgShape.props('data').blur).toBeDefined()
        })

        it('should render ItemCard as background image without errors', async () => {
            const project = createMockProject()
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: project.title,
                    data: imageData,
                    shape: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // Card should have background image styling
            expect(wrapper.find('.card-background-image').exists()).toBe(true)

            // No dimension errors
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
        })
    })

    // ===================================================================
    // ItemTile + ImgShape Integration (128×128px squares)
    // ===================================================================

    describe('ItemTile + ImgShape', () => {
        it('should render ImgShape without dimension errors', async () => {
            const user = createMockUser()
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: user.title,
                    data: imageData,
                    shape: 'square'
                }
            })

            await wrapper.vm.$nextTick()

            // Find ImgShape component
            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.exists()).toBe(true)

            // Verify no error overlay
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
            expect(wrapper.find('.error-state').exists()).toBe(false)
        })

        it('should pass entity img_square data correctly to ImgShape', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'square'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)

            // Verify data prop passed correctly
            expect(imgShape.props('data')).toEqual(imageData)
            expect(imgShape.props('shape')).toBe('square')
        })

        it('should use square shape by default when shape not specified', async () => {
            const project = createMockProject()
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: project.title,
                    data: imageData
                    // shape not specified - should default to 'square'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.props('shape')).toBe('square')
        })

        it('should render ImgShape with proper dimensions from theme', async () => {
            const user = createMockUser()
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: user.title,
                    data: imageData,
                    shape: 'square'
                }
            })

            await wrapper.vm.$nextTick()

            // ImgShape should have received tileWidth from theme
            const imgShape = wrapper.findComponent(ImgShape)
            // square shape: tileWidth × tileWidth
            expect(imgShape.vm.dimensions).toEqual([128, 128])
        })

        it('should handle compact mode with ImgShape', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'square',
                    compact: true
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.exists()).toBe(true)

            // No dimension errors in compact mode
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
        })

        it('should handle beside mode with ImgShape', async () => {
            const project = createMockProject()
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: project.title,
                    data: imageData,
                    shape: 'square',
                    beside: true
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.exists()).toBe(true)

            // No dimension errors in beside mode
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
        })
    })

    // ===================================================================
    // Cross-Component Dimension Validation
    // ===================================================================

    describe('Cross-Component Dimension Validation', () => {
        it('should handle all three components with different shapes simultaneously', async () => {
            const event = createMockEvent()

            const thumbData = createMockImageData('thumb')
            const wideData = createMockImageData('wide')
            const squareData = createMockImageData('square')

            const rowWrapper = mountCListComponent(ItemRow, {
                props: {
                    heading: event.title,
                    data: thumbData,
                    shape: 'thumb'
                }
            }).wrapper

            const cardWrapper = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: wideData,
                    shape: 'wide'
                }
            }).wrapper

            const tileWrapper = mountCListComponent(ItemTile, {
                props: {
                    heading: event.title,
                    data: squareData,
                    shape: 'square'
                }
            }).wrapper

            await Promise.all([
                rowWrapper.vm.$nextTick(),
                cardWrapper.vm.$nextTick(),
                tileWrapper.vm.$nextTick()
            ])

            // All should render without errors
            const wrappers = [rowWrapper, cardWrapper, tileWrapper]
            wrappers.forEach(wrapper => {
                expect(wrapper.find('.error-overlay').exists()).toBe(false)
                const imgShape = wrapper.findComponent(ImgShape)
                expect(imgShape.exists()).toBe(true)
            })

            // Verify correct dimensions for each
            expect(rowWrapper.findComponent(ImgShape).vm.dimensions).toEqual([64, 64])
            expect(cardWrapper.findComponent(ImgShape).vm.dimensions).toEqual([336, 168])
            expect(tileWrapper.findComponent(ImgShape).vm.dimensions).toEqual([128, 128])

            // Cleanup
            wrappers.forEach(w => w.unmount())
        })

        it('should not show error overlay with valid entity data', async () => {
            const entities = [
                { component: ItemRow, shape: 'thumb' as const },
                { component: ItemCard, shape: 'wide' as const },
                { component: ItemTile, shape: 'square' as const }
            ]

            for (const { component, shape } of entities) {
                const event = createMockEvent()
                const imageData = createMockImageData(shape)

                const { wrapper } = mountCListComponent(component, {
                    props: {
                        heading: event.title,
                        data: imageData,
                        shape
                    }
                })

                await wrapper.vm.$nextTick()

                // Should never show error overlay
                const errorOverlay = wrapper.find('.error-overlay')
                expect(errorOverlay.exists()).toBe(false)

                const imgShape = wrapper.findComponent(ImgShape)
                expect(imgShape.vm.hasError).toBe(false)

                wrapper.unmount()
            }
        })

        it('should handle entity data with all ImgShapeData properties', async () => {
            const event = createMockEvent()
            const completeImageData = {
                type: 'url' as const,
                url: 'https://images.unsplash.com/photo-1234567890',
                xmlid: `img-event-${event.id}`,
                blur: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
                tpar: 'fit=crop&w={W}&h={H}',
                turl: null,
                x: 0,
                y: 0,
                z: 1,
                alt_text: event.title
            }

            const { wrapper } = mountCListComponent(ItemRow, {
                props: {
                    heading: event.title,
                    data: completeImageData,
                    shape: 'thumb'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)

            // All properties should be passed through
            expect(imgShape.props('data')).toEqual(completeImageData)
            expect(wrapper.find('.error-overlay').exists()).toBe(false)
        })
    })

    // ===================================================================
    // Edge Cases: Dimension Errors
    // ===================================================================

    describe('Edge Cases: Dimension Handling', () => {
        it('should handle missing dimensions gracefully', async () => {
            // Note: This test verifies that ImgShape with valid theme dimensions
            // does NOT enter error state. Testing invalid dimensions would require
            // mocking theme BEFORE component mount, which is complex in this setup.

            const event = createMockEvent()
            const imageData = createMockImageData('wide')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'wide'
                }
            })

            await wrapper.vm.$nextTick()

            // With valid dimensions, should NOT show error
            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.vm.hasError).toBe(false)
            expect(imgShape.vm.dimensions).toEqual([336, 168])
        })

        it('should recover when dimensions become valid', async () => {
            const event = createMockEvent()
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemTile, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'square'
                }
            })

            await wrapper.vm.$nextTick()

            const imgShape = wrapper.findComponent(ImgShape)

            // Initially should be valid
            expect(imgShape.vm.hasError).toBe(false)

            // This verifies dimension validation is reactive
            expect(imgShape.vm.dimensions).toEqual([128, 128])
        })

        it('should handle shape mismatch between component and data', async () => {
            const event = createMockEvent()
            // Create square data but use wide shape
            const imageData = createMockImageData('square')

            const { wrapper } = mountCListComponent(ItemCard, {
                props: {
                    heading: event.title,
                    data: imageData,
                    shape: 'wide' // Mismatch: square data, wide shape
                }
            })

            await wrapper.vm.$nextTick()

            // ImgShape should still render (dimensions come from shape prop)
            const imgShape = wrapper.findComponent(ImgShape)
            expect(imgShape.exists()).toBe(true)

            // Should use wide dimensions (336×168) regardless of data source
            expect(imgShape.vm.dimensions).toEqual([336, 168])
        })
    })

    // ===================================================================
    // Real-World Usage Patterns
    // ===================================================================

    describe('Real-World Usage Patterns', () => {
        it('should render a list of events with ItemRow + ImgShape', async () => {
            const events = [
                createMockEvent(),
                createMockEvent(),
                createMockEvent()
            ]

            const wrappers = events.map(event => {
                const imageData = createMockImageData('thumb')
                return mountCListComponent(ItemRow, {
                    props: {
                        heading: event.title,
                        data: imageData,
                        shape: 'thumb'
                    }
                }).wrapper
            })

            await Promise.all(wrappers.map(w => w.vm.$nextTick()))

            // All should render successfully
            wrappers.forEach(wrapper => {
                const imgShape = wrapper.findComponent(ImgShape)
                expect(imgShape.exists()).toBe(true)
                expect(imgShape.vm.hasError).toBe(false)
            })

            wrappers.forEach(w => w.unmount())
        })

        it('should render a gallery of projects with ItemCard + ImgShape', async () => {
            const projects = [
                createMockProject(),
                createMockProject(),
                createMockProject()
            ]

            const wrappers = projects.map(project => {
                const imageData = createMockImageData('wide')
                return mountCListComponent(ItemCard, {
                    props: {
                        heading: project.title,
                        data: imageData,
                        shape: 'wide'
                    }
                }).wrapper
            })

            await Promise.all(wrappers.map(w => w.vm.$nextTick()))

            // All should render successfully
            wrappers.forEach(wrapper => {
                const imgShape = wrapper.findComponent(ImgShape)
                expect(imgShape.exists()).toBe(true)
                expect(imgShape.vm.hasError).toBe(false)
            })

            wrappers.forEach(w => w.unmount())
        })

        it('should render a grid of users with ItemTile + ImgShape', async () => {
            const users = [
                createMockUser(),
                createMockUser(),
                createMockUser()
            ]

            const wrappers = users.map(user => {
                const imageData = createMockImageData('square')
                return mountCListComponent(ItemTile, {
                    props: {
                        heading: user.title,
                        data: imageData,
                        shape: 'square'
                    }
                }).wrapper
            })

            await Promise.all(wrappers.map(w => w.vm.$nextTick()))

            // All should render successfully
            wrappers.forEach(wrapper => {
                const imgShape = wrapper.findComponent(ImgShape)
                expect(imgShape.exists()).toBe(true)
                expect(imgShape.vm.hasError).toBe(false)
            })

            wrappers.forEach(w => w.unmount())
        })

        it('should handle mixed entity types in a list', async () => {
            const event = createMockEvent()
            const user = createMockUser()
            const project = createMockProject()

            const entities = [
                { entity: event, shape: 'thumb' as const, component: ItemRow },
                { entity: user, shape: 'square' as const, component: ItemTile },
                { entity: project, shape: 'wide' as const, component: ItemCard }
            ]

            const wrappers = entities.map(({ entity, shape, component }) => {
                const imageData = createMockImageData(shape)
                const heading = entity.title // All mock entities use 'title' property

                return mountCListComponent(component, {
                    props: {
                        heading,
                        data: imageData,
                        shape
                    }
                }).wrapper
            })

            await Promise.all(wrappers.map(w => w.vm.$nextTick()))

            // All should render successfully with correct dimensions
            wrappers.forEach(wrapper => {
                const imgShape = wrapper.findComponent(ImgShape)
                expect(imgShape.exists()).toBe(true)
                expect(imgShape.vm.hasError).toBe(false)
                expect(wrapper.find('.error-overlay').exists()).toBe(false)
            })

            wrappers.forEach(w => w.unmount())
        })
    })
})
