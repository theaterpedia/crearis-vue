<!--
  UiaHighlight · the marked line. `shape: highlight` in the cutter-commands.

  This is the slot theaterpedia.org uses for „Start des Showcase: ab 27. NOV 2025".
  uia uses the exact same slot for its deadline-and-threshold line:
  „Anmeldung bis 10.09.26 · findet ab 10 Teilnehmenden statt".

  ── Why the mark is `secondary`, not `warning` ────────────────────────────────
  This line is the field where a live threshold-status would eventually live
  (§status-colour: it is uia's on-time/delayed field). It has no status source
  this round, so it must not *look* like it carries one — and a yellow mark here
  would read as „Schwelle noch nicht erreicht", which is precisely the collision
  §4 exists to prevent.

  So the mark uses `secondary` — orange h43, uia's brand ground, chosen in §3 for
  being *non-semantic*. Emphasis without a status claim. When a participant-count
  source arrives, the status goes on the text as colour (bahn-grammar), and this
  mark stays where it is.
-->

<template>
    <p class="uia-highlight">
        <span class="uia-highlight-text"><slot>{{ text }}</slot></span>
    </p>
</template>

<script setup lang="ts">
defineProps<{
    /** The line itself. Ignored when the default slot is filled. */
    text?: string
}>()
</script>

<style scoped>
.uia-highlight {
    margin: 1.5rem 0 0;
    padding: 0.7rem 1rem;
    border-left: 5px solid var(--color-secondary-bg);
    background-color: color-mix(in oklch, var(--color-secondary-bg) 14%, transparent);
}

.uia-highlight-text {
    font-size: clamp(0.9375rem, 1.6vw, 1.0625rem);
    font-weight: 700;
    line-height: 1.45;
}
</style>
