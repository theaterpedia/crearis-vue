<template>
    <div class="backslide-stack">
        <BackSlide
            v-for="slide in resolvedSlides"
            :key="slide.key"
            :image="slide.image"
            :image-alt="slide.imageAlt"
            :img-tmp-align-x="slide.imgTmpAlignX"
            :img-tmp-align-y="slide.imgTmpAlignY"
            :panel="slide.panel"
            :panel-mode="slide.panelMode"
            :image-right="slide.imageRight"
            :theme-color="slide.theme"
            :transition="slide.transition"
            :stack-index="slide.key"
            :bounded="bounded"
        />
    </div>
</template>

<script setup lang="ts">
/**
 * BackSlideStack — the assembler · PageHeading's sibling for the slide-system
 * (backslide-thread §2). Owns the ordered slide-list + stack-level defaults; renders
 * each BackSlide with merged props: (per-slide override ?? stack-default ??
 * component-default). Authored from md → cut to a `slides` list (§5).
 *
 * Pure CSS · no JS. ANCESTOR-PURITY (load-bearing · §9.1/§12): the stack stays a plain
 * block in normal flow — NO transform / filter / overflow / contain / will-change here
 * or on any ancestor. Those create a containing block that kills BOTH `position:sticky`
 * AND `background-attachment:fixed` — the whole choreography's basis (the landing-flicker
 * proof). The mounting page must honor the same.
 */
import { computed } from 'vue'
import BackSlide from './BackSlide.vue'
import type {
    BackSlideSpec,
    BackSlideAlignX,
    BackSlideAlignY,
    BackSlidePanelMode,
    PostItThemeColor,
} from './types'

interface Props {
    /** The ordered slide-list (the cutter's output · §5). */
    slides: BackSlideSpec[]
    /** Stack-level: bound every slide to the 90rem column on wide viewports (magnifica: true). */
    bounded?: boolean
    /** Stack-default horizontal focal · each slide may override. */
    imgTmpAlignX?: BackSlideAlignX
    /** Stack-default vertical focal · each slide may override. */
    imgTmpAlignY?: BackSlideAlignY
    /** Stack-default panel shape · each slide may override. */
    panelMode?: BackSlidePanelMode
    /** Stack-default panel color · each slide may override. */
    theme?: PostItThemeColor
    /** Stack-default side-flip · each slide may override. */
    imageRight?: boolean
    /** Stack-default choreography · `uncover` (default) or `scroll-over` · each slide may override. */
    transition?: 'uncover' | 'scroll-over'
}

const props = withDefaults(defineProps<Props>(), {
    bounded: false,
    imageRight: false,
})

/**
 * Resolve each slide. Per-instance override wins; else the stack default; else we pass
 * `undefined`, so BackSlide's own default applies (Vue omits the attr on undefined).
 * `image` + `panel` + `imageAlt` are per-slide only (no stack default).
 */
const resolvedSlides = computed(() =>
    props.slides.map((s, i) => ({
        key: i,
        image: s.image,
        imageAlt: s.imageAlt,
        imgTmpAlignX: s.imgTmpAlignX ?? props.imgTmpAlignX,
        imgTmpAlignY: s.imgTmpAlignY ?? props.imgTmpAlignY,
        panel: s.panel,
        panelMode: s.panelMode ?? props.panelMode,
        imageRight: s.imageRight ?? props.imageRight,
        theme: s.theme ?? props.theme,
        transition: s.transition ?? props.transition,
    })),
)
</script>

<style scoped>
/* Plain block in normal flow · ancestor-purity (see the script doc) — deliberately
   carries NO transform / filter / overflow / contain / will-change. Slides stack
   vertically; each slide owns its choreography (uncover today · scroll-over to come). */
.backslide-stack {
    display: block;
}
</style>
