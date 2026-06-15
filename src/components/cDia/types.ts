/**
 * cDia — the shadow-theater scroll-stage family (core · Theaterpedia-core · §41·1). The held Dia
 * (the *Grund* · ein *Bild*) · the rising Figure (the *Figur*) · the Shutter (the seam-blade ·
 * *Blende* in the whitepaper-etymology). ONE DiaStage with a `transition` prop — three views of one
 * data (§37). NOT magnifica-local: hero.vue-powerlevel, view-agnostic; magnifica consumes it.
 *
 * ── SIGNED (load-bearing · §41·1 · HP-screentested roughly-green 2026-06-14) ──
 *   BLENDE · code — the editor's contract: the flat Bild-list, additively-groupable (Scene/Chapter deferred) 🌒
 *   SCHWELLE · epistemology — Bild (Dia+Figure · §38·1) · the 2.5-level (§39) · timeline-Bild = AgendaLine (§38·4)
 */

/** focal · Hero aspect-engine vocab → background-position (never :deep · gotcha #1). */
export type DiaAlignX = 'left' | 'center' | 'right'
export type DiaAlignY = 'top' | 'center' | 'bottom'

/**
 * One **Bild** — the beat (a Dia + its Figure). §38·1: *Bild* is the truer *Composita* — the
 * projected plate, the *Standbild* (the held tableau · the-hold), and the Figur-Grund gestalt, in
 * one word. The "Scene" is the 3–5-Bild chain ABOVE it (the 2.5-level · §39: Scene > Bild, with
 * `chapterStart` a flag on a Scene — NOT built here · the flat list stays additively-groupable).
 *
 * The editor's `v-for` target. Editorial fields + OPTIONAL timeline fields (the dashboard / agenda
 * use · §38·4 · omitted for editorial /context). `status` maps the SYSREG — no invented enum
 * (Foundation · deferred · the agenda's AgendaLineStatus is the working shape · §38·4).
 */
export interface DiaBildSpec {
    /** the held plate · omit `image` → a text-Dia (content via the `#dia-N` slot). */
    dia: {
        image?: string
        imageAlt?: string
        imgTmpAlignX?: DiaAlignX
        imgTmpAlignY?: DiaAlignY
    }
    /** crearis-md "overline **HEADLINE** subline" → HeadingParser (the gap · the quick path). For
     *  rich Figures (CalloutPhrase/strong/em · /context) use the `#figure-N` slot instead. */
    figure?: string
    /** the Gasse (the stage-wings corridor · §36-amend) the held Dia pins into; the Figure rises
     *  in the opposite Gasse. */
    lane?: 'left' | 'right' | 'full'
    theme?: 'yellow' | 'green' | 'pink' | 'dim'
    // ── timeline-use (OPTIONAL · §30 dashboard stakes · omitted for editorial /context) ──
    /** anchor target + timeline-marker. */
    id?: string
    /** the timeline spine. */
    date?: string
    /** link to the project / course / workshop (external/published timeline · §38·4). */
    href?: string
    /** 🚩 reads/maps the SYSREG — no invented enum (Foundation · deferred to the sysreg-owner). */
    status?: string
    // chapterStart?: { label } — the 0.5 level (a flag, not a container · §39·1) — DEFERRED (don't
    // build the Scene/Chapter grouping yet · §37.2/§39·5; the flat list must not preclude it).
}
