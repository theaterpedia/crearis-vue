<template>
    <div
        class="shutter"
        :class="[
            `shutter--${transition}`,
            `shutter--${preset}`,
            { 'shutter--seam': seam, 'shutter--static': reducedMotion },
        ]"
        :style="shutterStyle"
    >
        <!-- the LINE (the neutral divider/axis · a vertical divider in `spearhead`, the timeline-axis
             in `timeline`) · sized by ONE formula off the shutter height · ::before = vertical (height-
             clamped), ::after = horizontal (width-based). -->
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
                ><ProseInline :text="p" /></p>
            </div>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Shutter — the seam-blade between scenes (the Dia-projector's shutter · the *black between* ·
 * "Blende" in the whitepaper-etymology). Container-width (covers BOTH lanes), assigned the HIGHEST
 * z by the stage for `shutter-lift`/`wipe`. hero-shaped: a flat colour OR a full-bleed image, with
 * **the line** — the neutral divider/axis (a divider in `spearhead`, the timeline-axis in `timeline`).
 *
 * §Außenkreis-r2 — ONE GEOMETRY FORMULA (HM 2026-06-14) owns height ↔ line:
 *  · `height` (the shutter's own height · the SAME family height-scale): `full` (= --dia-h · DEFAULT)
 *    · `prominent` · `medium` · `small` · `none` (auto · content-height) — computed off `--dia-h`,
 *    NO hardcoded vh.
 *  · the LINE rides the SAME ordinal scale (full=4 · prominent=3 · medium=2 · small=1 · none=0). The
 *    V-LINE is HEIGHT-CLAMPED — effective level = `min(vSize, height + 1)`; its length = `effective /
 *    (height+1)` of the shutter height (→ 100% "runs all through" at the cap). So a small-height
 *    shutter auto-corrects a `prominent` v-line down to `medium` (the cap). The H-LINE is WIDTH-based
 *    (its length is % of width · NOT height-clamped) — a small h-line on any height is allowed.
 *    `thick/thin/hairline` set the WEIGHT (full length); `none` = off. hSize defaults `none`.
 *  · content needs ≥ `medium` height for most presets (author's call · the formula keeps the line sane).
 *
 * CONTENT presets: `spearhead` (text centered on the line · DEFAULT) · `timeline` (heading-left/
 * prose-right · magnifica content-default · multi-row v-for = forward). `text` = md (`##`/`###`/`####`
 * → HeadingParser · prose → `<p><ProseInline>` · inline-md: bold + autolink · `inlineMd.ts`) + slot
 * hatch. The richer prose-parser landed (§timeline · `5b425a0`); the TIME-presets are still to come
 * (refs: Catalog.vue · useTemplateCode.ts · DateTime* · the in-day/multi-day schedule · §37.3/§38·4).
 *
 * MOTION — the family DEFAULTS to reduced-motion (`reducedMotion: true` · HP: the static reveal is the
 * best experience · §41·3 · Magnifica runs this default): the seam scrolls away + uncovers, NO
 * view()-lift. Set `reducedMotion: false` to opt INTO the scroll-driven lift (the OS
 * prefers-reduced-motion still forces static for accessibility regardless).
 *
 * §34.4 — the `transition` (from the stage) drives the seam-CSS: `shutter-lift` (default · overlap +
 * view()-lift · @supports-guarded + scroll-away fallback) · `rise-over` (passive) · `wipe` (②·later).
 *
 * ── SIGNED (load-bearing · §41·1 · HP-screentested roughly-green 2026-06-14) ──
 *   BLENDE · code — gate-checked: hold dead-still · seam-mask · ancestor-purity · standards-floor · gap-test 🌒
 *   SCHWELLE · epistemology — the gap held: Bild · the-hold · the Blende as the aperture (§38/§39)
 */
import { computed } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'
import ProseInline from './ProseInline.vue'

type LineSize =
    | 'full'
    | 'prominent'
    | 'medium'
    | 'small'
    | 'thickline'
    | 'thinline'
    | 'hairline'
    | 'none'
type HeightSize = 'full' | 'prominent' | 'medium' | 'small' | 'none'

const props = withDefaults(
    defineProps<{
        /** blade background · a colour-token (`bg`=page bg · default · `primary`/`card`/… → its -bg). */
        bg?: string
        /** optional full-bleed blade image (element-anchored · the hero-rented mechanics). */
        image?: string
        /** the shutter's OWN height · the family height-scale · `full` (= --dia-h · default). */
        height?: HeightSize
        /** the LINE · vertical size (height-clamped · `min(vSize, height+1)`). Default `medium`. */
        vSize?: LineSize
        /** the LINE · horizontal size (width-based · not clamped). Default `none`. */
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
        /** the family default · static reveal (no view()-lift · HP's best experience). false → opt into the lift. */
        reducedMotion?: boolean
    }>(),
    {
        height: 'full',
        vSize: 'medium',
        hSize: 'none',
        preset: 'spearhead',
        seam: false,
        transition: 'shutter-lift',
        reducedMotion: true,
    },
)

/* ── THE ONE GEOMETRY FORMULA (height ↔ line · §Außenkreis-r2) ───────────────────────────────── */
const HEIGHT_LEVEL: Record<HeightSize, number> = { full: 4, prominent: 3, medium: 2, small: 1, none: 0 }
// shutter height · computed off --dia-h (the family height) · NO hardcoded vh · 'none' = auto (content).
const HEIGHT_CSS: Record<HeightSize, string> = {
    full: 'var(--dia-h, 82vh)',
    prominent: 'calc(var(--dia-h, 82vh) * 0.72)',
    medium: 'calc(var(--dia-h, 82vh) * 0.5)',
    small: 'calc(var(--dia-h, 82vh) * 0.3)',
    none: 'auto',
}
// a line value's LENGTH-level (full/prominent/medium/small) + WEIGHT (thick/thin/hairline → full length).
const LINE_LEN_LEVEL: Record<LineSize, number> = {
    full: 4, prominent: 3, medium: 2, small: 1, thickline: 4, thinline: 4, hairline: 4, none: 0,
}
const LINE_WEIGHT: Record<LineSize, string> = {
    full: '2px', prominent: '2px', medium: '2px', small: '2px',
    thickline: '4px', thinline: '1px', hairline: '0.5px', none: '0',
}
// width-based length % (the h-line · unclamped) · index by level 0..4.
const LEN_PCT = ['0', '40%', '60%', '80%', '100%']

const geometry = computed(() => {
    const hLvl = HEIGHT_LEVEL[props.height]
    const cap = hLvl + 1 // the v-line can run one notch above the height → "all through" at the cap

    // V-LINE · HEIGHT-CLAMPED: effective level = min(requested, cap); length = effective/cap of height.
    const vLvl = LINE_LEN_LEVEL[props.vSize]
    let vLen = '0'
    let vWt = '0'
    if (vLvl > 0) {
        const eff = Math.min(vLvl, cap)
        vLen = `${Math.min(100, Math.round((eff / cap) * 100))}%`
        vWt = LINE_WEIGHT[props.vSize]
    }

    // H-LINE · WIDTH-based, NOT clamped.
    const hLineLvl = LINE_LEN_LEVEL[props.hSize]
    const hLen = hLineLvl > 0 ? LEN_PCT[Math.min(hLineLvl, 4)] : '0'
    const hWt = hLineLvl > 0 ? LINE_WEIGHT[props.hSize] : '0'

    return { shutterH: HEIGHT_CSS[props.height], vLen, vWt, hLen, hWt }
})

/** a colour-token → its CSS var (`bg` → --color-bg · else → --color-{token}-bg). */
function colorVar(token: string | undefined, fallback: string): string {
    if (!token) return fallback
    return token === 'bg' ? 'var(--color-bg)' : `var(--color-${token}-bg)`
}

const shutterStyle = computed<Record<string, string>>(() => {
    const g = geometry.value
    const s: Record<string, string> = {
        // backgroundColor (longhand · NOT the `background` shorthand, which would clobber backgroundImage)
        backgroundColor: colorVar(props.bg, 'var(--color-bg)'),
        '--line-color': colorVar(props.lineColor, 'var(--color-primary-bg)'),
        '--shutter-h': g.shutterH,
        '--line-v-len': g.vLen,
        '--line-v-wt': g.vWt,
        '--line-h-len': g.hLen,
        '--line-h-wt': g.hWt,
    }
    if (props.image) {
        s.backgroundImage = `url('${props.image}')`
        s.backgroundSize = 'cover'
        s.backgroundPosition = 'center'
    }
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
   var). Height = --shutter-h (the geometry formula · off --dia-h). Square — no border-radius (§34.7).
   z-index assigned by the stage inline (the transition-keyed z-strategy · §34.4). bg = page bg. */
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

/* the LINE · vertical (::before · height %, height-clamped) + horizontal (::after · width %) ·
   sized by the geometry vars, centered, coloured. 0-size (none / clamped-off) → invisible. */
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

/* spearhead · centered column (heading + prose stacked) · reads centred on the line (the bridge it
   sits on). [dial · HP: the exact text-top↔line-top alignment.] */
.shutter--spearhead .shutter-content {
    max-width: 42rem;
    margin-inline: auto;
    text-align: center;
}

/* timeline · heading LEFT of the line, prose RIGHT (the 2-Gasse split at centre). Multi-row (3–4
   rows in one shutter via v-for) is the FORWARD step (the parser note · the time-presets). */
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

/* family default · the STATIC reveal (HP: the best experience · §41·3 · the family defaults to
   reduced-motion · Magnifica runs this · `reducedMotion: true`): kill the lift + neutralise the
   overlap so the seam scrolls away + uncovers. Opt into the lift with `reducedMotion: false`. */
.shutter--static.shutter--seam.shutter--shutter-lift {
    animation: none !important;
    position: relative;
    top: auto;
    margin-bottom: 0;
}

/* reduced-motion · the OS user-setting · forces the static reveal regardless of `reducedMotion`
   (accessibility · §41·3 · NOT `animation:none` alone, which would strand the next plate). */
@media (prefers-reduced-motion: reduce) {
    .shutter--seam.shutter--shutter-lift {
        animation: none !important;
        position: relative;
        top: auto;
        margin-bottom: 0;
    }
}
</style>
