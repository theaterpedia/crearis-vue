<template>
    <Heading :is="as" :headline="parsedHeadline" :overline="parsedOverline" :subline="parsedSubline" :tags="tags"
        :shortcode="shortcode" :is-mobile="isMobile" :compact="compact" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Heading from './Heading.vue'
import type { PropType } from 'vue'

const props = defineProps({
    /**
     * Content string to parse. Format:
     * - "overline text **headline text**" - overline + headline
     * - "**headline text** subline text" - headline + subline
     * - "overline text **headline text** subline text" - all three
     * - "**headline text**" - headline only
     */
    content: {
        type: String,
        required: true,
    },
    /**
     * The heading tag to render (passed to Heading component as 'is' prop)
     * @default 'h2'
     */
    as: {
        type: [Object, String] as PropType<'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'li' | 'p'>,
        default: 'h2',
    },
    /**
     * Tags to pass through to Heading component
     */
    tags: {
        type: String,
    },
    /**
     * Shortcode to pass through to Heading component
     */
    shortcode: {
        type: String,
    },
    /**
     * Mobile flag to pass through to Heading component
     */
    isMobile: {
        type: Boolean,
        default: false,
    },
    /**
     * Compact mode to pass through to Heading component
     */
    compact: {
        type: Boolean,
        default: false,
    },
})

/**
 * Parse the content string to extract overline, headline, and subline
 * Format: "overline **headline** subline"
 * - Text before ** is overline
 * - Text between ** ** is headline (required)
 * - Text after ** is subline
 */
const parseContent = computed(() => {
    const content = props.content.trim()

    // Match pattern: optional text before **, required **text**, optional text after **
    const match = content.match(/^(.*?)\*\*(.*?)\*\*(.*)$/)

    if (!match) {
        // No markdown found, treat entire content as headline
        return {
            overline: '',
            headline: content,
            subline: '',
        }
    }

    const [, before, headline, after] = match

    return {
        overline: before.trim(),
        headline: headline.trim(),
        subline: after.trim(),
    }
})

const parsedOverline = computed(() => parseContent.value.overline)
const parsedHeadline = computed(() => parseContent.value.headline)
const parsedSubline = computed(() => parseContent.value.subline)
</script>
