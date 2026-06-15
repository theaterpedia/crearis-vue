<template>
    <div
        class="shutter"
        :class="[`shutter--${transition}`, `shutter--${preset}`, { 'shutter--seam': seam }]"
        :style="shutterStyle"
    >
        <!-- the LINE (the neutral divider/axis · a vertical divider in `spearhead`, the timeline-axis
             in `timeline`) · sized length×weight by vSize/hSize · ::before = vertical, ::after = horizontal -->
        <!-- content · the md `text` minimally parsed (## → HeadingParser · prose → <p>) + the slot
             escape-hatch · distributed by the `preset`. -->
        <div
            v-if="hasContent"
            class="shutter-content"
        >
            <div
                v-if="parsed.headings.length"
                class="shutter-col shutter-col--head"
            >
                <HeadingParser
                    v-for="(h, i) in parsed.headings"
                    :key="`h${i}`"
                    :content="h.text"
                    :as="h.as"
                    class="shutter-heading"
                />
            </div>
            <div
                v-if="parsed.prose.length"
                class="shutter-col shutter-col--prose"
            >
                <p
                    v-for="(p, i) in parsed.prose"
                    :key="`p${i}`"
                    class="shutter-prose"
                >{{ p }}</p>
            </div>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Shutter — the seam-blade between scenes (the Dia-projector's shutter · the *black between* ·
 * "Blende" in the whitepaper-etymology). Container-width (covers BOTH lanes), assigned the HIGHEST
 * z by the stage for `shutter-lift`/`wipe` (it passes OVER the held Dias + Figures). hero-shaped:
 * a flat colour OR a full-bleed image, with **the line** — the neutral divider/axis that plays the
 * gap (the dasei yellow line · UI_dasei_eu_slideOver_Hero). Named `line` (not "splitter"): it is a
 * divider in `spearhead` and the timeline-axis in `timeline` — one neutral word for both (HM).
 *
 * §34.4 — the `transition` (passed from the stage) drives this blade's seam-CSS:
 *  · `shutter-lift` (DEFAULT) — a `seam` shutter OVERLAPS the next plate (`margin-bottom:-1·--dia-h`
 *    · so the next Dia pins BEHIND it · no early peek) then `animation-timeline: view()` LIFTS it off
 *    the top to uncover the held next plate. Zero-JS-in-loop · `@supports`-guarded + a scroll-away
 *    fallback (Firefox-stable · degraded, never broken). The proven /proto mechanism, folded in.
 *  · `rise-over` — the blade is PASSIVE (a sticky plate the next Dia rises over · ascending-z · §27).
 *  · `wipe` — (②·CandB) the scroll-driven reversible blade (added later).
 *
 * CONTENT presets (§Außenkreis-r1 · HM):
 *  · `spearhead` (DEFAULT · cand-B's bridge) — text centered, sitting above + on the line (the
 *    text-container top ≈ the line top, so varying content all reads centred to the shutter).
 *  · `timeline` (magnifica default for content-shutters) — heading LEFT of the line, prose RIGHT.
 *    Repeatable (3–4 timeline-rows in one shutter) is the FORWARD step — see the parser note below.
 *
 * `text` = an md fragment (H2/H3/H4 + a paragraph): `##`/`###`/`####` → HeadingParser (the level sets
 * the size), the rest → prose. This is the MINIMAL parse (HM-chosen · slots-now); the RICHER parser
 * (shortcodes · structured distribution · the in-day / multi-day time-presets · one shutter = one
 * time-slot) is a DEDICATED component to come — pattern refs: `src/components/Catalog.vue` +
 * `src/composables/useTemplateCode.ts` (parsing) · `DateTimeEdit.vue` / `DateRangeEdit.vue` /
 * `DateTimeExamples.vue` (time formatting). First ideas → the thread; don't build them here yet.
 *
 * The STAGE assigns the z-index inline (the z-strategy is `transition`-keyed · §34.4).
 *
 * ── NOW-RUNNING ──  sticky cover + the `view()` lift (Chromium + Safari 26 · pure-CSS).
 * ── FUTURE-SPEC ──  the `wipe` value adds a reversible scroll-linked blade (flackr/scroll-timeline
 *    polyfill for Firefox-stable · `import 'scroll-timeline-polyfill'` or the canonical dist · the
 *    polyfill parses this CSS, so authoring stays declarative · same-origin stylesheet required).
 *
 * ── SIGNED (load-bearing · §41·1 · HP-screentested roughly-green 2026-06-14) ──
 *   BLENDE · code — gate-checked: hold dead-still · seam-mask · ancestor-purity · standards-floor · gap-test 🌒
 *   SCHWELLE · epistemology — the gap held: Bild · the-hold · the Blende as the aperture (§38/§39)
 */
import { computed } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'

type LineSize =
    | 'full'
    | 'prominent'
    | 'medium'
    | 'small'
    | 'thickline'
    | 'thinline'
    | 'hairline'
    | 'none'

const props = withDefaults(
    defineProps<{
        /** blade background · a colour-token (`bg`=page bg · default · `primary`/`card`/… → its -bg). */
        bg?: string
        /** optional full-bleed blade image (element-anchored · the hero-rented mechanics). */
        image?: string
        /** the LINE · vertical size (length×weight · `full|prominent|medium|small`=length ·
         *  `thickline|thinline|hairline`=weight · `none`=off). Default `medium`. */
        vSize?: LineSize
        /** the LINE · horizontal size (same scale). Default `thinline`. */
        hSize?: LineSize
        /** the line colour-token (default `primary`). */
        lineColor?: string
        /** content distribution · `spearhead` (centered · default) or `timeline` (heading-left/prose-right). */
        preset?: 'spearhead' | 'timeline'
        /** md fragment (`##`/`###`/`####` → HeadingParser · paragraphs → prose) · the minimal parse. */
        text?: string
        /** a between-scenes seam (gets the overlap + lift for `shutter-lift`). vs a plain cover. */
        seam?: boolean
        /** the stage transition · drives the seam-CSS (§34.4). */
        transition?: 'shutter-lift' | 'rise-over' | 'wipe'
        /** blade height in vh · a BRIEF seam-blade vs the full plate. Omit → the stage's --dia-h. */
        heightVh?: number
    }>(),
    { vSize: 'medium', hSize: 'thinline', preset: 'spearhead', seam: false, transition: 'shutter-lift' },
)

/* the line scale · [length, weight] · length-prominence (full→small · default 2px weight) OR a
   weight (thick/thin/hairline · full length) · none → 0 (invisible). HM-confirmed length×weight. */
const LINE: Record<LineSize, [string, string]> = {
    full: ['100%', '2px'],
    prominent: ['76%', '2px'],
    medium: ['60%', '2px'],
    small: ['40%', '2px'],
    thickline: ['100%', '4px'],
    thinline: ['100%', '1px'],
    hairline: ['100%', '0.5px'],
    none: ['0', '0'],
}

/** a colour-token → its CSS var (`bg` → --color-bg · else → --color-{token}-bg). */
function colorVar(token: string | undefined, fallback: string): string {
    if (!token) return fallback
    return token === 'bg' ? 'var(--color-bg)' : `var(--color-${token}-bg)`
}

const shutterStyle = computed<Record<string, string>>(() => {
    const [vLen, vWt] = LINE[props.vSize]
    const [hLen, hWt] = LINE[props.hSize]
    const s: Record<string, string> = {
        // backgroundColor (longhand · NOT the `background` shorthand, which would clobber the
        // backgroundImage set below for an image-blade)
        backgroundColor: colorVar(props.bg, 'var(--color-bg)'),
        '--line-color': colorVar(props.lineColor, 'var(--color-primary-bg)'),
        '--line-v-len': vLen,
        '--line-v-wt': vWt,
        '--line-h-len': hLen,
        '--line-h-wt': hWt,
    }
    if (props.image) {
        s.backgroundImage = `url('${props.image}')`
        s.backgroundSize = 'cover'
        s.backgroundPosition = 'center'
    }
    if (props.heightVh) s['--shutter-h'] = `${props.heightVh}vh`
    return s
})

/** Minimal md-fragment parse: `##`/`###`/`####` lines → HeadingParser (level→size) · the rest → prose. */
const parsed = computed(() => {
    const headings: { as: 'h2' | 'h3' | 'h4'; text: string }[] = []
    const prose: string[] = []
    if (props.text) {
        for (const raw of props.text.split('\n')) {
            const line = raw.trim()
            if (!line) continue
            const m = /^(#{2,4})\s+(.*)$/.exec(line)
            if (m) headings.push({ as: `h${m[1].length}` as 'h2' | 'h3' | 'h4', text: m[2].trim() })
            else prose.push(line)
        }
    }
    return { headings, prose }
})

const hasContent = computed(() => parsed.value.headings.length > 0 || parsed.value.prose.length > 0)
</script>

<style scoped>
/* the blade · full experience-width (breaks out of the lane via the stage's negative-margin gutter
   var), sized by the stage CSS vars. Square — theme-7 register, no border-radius (§34.7). z-index
   is assigned by the stage inline (the transition-keyed z-strategy · §34.4). bg default = page bg. */
.shutter {
    position: sticky;
    top: var(--dia-top, var(--bb-navbar-offset, 6rem));
    height: var(--shutter-h, var(--dia-h, 82vh));
    min-height: var(--shutter-h, var(--dia-h, 82vh));
    /* break out of the lane to cover both (the stage sets --stage-gutter to the lane offset) */
    margin-inline: calc(-1 * var(--stage-gutter, 0px));
    background: var(--color-bg, #1d1b1a);
    color: var(--color-contrast, #f4f4f4);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1.5rem clamp(1.25rem, 4vw, 3rem);
}

/* the LINE · vertical (::before) + horizontal (::after) · sized length×weight, centered, coloured.
   0-size (vSize/hSize = 'none') → invisible. The neutral divider/axis. */
.shutter::before,
.shutter::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: var(--line-color, var(--color-primary-bg));
}
.shutter::before {
    width: var(--line-v-wt, 0);
    height: var(--line-v-len, 0);
}
.shutter::after {
    width: var(--line-h-len, 0);
    height: var(--line-h-wt, 0);
}

/* content · above the line. Preset distributes it (§Außenkreis-r1). */
.shutter-content {
    position: relative;
    z-index: 1;
    width: 100%;
}
.shutter-heading {
    margin: 0 0 0.5rem;
}
.shutter-prose {
    margin: 0 0 0.75rem;
    line-height: 1.7;
}
.shutter-prose:last-child {
    margin-bottom: 0;
}

/* spearhead · centered column (heading + prose stacked) · reads centred to the shutter (the line is
   the bridge it sits on). [dial · HP: the exact text-top↔line-top alignment.] */
.shutter--spearhead .shutter-content {
    max-width: 42rem;
    margin-inline: auto;
    text-align: center;
}

/* timeline · heading LEFT of the line, prose RIGHT (the 2-Gasse split at centre). Multi-row (3–4
   rows in one shutter via v-for) is the FORWARD step (see the parser note · the time-presets). */
@media (min-width: 768px) {
    .shutter--timeline .shutter-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 clamp(1rem, 3vw, 2.5rem);
        align-items: start;
    }
    .shutter--timeline .shutter-col--head {
        text-align: right;
    }
    .shutter--timeline .shutter-col--prose {
        text-align: left;
    }
}

@media (min-width: 768px) {
    /* shutter-lift (default) · a seam OVERLAPS the next plate so it pins behind (no early peek),
       then the view()-driven lift uncovers the held next plate (the proven /proto mechanism). */
    .shutter--seam.shutter--shutter-lift {
        width: 100%;
        margin-bottom: calc(-1 * var(--dia-h, 82vh));
    }
    @supports (animation-timeline: view()) {
        .shutter--seam.shutter--shutter-lift {
            animation: shutter-lift linear both;
            animation-timeline: view(block);
            /* lift completes by the time the next plate pins · keyed to the blade's OWN view-pass +
               the uniform --dia-h → drift-free across scroll-speed + Figure-length (the §24-B trap
               avoided by keying to layout, not a guessed scroll-%). */
            animation-range: cover 0% cover 50%;
        }
        @keyframes shutter-lift {
            from { transform: translateY(0); }
            to { transform: translateY(-110%); }
        }
    }
    /* fallback (no scroll-driven · Firefox-stable) · the seam scrolls away in flow, still revealing
       the held plate — degraded (no double-speed lift), never broken. */
    @supports not (animation-timeline: view()) {
        .shutter--seam.shutter--shutter-lift {
            position: relative;
            top: auto;
        }
    }

    /* rise-over · the blade is a passive full-width sticky plate the next Dia rises over (no overlap,
       no lift · the ascending-z positional path · §27 · the rise-over instance ③ refines it). */
    .shutter--seam.shutter--rise-over {
        width: 100%;
    }
}

@media (max-width: 767px) {
    .shutter {
        position: relative;
        top: 0;
        height: auto;
        min-height: 12rem;
        margin-inline: 0;
        margin-bottom: 0 !important;
    }
    /* timeline collapses to a single stacked column on narrow (heading then prose) */
    .shutter--timeline .shutter-content {
        display: block;
    }
}

/* reduced-motion (§41·3) · a user-setting, not a device. The lift drops to a STATIC reveal: kill
   the animation AND neutralise the overlap (position:relative · margin-bottom:0) so the seam scrolls
   away in flow and the held plate is revealed — NOT `animation:none` alone, which would strand the
   next plate behind the still-overlapping seam (no lift to uncover it). Same shape as the no-view()
   fallback above.
   ★ HP-screentest 2026-06-14: this static-reveal reads as the BEST experience so far (near
   magnifica-production). Keep it strong — it is the floor AND a first-class reading, not merely a
   fallback. (The Außenkreis/tweaking phase may consider making it the default feel.) */
@media (prefers-reduced-motion: reduce) {
    .shutter--seam.shutter--shutter-lift {
        animation: none !important;
        position: relative;
        top: auto;
        margin-bottom: 0;
    }
}
</style>
