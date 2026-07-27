/**
 * uia · date + status helpers for the file-backed agenda.
 *
 * The content-files carry dates the way the owners' flyers print them —
 * `DD.MM.YY` (`'23.09.26'`). No engine parses that reliably (`new Date('23.09.26')`
 * is Invalid, or a US-order misread, depending on where it runs), so it is parsed
 * here explicitly. Plain module, no Vue — unit-testable without mounting.
 *
 * ── STATUS · what is and is not derivable this round ─────────────────────────
 * `_CUTTER-PROMPT.md` §4 names four states. Only two are honestly derivable
 * from a date sitting in a file:
 *
 *   past   → `abgeschlossen`  (green — a completed thing is not an error state)
 *   future → `findet-statt`   (green)
 *
 * `schwelle-offen` (yellow) and `anmeldung-geschlossen` (red) need a live
 * participant-count / registration-state, and this deployment has neither
 * (uia ships as its own pm2 process, no DB — §2). They stay in the vocabulary
 * so the chrome is ready the day a status-source exists; `deriveStatus` never
 * returns them. Per §5: "Do not fake a threshold state you cannot know."
 */

export type UiaStatus =
    | 'findet-statt'
    | 'schwelle-offen'
    | 'anmeldung-geschlossen'
    | 'abgeschlossen'

/** Semantic token that colours the ONE status field (§4 — never the whole row). */
export type UiaStatusToken = 'positive' | 'warning' | 'negative'

/** §4 status vocabulary · the owners' words, and which token carries them. */
export const UIA_STATUS: Record<UiaStatus, { label: string; token: UiaStatusToken }> = {
    'findet-statt': { label: 'findet statt', token: 'positive' },
    'schwelle-offen': { label: 'Schwelle noch nicht erreicht', token: 'warning' },
    'anmeldung-geschlossen': { label: 'Anmeldung geschlossen', token: 'negative' },
    'abgeschlossen': { label: 'abgeschlossen', token: 'positive' },
}

/** German weekday abbreviations, as the flyers print them. Index = `getUTCDay()`. */
const WEEKDAYS_DE = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'] as const

const DDMMYY = /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/

/**
 * Parse a content-file `DD.MM.YY` date.
 *
 * Built at **UTC noon** so no local timezone can shift the calendar day — the
 * whole point of these dates is which Wednesday they name.
 *
 * @returns the Date, or `null` for anything that is not a real calendar date.
 */
export function parseUiaDate(value: string): Date | null {
    const match = DDMMYY.exec(value.trim())
    if (!match) return null

    const day = Number(match[1])
    const month = Number(match[2])
    const year = 2000 + Number(match[3])

    const parsed = new Date(Date.UTC(year, month - 1, day, 12))
    // Date silently rolls 31.02. over into March — reject instead of accepting a lie.
    if (parsed.getUTCDate() !== day || parsed.getUTCMonth() !== month - 1) return null
    return parsed
}

/** `'23.09.26'` → `'MI 23.09.26'` — the date-line the agenda rows lead with. */
export function formatUiaDay(value: string): string {
    const parsed = parseUiaDate(value)
    if (!parsed) return value
    return `${WEEKDAYS_DE[parsed.getUTCDay()]} ${value}`
}

/** `'23.09.26'` → `'23.09.2026'` — for the places that want the full year. */
export function formatUiaDateLong(value: string): string {
    const parsed = parseUiaDate(value)
    if (!parsed) return value
    return `${pad(parsed.getUTCDate())}.${pad(parsed.getUTCMonth() + 1)}.${parsed.getUTCFullYear()}`
}

function pad(n: number): string {
    return String(n).padStart(2, '0')
}

/** Today at UTC noon — the comparison anchor, so day-boundaries behave. */
function todayAnchor(today: Date): Date {
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12))
}

/**
 * Derive the status of a single dated beat.
 *
 * Today counts as `findet-statt` — a Mittwoch is still happening on the Mittwoch.
 * Unparseable input also yields `findet-statt`: an agenda that silently marks a
 * malformed date "abgeschlossen" would hide a live beat, which is the worse failure.
 */
export function deriveStatus(value: string, today: Date = new Date()): UiaStatus {
    const parsed = parseUiaDate(value)
    if (!parsed) return 'findet-statt'
    return parsed.getTime() < todayAnchor(today).getTime() ? 'abgeschlossen' : 'findet-statt'
}

/** The dates that have not happened yet, in file order. */
export function upcoming(dates: ReadonlyArray<string>, today: Date = new Date()): string[] {
    return dates.filter((d) => deriveStatus(d, today) === 'findet-statt')
}

/**
 * The next N upcoming dates — what the landing's `agendaTeaser.limit` asks for.
 * Falls back to the last N dates once every beat is past, so the band never
 * renders empty.
 */
export function nextUp(dates: ReadonlyArray<string>, limit: number, today: Date = new Date()): string[] {
    const future = upcoming(dates, today)
    if (future.length > 0) return future.slice(0, limit)
    return dates.slice(-limit)
}
