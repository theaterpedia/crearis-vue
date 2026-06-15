/**
 * DAS Ei timeline · 5 content-shutters (the `timeline` preset · §45). HM-authored 2026-06-14.
 *
 * Each entry → a `<Shutter timeline :text>`: the `## overline **headline**` line → HeadingParser
 * (overline + headline · left of the line); the description lines → prose (right · rendered with
 * ProseInline · bold + autolink · `inlineMd.ts`). The `**bold**` (Zentrum Nürnberg · Institut Bayern)
 * + the `https://dasei.eu` autolink now read correctly through the parser.
 *
 * PLACEMENT (HP 2026-06-14): these feed the **/context seams** (the chronology-at-the-seam · §40·2/
 * §45) — the 5 entries map to /context's 5 seams (Bild0→1 … Bild4→5). That needs the technician's
 * DiaStage per-seam content (`#seam-N` slot / a seam field · §45 · the technician's lane · coordinated
 * in the thread). Until that lands, the content is ready here; ContextPage authors it then.
 */

export interface TimelineShutter {
    /** md fragment for `<Shutter timeline :text>` · `## overline **headline**` + description lines. */
    text: string
}

export const daseiTimeline: ReadonlyArray<TimelineShutter> = [
    {
        text: `## 1997-2010 **the raise of Europe**
DAS Ei – Theaterpädagogisches **Zentrum Nürnberg** e.V.
Fürther Str. 174
90429 Nürnberg`,
    },
    {
        text: `## 2008 **we start the institute**
DAS Ei – Theaterpädagogisches **Institut Bayern** e.V.
https://dasei.eu`,
    },
    {
        text: `## 2014 **Elementare Animation**
the 'didactics of the unspoken' turn from personal skill into tradition`,
    },
    {
        text: `## 2018 **modern websites**
enter open source and open knowledge`,
    },
    {
        text: `## 2022 **theaterpedia**
face digital transformation of Theaterpädagogik`,
    },
]
