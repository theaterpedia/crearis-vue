/**
 * Width Architecture Diagnosis Tests
 * 
 * PURPOSE: Diagnose complex width relationship issues in DropdownList → ItemList → ItemTile chain
 * 
 * OBSERVED ISSUES FROM SCREENSHOT:
 * 1. DropdownList wrapper appears much smaller than 504px
 * 2. ItemTiles are exactly 504px (128px image + 376px content) - CORRECT
 * 3. White background container is narrower than ItemTiles - creates "see through" gaps
 * 4. ItemList respects wrapper sizing but wrapper has wrong width
 * 
 * HYPOTHESIS:
 * - .dropdown-list-wrapper.width-large should be 504px but isn't applying
 * - .item-list-container or .item-list has conflicting width constraints
 * - ItemTile non-compact mode: grid-template-columns: 128px 1fr might be forcing 504px
 * - CSS cascade or specificity issues preventing wrapper width from applying
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DropdownList from '@/components/clist/DropdownList.vue'
import ItemList from '@/components/clist/ItemList.vue'
import ItemTile from '@/components/clist/ItemTile.vue'

describe('Width Architecture Diagnosis', () => {
    describe('LAYER 1: DropdownList Wrapper Width', () => {
        it('DIAGNOSTIC: wrapper.width-large should set width to 504px (1.5 × 336px)', () => {
            const wrapper = mount(DropdownList, {
                props: {
                    entity: 'images',
                    width: 'large',
                    dataMode: false
                }
            })

            // Open dropdown to render content
            wrapper.vm.isOpen = true
            wrapper.vm.$nextTick()

            const dropdownWrapper = wrapper.find('.dropdown-list-wrapper.width-large')
            expect(dropdownWrapper.exists()).toBe(true)

            // Check computed style (this will show actual rendered width)
            const computedWidth = window.getComputedStyle(dropdownWrapper.element).width
            console.log('[DIAGNOSTIC] .dropdown-list-wrapper.width-large computed width:', computedWidth)

            // Expected: 504px (calc(var(--card-width) * 1.5) where --card-width = 336px)
            // If this fails, check if CSS variable --card-width is defined
        })

        it('DIAGNOSTIC: Check CSS variable --card-width availability', () => {
            const wrapper = mount(DropdownList, {
                props: {
                    entity: 'images',
                    width: 'large'
                }
            })

            wrapper.vm.isOpen = true
            wrapper.vm.$nextTick()

            const dropdownWrapper = wrapper.find('.dropdown-list-wrapper')
            const cardWidth = window.getComputedStyle(dropdownWrapper.element).getPropertyValue('--card-width')

            console.log('[DIAGNOSTIC] CSS variable --card-width value:', cardWidth)

            // Expected: "21rem" or "336px"
            // If empty, variable not defined in test environment
        })

        it('DIAGNOSTIC: wrapper should apply width class correctly', () => {
            const wrapper = mount(DropdownList, {
                props: {
                    entity: 'images',
                    width: 'large'
                }
            })

            const wrapperClasses = wrapper.vm.wrapperClasses
            console.log('[DIAGNOSTIC] wrapperClasses computed:', wrapperClasses)

            expect(wrapperClasses).toContain('width-large')
        })
    })

    describe('LAYER 2: ItemList Container Width', () => {
        it('DIAGNOSTIC: ItemList.item-list-container should have width: 100%', () => {
            const wrapper = mount(ItemList, {
                props: {
                    entity: 'images',
                    width: 'inherit',
                    items: [
                        { id: 1, heading: 'Test 1', img_square: { type: 'url', url: 'https://example.com/1.jpg' } }
                    ]
                }
            })

            const container = wrapper.find('.item-list-container')
            expect(container.exists()).toBe(true)

            const computedWidth = window.getComputedStyle(container.element).width
            console.log('[DIAGNOSTIC] .item-list-container computed width:', computedWidth)

            // Should be "100%" or match parent width
            // If fixed width, this is the problem
        })

        it('DIAGNOSTIC: ItemList.item-list should NOT have width constraints when width="inherit"', () => {
            const wrapper = mount(ItemList, {
                props: {
                    entity: 'images',
                    width: 'inherit',
                    items: [
                        { id: 1, heading: 'Test 1' }
                    ]
                }
            })

            const itemList = wrapper.find('.item-list')
            expect(itemList.exists()).toBe(true)

            // Check if width classes are applied (they shouldn't be when width="inherit")
            expect(itemList.classes()).not.toContain('width-small')
            expect(itemList.classes()).not.toContain('width-medium')
            expect(itemList.classes()).not.toContain('width-large')

            const computedWidth = window.getComputedStyle(itemList.element).width
            console.log('[DIAGNOSTIC] .item-list computed width with inherit:', computedWidth)
        })

        it('DIAGNOSTIC: Check if ItemList has conflicting width rules', () => {
            const wrapper = mount(ItemList, {
                props: {
                    entity: 'images',
                    width: 'inherit',
                    items: [
                        { id: 1, heading: 'Test 1' }
                    ]
                }
            })

            const itemList = wrapper.find('.item-list')
            const styles = window.getComputedStyle(itemList.element)

            console.log('[DIAGNOSTIC] .item-list CSS properties:', {
                width: styles.width,
                maxWidth: styles.maxWidth,
                minWidth: styles.minWidth,
                display: styles.display,
                flexDirection: styles.flexDirection
            })
        })
    })

    describe('LAYER 3: ItemTile Width in Non-Compact Mode', () => {
        it('DIAGNOSTIC: ItemTile non-compact grid should be 128px + 1fr', () => {
            const wrapper = mount(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    styleCompact: false,
                    data: {
                        type: 'url',
                        url: 'https://example.com/test.jpg'
                    }
                }
            })

            const tile = wrapper.find('.item-tile:not(.style-compact)')
            expect(tile.exists()).toBe(true)

            const styles = window.getComputedStyle(tile.element)
            console.log('[DIAGNOSTIC] ItemTile non-compact CSS:', {
                display: styles.display,
                gridTemplateColumns: styles.gridTemplateColumns,
                width: styles.width,
                minWidth: styles.minWidth,
                maxWidth: styles.maxWidth
            })

            // Expected: grid-template-columns: 128px 1fr
            // If 1fr is expanding beyond parent, this is the issue
        })

        it('DIAGNOSTIC: ItemTile should respect parent container width', () => {
            // Create parent container with specific width
            const parent = document.createElement('div')
            parent.style.width = '300px'
            parent.style.backgroundColor = 'red' // Visual debugging
            document.body.appendChild(parent)

            const wrapper = mount(ItemTile, {
                props: {
                    heading: 'Test Tile',
                    styleCompact: false,
                    data: { type: 'url', url: 'https://example.com/test.jpg' }
                },
                attachTo: parent
            })

            const tile = wrapper.find('.item-tile')
            const computedWidth = window.getComputedStyle(tile.element).width

            console.log('[DIAGNOSTIC] ItemTile width in 300px container:', computedWidth)
            console.log('[DIAGNOSTIC] Parent container width:', window.getComputedStyle(parent).width)

            // Expected: tile width ≤ 300px
            // If tile width > 300px, it's not respecting parent constraints

            document.body.removeChild(parent)
        })

        it('DIAGNOSTIC: ItemTile .tile-heading should not force width expansion', () => {
            const wrapper = mount(ItemTile, {
                props: {
                    heading: 'Very Long Heading That Should Truncate With Ellipsis',
                    styleCompact: false,
                    data: { type: 'url', url: 'https://example.com/test.jpg' }
                }
            })

            const tileHeading = wrapper.find('.tile-heading')
            const styles = window.getComputedStyle(tileHeading.element)

            console.log('[DIAGNOSTIC] .tile-heading CSS:', {
                width: styles.width,
                minWidth: styles.minWidth,
                maxWidth: styles.maxWidth,
                overflow: styles.overflow,
                flex: styles.flex
            })

            // Should have min-width: 0 to allow shrinking
            // Should have overflow: hidden
        })
    })

    describe('LAYER 4: Full Chain Integration', () => {
        it('DIAGNOSTIC: Full chain width propagation DropdownList → ItemList → ItemTile', async () => {
            const wrapper = mount(DropdownList, {
                props: {
                    entity: 'images',
                    width: 'large', // Should be 504px
                    dataMode: false
                }
            })

            // Open dropdown
            wrapper.vm.isOpen = true
            await wrapper.vm.$nextTick()

            // Measure each layer
            const dropdownWrapper = wrapper.find('.dropdown-list-wrapper.width-large')
            const itemListContainer = wrapper.find('.item-list-container')
            const itemList = wrapper.find('.item-list')

            const measurements = {
                dropdownWrapper: dropdownWrapper.exists() ? window.getComputedStyle(dropdownWrapper.element).width : 'NOT FOUND',
                itemListContainer: itemListContainer.exists() ? window.getComputedStyle(itemListContainer.element).width : 'NOT FOUND',
                itemList: itemList.exists() ? window.getComputedStyle(itemList.element).width : 'NOT FOUND'
            }

            console.log('[DIAGNOSTIC] Width chain measurements:', measurements)

            // EXPECTED: All should be ~504px
            // ISSUE: If dropdownWrapper = 504px but itemList < 504px, width not propagating
            // ISSUE: If all are < 504px, wrapper width rule not applying
        })

        it('DIAGNOSTIC: ItemTile actual rendered width vs parent width', async () => {
            const wrapper = mount(DropdownList, {
                props: {
                    entity: 'images',
                    width: 'large',
                    dataMode: false
                }
            })

            wrapper.vm.isOpen = true
            await wrapper.vm.$nextTick()

            const itemTiles = wrapper.findAll('.item-tile')
            if (itemTiles.length > 0) {
                const firstTile = itemTiles[0]
                const tileWidth = window.getComputedStyle(firstTile.element).width

                const dropdownWrapper = wrapper.find('.dropdown-list-wrapper')
                const wrapperWidth = window.getComputedStyle(dropdownWrapper.element).width

                console.log('[DIAGNOSTIC] ItemTile vs Wrapper width:', {
                    tileWidth,
                    wrapperWidth,
                    tileLargerThanWrapper: parseInt(tileWidth) > parseInt(wrapperWidth)
                })

                // ISSUE FROM SCREENSHOT: Tile = 504px, Wrapper < 504px
                // This creates the "see through" gaps
            }
        })
    })

    describe('LAYER 5: CSS Specificity & Cascade Issues', () => {
        it('DIAGNOSTIC: Check for conflicting width rules on .item-list', () => {
            const wrapper = mount(ItemList, {
                props: {
                    entity: 'images',
                    width: 'inherit',
                    items: [{ id: 1, heading: 'Test' }]
                }
            })

            const itemList = wrapper.find('.item-list')
            const allRules = []

            // Get all applied CSS rules
            const element = itemList.element as HTMLElement
            const sheets = Array.from(document.styleSheets)

            sheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || [])
                    rules.forEach((rule: any) => {
                        if (rule.selectorText && element.matches(rule.selectorText)) {
                            const width = rule.style.width
                            if (width) {
                                allRules.push({ selector: rule.selectorText, width })
                            }
                        }
                    })
                } catch (e) {
                    // CORS restrictions on some stylesheets
                }
            })

            console.log('[DIAGNOSTIC] All width rules applying to .item-list:', allRules)

            // Look for: .item-list.width-small, .item-list.width-medium, etc.
            // These should NOT apply when width="inherit"
        })

        it('DIAGNOSTIC: Verify wrapper width rule specificity', () => {
            const wrapper = mount(DropdownList, {
                props: {
                    entity: 'images',
                    width: 'large'
                }
            })

            wrapper.vm.isOpen = true
            wrapper.vm.$nextTick()

            const dropdownWrapper = wrapper.find('.dropdown-list-wrapper.width-large')

            // Check inline styles (highest priority)
            const inlineWidth = (dropdownWrapper.element as HTMLElement).style.width
            console.log('[DIAGNOSTIC] Inline width style:', inlineWidth || 'NONE')

            // If inline style exists and conflicts, that's the problem
        })
    })

    describe('ROOT CAUSE HYPOTHESES', () => {
        it('HYPOTHESIS 1: --card-width variable not defined in test/dropdown context', () => {
            // Test if CSS variable propagates into dropdown
            const wrapper = mount(DropdownList, {
                props: { entity: 'images', width: 'large' }
            })

            wrapper.vm.isOpen = true
            wrapper.vm.$nextTick()

            const dropdownContent = wrapper.find('.dropdown-content')
            const cardWidth = window.getComputedStyle(dropdownContent.element).getPropertyValue('--card-width')

            console.log('[HYPOTHESIS 1] --card-width in .dropdown-content:', cardWidth)

            // If empty: Variable not inherited into Floating UI popper
            // FIX: Add :style="systemTheme" to dropdown-list-wrapper
        })

        it('HYPOTHESIS 2: ItemList width classes override wrapper width', () => {
            const wrapper = mount(ItemList, {
                props: {
                    entity: 'images',
                    width: 'inherit',
                    items: [{ id: 1, heading: 'Test' }]
                }
            })

            const itemList = wrapper.find('.item-list')
            const hasWidthClass = itemList.classes().some((c: string) => c.startsWith('width-'))

            console.log('[HYPOTHESIS 2] ItemList has width-* class when width="inherit":', hasWidthClass)

            // If true: ItemList applying its own width classes despite inherit
            // FIX: Ensure width="inherit" prevents width classes
        })

        it('HYPOTHESIS 3: ItemTile grid forces 504px regardless of parent', () => {
            // Create narrow parent
            const parent = document.createElement('div')
            parent.style.width = '300px'
            parent.style.overflow = 'hidden'
            document.body.appendChild(parent)

            const wrapper = mount(ItemTile, {
                props: {
                    heading: 'Test',
                    styleCompact: false,
                    data: { type: 'url', url: 'https://example.com/test.jpg' }
                },
                attachTo: parent
            })

            const tile = wrapper.find('.item-tile')
            const tileWidth = parseInt(window.getComputedStyle(tile.element).width)

            console.log('[HYPOTHESIS 3] ItemTile width in 300px parent:', tileWidth)

            // If tileWidth > 300px: Grid not respecting parent constraints
            // FIX: Add max-width: 100% to .item-tile:not(.style-compact)

            expect(tileWidth).toBeLessThanOrEqual(300)

            document.body.removeChild(parent)
        })
    })
})
