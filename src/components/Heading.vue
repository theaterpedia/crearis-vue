<template>
  <Prose>
    <component :is="is" class="heading"
      :class="[hasOverline || hasSubline ? 'twoliner' : 'oneliner', fancyShortCode ? 'twocolums' : '', compact ? 'compact' : '']"
      :style="{ opacity: opacity }">
      <span v-if="fancyShortCode" class="shortcode-float">{{ shortcode }}</span>
      <template v-if="hasOverline">
        <span v-if="extLineShortCode" class="shortcode">{{ shortcode }}</span>
        <span v-if="tags" class="tags">{{ tags }}</span>
        <span v-if="tags && overline" class="separator">//</span>
        <span class="overline">{{ overline }}</span>
      </template>
      <strong>
        <span v-if="mainLineShortCode" class="shortcode">{{ shortcode }}</span>
        {{ headline }}
      </strong>
      <template v-if="hasSubline">
        <span v-if="extLineShortCode" class="shortcode">{{ shortcode }}</span>
        <span v-if="tags" class="tags">{{ tags }}</span>
        <span v-if="tags && subline" class="separator">//</span>
        <span class="subline">{{ subline }}</span>
      </template>
      <!-- slot / not needed anymore? -->
    </component>
  </Prose>
</template>

<script lang="ts" setup>
import Prose from './Prose.vue'
import { computed } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  /**
   * The heading tag to render.
   *
   * @default 'h1'
   */
  is: {
    type: [Object, String] as PropType<'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'li' | 'p'>,
    default: 'h1',
  },
  /**
   * The main line of the heading, important for SEO.
   * required
   */
  headline: {
    type: String,
    required: true,
  },
  /**
   * For newspaper-style headings, typicall gives abstract/meta-informaton
   * small font-size
   * If provided, contents of the `subline` will be ignored.
   */
  overline: {
    type: String,
  },
  /**
   * For default headings, extends the headline with additional information
   * Only shows up, if no overline is provided
   */
  subline: {
    type: String,
  },
  /**
   * Tags extend the overline or subline with contextual information like date, time, location
   * if no overline or subline is provided, tags will be shown as overline
   */
  tags: {
    type: String,
  },
  /**
   * A unique shortcode representing the data of this heading, for instance "B1" for an event, "26.7" for a date
   * if no overline or subline is provided, tags will be shown as overline
   */
  shortcode: {
    type: String,
  },
  isMobile: {
    // for development purposes only > has to be removed
    type: Boolean,
    default: false,
  },
  /**
   * Compact mode - scales down overline/subline by one step
   * Useful for cards and smaller containers
   */
  compact: {
    type: Boolean,
    default: false,
  },
  /**
   * Opacity of the heading content (0-1)
   * @default 1
   */
  opacity: {
    type: Number,
    default: 1,
  },
})

// TODO: detect mobile
// const isMobile = false

// TODO:  maybe refactor towards crearis 1.0 once runnung to have less computations
const hasOverline = computed(() => props.overline || (!props.subline && props.tags))
const hasSubline = computed(() => !hasOverline.value && (props.subline || props.tags))
const mainLineShortCode = computed(() => props.shortcode && !hasOverline.value && !hasSubline.value)
const extLineShortCode = computed(() => props.shortcode && props.isMobile && !mainLineShortCode.value)
const fancyShortCode = computed(() => props.shortcode && !props.isMobile && (hasOverline.value || hasSubline.value))
</script>

<style scoped>
.shortcode {
  margin-right: 0.3em;
  background-color: #999;
  padding: 0em 0.15em;
}

.shortcode,
.shortcode-float {
  font-weight: 800;
}

.separator {
  margin-right: 0.4em;
  margin-left: 0.4em;
}

.shortcode-float {
  float: left;
  margin-right: 0.15em;
  line-height: 0.9;
}

:where(h1, h2, h3).heading.twoliner :where(strong) {
  line-height: 1.05;
}

:where(h1, .h1)>span.shortcode-float {
  font-size: 4.4em;
}

:where(h2, .h2)>span.shortcode-float {
  font-size: 3.8em;
}

:where(h3, .h3)>span.shortcode-float {
  font-size: 3em;
}

.overline,
.subline {
  display: block;
  font-weight: 300;
  text-decoration-line: none;
}

/* Size overline and subline relative to the heading level */
:where(h1, .h1) .overline,
:where(h1, .h1) .subline {
  font-size: 0.875em;
  line-height: 1.3;
}

:where(h2, .h2) .overline,
:where(h2, .h2) .subline {
  font-size: 0.75em;
  line-height: 1.3;
}

:where(h3, .h3) .overline,
:where(h3, .h3) .subline {
  font-size: 0.7em;
  line-height: 1.3;
}

/* Compact mode - scale down overline/subline slightly */
:where(h1, .h1).compact .overline,
:where(h1, .h1).compact .subline {
  font-size: 0.85em;
  line-height: 1.3;
}

:where(h2, .h2).compact .overline,
:where(h2, .h2).compact .subline {
  font-size: 0.8em;
  line-height: 1.3;
}

:where(h3, .h3).compact .overline,
:where(h3, .h3).compact .subline {
  font-size: 0.75em;
  line-height: 1.3;
}

:where(h4, .h4).compact .overline,
:where(h4, .h4).compact .subline {
  font-size: 0.7em;
  line-height: 1.3;
}

:where(h5, .h5).compact .overline,
:where(h5, .h5).compact .subline {
  font-size: 0.65em;
  line-height: 1.3;
}

/* Add your styles here / deactivated
.heading {

}

.heading :deep() em {

}

.heading :deep() mark {

}

.heading :deep() strong {
  
}
*/
</style>
