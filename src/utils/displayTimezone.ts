/**
 * The display timezone — Theaterpedia renders **venue time**, not viewer time.
 *
 * ── The decision (HD, 2026-08-03) ────────────────────────────────────────────
 * > *"It was me who decided to almost hardcode the CET into the plugin — because
 * > crearis-vue is all about simplification. The good thing about Europe and time is
 * > you don't need all the timezoning as long as you stay between Stockholm,
 * > Bratislava, Madrid, Paris. If somebody browses with a different
 * > timezone/localization we should append 'CET' to the date-time-output, otherwise
 * > not. Nobody cares about these things on the continent."*
 *
 * So: **one frame for everyone, and a marker only for the reader who is not in it.**
 *
 * ── Why this is correct rather than merely simple ───────────────────────────
 * An event time is a fact about **the venue**, not about the reader. The poster says
 * „mittwochs 19–21 Uhr"; that is 19:00 in Augsburg whether you read it in Augsburg or
 * in Tokyo. Rendering it in the viewer's zone would answer a question nobody asked.
 *
 * This was implicit before and is now explicit. The platform formatter used
 * `date.getHours()` — *the viewer's* clock — which happened to be right because the
 * devbox, the server and ~90 % of readers are all in this band. That is a
 * **population-masked** correctness, and it would have flipped silently the moment the
 * Odoo sync started writing offset-carrying timestamps (`…+00:00`) instead of CV's
 * naive local ones. Measured before the change:
 *
 *     stored                            Berlin   London   New York
 *     '2026-11-04T19:00:00'   (naive)   19:00    19:00    19:00     ← venue-time by accident
 *     '2026-11-04 18:00:00+00:00'       19:00    18:00    13:00     ← viewer-time
 *
 * ── The "is the reader in the band?" test ───────────────────────────────────
 * Not a zone-name allowlist — an **offset comparison for that instant**. That covers
 * Stockholm · Bratislava · Madrid · Paris · Berlin without enumerating them, and
 * correctly excludes London (+0/+1) and Athens (+2/+3), whose wall-clocks genuinely
 * differ. DST is handled for free: the comparison is made per-instant, so a summer
 * date compares CEST against the viewer's summer offset.
 *
 * *(Accepted imprecision: a reader in, say, Lagos (+1, no DST) matches Berlin in
 * winter and gets no marker. Their wall-clock genuinely does agree that day, so the
 * omission is harmless — and chasing it would reintroduce exactly the timezoning this
 * decision removes.)*
 */

/** The venue frame. Central European, DST-aware — CET in winter, CEST in summer. */
export const DISPLAY_TZ = 'Europe/Berlin'

/**
 * The wall-clock of `date` in the display zone, carried by a Date object.
 *
 * ⚠ The returned Date is a **wall-clock carrier, not the same instant.** Its local
 * getters (`getHours()`, `getDate()`, `getDay()`…) return the display zone's values,
 * which is exactly what a formatter wants — but it must never be used for comparison
 * against `new Date()` or for arithmetic. Use the original Date for those.
 *
 * The `sv-SE` locale is chosen because it formats as `YYYY-MM-DD HH:mm:ss`, which is
 * the one common locale whose output re-parses unambiguously.
 */
export function toDisplayZone(date: Date): Date {
    if (Number.isNaN(date.getTime())) return date
    const wall = date.toLocaleString('sv-SE', { timeZone: DISPLAY_TZ })
    return new Date(wall.replace(' ', 'T'))
}

/** Does this timestamp state its own UTC offset? */
export function carriesOffset(value: string): boolean {
    return /[+-]\d{2}:?\d{2}$|Z$/.test(value.trim())
}

/**
 * Parse a stored timestamp into a **venue wall-clock carrier** — a Date whose *local*
 * getters return the venue's clock, whatever zone the reader is in.
 *
 * The two storage shapes need opposite treatment, and getting this backwards is the
 * bug this function exists to prevent:
 *
 *   · **offset-carrying** (`'2026-11-04 18:00:00+00:00'`, Odoo's wire format per K4) —
 *     a true instant. Shift it into the display zone.
 *   · **naive** (`'2026-11-04T19:00:00'`, what CV stores today) — **already venue
 *     time**. `new Date()` parses it as *local* and the getters read it back as
 *     *local*, so it round-trips to 19:00 in any zone. Touching it would be wrong.
 *
 * Converting a naive string as though it were an instant double-counts the reader's
 * offset: in `America/New_York` a 19:00 row came out as `05.11 01:00`. Invisible in
 * Berlin, which is precisely why the test forces the zone.
 */
export function parseToVenueWallClock(value: string): Date {
    const asWritten = new Date(value)
    if (!carriesOffset(value)) return asWritten          // already venue time
    if (Number.isNaN(asWritten.getTime())) return asWritten
    return toDisplayZone(asWritten)                       // true instant → venue clock
}

/** UTC offset of the display zone at this instant, in minutes (+60 CET, +120 CEST). */
export function displayZoneOffsetMinutes(date: Date): number {
    const wall = new Date(date.toLocaleString('sv-SE', { timeZone: DISPLAY_TZ }).replace(' ', 'T'))
    const utcWall = new Date(date.toLocaleString('sv-SE', { timeZone: 'UTC' }).replace(' ', 'T'))
    return Math.round((wall.getTime() - utcWall.getTime()) / 60000)
}

/** `'CET'` or `'CEST'`, chosen by the instant rather than assumed. */
export function displayZoneLabel(date: Date): string {
    return displayZoneOffsetMinutes(date) >= 120 ? 'CEST' : 'CET'
}

/**
 * Is the reader's clock outside the display zone's band for this instant?
 *
 * `getTimezoneOffset()` is minutes **behind** UTC, hence the negation. When the two
 * offsets agree the reader's wall-clock equals the venue's, so no marker is needed —
 * which is the common case on the continent and the whole point of the rule.
 */
export function viewerIsOutsideDisplayZone(date: Date): boolean {
    if (Number.isNaN(date.getTime())) return false
    return -date.getTimezoneOffset() !== displayZoneOffsetMinutes(date)
}

/**
 * The suffix to append to a rendered time, or `''`.
 *
 * Empty for a reader already in the band — *"nobody cares about these things on the
 * continent"* — and the correct CET/CEST label for anyone else, so a reader who does
 * convert lands on the right hour. Labelling a July event "CET" would be wrong by
 * exactly the hour the marker exists to prevent.
 */
export function displayZoneSuffix(date: Date): string {
    return viewerIsOutsideDisplayZone(date) ? ` ${displayZoneLabel(date)}` : ''
}
