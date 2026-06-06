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

  Stage-0 background: the HM-provided encyclica image (bgImage below).
  TBD HM-final wording: CCC/CCCS definitions + the Hans-one-sentence (cand-1a drafts used).
-->

<template>
  <!-- HM 2026-06-06: prompt height at 62% of the full-viewport hero (100vh → 62vh). -->
  <Hero height-tmp="full" content-align-y="center" content-width="short" :img-tmp="bgImage || undefined" :style="{ minHeight: '62vh' }">
    <Banner transparent>
      <div class="entry-gate">
        <a class="entry-wordmark" href="/">Theater<span class="entry-wordmark-accent">pedia</span></a>

        <!-- 6-beat chat-box · fixed square · word-by-word typewriter · codebox styling -->
        <div v-if="beat >= 1" class="entry-chatbox" aria-live="polite">
          <template v-for="n in contentBeats" :key="n">
            <p v-if="beat >= n" class="entry-line" :class="{ 'entry-disclaimer': n === 5 }">
              <span v-for="(w, i) in shownWords(n)" :key="i" :class="{ 'entry-accent': w.a }">{{ w.t }} </span>
            </p>
          </template>
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

// Stage-0 background · HM-provided 2026-06-06 (relay): the encyclica image
// (Pope Leo · Chris Olah, Vatican). Empty → Hero renders its theme-dark cover.
const bgImage = 'https://res.cloudinary.com/little-papillon/image/upload/v1780762597/crearis/alamy_pope-leo_chris-olah.jpg'

const route = useRoute()
const password = ref('')
const beat = ref(0) // 0 = pre-input · 1..6 = reveal beats (6 = button enabled / steady-state)
const typed = ref(0) // words revealed so far in the currently-typing content-beat
const locked = ref(false)
const timers: ReturnType<typeof setTimeout>[] = []

const WORD_MS = 70 // word-by-word typewriter cadence
const BREAK_MS = 1000 // 1-second break between beats

const prefersReducedMotion =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false

const error = computed<string | null>(() => (route.query.error === 'invalid' ? 'Wrong password.' : null))

// Content beats (2-5) as accent-aware word tokens · `a` marks primary-accent words.
// TBD HM-final wording for CCC/CCCS definitions (O7); cand-1a drafts in place.
interface Word { t: string; a: boolean }
const contentBeats = [2, 3, 4, 5] as const
function tok(line: string, accents: string[]): Word[] {
    return line.split(' ').map((t) => ({ t, a: accents.includes(t) }))
}
const beatWords: Record<number, Word[]> = {
    2: tok('CCC — Chaos Computer Club. „Öffentliche Daten nützen, private Daten schützen.“', ['CCC']),
    3: tok('CCCS — Centre for Contemporary Cultural Studies, Birmingham. Stuart Hall: „Identity is not an essence, it is a positioning.“', ['CCCS']),
    4: tok('Hackerethik from Hamburg, organic intellectual from Birmingham — two anchors, one practice, thirty years. — Hans Dönitz', ['Hans', 'Dönitz']),
    5: tok('© all images M. Farkas 2022–2026 · they show H. Dönitz and the team of dasei; used only to present this website.', []),
}

/** Words to render for content-beat `n`: full once passed, slice while typing, none before. */
function shownWords(n: number): Word[] {
    const words = beatWords[n] ?? []
    if (beat.value > n) return words
    if (beat.value === n) return words.slice(0, typed.value)
    return []
}

function schedule(fn: () => void, ms: number) {
    timers.push(setTimeout(fn, ms))
}

// Stage 1 trigger · single reveal on full case-sensitive match of `CCCS`.
watch(password, (val) => {
    if (beat.value === 0 && val === 'CCCS') startSequence()
})

function startSequence() {
    locked.value = true
    beat.value = 1 // chat-box appears (empty square)
    schedule(() => playBeat(2), BREAK_MS)
}

function playBeat(n: number) {
    beat.value = n
    if (n > 5) return // beat 6: button greyed→primary + enabled · steady-state (no auto-advance)
    typed.value = 0
    const total = (beatWords[n] ?? []).length
    if (prefersReducedMotion) {
        typed.value = total
        schedule(() => playBeat(n + 1), 0)
        return
    }
    typeWord(n, total)
}

function typeWord(n: number, total: number) {
    if (typed.value >= total) {
        schedule(() => playBeat(n + 1), BREAK_MS) // 1s break, then next beat
        return
    }
    schedule(() => {
        typed.value += 1
        typeWord(n, total)
    }, WORD_MS)
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

/* Chat-box · codebox surface (consistent with code/pre blocks) · fixed square
   (height = width) from Beat 1 · does not grow line-by-line. */
.entry-chatbox {
  background: var(--color-popover-bg, #0f0f0f);
  color: var(--color-popover-contrast, #d0d0d0);
  border: 1px solid var(--color-border, rgba(255, 238, 0, 0.15));
  border-radius: 4px;
  padding: 1.25rem 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  aspect-ratio: 1 / 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.entry-line {
  margin: 0;
}

/* Primary-accent words (CCC · CCCS · Hans Dönitz) revealed by the typewriter. */
.entry-accent {
  color: var(--color-primary-bg, #ffee00);
  font-weight: 700;
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
