<template>
  <div class="prose" :class="{ 'prose-element': scope === 'element' }">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /**
   * Scope of prose content
   * - 'page': Full page content with max-width and page-level heading sizes (default)
   * - 'element': Component-level content with no width constraints and smaller heading sizes
   */
  scope?: 'page' | 'element'
}>()
</script>

<style scoped>
.prose {
  max-width: 54rem;
  /* 864px */
}

/* Element scope: no width constraints */
.prose-element {
  max-width: none;
  min-width: 0;
  overflow: hidden;
  /* Prevent content from extending beyond parent */
}

/* Element scope: Enable text truncation for headings and their children */
.prose-element :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) {
  overflow: hidden;
  /* Allow wrapping - don't use white-space: nowrap on container */
}

.prose-element :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) :where(strong) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prose-element :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) :where(.subline, .overline) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/**
 * Empty Headline Special Case
 * Used for metadata display (e.g., image credits) where headline is intentionally empty
 * Format: "** **subline" or "overline** **"
 */

/* Hide empty strong element (SEO: still in DOM, just invisible) */
.prose :where(.empty-headline) :where(strong) {
  display: none;
}

/* Overline in empty headline: move up 4px, reduce size by one level */
.prose :where(.empty-headline) :where(.overline) {
  margin-top: -4px;
  font-size: 0.875em;
  /* One step smaller */
  /* Ensure truncation works */
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  min-width: 0;
}

/* Subline in empty headline: move down 10px, reduce size by one level */
.prose :where(.empty-headline) :where(.subline) {
  margin-top: 10px;
  font-size: 0.875em;
  /* One step smaller */
  /* Ensure truncation works */
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  min-width: 0;
}

/* Overline in empty headline: also needs truncation */
.prose :where(.empty-headline) :where(.overline) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  min-width: 0;
}

/* Element scope: Further reduce size for empty headline metadata */
.prose-element :where(.empty-headline) :where(.overline),
.prose-element :where(.empty-headline) :where(.subline) {
  font-size: 0.75em;
  /* Two steps smaller in element scope */
}

/**
 * Paragraphs
 */

.prose :where(p) {
  color: var(--color-muted-contrast);
  font-size: 1em;
  line-height: 1.15;
}

/**
 * Headings
 */

.prose :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) {
  color: var(--color-contrast);
  font-weight: 500;
}

.prose :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) :where(strong) {
  display: block;
}

/* Page scope: Default heading sizes */
.prose :where(h1, .h1) :where(strong) {
  font-size: 2.7em;
  line-height: 1.2;
}

.prose :where(h2, .h2) :where(strong) {
  font-size: 2.2em;
  line-height: 1.2;
}

.prose :where(h3, .h3) :where(strong) {
  font-size: 1.4em;
  line-height: 1.2;
}

.prose :where(h4, .h4) :where(strong) {
  font-size: 1.2em;
  line-height: 1.2;
}

.prose :where(h5, .h5) :where(strong) {
  font-size: 1em;
  line-height: 1.2;
}

.prose :where(h6, .h6) :where(strong) {
  font-size: 0.875em;
  line-height: 1.2;
}

/* Element scope: Shift heading sizes down (h3 becomes h4 size, etc.) */
.prose-element :where(h3, .h3) :where(strong) {
  font-size: 1.2em;
  /* h4 size */
  line-height: 1.2;
}

.prose-element :where(h4, .h4) :where(strong) {
  font-size: 1em;
  /* h5 size */
  line-height: 1.2;
}

.prose-element :where(h5, .h5) :where(strong) {
  font-size: 0.875em;
  /* h6 size */
  line-height: 1.2;
}

/* .small to be used from outside via slot */
.prose :where(h1, h2, h3, .h1, .h2, .h3, .h4, .h5, .h6) :where(small) {
  font-size: 0.875em;
  display: block;
  font-weight: 400;
}

/**
 * Links
 */

.prose :where(:not(:where(h1, h2, h3, h4, h5, h6)[id])) :where(a) {
  color: var(--link, var(--color-secondary-base));text-decoration: underline;
}

.prose :where(a:hover) {
  text-decoration: none;
}

/**
 * Lists
 */

.prose>*+ :where(ul, ol) {
  margin-top: 0.6em;
  color: var(--color-muted-contrast);
}

.prose :where(ul, ol) :where(ul, ol) {
  padding-left: 2.5em;
}

.prose :where(li) {
  position: relative;
  margin-top: 0.4em;
  margin-bottom: 0.4em;
  padding-left: 2.5em;
}

.prose :where(li)::before {
  content: '';
  position: absolute;
  top: 0.575em;
  left: 1.75em;
  width: 0.1875rem;
  height: 0.1875rem;
  margin-top: -0.09375rem;
  border-radius: 50%;
  background-color: var(--color-muted-contrast);
}

/**
 * Spacings
 */

.prose> :where(* + *) {
  margin-top: 1em;
}

.prose :where(:not(.narrow, .h1, .h2, .h3, .h4, .h5, .h6) + p) {
  margin-top: 1.8em;
}

.prose :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6)+ :where(:not(.h1, .h2, .h3, .h4, .h5, .h6)) {
  margin-top: 1.3em;
}

.prose :where(:not(.h1, .h2, .h3, .h4, .h5, .h6))+ :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) {
  margin-top: 1.8em;
}

.prose :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6)+ :where(h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6) {
  margin-top: 0.75rem;
}

.prose :where(* + .narrow, .narrow > p) {
  margin-top: 0.5em;
}

/**
 * Colors
 */
.prose :where(.primary) {
  --color-contrast: var(--color-primary-contrast);
  color: var(--color-primary-contrast);
}

.prose :where(.secondary) {
  --color-contrast: var(--color-secondary-contrast);
  color: var(--color-secondary-contrast);
}

.prose :where(.neutral) {
  --color-contrast: var(--color-contrast);
  color: var(--color-contrast);
}

.prose :where(.positive) {
  --color-contrast: var(--color-positive-contrast);
  color: var(--color-positive-contrast);
}

.prose :where(.negative) {
  --color-contrast: var(--color-negative-contrast);
  color: var(--color-negative-contrast);
}

.prose :where(.warning) {
  --color-contrast: var(--color-warning-contrast);
  color: var(--color-warning-contrast);
}

.prose :where(.dimmed) {
  --color-contrast: var(--color-muted-contrast);
  color: var(--color-muted-contrast);
}

.prose :where(strong) {
  color: var(--color-contrast);
}
</style>
