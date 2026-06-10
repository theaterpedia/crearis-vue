<template>
    <section
        :class="slideClasses"
        :style="slideStyle"
    >
        <!-- Image-window · renders the parallax-anchored background · focal via aspect-engine -->
        <div
            class="panel-image"
            role="img"
            :aria-label="imageAlt ?? ''"
            :style="imageStyle"
        />

        <!-- Colored panel side · panelMode shapes (panel · lane · handle); `none` omits it.
             Text path = HeadingParser→Heading from the md `panel` prop (no paragraph slot ·
             the structural cure for over-texting); raw <slot/> kept as the escape-hatch. -->
        <div
            v-if="panelMode !== 'none'"
            :class="panelClasses"
        >
            <div
                v-if="showPanelText"
                class="panel-text"
            >
                <HeadingParser
                    v-if="panel"
                    :content="panel"
                    as="h2"
                />
                <slot v-else />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
/**
 * BackSlide — image-and-panel slide with cover/uncover scroll · canonical
 * CSS per `crearis:projects/magnifica/docs/howto-panels.md`.
 *
 * Two stacking primitives:
 *   - `background-attachment: fixed` (desktop) · image parallax-anchored to
 *     viewport while the panel scrolls past
 *   - `position: sticky; bottom: 0` · panel-text pinned to viewport-bottom
 *     for the duration of the section
 *
 * Mobile fallback (per howto §6): `background-attachment: scroll` instead
 * of `fixed` (iOS Safari + Android browsers render fixed unreliably).
 * Sticky-bottom text still works.
 *
 * Per CV@wsl dispatch #4 (TO (website) 2026-06-02 DI · meta-feed).
 */
import { computed } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'
import { normalizeTheme, type PostItThemeColor } from './types'

interface Props {
    /** Image URL (rendered as `background-image` on the image-window). */
    image: string
    /** Image alt-text · accessibility (ARIA-label on the image-window div). */
    imageAlt?: string
    /** Horizontal focal of the image-window · Hero's aspect-engine vocab verbatim
     *  (`cover`=center · `stretch`=fill-width · `left`/`center`/`right`). Default 'cover'.
     *  Declare the focal so the crop never cuts the claim (backslide-thread §6 · argument-region). */
    imgTmpAlignX?: 'left' | 'right' | 'center' | 'stretch' | 'cover'
    /** Vertical focal of the image-window · Hero's aspect-engine vocab verbatim
     *  (`cover`=center · `stretch`=fill-height · `top`/`center`/`bottom`). Default 'bottom'. */
    imgTmpAlignY?: 'top' | 'bottom' | 'center' | 'stretch' | 'cover'
    /** Panel content as crearis-md ("overline **headline** subline") → HeadingParser→Heading.
     *  Overline-headline only — no paragraph slot (the structural cure for over-texting ·
     *  backslide-thread §6). Omit for panelMode none/handle, or to use the raw <slot/> hatch. */
    panel?: string
    /** Panel shape (backslide-thread §3). `panel`=colored ~40% panel with heading (default) ·
     *  `none`=image only, no panel · `handle`=thin color strip, no text · `lane`=narrow color
     *  panel (typically no text). */
    panelMode?: 'panel' | 'none' | 'handle' | 'lane'
    /** Theme color (new naming OR 2022 alias). Default 'yellow'. */
    themeColor?: PostItThemeColor
    /** Image on the right instead of the left (per howto §5.1). Default false (image-left). */
    imageRight?: boolean
    /** Opt-in: bound the full-bleed slide to the 90rem content-column on wide viewports
     *  (≥96rem · canon 'wide' 1536px), aligning it with the magnifica page-shell + Hero.
     *  Default false → full-bleed (unchanged for the Demo / any non-magnifica use). */
    bounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    imgTmpAlignX: 'cover',
    imgTmpAlignY: 'bottom',
    panelMode: 'panel',
    themeColor: 'yellow',
    imageRight: false,
    bounded: false,
})

const slideClasses = computed(() => {
    const classes = ['panel-slide', `panel-slide--mode-${props.panelMode}`]
    if (props.imageRight) classes.push('panel-slide--image-right')
    if (props.bounded) classes.push('panel-slide--bounded')
    return classes
})

/** Text renders only in the text-bearing modes (`panel`, `lane`); `handle` is a bare strip. */
const showPanelText = computed(() => props.panelMode === 'panel' || props.panelMode === 'lane')

const slideStyle = computed<Record<string, string>>(() => ({
    '--panel-image': `url('${props.image}')`,
}))

/**
 * Focal of the image-window · Hero's aspect-engine mapping, verbatim (one vocabulary
 * across the family · backslide-thread Q2/§12). `cover`→center · `stretch`→edge+100%;
 * any literal (`left`/`bottom`/…) passes through as the background-position. The window
 * fills via `cover` unless an axis is `stretch`. Replaces the old hardcoded `left bottom`.
 */
