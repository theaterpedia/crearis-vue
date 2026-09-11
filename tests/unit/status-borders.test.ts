/**
 * The two named lines on the sysreg ladder — DECISION-ENCODING tests.
 *
 * 1. The DRAFTING-BORDER at 64 is NOT the Rubicon at 512. HD blessed 64 as the
 *    intended Stepper/Dashboard boundary (sysreg thread §2, 2026-08-06) after a
 *    live table-vs-prose contradiction. Changing these assertions reverses a
 *    named ruling — reopen it in the thread, don't loosen the test.
 * 2. The comparison is MASKED: raw equality against NEW(1)/DEMO(8) let the
 *    3-bit-slot subcategories (new_user=3, demo_project=24) silently fall
 *    through to Dashboard — the F-6 rider defect this suite pins shut.
 * 3. isPublished is the ONE spelling of the rotation predicate (project-status
 *    thread §1/§4): masked lifecycle ≥ RELEASED, < ARCHIVED.
 */

import { describe, expect, it } from 'vitest'
import {
    DRAFTING_BORDER,
    RUBICON,
    STATUS,
    isBeforeDraftingBorder,
    isPublished,
} from '@/utils/status-constants'

describe('the drafting-border · 64, masked — not the Rubicon', () => {
    it('is a DIFFERENT line than the Rubicon — two lines, two names', () => {
        expect(DRAFTING_BORDER).toBe(64)
        expect(RUBICON).toBe(512)
        expect(DRAFTING_BORDER).not.toBe(RUBICON)
    })

    it('puts NEW and DEMO categories before the border (→ Stepper)', () => {
        expect(isBeforeDraftingBorder(STATUS.NEW)).toBe(true)
        expect(isBeforeDraftingBorder(STATUS.DEMO)).toBe(true)
    })

    it('keeps the 3-bit-slot SUBCATEGORIES on the Stepper side — the raw-equality defect', () => {
        expect(isBeforeDraftingBorder(3)).toBe(true) // new_user
        expect(isBeforeDraftingBorder(24)).toBe(true) // demo_project
        expect(isBeforeDraftingBorder(32)).toBe(true) // demo_user
    })

    it('puts DRAFT and everything above into Dashboard mode', () => {
        expect(isBeforeDraftingBorder(STATUS.DRAFT)).toBe(false)
        expect(isBeforeDraftingBorder(256)).toBe(false) // draft_review — inside the draft slot
        expect(isBeforeDraftingBorder(STATUS.CONFIRMED)).toBe(false)
        expect(isBeforeDraftingBorder(STATUS.RELEASED)).toBe(false)
        expect(isBeforeDraftingBorder(STATUS.ARCHIVED)).toBe(false) // Dashboard read-only, not Stepper
    })

    it('masks the scope toggles — a NEW row carrying scope bits stays a Stepper row', () => {
        expect(isBeforeDraftingBorder(STATUS.NEW | (1 << 21))).toBe(true)
        // …and a scope-inflated draft does not fall back to Stepper either.
        expect(isBeforeDraftingBorder(STATUS.DRAFT | (1 << 21))).toBe(false)
    })

    it('treats no-status as not-yet-drafting', () => {
        expect(isBeforeDraftingBorder(null)).toBe(true)
        expect(isBeforeDraftingBorder(undefined)).toBe(true)
    })
})

describe('isPublished · the rotation predicate, one spelling', () => {
    it('publishes at RELEASED and not one step earlier', () => {
        expect(isPublished(STATUS.RELEASED)).toBe(true)
        expect(isPublished(STATUS.CONFIRMED)).toBe(false)
        expect(isPublished(STATUS.DRAFT)).toBe(false)
    })

    it('bounds out archived and trash — the raw >= bug class', () => {
        expect(isPublished(STATUS.ARCHIVED)).toBe(false)
        expect(isPublished(STATUS.TRASH)).toBe(false)
        expect(isPublished(STATUS.RELEASED | STATUS.ARCHIVED)).toBe(false)
    })

    it('masks scope toggles — a released row with scope bits is still published', () => {
        expect(isPublished(STATUS.RELEASED | (1 << 17))).toBe(true)
        // …and a draft inflated by toggles does not read as published.
        expect(isPublished(STATUS.DRAFT | (1 << 21))).toBe(false)
    })

    it('treats no-status as unpublished', () => {
        expect(isPublished(null)).toBe(false)
        expect(isPublished(undefined)).toBe(false)
    })
})
