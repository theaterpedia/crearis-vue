/**
 * inlineMd — the cDia richer-prose parser (the §43/§44 "richer parser" the Shutter doc-comment
 * pins · refs: Catalog.vue · useTemplateCode.ts). Begins with the two inline marks the timeline
 * descriptions need (Zentrum Nürnberg · Institut Bayern · dasei.eu · §45):
 *   · `**bold**`        → a <strong> segment
 *   · `https://…`       → an autolinked <a> (scheme stripped for display · lean · no punctuation
 *                         trimming until real content needs it · HP-steer 2026-06-14)
 * Everything else is plain text. Safe-by-construction (segments → vnodes · no v-html). Extensible
 * to shortcodes (the fuller useTemplateCode pattern) when that round opens — keep this the floor.
 */

export interface InlineSegment {
    type: 'text' | 'bold' | 'link'
    value: string
    /** present for `link` segments · the full href (scheme included). */
    href?: string
}

/** `**bold**`  OR  a bare `http(s)://…` URL. */
const TOKEN = /\*\*([^*]+)\*\*|(https?:\/\/[^\s<>]+)/g

/** Parse one prose line into inline segments (bold · autolink · text). */
export function parseInline(text: string): InlineSegment[] {
    const segments: InlineSegment[] = []
    let last = 0
    let m: RegExpExecArray | null
    TOKEN.lastIndex = 0
    while ((m = TOKEN.exec(text)) !== null) {
        if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) })
        if (m[1] !== undefined) {
            segments.push({ type: 'bold', value: m[1] })
        } else if (m[2] !== undefined) {
            const href = m[2]
            segments.push({ type: 'link', value: href.replace(/^https?:\/\//, ''), href })
        }
        last = TOKEN.lastIndex
    }
    if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
    return segments
}
