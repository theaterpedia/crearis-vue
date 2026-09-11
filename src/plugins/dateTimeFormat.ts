/**
 * Date/Time Formatting Plugin
 * 
 * Handles date and time presentation for entities (especially events).
 * Supports German time/date formatting with planned i18n support.
 * 
 * Field naming follows event entity spec:
 * - date_begin (ISO string)
 * - date_end (ISO string)
 */

import type { App } from 'vue'
import { parseToVenueWallClock, displayZoneSuffix } from '@/utils/displayTimezone'

export type DateTimeFormat =
    | 'compact'      // "FR 7.11 0:00"
    | 'standard'     // "FR 07.11 00:00" (default)
    | 'verbose'      // "Fr., 7.11 00:00 Uhr"

export type DateTimeRows =
    | 'row'          // Single row, concatenated with " - "
    | '1or2'         // Separate rows with "Start: " / "Ende: "
    | 'fullText'     // Date row + time rows
    | 'fullMd'       // Date row in **bold** + time rows

export type DateTimeLang = 'de' | 'en' | 'cz'

export interface DateTimeOptions {
    start?: string | null
    end?: string | null
    format?: DateTimeFormat
    lang?: DateTimeLang
    showTime?: boolean
    rows?: DateTimeRows
    md?: boolean
}

interface DayNames {
    compact: string[]
    verbose: string[]
}

const DAY_NAMES: Record<DateTimeLang, DayNames> = {
    de: {
        compact: ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'],
        verbose: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.']
    },
    en: {
        compact: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
        verbose: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    cz: {
        compact: ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'],
        verbose: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
    }
}

/**
 * Format a single date according to format specification
 */
function formatSingleDate(
    instant: Date,
    format: DateTimeFormat,
    lang: DateTimeLang,
    showTime: boolean,
    showYear: boolean = false,
    showMonth: boolean = true
): string {
    // `instant` is already a VENUE WALL-CLOCK CARRIER — normalised at the parse
    // boundary in formatInDisplayZone(), because only there is the original string
    // (and therefore whether it carried an offset) still known. Every getter below is
    // a local-time getter, and that is correct on a carrier.
    const date = instant

    const dayNames = format === 'verbose'
        ? DAY_NAMES[lang].verbose
        : DAY_NAMES[lang].compact

    const dayName = dayNames[date.getDay()]
    const day = format === 'compact'
        ? date.getDate().toString()
        : date.getDate().toString().padStart(2, '0')

    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    let result = ''

    // Day name
    if (format === 'verbose') {
        result += `${dayName}, `
    } else {
        result += `${dayName} `
    }

    // Date part
    if (showMonth) {
        result += `${day}.${month}`
        if (showYear) {
            result += `.${year}`
        }
    } else {
        // Only day (when same month as start date)
        result += day
    }

    // Time part
    if (showTime) {
        const hours = format === 'compact'
            ? date.getHours().toString()
            : date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')

        if (format === 'verbose') {
            result += ` ${hours}:${minutes} Uhr`
        } else {
            result += ` ${hours}:${minutes}`
        }
    }

    return result
}

/**
 * Check if date is in the past
 */
function isInPast(date: Date): boolean {
    return date < new Date()
}

/**
 * Check if date is in current year
 */
function isCurrentYear(date: Date): boolean {
    return date.getFullYear() === new Date().getFullYear()
}

/**
 * Check if two dates are in the same month
 */
function isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth()
}

/**
 * Check if two dates are in the same year
 */
function isSameYear(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear()
}

/**
 * Main formatting function
 */
/**
 * Public entry point. Formats in the display zone (venue time) and appends a CET/CEST
 * marker ONLY when the reader's clock is outside that band — per HD 2026-08-03:
 * *"nobody cares about these things on the continent"*, but a reader elsewhere needs
 * to know which frame the number is in.
 *
 * The marker is attached only when a time is actually shown; a bare date carries no
 * zone claim worth marking.
 */
export function formatDateTime(options: DateTimeOptions): string {
    const rendered = formatInDisplayZone(options)
    if (!rendered || options.showTime === false) return rendered

    const anchor = options.start || options.end
    if (!anchor) return rendered
    const instant = new Date(anchor)
    if (Number.isNaN(instant.getTime())) return rendered

    return rendered + displayZoneSuffix(instant)
}

