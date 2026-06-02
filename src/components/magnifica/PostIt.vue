<template>
    <article
        :class="postitClasses"
        :style="postitStyle"
    >
        <img
            v-if="image"
            :src="image"
            :alt="imageAlt ?? ''"
            class="bb-postit-image"
        />
        <p v-if="overline" class="bb-postit-overline">
            <slot name="overline">{{ overline }}</slot>
        </p>
        <h3 v-if="headline" class="bb-postit-headline">
            <slot name="headline">{{ headline }}</slot>
        </h3>
        <p v-if="bodyText" class="bb-postit-body">{{ bodyText }}</p>
        <div v-if="$slots.default" class="bb-postit-body bb-postit-slot">
            <slot />
        </div>
    </article>
</template>

<script setup lang="ts">
/**
 * PostIt — single sticky post-it card · canonical CSS per
 * `crearis:projects/magnifica/docs/howto-blackboard.md`.
 *
 * Sticky-positioned inside a `CardsCanvas` wrapper. Per-instance position
 * + rotation come in via CSS custom-properties (`--bb-top`, `--bb-left`,
 * `--bb-rotate`). Tailwind/DaisyUI dropped; plain CSS only.
 *
 * Authoring shape (mirrors the 2022 source consumer-contract at
 * `theaterpedia2022/components/content/PostIt.vue` but maps Tailwind class
 * idioms to CSS-custom-property + modifier-class idioms per howto §7):
 *   - `themeColor` accepts the new names `yellow/green/pink/dim` OR
 *     the 2022 aliases `primary/secondary/accent/warn` (back-compat).
 *   - `top`/`left`/`rotate` accept the same string-format as 2022
 *     (`'8%'`, `'62%'`, `'+3'`, `'-2'`). Sign-prefix stripped from rotate
 *     before degree-suffix appended.
 *   - `classes` accepts a 2022 Tailwind `mt-X` token (e.g. `'mt-32'`)
 *     which is converted to `margin-top: <X*0.25>rem`.
 *
 * Per CV@wsl dispatch #4 (TO (website) 2026-06-02 DI · meta-feed).
 */
import { computed } from 'vue'
import {
    normalizeTheme,
    parseClassesMarginTop,
    parseRotateDeg,
    type PostItThemeColor,
} from './types'

interface Props {
    /** Display heading (h3 inside the card). Plain string or use the `headline` slot. */
    headline?: string
    /** Display overline (small kicker above the heading). Plain string or use the `overline` slot. */
    overline?: string
    /** Pre-line body paragraph (preserves blank lines per howto §4 typography). */
    bodyText?: string
    /** Optional image URL rendered at the top of the post-it. */
    image?: string
    /** Image alt-text · accessibility. */
    imageAlt?: string
    /** Theme color (new naming OR 2022 alias). Default 'yellow' (= 'primary' in 2022). */
    themeColor?: PostItThemeColor
    /** Per-instance sticky `top` (CSS custom-property `--bb-top`). Format: '8%' / '32%'. Default '20%'. */
    top?: string
    /** Per-instance sticky `left` (CSS custom-property `--bb-left`). Format: '5%' / '62%'. Default '50%'. */
    left?: string
    /**
     * Rotation in degrees. Accepts numbers (`2`, `-3`) OR 2022-style string-with-sign (`'+2'`, `'-3'`)
     * OR plain numeric string (`'2'`).
     */
    rotate?: number | string
    /** 2022 Tailwind class-token forwarded through the port-map (`'mt-32'` → `margin-top: 8rem`). */
    classes?: string
}

const props = withDefaults(defineProps<Props>(), {
    themeColor: 'yellow',
    top: '20%',
    left: '50%',
    rotate: 0,
})

const postitClasses = computed(() => {
    const theme = normalizeTheme(props.themeColor)
    return ['bb-postit', `bb-postit--${theme}`]
})

const postitStyle = computed<Record<string, string>>(() => {
    const style: Record<string, string> = {
        '--bb-top': props.top,
        '--bb-left': props.left,
        '--bb-rotate': `${parseRotateDeg(props.rotate)}deg`,
    }
    const marginTop = parseClassesMarginTop(props.classes)
    if (marginTop !== undefined) style.marginTop = marginTop
    return style
})
</script>

<style scoped>
.bb-postit {
    position: sticky;
    top: var(--bb-top, 20%);
    left: var(--bb-left, 50%);
    width: 20rem;
    height: 20rem;
    padding: 1.25rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    transform: rotate(var(--bb-rotate, 0deg));
    display: flex;
    flex-direction: column;
    font-family: var(
        --bb-mono,
        ui-monospace,
        'JetBrains Mono',
        Menlo,
        Consolas,
        monospace
    );
}

.bb-postit--yellow {
    background: #ffee00;
    color: #1d1b1a;
}
.bb-postit--green {
    background: #84cc16;
    color: #1d1b1a;
}
.bb-postit--pink {
    background: #ff7598;
    color: #1d1b1a;
}
.bb-postit--dim {
    background: #2a2a2a;
    color: #f4f4f4;
}

.bb-postit-image {
    width: 100%;
    height: auto;
    margin-bottom: 0.75rem;
    display: block;
}

.bb-postit-overline {
    font-size: 0.875rem;
    margin: 0 0 0.5rem;
    opacity: 0.85;
}

.bb-postit-headline {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.75rem;
    line-height: 1.3;
}

.bb-postit-body {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    white-space: pre-line;
}

/* Accessibility · respect reduced-motion */
@media (prefers-reduced-motion: reduce) {
    .bb-postit {
        transform: none;
    }
}

/* Mobile · Option-A linearised per howto-blackboard §5 (HM-approved) */
@media (max-width: 768px) {
    .bb-postit {
        position: static;
        width: 100%;
        max-width: 24rem;
        height: auto;
        transform: none;
        margin: 1rem auto;
    }
}
</style>
