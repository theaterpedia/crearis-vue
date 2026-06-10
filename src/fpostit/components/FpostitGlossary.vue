<!--
  FpostitGlossary — a reading-trail rail (Strategy 5 · accumulating glossary).

  A scan-and-dismiss view over the controller's `openKeys`: every gloss the reader
  has open shows as a colour-coded chip (the card's semantic colour), so the trail
  reads as a map of kinds. Click a chip to drop that gloss; "clear all" empties the
  trail. Mount once per glossary-mode page (alongside <FpostitRenderer/>).

  General fpostit infra (no page-specific content) — lives on alpha/fpostit-extend.
  Per dev/Act26/06-06_DEVDOC_post-its_accumulating-glossary.md §3.3.
-->

<template>
  <aside v-if="openList.length" class="fpostit-glossary" aria-label="Your glossary">
    <h3 class="fpostit-glossary-title">Your glossary ({{ openList.length }})</h3>
    <ul class="fpostit-glossary-chips">
      <li v-for="item in openList" :key="item.key">
        <button
          type="button"
          class="fpostit-glossary-chip"
          :class="`bg-${item.color}`"
          @click="controller.closePostit(item.key)"
        >
          <span class="fpostit-glossary-chip-label">{{ item.title }}</span>
          <span aria-hidden="true" class="fpostit-glossary-chip-x">✕</span>
        </button>
      </li>
    </ul>
    <button type="button" class="fpostit-glossary-clear" @click="controller.closeAll()">clear all</button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFpostitController } from '../composables/useFpostitController'

const controller = useFpostitController()

/** The open trail, newest-last, with each gloss's title + semantic colour. */
const openList = computed(() =>
    Array.from(controller.openKeys).map((key) => {
        const p = controller.postits.get(key)
        return { key, title: p?.title ?? key, color: p?.color ?? 'primary' }
    }),
)
</script>

<style scoped>
.fpostit-glossary {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 40;
    max-width: min(20rem, calc(100vw - 2rem));
    max-height: 50vh;
    overflow-y: auto;
    padding: 0.75rem 0.875rem;
    background: var(--color-popover-bg, #0f0f0f);
    color: var(--color-popover-contrast, #d0d0d0);
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
    /* square corners · magnifica grammar */
    border-radius: 0;
    font-family: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace;
}

.fpostit-glossary-title {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.02em;
}

.fpostit-glossary-chips {
    list-style: none;
    margin: 0 0 0.5rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.fpostit-glossary-chip {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    border: 0;
    border-radius: 0;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
    color: var(--color-primary-contrast, #1a1a1a);
}

/* Semantic chip colours · mirror the card's `bg-{color}` OKLCH tokens. */
.fpostit-glossary-chip.bg-primary  { background: var(--color-primary-bg, #ffee00);  color: var(--color-primary-contrast, #1a1a1a); }
.fpostit-glossary-chip.bg-positive { background: var(--color-positive-bg, #57e389); color: var(--color-positive-contrast, #1a1a1a); }
.fpostit-glossary-chip.bg-negative { background: var(--color-negative-bg, #f06292); color: var(--color-negative-contrast, #1a1a1a); }
.fpostit-glossary-chip.bg-dimmed   { background: var(--color-dimmed, #888888);      color: var(--color-muted-contrast, #f4f4f4); }

.fpostit-glossary-chip-x {
    opacity: 0.7;
    flex-shrink: 0;
}

.fpostit-glossary-chip:hover .fpostit-glossary-chip-x,
.fpostit-glossary-chip:focus-visible .fpostit-glossary-chip-x {
    opacity: 1;
}

.fpostit-glossary-clear {
    border: 0;
    background: transparent;
    padding: 0.25rem 0;
    font: inherit;
    font-size: 0.75rem;
    color: var(--color-muted-contrast, #aaa);
    text-decoration: underline;
    cursor: pointer;
}

@media (max-width: 768px) {
    .fpostit-glossary {
        left: 0.5rem;
        bottom: 0.5rem;
        max-width: calc(100vw - 1rem);
    }
}
</style>
