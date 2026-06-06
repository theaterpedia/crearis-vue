<!--
  EntryHero · Magnifica password-gate with the 6-beat entry-choreography.

  Per final_conception.md §Landing > entry-choreography (TO (website) 2026-06-05).
  Modeled on the StartPageHero shape (<Hero> › <Banner transparent> › slot), retiring
  both the old custom hero and the separate UnlockOverlay (the 9000ms timer 3-beat).

  Flow:
    Stage 0 — centered password field + greyed/disabled 'enter-sign' button.
    Stage 1 — when the field value equals `CCCS`, the field locks and a 6-beat reveal
      plays above it inside a codebox chat-box, 1-second break between beats:
        b1 chat-box appears · b2 CCC · b3 CCCS+Hall · b4 Hans-sentence · b5 images-disclaimer
        · b6 the button transitions greyed→primary and becomes enabled (submit-active).
      After b6: steady-state · no auto-advance · the user reads, then clicks.
    Stage 2 — submit POSTs to /__auth (Nitro middleware validates + sets the cookie,
      then redirects to `/`). No `?just_unlocked` param; no post-submit overlay.

  prefers-reduced-motion: the inter-beat pacing collapses to instant (all 6 reveals
  appear at once · button immediately enabled).

  TODO HM: the Stage-0 background `image of magnifica` (bgImage slot below).
  TBD HM-final wording: CCC/CCCS definitions + the Hans-one-sentence (cand-1a drafts used).
-->

<template>
  <Hero height-tmp="full" content-align-y="center" content-width="short" :img-tmp="bgImage || undefined">
    <Banner transparent>
      <div class="entry-gate">
        <a class="entry-wordmark" href="/">Theater<span class="entry-wordmark-accent">pedia</span></a>

        <!-- 6-beat chat-box · appears at beat 1 · codebox styling -->
        <div v-if="beat >= 1" class="entry-chatbox" aria-live="polite">
          <p v-if="beat >= 2" class="entry-line">
            <strong>CCC</strong> — Chaos Computer Club. „Öffentliche Daten nützen, private Daten schützen.“
          </p>
          <p v-if="beat >= 3" class="entry-line">
            <strong>CCCS</strong> — Centre for Contemporary Cultural Studies, Birmingham.
            Stuart Hall: „Identity is not an essence, it is a positioning.“
          </p>
          <p v-if="beat >= 4" class="entry-line">
            Hackerethik from Hamburg, organic intellectual from Birmingham — two anchors, one practice, thirty years. — Hans Dönitz
          </p>
          <p v-if="beat >= 5" class="entry-line entry-disclaimer">
            © all images M. Farkas 2022–2026 · they show H. Dönitz and the team of dasei; used only to present this website.
          </p>
        </div>

        <form class="entry-form" method="POST" action="/__auth" novalidate @submit="onSubmit">
          <label class="entry-label" for="magnifica-password">Password</label>
          <div class="entry-row">
            <input
              id="magnifica-password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              :readonly="locked"
              required
              autofocus
              class="entry-input"
            />
            <button
              type="submit"
              class="entry-submit"
              :class="{ 'entry-submit--ready': beat >= 6 }"
              :disabled="beat < 6"
            >Enter</button>
          </div>
          <p class="entry-strip">You were invited. The password came with the email. The threshold is here — invitation, not push.</p>
          <p v-if="error" class="entry-error" role="alert">{{ error }}</p>
        </form>
      </div>
    </Banner>
  </Hero>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Hero from '@/components/Hero.vue'
import Banner from '@/components/Banner.vue'

// TODO HM: Stage-0 "image of magnifica" background. Empty → Hero renders its theme-dark cover.
const bgImage = ''

const route = useRoute()
const password = ref('')
const beat = ref(0) // 0 = pre-input · 1..6 = reveal beats (6 = button enabled / steady-state)
const locked = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

const prefersReducedMotion =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false

const error = computed<string | null>(() => (route.query.error === 'invalid' ? 'Wrong password.' : null))

// Stage 1 trigger · single reveal on full case-sensitive match of `CCCS`.
watch(password, (val) => {
    if (beat.value === 0 && val === 'CCCS') startSequence()
})

function startSequence() {
    locked.value = true
    beat.value = 1
    // 1-second break between beats (collapses to instant under reduced-motion).
    const step = prefersReducedMotion ? 0 : 1000
    for (let b = 2; b <= 6; b++) {
        timers.push(setTimeout(() => { beat.value = b }, step * (b - 1)))
    }
}

// Belt-and-suspenders: never submit before beat 6 / without the matching value.
function onSubmit(e: Event) {
    if (beat.value < 6 || password.value !== 'CCCS') e.preventDefault()
}

onUnmounted(() => timers.forEach(clearTimeout))
</script>

<style scoped>
.entry-gate {
  width: min(600px, calc(100vw - 2rem));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
}

.entry-wordmark {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  text-decoration: none;
  color: var(--color-contrast, #f4f4f4);
  letter-spacing: -0.01em;
}

.entry-wordmark-accent {
  color: var(--color-primary-bg, #ffee00);
}

/* Chat-box · codebox surface (consistent with code/pre blocks) */
.entry-chatbox {
  background: var(--color-popover-bg, #0f0f0f);
  color: var(--color-popover-contrast, #d0d0d0);
  border: 1px solid var(--color-border, rgba(255, 238, 0, 0.15));
  border-radius: 4px;
  padding: 1.25rem 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.entry-line {
  margin: 0;
  animation: entry-line-in 320ms ease forwards;
}

.entry-line strong {
  color: var(--color-primary-bg, #ffee00);
}

.entry-disclaimer {
  font-size: 0.8125rem;
  opacity: 0.75;
  font-style: italic;
}

@keyframes entry-line-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.entry-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.entry-label {
  font-size: 0.875rem;
  color: var(--color-muted-contrast, #aaa);
}

.entry-row {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.entry-input {
  flex: 1;
  font: inherit;
  font-size: 1rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--color-border, #555);
  border-radius: 4px;
  background: var(--color-input, #fff);
  color: var(--color-contrast, #1a1a1a);
  outline: none;
}

.entry-input:read-only {
  opacity: 0.85;
  cursor: default;
}

/* greyed → primary at beat 6 */
.entry-submit {
  font: inherit;
  font-weight: 700;
  padding: 0.7rem 1.5rem;
  border: 0;
  border-radius: 4px;
  background: var(--color-muted-bg, #555);
  color: var(--color-muted-contrast, #999);
  cursor: not-allowed;
  transition: background 300ms ease, color 300ms ease;
}

.entry-submit--ready {
  background: var(--color-primary-bg, #ffee00);
  color: var(--color-primary-contrast, #1a1a1a);
  cursor: pointer;
}

.entry-strip {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-muted-contrast, #aaa);
}

.entry-error {
  margin: 0.25rem 0 0;
  color: var(--color-negative-bg, #c91100);
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .entry-gate {
    width: min(400px, calc(100vw - 2rem));
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry-line {
    animation: none;
  }
  .entry-submit {
    transition: none;
  }
}
</style>
