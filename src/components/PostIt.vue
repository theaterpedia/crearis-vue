<template>
  <div class="post-it column theme-shadow" :class="[
    `column-${width}`,
    `column-${width}-padding`,
    rotation,
    sticky !== 'static' ? 'sticky ' + sticky : '',
    `bg-${color}`,
  ]">
    <HeadingParser v-if="heading" :content="heading" :as="is" class="post-it-heading"
      :class="[`bg-${color}`, `heading-${is}`]" />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import HeadingParser from './HeadingParser.vue'

const props = defineProps({
  /**
   * The width of the column.
   * On tablet and mobile, the column will take up the full width.
   *
   * @default '1/3'
   */
  width: {
    type: String as PropType<'1/5' | '1/3' | '1/2' | '3/5' | '4/5'>,
    default: '1/3',
  },
  /**
   * The heading tag to render.
   *
   * @default 'h3'
   */
  is: {
    type: String as PropType<'h2' | 'h3' | 'h4' | 'span'>,
    default: 'h3',
  },
  /**
   * Heading content string. Format: "overline **headline** subline"
   */
  heading: {
    type: String,
    required: false,
  },
  /**
   * Color theme for the post-it
   *
   * @default 'primary'
   */
  color: {
    type: String as PropType<'primary' | 'secondary' | 'warning' | 'positive' | 'negative' | 'accent' | 'muted' | 'dimmed'>,
    default: 'primary',
  },
  /**
   * The rotation of the column.
   *
   * @default 'rotate-0'
   */
  rotation: {
    type: String as PropType<
      'rotate-0' | '-rotate-3' | '-rotate-2' | '-rotate-1' | 'rotate-1' | 'rotate-2' | 'rotate-3'
    >,
    default: 'rotate-0',
  },
  /**
   * Sticky positioning
   *
   * @default 'static'
   */
  sticky: {
    type: String as PropType<'static' | 'top-0' | 'top-20' | 'bottom-0' | 'bottom-20'>,
    default: 'static',
  },
})
</script>

<style scoped>
.post-it {
  position: relative;
}

.theme-shadow {
  box-shadow: var(--theme-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

/* Column widths */
.column-1\/5 {
  width: 17.5%;
  min-width: 10.5rem;
  /* 176px */
}

.column-1\/3 {
  width: calc(1 / 3 * 88%);
  min-width: 18rem;
  /* 288px */
}

.column-1\/2 {
  width: calc(1 / 2 * 93%);
  min-width: 21.5rem;
  /* 344px */
}

.column-3\/5 {
  width: 58%;
  min-width: 21.5rem;
  /* 344px */
}

.column-4\/5 {
  width: 79%;
  min-width: 21.5rem;
  /* 344px */
}

/* Padding based on width - default (desktop) */
.column-1\/5-padding {
  padding: 0.5rem;
  /* p-2 = 8px */
  font-size: 0.7em;
}

.column-1\/3-padding,
.column-1\/2-padding,
.column-3\/5-padding,
.column-4\/5-padding {
  padding: 1rem;
  /* p-4 = 16px */
}

/* Responsive padding for 1/5 width - tablet */
@media (min-width: 640px) {
  .column-1\/5-padding {
    padding: 0.75rem;
    /* p-3 = 12px */
    font-size: 0.8em;
  }
}

/* Responsive padding for 1/5 width - desktop */
@media (min-width: 768px) {
  .column-1\/5-padding {
    padding: 1rem;
    /* p-4 = 16px */
    font-size: 1em;
  }
}

/* Responsive padding for larger columns - desktop */
@media (min-width: 768px) {

  .column-1\/3-padding,
  .column-1\/2-padding,
  .column-3\/5-padding,
  .column-4\/5-padding {
    padding: 1.5rem;
    /* p-6 = 24px */
  }
}

/* Special font size for 1/3 width */
.column-1\/3 {
  font-size: 0.8em;
}

/* Heading spacing */
.post-it-heading {
  margin-bottom: 1rem;
  /* mb-4 = 16px */
}

/* Responsive heading font sizes - mobile/tablet only */
@media (max-width: 767px) {
  .heading-h2 {
    font-size: 0.75em;
  }

  .heading-h3 {
    font-size: 0.825em;
  }

  .heading-h4,
  .heading-span {
    font-size: 0.875em;
  }
}

/* Rotation classes */
.-rotate-3 {
  rotate: -3deg;
}

.-rotate-2 {
  rotate: -2deg;
}

.-rotate-1 {
  rotate: -1deg;
}

.rotate-0 {
  rotate: 0deg;
}

.rotate-1 {
  rotate: 1deg;
}

.rotate-2 {
  rotate: 2deg;
}

.rotate-3 {
  rotate: 3deg;
}

/* Sticky positioning */
.sticky {
  position: sticky;
}

.top-0 {
  top: 0;
}

.top-20 {
  top: 5rem;
  /* 20 * 0.25rem = 80px */
}

.bottom-0 {
  bottom: 0;
}

.bottom-20 {
  bottom: 5rem;
  /* 20 * 0.25rem = 80px */
}

/* Color backgrounds and contrasts */
.bg-primary {
  background-color: var(--color-primary-bg);
  color: var(--color-primary-contrast);
  --color-contrast: var(--color-primary-contrast);
}

.bg-secondary {
  background-color: var(--color-secondary-bg);
  color: var(--color-secondary-contrast);
  --color-contrast: var(--color-secondary-contrast);
}

.bg-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-contrast);
  --color-contrast: var(--color-warning-contrast);
}

.bg-positive {
  background-color: var(--color-positive-bg);
  color: var(--color-positive-contrast);
  --color-contrast: var(--color-positive-contrast);
}

.bg-negative {
  background-color: var(--color-negative-bg);
  color: var(--color-negative-contrast);
  --color-contrast: var(--color-negative-contrast);
}

.bg-accent {
  background-color: var(--color-accent-bg);
  color: var(--color-accent-contrast);
  --color-contrast: var(--color-accent-contrast);
}

.bg-muted {
  background-color: var(--color-muted-bg);
  color: var(--color-muted-contrast);
  --color-contrast: var(--color-muted-contrast);
}

.bg-dimmed {
  background-color: var(--color-dimmed);
  color: var(--color-muted-contrast);
  --color-contrast: var(--color-muted-contrast);
}

/* Nested color overrides - when colored elements are inside colored post-its */
:is(.bg-primary, .bg-secondary, .bg-warning, .bg-positive, .bg-negative) :deep(:is(.bg-primary, .bg-secondary, .bg-warning, .bg-positive, .bg-negative)) {
  --color-inverted: 0;
  --color-contrast: var(--color-black);
  --color-primary-contrast: var(--color-black);
  color: var(--color-black);
}
</style>
