<template>
  <aside class="side-content" :class="[
    `side-content-${placement}`,
    layoutMode ? `side-content-layout-${layoutMode}` : ''
  ]">
    <slot />
  </aside>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'

defineProps({
  /**
   * Specifies the placement of the side content.
   * 
   * - `right`: Side content appears on the right side (default)
   * - `left`: Side content appears on the left side
   * 
   * @default 'right'
   */
  placement: {
    type: String as PropType<'left' | 'right'>,
    default: 'right',
  },
  /**
   * Layout mode for responsive behavior
   * 
   * - `fullTwo`: Full-width 2-column layout
   * - `fullThree`: Full-width 3-column layout
   */
  layoutMode: {
    type: String as PropType<'fullTwo' | 'fullThree' | null>,
    default: null,
  },
})
</script>

<style scoped>
.side-content {
  width: 100%;
  flex-shrink: 0;
  background-color: var(--color-muted-bg);
}

/* Tablet: Shrink sidebars to 300px max */
@media (min-width: 1024px) and (max-width: 1279px) {
  .side-content {
    width: 18.75rem;
    /* 300px total width including padding */
    padding: 0 1rem;
    align-self: stretch;
  }
}

/* Desktop: Full sidebar width at 1280px+ */
@media (min-width: 1280px) {
  .side-content {
    width: 23.625rem;
    /* 378px content width */
    padding: 0 1rem;
    /* Only left-right padding: Total width: 23.625rem + 2rem padding = 25.625rem (410px) */
    align-self: stretch;
    /* Fill the entire available height */
  }
}

/* Tablet (768px-1023px): Force wrap, sidebars take appropriate width */
@media (min-width: 768px) and (max-width: 1023px) {
  .side-content {
    padding: 0 1.5rem;
    flex: 0 0 auto;
    /* Don't grow or shrink, use width */
  }

  /* fullTwo: Right sidebar full width when wrapped */
  .side-content-layout-fullTwo {
    flex-basis: 100%;
    width: 100%;
  }

  /* fullThree: Both sidebars half width when wrapped */
  .side-content-layout-fullThree {
    flex-basis: 50%;
    width: 50%;
    box-sizing: border-box;
  }
}

/* Mobile (<768px): Full width for all sidebars */
@media (max-width: 767px) {
  .side-content {
    flex: 0 0 100%;
    width: 100%;
    padding: 0 1rem;
  }
}

/* Placement: right is default */
.side-content-right {
  order: 2;
}

/* Placement: left should come before main content on desktop */
.side-content-left {
  order: 0;
}

/* Tablet (768px-1023px): Main content comes first, sidebars wrap below */
@media (min-width: 768px) and (max-width: 1023px) {
  .side-content-right {
    order: 1;
    /* Right sidebar comes after main (which is order: 0) */
  }

  .side-content-left {
    order: 2;
    /* Left sidebar comes after right sidebar */
  }
}

/* Mobile (<768px): Stack order - main content, right sidebar, left sidebar */
@media (max-width: 767px) {
  .side-content-right {
    order: 1;
    /* Right sidebar second (after main) */
  }

  .side-content-left {
    order: 2;
    /* Left sidebar last (lowest priority) */
  }
}
</style>
