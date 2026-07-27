<!--
  UiaTaxonomyBand · section-heading plus the dotted rule beneath it, in the
  taxonomy's colour.

  This is the *chrome* half of §4: the dotted rule is how a block declares which
  taxonomy it belongs to. Drawn in `X_Assets/UI_community_3colors_3taxonomies_3shapes.png`
  — "THEATERPÄDAGOGISCHE ARBEITSFORMEN:" over a green dotted rule,
  "VERANSTALTUNGEN:" over a red one, "AKTEURE:" over a yellow one.

  `taxonomy` may be omitted for the untaxonomised blocks (`taxonomy: —` in the
  content-files' cutter-commands) — then the rule is drawn in the border token
  and carries no semantic claim.
-->

<template>
    <div class="uia-band" :style="vars">
        <p v-if="overline" class="uia-band-overline">{{ overline }}</p>
        <component :is="is" class="uia-band-heading">{{ heading }}</component>
        <div class="uia-band-rule" aria-hidden="true" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { taxonomyVars, type UiaTaxonomy } from './uiaTaxonomy'

const props = withDefaults(
    defineProps<{
        /** Section heading — the taxonomy's own name, or the block's. */
        heading: string
        /** Small line above the heading. */
        overline?: string
        /** Which taxonomy colours the rule. Omit for untaxonomised blocks. */
        taxonomy?: UiaTaxonomy
        /** Heading level — the page decides, so the document outline stays sane. */
        is?: 'h2' | 'h3'
    }>(),
    { is: 'h2' },
)

const vars = computed<Record<string, string>>(() =>
    props.taxonomy
        ? taxonomyVars(props.taxonomy)
        : { '--uia-taxonomy-bg': 'var(--color-border)', '--uia-taxonomy-contrast': 'var(--color-contrast)' },
)
</script>

<style scoped>
.uia-band {
    margin-bottom: 1.25rem;
}

.uia-band-overline {
    margin: 0 0 0.15rem;
    font-size: 0.8125rem;
    font-weight: 300;
    line-height: 1.3;
    color: var(--color-muted-contrast);
}

.uia-band-heading {
    margin: 0;
    font-size: clamp(1.25rem, 2.4vw, 1.75rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.01em;
}

/* The dotted rule · taxonomy chrome. Dotted, not solid: the mockups reserve
   solid rules for the row-separators inside a Veranstaltungen list. */
.uia-band-rule {
    height: 0;
    margin-top: 0.5rem;
    border-bottom: 3px dotted var(--uia-taxonomy-bg);
}
</style>
