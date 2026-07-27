<!--
  UiaHero · the masthead band. `shape: band` · col: full.

  Used by all three views: the landing's `hero`, the agenda page's `page-hero`,
  and the stub. The uia hero is the owners' own masthead grammar — overline
  crystal-clear (method · place · time), headline free, and the gap between them
  is the writing. **One button only, never a menu** (`content/landing.ts`).

  ── Deliberately not `components/Hero.vue` ────────────────────────────────────
  The mainline `Hero.vue` resolves its cover through `useImageFetch` /
  `selectHeroInstance` — i.e. the image API and the DB. uia has neither (§2), so
  reusing it would buy a hero that renders nothing. This is the same call
  magnifica made with `EntryHero`.

  ── focal (§8) ────────────────────────────────────────────────────────────────
  The landing's cover is the two-figures illustration and its argument is THE TWO
  HANDS — one palms-up refusing, one reaching across. They must hold at every
  crop and every width, so `focal` is declared in the content-file and bound to
  `background-position` here rather than left to a default.
-->

<template>
    <header class="uia-hero" :class="{ 'uia-hero-plain': !hasImage }" :style="style">
        <div v-if="hasImage" class="uia-hero-scrim" aria-hidden="true" />
        <Container>
            <div class="uia-hero-inner">
                <p v-if="overline" class="uia-hero-overline">{{ overline }}</p>
                <h1 class="uia-hero-headline">{{ headline }}</h1>
                <p v-if="teaser" class="uia-hero-teaser">{{ teaser }}</p>
                <p v-if="action" class="uia-hero-action">
                    <!-- `/agenda` is a route, `#agenda` is an in-page anchor — the first
                         must not reload the SPA, the second must not go through the router. -->
                    <router-link v-if="routeTo" class="uia-hero-button" :to="routeTo">
                        {{ action.label }}
                    </router-link>
                    <a v-else class="uia-hero-button" :href="action.href">{{ action.label }}</a>
                </p>
            </div>
        </Container>
        <!-- Alt-text of a decorative-position background still has to reach AT. -->
        <span v-if="hasImage" class="uia-hero-alt" role="img" :aria-label="imageAlt" />
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Container from '@/components/Container.vue'

const props = withDefaults(
    defineProps<{
        headline: string
        overline?: string
        teaser?: string
        /** One action. Not a menu. */
        action?: { href: string; label: string }
        /** `'TODO HP'` / empty → the plain themed band instead of a cover. */
        image?: string
        imageAlt?: string
        focal?: string
    }>(),
    { focal: 'center' },
)

const hasImage = computed(() => {
    const src = props.image?.trim()
    return !!src && !src.toUpperCase().startsWith('TODO')
})

const style = computed<Record<string, string>>(() => {
    if (!hasImage.value) return {}
    const cover: Record<string, string> = {
        backgroundImage: `url('${props.image}')`,
        backgroundPosition: props.focal,
    }
    return cover
})

/**
 * The router-target, or null when the action is not an in-app route.
 * `/agenda` goes through the router; `#agenda` and `mailto:` must not.
 */
const routeTo = computed<string | null>(() => {
    const href = props.action?.href
    return href?.startsWith('/') ? href : null
})
</script>

<style scoped>
.uia-hero {
    position: relative;
    display: flex;
    align-items: flex-end;
    min-height: clamp(20rem, 52vh, 34rem);
    padding: 2.5rem 0;
    overflow: hidden;
    background-color: var(--color-accent-bg);
    background-size: cover;
    background-repeat: no-repeat;
    color: var(--color-accent-contrast);
}

/* No cover yet · the theme's own ground, so the masthead still reads as uia's
   (primary h191 teal into secondary h43 orange — their logo and their posters). */
.uia-hero-plain {
    min-height: clamp(15rem, 38vh, 24rem);
    background-image: linear-gradient(
        135deg,
        var(--color-primary-bg) 0%,
        var(--color-secondary-bg) 100%
    );
    color: var(--color-primary-contrast);
}

.uia-hero-scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgb(0 0 0 / 72%) 0%, rgb(0 0 0 / 18%) 55%, transparent 100%);
}

.uia-hero-inner {
    position: relative;
    max-width: 52rem;
}

.uia-hero-overline {
    margin: 0 0 0.4rem;
    font-size: clamp(0.8125rem, 1.4vw, 1rem);
    font-weight: 300;
    line-height: 1.35;
    letter-spacing: 0.01em;
}

.uia-hero-headline {
    margin: 0;
    font-size: clamp(2rem, 6vw, 4rem);
    font-weight: 700;
    line-height: 1.05;
}

.uia-hero-teaser {
    max-width: 42rem;
    margin: 0.9rem 0 0;
    font-size: clamp(0.9375rem, 1.7vw, 1.125rem);
    line-height: 1.55;
}

.uia-hero-action {
    margin: 1.4rem 0 0;
}

.uia-hero-button {
    display: inline-block;
    padding: 0.7rem 1.4rem;
    background-color: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    font-size: 1rem;
    font-weight: 700;
    text-decoration: none;
    transition: var(--transition, all 0.2s ease);
}

.uia-hero-button:hover,
.uia-hero-button:focus-visible {
    background-color: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

/* Visually-hidden carrier for the cover's alt-text. */
.uia-hero-alt {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
}
</style>
