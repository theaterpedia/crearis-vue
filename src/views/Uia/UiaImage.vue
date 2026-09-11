<!--
  UiaImage · one image slot that survives having no image yet.

  Every `image:` in `content/*.ts` is currently the literal string `'TODO HP'`
  (§8 — Cloudinary URLs come from HP). Rather than render a broken <img>, this
  shows a themed placeholder that names the alt-text, so HP can see at a glance
  which source belongs in which slot.

  ── focal ──────────────────────────────────────────────────────────────────────
  §8: the Meine-Grenzen illustration's argument is THE TWO HANDS — one palms-up
  refusing, one reaching across — and they must stay in frame at every crop and
  every width. `focal` is declared per-image in the content-files and mapped
  straight onto `object-position`, so the crop is stated rather than defaulted.
  It accepts the CSS position keywords plus a raw `"x% y%"` for when HP measures
  the real crop.
-->

<template>
    <figure class="uia-image" :class="[`uia-image-${ratio}`, framed ? 'uia-image-framed' : null]">
        <img
            v-if="hasImage"
            class="uia-image-img"
            :src="src"
            :alt="alt"
            :style="{ objectPosition: focal }"
            loading="lazy"
            decoding="async"
        />
        <!-- Placeholder · gradient from the theme's own tokens, never a literal colour. -->
        <div v-else class="uia-image-placeholder" role="img" :aria-label="alt">
            <span class="uia-image-placeholder-flag">Bild folgt</span>
            <span class="uia-image-placeholder-alt">{{ alt }}</span>
        </div>
        <figcaption v-if="caption" class="uia-image-caption">{{ caption }}</figcaption>
    </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { hasRealImage } from './uiaItems'

const props = withDefaults(
    defineProps<{
        /** Image URL. `'TODO HP'`, `'TODO'` or empty → placeholder. */
        src?: string
        /** Required as content, not as decoration — the placeholder renders it. */
        alt: string
        /** `object-position` for the crop. Content-files declare this per image. */
        focal?: string
        /** Aspect ratio of the slot. */
        ratio?: 'wide' | 'banner' | 'portrait' | 'square'
        /** Draw a taxonomy frame around it (expects `--uia-taxonomy-bg` in scope). */
        framed?: boolean
        caption?: string
    }>(),
    { focal: 'center', ratio: 'wide', framed: false },
)

/** `'TODO HP'` is a note to HP, not a URL — one shared rule, see ./uiaItems.ts. */
const hasImage = computed(() => hasRealImage(props.src))
</script>

<style scoped>
.uia-image {
    position: relative;
    margin: 0;
    overflow: hidden;
}

.uia-image-framed {
    border: 3px solid var(--uia-taxonomy-bg, var(--color-border));
}

.uia-image-img,
.uia-image-placeholder {
    display: block;
    width: 100%;
    height: 100%;
}

.uia-image-img {
    object-fit: cover;
}

.uia-image-wide > .uia-image-img,
.uia-image-wide > .uia-image-placeholder {
    aspect-ratio: 16 / 9;
}

.uia-image-banner > .uia-image-img,
.uia-image-banner > .uia-image-placeholder {
    aspect-ratio: 21 / 9;
}

.uia-image-portrait > .uia-image-img,
.uia-image-portrait > .uia-image-placeholder {
    aspect-ratio: 3 / 4;
}

.uia-image-square > .uia-image-img,
.uia-image-square > .uia-image-placeholder {
    aspect-ratio: 1 / 1;
}

.uia-image-placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.4rem;
    padding: 1rem;
    background-image: linear-gradient(
        135deg,
        var(--color-muted-bg) 0%,
        var(--color-secondary-bg) 100%
    );
    color: var(--color-secondary-contrast);
}

.uia-image-placeholder-flag {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.75;
}

.uia-image-placeholder-alt {
    font-size: 0.8125rem;
    line-height: 1.35;
}

.uia-image-caption {
    padding-top: 0.4rem;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--color-muted-contrast);
}
</style>