function formatInDisplayZone(options: DateTimeOptions): string {
    const {
        start,
        end,
        format = 'standard',
        lang = 'de',
        showTime = true,
        rows = 'row',
        md = false
    } = options

    // Validate: at least one date must be provided
    if (!start && !end) {
        return ''
    }

    // Venue time (HD 2026-08-03): render the venue's clock, identically for every
    // reader. Naive strings are already venue-time and are left alone; offset-carrying
    // ones (Odoo's wire format) are shifted. See utils/displayTimezone.ts.
    //
    // ⚠ These are wall-clock carriers, not instants. isInPast()/isCurrentYear() below
    // therefore compare a venue calendar against the reader's `now`, which can differ
    // by hours near midnight for a distant reader. They only decide whether to show a
    // YEAR, so the imprecision is cosmetic — noted rather than hidden.
    const startDate = start ? parseToVenueWallClock(start) : null
    const endDate = end ? parseToVenueWallClock(end) : null

    // Single date case
    if (!startDate || !endDate) {
        const date = (startDate || endDate)!
        const showYear = !isCurrentYear(date) || isInPast(date)
        return formatSingleDate(date, format, lang, showTime, showYear)
    }

    // Both dates provided - handle year display logic
    const bothInPast = isInPast(startDate) && isInPast(endDate)
    const sameYear = isSameYear(startDate, endDate)
    const sameMonth = isSameMonth(startDate, endDate)
    const currentYear = isCurrentYear(startDate) && isCurrentYear(endDate)

    let showYearStart = false
    let showYearEnd = false

    if (!sameYear) {
        // Different years: always show both
        showYearStart = true
        showYearEnd = true
    } else if (!currentYear) {
        // Not current year (future years): show year on end date
        showYearEnd = true
    } else if (currentYear && bothInPast) {
        // Both dates are in the past within current year: show year on end date
        showYearEnd = true
    }

    // Format based on rows option
    if (rows === 'row') {
        const startStr = formatSingleDate(
            startDate,
            format,
            lang,
            showTime,
            showYearStart,
            true // always show month for start
        )
        const endStr = formatSingleDate(
            endDate,
            format,
            lang,
            showTime,
            showYearEnd,
            !sameMonth // hide month if same as start
        )
        return `${startStr} - ${endStr}`
    }

    if (rows === '1or2') {
        const startStr = formatSingleDate(startDate, format, lang, showTime, showYearStart)
        const endStr = formatSingleDate(endDate, format, lang, showTime, showYearEnd)
        return `Start: ${startStr}\nEnde: ${endStr}`
    }

    if (rows === 'fullText') {
        // First row: dates only
        const startDateOnly = formatSingleDate(startDate, format, lang, false, showYearStart)
        const endDateOnly = formatSingleDate(endDate, format, lang, false, showYearEnd, !sameMonth)
        let result = `${startDateOnly} - ${endDateOnly}`

        // Add time rows if showTime
        if (showTime) {
            const startTimeStr = formatSingleDate(startDate, format, lang, true, false, false)
            const endTimeStr = formatSingleDate(endDate, format, lang, true, false, false)
            result += `\nStart: ${startTimeStr}`
            result += `\nEnde: ${endTimeStr}`
        }
        return result
    }

    if (rows === 'fullMd') {
        // First row: dates only in bold
        const startDateOnly = formatSingleDate(startDate, format, lang, false, showYearStart)
        const endDateOnly = formatSingleDate(endDate, format, lang, false, showYearEnd, !sameMonth)
        let result = `**${startDateOnly} - ${endDateOnly}**`

        // Add time rows if showTime
        if (showTime) {
            const startTimeStr = formatSingleDate(startDate, format, lang, true, false, false)
            const endTimeStr = formatSingleDate(endDate, format, lang, true, false, false)
            result += `\nStart: ${startTimeStr}`
            result += `\nEnde: ${endTimeStr}`
        }
        return result
    }

    return ''
}

/**
 * Vue plugin installation
 */
export default {
    install(app: App) {
        app.config.globalProperties.$formatDateTime = formatDateTime
    }
}

/**
 * Type augmentation for Vue global properties
 */
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $formatDateTime: typeof formatDateTime
    }
}
