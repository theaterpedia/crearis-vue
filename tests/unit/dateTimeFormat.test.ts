/**
 * Date/Time Format Plugin Tests
 * 
 * Tests the dateTimeFormat plugin functionality including:
 * - Format variants (compact, standard, verbose)
 * - Single and dual date handling
 * - Year/month display logic
 * - Row layout options
 * - Integration with ItemRow component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDateTime, type DateTimeOptions } from '@/plugins/dateTimeFormat'

describe('dateTimeFormat Plugin', () => {
    beforeEach(() => {
        // Mock current date to 2025-11-16 for consistent testing
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-11-16T12:00:00'))
    })

    // Test date reference: 2025-11-19 is Wednesday (MI)
    // Use this for tests expecting Wednesday/MI

    describe('Format Variants', () => {
        it('formats in compact style', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                format: 'compact',
                showTime: true
            })
            expect(result).toBe('MI 19.11 14:00')
        })

        it('formats in standard style (default)', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                format: 'standard',
                showTime: true
            })
            expect(result).toBe('MI 19.11 14:00')
        })

        it('formats in verbose style', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                format: 'verbose',
                showTime: true
            })
            expect(result).toBe('Mi., 19.11 14:00 Uhr')
        })

        it('formats without time when showTime is false', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                showTime: false
            })
            expect(result).toBe('MI 19.11')
        })
    })

    describe('Single Date', () => {
        it('formats single start date', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:30:00'
            })
            expect(result).toBe('MI 19.11 14:30')
        })

        it('formats single end date', () => {
            const result = formatDateTime({
                end: '2025-11-19T14:30:00'
            })
            expect(result).toBe('MI 19.11 14:30')
        })

        it('shows year for date in different year', () => {
            const result = formatDateTime({
                start: '2026-03-15T10:00:00'
            })
            expect(result).toBe('SA 15.03.2026 10:00')
        })

        it('shows year for past date', () => {
            const result = formatDateTime({
                start: '2024-10-10T10:00:00'
            })
            expect(result).toBe('DO 10.10.2024 10:00')
        })
    })

    describe('Date Range - Same Month', () => {
        it('hides month for end date when in same month', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                end: '2025-11-21T16:00:00'
            })
            expect(result).toBe('MI 19.11 14:00 - FR 21 16:00')
        })

        it('shows month when dates are in different months', () => {
            const result = formatDateTime({
                start: '2025-11-28T14:00:00',
                end: '2025-12-02T16:00:00'
            })
            expect(result).toBe('FR 28.11 14:00 - MO 02.12 16:00')
        })
    })

    describe('Date Range - Year Display', () => {
        it('does not show year for current year future dates', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                end: '2025-11-21T16:00:00'
            })
            expect(result).not.toContain('2025')
        })

        it('shows year when both dates are in the past', () => {
            const result = formatDateTime({
                start: '2025-10-01T14:00:00',
                end: '2025-10-05T16:00:00'
            })
            expect(result).toContain('2025')
        })

        it('shows year when dates are in different year than current', () => {
            const result = formatDateTime({
                start: '2026-01-15T14:00:00',
                end: '2026-01-20T16:00:00'
            })
            expect(result).toContain('2026')
        })

        it('shows both years when dates span different years', () => {
            const result = formatDateTime({
                start: '2025-12-30T14:00:00',
                end: '2026-01-02T16:00:00'
            })
            expect(result).toContain('2025')
            expect(result).toContain('2026')
        })
    })

    describe('Row Layout Options', () => {
        it('formats as single row (default)', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                end: '2025-11-21T16:00:00',
                rows: 'row'
            })
            expect(result).toBe('MI 19.11 14:00 - FR 21 16:00')
            expect(result).not.toContain('\n')
        })

        it('formats as separate rows with labels', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                end: '2025-11-21T16:00:00',
                rows: '1or2'
            })
            expect(result).toContain('Start: MI 19.11 14:00')
            expect(result).toContain('Ende: FR 21.11 16:00')
            expect(result.split('\n')).toHaveLength(2)
        })

        it('formats as fullText with date row and time rows', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                end: '2025-11-21T16:00:00',
                rows: 'fullText',
                showTime: true
            })
            const lines = result.split('\n')
            expect(lines).toHaveLength(3)
            expect(lines[0]).toBe('MI 19.11 - FR 21')
            expect(lines[1]).toContain('Start:')
            expect(lines[2]).toContain('Ende:')
        })

        it('formats as fullMd with bold date row', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                end: '2025-11-21T16:00:00',
                rows: 'fullMd',
                showTime: true
            })
            const lines = result.split('\n')
            expect(lines[0]).toMatch(/^\*\*.*\*\*$/)
            expect(lines[0]).toContain('MI 19.11 - FR 21')
        })
    })

    describe('Language Support', () => {
        it('formats in German (default)', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                lang: 'de'
            })
            expect(result).toContain('MI') // German day name
        })

        it('formats in English', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                lang: 'en',
                format: 'verbose'
            })
            expect(result).toContain('Wed') // English day name
        })

        it('formats in Czech', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                lang: 'cz'
            })
            expect(result).toContain('ST') // Czech day name
        })
    })

    describe('Edge Cases', () => {
        it('returns empty string when no dates provided', () => {
            const result = formatDateTime({})
            expect(result).toBe('')
        })

        it('handles null dates', () => {
            const result = formatDateTime({
                start: null,
                end: null
            })
            expect(result).toBe('')
        })

        it('handles midnight times', () => {
            const result = formatDateTime({
                start: '2025-11-19T00:00:00',
                format: 'compact'
            })
            expect(result).toBe('MI 19.11 0:00')
        })

        it('handles noon times', () => {
            const result = formatDateTime({
                start: '2025-11-19T12:00:00'
            })
            expect(result).toBe('MI 19.11 12:00')
        })
    })

    describe('Defaults', () => {
        it('uses standard format by default', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:30:00'
            })
            // Standard format pads day with zero
            expect(result).toContain('19.11')
        })

        it('uses German language by default', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00'
            })
            expect(result).toContain('MI') // German abbreviation
        })

        it('shows time by default', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:30:00'
            })
            expect(result).toContain('14:30')
        })

        it('uses row layout by default', () => {
            const result = formatDateTime({
                start: '2025-11-19T14:00:00',
                end: '2025-11-21T16:00:00'
            })
            expect(result).not.toContain('\n')
            expect(result).toContain(' - ')
        })
    })
})
