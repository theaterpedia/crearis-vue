<template>
    <section
        :class="slideClasses"
        :style="slideStyle"
    >
        <!-- Image-window · renders the parallax-anchored background -->
        <div
            class="panel-image"
            role="img"
            :aria-label="imageAlt ?? ''"
        />

        <!-- Colored panel side with sticky-bottom text -->
        <div :class="panelClasses">
            <div class="panel-text">
                <slot />
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
import { normalizeTheme, type PostItThemeColor } from './types'

interface Props {
    /** Image URL (rendered as `background-image` on the image-window). */
    image: string
    /** Image alt-text · accessibility (ARIA-label on the image-window div). */
    imageAlt?: string
    /** Theme color (new naming OR 2022 alias). Default 'yellow'. */
    themeColor?: PostItThemeColor
    /** Image on the right instead of the left (per howto §5.1). Default false (image-left). */
    imageRight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    themeColor: 'yellow',
    imageRight: false,
})

const slideClasses = computed(() => {
    const classes = ['panel-slide']
    if (props.imageRight) classes.push('panel-slide--image-right')
    return classes
})

const slideStyle = computed<Record<string, string>>(() => ({
    '--panel-image': `url('${props.image}')`,
}))

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
    background-size: cover;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-attachment: scroll;
}

@media (min-width: 768px) {
    .panel-image {
        width: 60%;
        min-height: auto;
        background-attachment: fixed;
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
    .panel-side {
        width: 40%;
    }
}

.panel-side--yellow {
    background: #ffee00;
    color: #1d1b1a;
}
.panel-side--green {
    background: #84cc16;
    color: #1d1b1a;
}
.panel-side--pink {
    background: #ff7598;
    color: #1d1b1a;
}
.panel-side--dim {
    background: #2a2a2a;
    color: #f4f4f4;
}

.panel-text {
    position: sticky;
    bottom: 0;
    padding-bottom: 3rem;
    font-family: var(
        --panel-mono,
        ui-monospace,
        'JetBrains Mono',
        Menlo,
        Consolas,
        monospace
    );
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

/* Accessibility · respect reduced-motion · drop parallax */
@media (prefers-reduced-motion: reduce) {
    .panel-image {
        background-attachment: scroll;
    }
}
</style>
