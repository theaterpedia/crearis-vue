<template>
  <div class="slide swiper-slide" :class="{ [`theme-${theme}`]: theme }">
    <div class="slide-inner">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  theme?: 'primary' | 'secondary' | 'muted' | 'accent' | false
}

const props = withDefaults(defineProps<Props>(), {
  theme: false
})
</script>

<style scoped>
.slide {
  /* Default: use parent vars */
  --color-slide-bg: var(--color-bg);
  --color-slide-contrast: var(--color-contrast);

  width: 100%;
  padding: 0 4.5rem;
}

/* Theme variants - override slide vars */
.slide.theme-primary {
  --color-slide-bg: var(--color-primary-bg);
  --color-slide-contrast: var(--color-primary-contrast);
}

.slide.theme-secondary {
  --color-slide-bg: var(--color-secondary-bg);
  --color-slide-contrast: var(--color-secondary-contrast);
}

.slide.theme-muted {
  --color-slide-bg: var(--color-muted-bg);
  --color-slide-contrast: var(--color-muted-contrast);
}

.slide.theme-accent {
  --color-slide-bg: var(--color-accent-bg);
  --color-slide-contrast: var(--color-accent-contrast);
}

.slide:not(:last-child) {
  margin-right: 1.75rem;
  /* 28px */
}

.slide-inner {
  padding: 1.125rem;
  /* 18px */
  background-color: var(--color-slide-bg);
  color: var(--color-slide-contrast);
  pointer-events: auto;
}

@media (max-width: 1023px) {
  .slide {
    padding: 0;
  }
}
</style>