const imageStyle = computed<Record<string, string>>(() => {
    const ax = props.imgTmpAlignX
    const ay = props.imgTmpAlignY
    const usesCover = ax !== 'stretch' && ay !== 'stretch'
    return {
        backgroundPositionX: ax === 'stretch' ? 'left' : ax === 'cover' ? 'center' : ax,
        backgroundPositionY: ay === 'stretch' ? 'top' : ay === 'cover' ? 'center' : ay,
        backgroundSize: usesCover
            ? 'cover'
            : `${ax === 'stretch' ? '100%' : 'auto'} ${ay === 'stretch' ? '100%' : 'auto'}`,
    }
})

const panelClasses = computed(() => {
    const theme = normalizeTheme(props.themeColor)
    return ['panel-side', `panel-side--${theme}`]
})
</script>

<style scoped>
.panel-slide {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 600px;
    background: var(--panel-page-bg, #1d1b1a);
}

@media (min-width: 768px) {
    .panel-slide {
        flex-direction: row;
        min-height: 600px;
    }
    .panel-slide--image-right {
        flex-direction: row-reverse;
    }
}

.panel-image {
    width: 100%;
    min-height: 600px;
    background-image: var(--panel-image);
    /* background-size + background-position are inline (computed) · the aspect-engine focal */
    background-repeat: no-repeat;
    background-attachment: scroll;
}

@media (min-width: 768px) {
    .panel-image {
        min-height: auto;
        background-attachment: fixed;
    }

    /* panelMode shapes · row layout · image/panel split (backslide-thread §3).
       Defaults: panel 60/40 (current) · lane 78/22 (narrow panel) · handle thin color
       strip · none = image-only. */
    .panel-slide--mode-panel .panel-image {
        width: 60%;
    }
    .panel-slide--mode-lane .panel-image {
        width: 78%;
    }
    .panel-slide--mode-handle .panel-image {
        width: calc(100% - 2.5rem);
    }
    .panel-slide--mode-none .panel-image {
        width: 100%;
    }
}

.panel-side {
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 2rem 1.5rem;
}

@media (min-width: 768px) {
    .panel-slide--mode-panel .panel-side {
        width: 40%;
    }
    .panel-slide--mode-lane .panel-side {
        width: 22%;
    }
    .panel-slide--mode-handle .panel-side {
        width: 2.5rem;
        padding: 0;
    }
}

.panel-side--yellow {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast, #1d1b1a);
}
.panel-side--green {
    background: var(--color-positive-bg, #84cc16);
    color: var(--color-positive-contrast, #1d1b1a);
}
.panel-side--pink {
    background: var(--color-negative-bg, #ff7598);
    color: var(--color-negative-contrast, #1d1b1a);
}
.panel-side--dim {
    background: var(--color-card-bg, #2a2a2a);
    color: var(--color-card-contrast, #f4f4f4);
}

.panel-text {
    position: sticky;
    bottom: 0;
    padding-bottom: 3rem;
    font-family: var(--panel-mono, var(--font, ui-monospace));
}

.panel-text :deep(h2) {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 1rem;
    line-height: 1.25;
}

.panel-text :deep(p) {
    font-size: 1rem;
    line-height: 1.55;
    margin: 0 0 0.75rem;
    max-width: 24rem;
}

@media (min-width: 768px) {
    .panel-text {
        margin-top: 18rem;
    }
}

/* opt-in (`bounded`) · align the full-bleed slide with the 90rem content-column on wide
   viewports, sharing the one gate with Hero `magnifica` + CardsCanvas `bounded`.
   §9.4/§13 (HP-blessed · backslide-thread): keep `background-attachment: fixed` when
   bounded — the focal-control (imgTmpAlignX/Y) frames the viewport-fixed image inside the
   90rem window. The earlier `→ scroll` fallback killed the wide-screen uncover
   (crearis-vue@5642740) and is removed; only mobile (<768px · the rule above) + reduced-
   motion still fall back to scroll.
   Gate = 96rem (90rem content + 2×3rem gutters · canon 'wide' 1536px) — the bound as its
   geometry, not a magic literal (LAYOUT-STANDARDS §6 · the 1456-drift cure). CSS @media
   can't read var(), so the token lives as this rem-geometry, not a custom-prop. */
@media (min-width: 96rem) {
    .panel-slide--bounded {
        max-width: 90rem;
        margin-inline: auto;
    }
}

/* Accessibility · respect reduced-motion · drop parallax */
@media (prefers-reduced-motion: reduce) {
    .panel-image {
        background-attachment: scroll;
    }
}
</style>
