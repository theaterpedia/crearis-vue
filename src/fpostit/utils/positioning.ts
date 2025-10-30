/**
 * Positioning Utilities for Floating Post-Its
 * 
 * Handles position calculation based on horizontal logic (hlogic),
 * viewport constraints, and mobile responsiveness.
 */

import type { HorizontalLogic, FpostitPosition, PostitRotation } from '../types'

/**
 * Mobile breakpoint (matches typical mobile width)
 */
const MOBILE_BREAKPOINT = 768

/**
 * Right-third threshold (66.67% of viewport width)
 */
const RIGHT_THIRD_THRESHOLD = 0.6667

/**
 * Desktop post-it width
 */
const DESKTOP_WIDTH = '400px'

/**
 * Mobile post-it width (50% of viewport)
 */
const MOBILE_WIDTH_PERCENTAGE = 50

/**
 * Spacing from screen edges
 */
const EDGE_SPACING = 16

/**
 * Check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
    if (typeof window === 'undefined') return false
    return window.innerWidth < MOBILE_BREAKPOINT
}

/**
 * Check if trigger element is in the right third of the viewport
 */
export function isInRightThird(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    const elementCenter = rect.left + rect.width / 2
    const viewportWidth = window.innerWidth

    return elementCenter > viewportWidth * RIGHT_THIRD_THRESHOLD
}

/**
 * Calculate position for a floating post-it
 * 
 * @param triggerElement - The element that triggered the post-it
 * @param hlogic - Horizontal positioning logic
 * @param hOffset - Horizontal offset in rem (for stacking)
 * @returns Position configuration
 */
export function calculatePosition(
    triggerElement: HTMLElement,
    hlogic: HorizontalLogic = 'default',
    hOffset: number = 0
): FpostitPosition {
    const isMobile = isMobileViewport()
    const rect = triggerElement.getBoundingClientRect()

    // Base position aligned with trigger top
    const top = `${rect.top + window.scrollY}px`

    // Mobile positioning
    if (isMobile) {
        const isRightSide = isInRightThird(triggerElement)

        return {
            top,
            left: isRightSide ? undefined : `${EDGE_SPACING}px`,
            right: isRightSide ? `${EDGE_SPACING}px` : undefined,
            maxWidth: `${MOBILE_WIDTH_PERCENTAGE}vw`,
            isMobile: true,
            hOffset
        }
    }

    // Desktop positioning based on hlogic
    switch (hlogic) {
        case 'right':
            // Always position on right side of screen
            return {
                top,
                right: `${EDGE_SPACING}px`,
                maxWidth: DESKTOP_WIDTH,
                isMobile: false,
                hOffset
            }

        case 'left':
            // Always position on left side of screen
            return {
                top,
                left: `${EDGE_SPACING}px`,
                maxWidth: DESKTOP_WIDTH,
                isMobile: false,
                hOffset
            }

        case 'element':
            // Position near element, choose side intelligently
            // Draft implementation: Check if element is in right half
            const viewportWidth = window.innerWidth
            const elementCenter = rect.left + rect.width / 2
            const isRightHalf = elementCenter > viewportWidth / 2

            if (isRightHalf) {
                // Element on right, position post-it to the left of it
                return {
                    top,
                    right: `${viewportWidth - rect.left + EDGE_SPACING}px`,
                    maxWidth: DESKTOP_WIDTH,
                    isMobile: false,
                    hOffset
                }
            } else {
                // Element on left, position post-it to the right of it
                return {
                    top,
                    left: `${rect.right + EDGE_SPACING}px`,
                    maxWidth: DESKTOP_WIDTH,
                    isMobile: false,
                    hOffset
                }
            }

        case 'default':
        default:
            // Default behavior: position on right side of screen
            return {
                top,
                right: `${EDGE_SPACING}px`,
                maxWidth: DESKTOP_WIDTH,
                isMobile: false,
                hOffset
            }
    }
}

/**
 * Get a random rotation for visual variety
 * Matches the rotation options from PostIt component
 */
export function getRandomRotation(): PostitRotation {
    const rotations: PostitRotation[] = [
        'rotate-0',
        '-rotate-1',
        '-rotate-2',
        '-rotate-3',
        'rotate-1',
        'rotate-2',
        'rotate-3'
    ]

    return rotations[Math.floor(Math.random() * rotations.length)] as PostitRotation
}

/**
 * Convert position object to CSS style string
 */
export function positionToStyle(position: FpostitPosition): Record<string, string> {
    const style: Record<string, string> = {
        position: 'absolute',
        top: position.top,
        maxWidth: position.maxWidth,
        zIndex: '1000'
    }

    if (position.left !== undefined) {
        // Apply hOffset for left-positioned post-its
        const leftValue = parseInt(position.left) + (position.hOffset || 0) * 16 // Convert rem to px (1rem = 16px)
        style.left = `${leftValue}px`
    }

    if (position.right !== undefined) {
        // Apply hOffset for right-positioned post-its
        const rightValue = parseInt(position.right) + (position.hOffset || 0) * 16 // Convert rem to px (1rem = 16px)
        style.right = `${rightValue}px`
    }

    return style
}

/**
 * Check if two post-its would overlap vertically
 * Used for future stacking logic if needed
 */
export function wouldOverlap(
    pos1: FpostitPosition,
    height1: number,
    pos2: FpostitPosition,
    height2: number
): boolean {
    const top1 = parseInt(pos1.top)
    const bottom1 = top1 + height1

    const top2 = parseInt(pos2.top)
    const bottom2 = top2 + height2

    return !(bottom1 < top2 || top1 > bottom2)
}
