<!--
  Demo1 · /demo1 · DiaStage documentation — the BASIC variants.
  A gallery (not an argument): each scene demonstrates ONE simple Dia application and carries a
  pop-over note (the dotted phrase) explaining what is happening. Source clipped/rearranged from
  /context (the image-beats) — here to show the *intended application*, not to be read as a page.
    1 · text-led   — image is a held Dia, prose rises as the Figure (the default reading-Dia)
    2 · image-led  — text recedes to the held ground, the image is the rising Figure (the inverse)
    3 · text-Dia   — a held plate of pure text (held via position, not background-image)
    4 · Shutter    — the black-between blade, with the dasei separator
-->

<template>
  <MagnificaPageLayout variant="standard">
    <template #header><MagnificaHeader show-nav compact /></template>

    <!-- Overview (the doc header) -->
    <template #hero>
      <header class="demo-hero">
        <p class="demo-hero-overline">DiaStage · documentation · basics</p>
        <h1 class="demo-hero-headline">Dia — the basic variants</h1>
        <p class="demo-lead">
          The shadow-theater stage: a held <strong>Dia</strong> (the ground · z1), a rising
          <strong>Figure</strong> (the reading · z2), and the <strong>Shutter</strong> (the
          blade between scenes · z3). Pure-CSS sticky; the Dia is element-anchored (never
          viewport-glued). Below, each variant is labelled — click the dotted phrase for a note
          on the specialty you see in that scene.
        </p>
      </header>
    </template>

    <DiaStage :height-vh="70">
      <!-- 1 · text-led — image holds, prose rises -->
      <p class="demo-label">
        <span class="demo-label-n">1</span><strong>text-led</strong> — the image holds, the prose rises
        · <CalloutPhrase :callout="notes.textLed">what's happening here</CalloutPhrase>
      </p>
      <div class="dia-scene">
        <Dia lane="left" :image="beats.unspoken.image" :image-alt="beats.unspoken.imageAlt" img-tmp-align-y="center" />
        <div class="dia-figure">
          <HeadingParser :content="beats.unspoken.panel" as="h2" class="dia-head" />
          <p>The image is the ground here: it pins and holds, dead-still, while the reading rises beside it. The body witnessed, not stored — the plate stays, the words move.</p>
          <p>Because the Figure provides the scroll-travel, a held image-Dia like this reads as a quiet constant the argument plays against. The longer the prose, the longer the hold — the reading earns its own pace.</p>
          <p>This is the default magnifica reading-Dia: the picture grounds the claim, the sentences carry it. The same gene as the BackSlide — the image is the argument — folded into the sticky stage.</p>
        </div>
      </div>

      <!-- 2 · image-led — text holds as quiet ground, the image rises -->
      <p class="demo-label">
        <span class="demo-label-n">2</span><strong>image-led</strong> — the text holds as quiet ground, the image rises
        · <CalloutPhrase :callout="notes.imageLed">what's happening here</CalloutPhrase>
      </p>
      <div class="dia-scene">
        <Dia lane="left" class="demo-ground"><p>{{ groundText }}</p></Dia>
        <div class="dia-figure demo-img-figure">
          <img :src="beats.hope.image" :alt="beats.hope.imageAlt" />
          <p class="demo-caption">the figures rise from the book — here the image, not the text, is the one that argues.</p>
        </div>
      </div>

      <!-- 3 · text-Dia — a held plate of pure text -->
      <p class="demo-label">
        <span class="demo-label-n">3</span><strong>text-Dia</strong> — a held plate of pure text
        · <CalloutPhrase :callout="notes.textDia">what's happening here</CalloutPhrase>
      </p>
      <div class="dia-scene">
        <Dia lane="left" class="demo-thesis">
          <div>
            <p>You cannot store theatre. The spoken has to be witnessed.</p>
            <p class="demo-aside">— so the page does not store it either; it holds it, and lets you read past.</p>
          </div>
        </Dia>
        <div class="dia-figure">
          <p>A held plate need not be a picture. This one is pure text — held by <code>position</code>, not by a background-image (rendering a div as a background is the Firefox-only <code>element()</code> dead end). The thesis stays put; the gloss rises beside it.</p>
        </div>
      </div>

      <!-- 4 · the Shutter — the black-between blade -->
      <p class="demo-label">
        <span class="demo-label-n">4</span><strong>the Shutter</strong> — the blade between scenes
        · <CalloutPhrase :callout="notes.shutter">what's happening here</CalloutPhrase>
      </p>
      <Shutter separator>
        <p class="demo-shutter-text">the black-between · then a new Dia opens</p>
      </Shutter>
    </DiaStage>
  </MagnificaPageLayout>
</template>

<script setup lang="ts">
import MagnificaPageLayout from './MagnificaPageLayout.vue'
import MagnificaHeader from './MagnificaHeader.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import DiaStage from '@/components/cDia/DiaStage.vue'
import Dia from '@/components/cDia/Dia.vue'
import Shutter from '@/components/cDia/Shutter.vue'
import { beats } from './content/context'
import { groundText, notes } from './content/demo'
</script>

<style scoped>
/* ==Overview header== */
.demo-hero {
  padding-top: clamp(1rem, 4vh, 2.5rem);
}
.demo-hero-overline {
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
  opacity: 0.85;
}
.demo-hero-headline {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  margin: 0 0 1rem;
  line-height: 1.2;
}
.demo-lead {
  max-width: 46rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-muted-contrast);
  margin: 0;
}

/* ==Per-scene label== (normal flow · names the variant + holds the pop-over note) */
.demo-label {
  margin: clamp(2rem, 6vh, 4rem) 0 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
  color: var(--color-muted-contrast);
}
.demo-label-n {
  display: inline-block;
  min-width: 1.4rem;
  font-weight: 700;
  color: var(--color-primary-bg);
}
.demo-label strong {
  color: var(--color-contrast);
}

/* ==A scene== (plain block · ancestor-purity) holds a held Dia (left) + a rising Figure. */
.dia-scene {
  position: relative;
  margin-bottom: clamp(2rem, 6vh, 4rem);
}

/* ==The rising Figure== · the right lane, z:2 (above the held Dia z:1), normal flow. */
.dia-figure {
  position: relative;
  z-index: 2;
}
@media (min-width: 768px) {
  .dia-figure {
    width: 48%;
    margin-left: 52%;
  }
}
.dia-head {
  margin: 0 0 0.75rem;
}
.dia-figure p:last-child {
  margin-bottom: 0;
}

/* ==Image-led== · the held text recedes (the quiet ground); the image Figure is prominent. */
.demo-ground {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-muted-contrast);
  opacity: 0.85;
}
.demo-img-figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 4px;
}
.demo-caption {
  font-size: 0.8125rem;
  color: var(--color-muted-contrast);
  margin: 0.75rem 0 0;
}

/* ==Text-Dia== · the held thesis plate (bigger · the spoken-centre). */
.demo-thesis {
  font-size: clamp(1.05rem, 1.6vw, 1.3rem);
  line-height: 1.55;
}
.demo-aside {
  font-size: 0.9rem;
  margin-top: 0.75rem;
  opacity: 0.8;
}

/* ==Shutter caption== */
.demo-shutter-text {
  text-align: center;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  margin: 0;
  opacity: 0.9;
}
</style>
