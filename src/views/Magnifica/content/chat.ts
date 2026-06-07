/**
 * Shared shape for the Magnifica chat/letter displays (the typewriter codebox).
 *
 * One component (MagnificaChatbox) renders both:
 *   - the landing letter (Hans → Olah · no speakers · CCC/CCCS lines accented)
 *   - the /ethnography Nahtod compaction-chat (speaker-turns · the system-entry pins TOP
 *     but types LAST — Hans did not know about these makings until after the exchange).
 */

export interface ChatEntry {
    /** Speaker label (shown above the lines). Omit for the letter (monologue). */
    speaker?: string
    /** Visual role · drives the accent-rail colour for chat turns. */
    role?: 'system' | 'hm' | 'claude' | 'letter'
    /** One or more paragraphs of the entry. */
    lines: ReadonlyArray<string>
    /** Highlight the whole entry (e.g. the CCC/CCCS shortcode-pointer lines). */
    accent?: boolean
    /** Render at the TOP of the box, but type in LAST (the system-entry on /ethnography). */
    pinTop?: boolean
}
