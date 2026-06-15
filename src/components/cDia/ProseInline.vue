<template>
    <span class="prose-inline"><template
        v-for="(seg, i) in segments"
        :key="i"
    ><strong v-if="seg.type === 'bold'">{{ seg.value }}</strong><a
        v-else-if="seg.type === 'link'"
        class="prose-inline-link"
        :href="seg.href"
        target="_blank"
        rel="noopener noreferrer"
    >{{ seg.value }}</a><template v-else>{{ seg.value }}</template></template></span>
</template>

<script setup lang="ts">
/**
 * ProseInline — renders one prose line with the cDia inline-md (bold + autolink · inlineMd.ts · the
 * §43/§44 richer parser). Inline (a <span>) so it sits inside the consumer's <p>. Safe-by-
 * construction (segments → elements · no v-html). The cDia family reuses it for prose; the Shutter
 * timeline descriptions (Zentrum Nürnberg · Institut Bayern · dasei.eu · §45) read correctly through it.
 */
import { computed } from 'vue'
import { parseInline } from './inlineMd'

const props = defineProps<{ text: string }>()
const segments = computed(() => parseInline(props.text))
</script>

<style scoped>
.prose-inline-link {
    color: var(--color-primary-bg);
    text-decoration: underline;
    text-underline-offset: 2px;
}
</style>
