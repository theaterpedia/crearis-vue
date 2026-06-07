<!--
  MagnificaChatbox · the typewriter codebox · reused for both Magnifica chat/letter views:
    - landing: Hans's letter to Olah (no speakers · CCC/CCCS lines accented · `instant-portion`
      reveals ~the first half at once, then types the rest word-by-word)
    - /ethnography: the Nahtod compaction-chat (speaker-turns · the system-entry pins TOP but
      types LAST — Hans did not know about these makings until after the exchange).
  The typewriter only starts once the box scrolls into view. prefers-reduced-motion → all at once.
-->

<template>
  <div ref="rootEl" class="chatbox" aria-live="polite">
    <template v-for="(entry, i) in entries" :key="i">
      <div
        v-if="rank[i] <= step"
        class="chatbox-entry"
        :class="[entry.role ? `chatbox-entry--${entry.role}` : '', { 'chatbox-entry--accent': entry.accent }]"
      >
        <p v-if="entry.speaker" class="chatbox-speaker">{{ entry.speaker }}</p>
        <p class="chatbox-line">{{ shownText(i) }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ChatEntry } from './content/chat'

const props = withDefaults(defineProps<{
  entries: ReadonlyArray<ChatEntry>
  /** Fraction of entries (in reveal-order) shown at once before the typewriter starts. */
  instantPortion?: number
}>(), { instantPortion: 0 })

const WORD_MS = 45 // word-by-word cadence
const PAUSE_MS = 320 // pause between entries

interface Tok { t?: string; br?: boolean }

// Flatten each entry's lines into word/break tokens.
const tokenCache: Tok[][] = props.entries.map((entry) => {
  const out: Tok[] = []
  entry.lines.forEach((ln, li) => {
    if (li > 0) out.push({ br: true })
    ln.split(' ').forEach((w) => out.push({ t: w }))
  })
  return out
})

// Reveal/typing order: non-pinTop entries first (in order), pinTop entries last.
const order = computed<number[]>(() => {
  const idx = props.entries.map((_, i) => i)
  return [...idx.filter((i) => !props.entries[i]!.pinTop), ...idx.filter((i) => props.entries[i]!.pinTop)]
})

// rank[arrayIndex] = position in the reveal-order.
const rank = computed<number[]>(() => {
  const r: number[] = []
  order.value.forEach((ai, pos) => (r[ai] = pos))
  return r
})

const step = ref(0) // index into order · which entry is currently typing
const typed = ref(0) // tokens revealed in the current entry
const timers: ReturnType<typeof setTimeout>[] = []
const rootEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// Build the revealed text of an entry · real spaces between words, newlines between lines.
function shownText(arrayIndex: number): string {
  const pos = rank.value[arrayIndex]!
  const toks = tokenCache[arrayIndex]!
  const slice = pos < step.value ? toks : pos === step.value ? toks.slice(0, typed.value) : []
  let out = ''
  slice.forEach((tok) => {
    if (tok.br) out = out.replace(/ $/, '') + '\n'
    else out += tok.t + ' '
  })
  return out.replace(/ $/, '')
}

function typeEntry() {
  if (step.value >= order.value.length) return
  const ai = order.value[step.value]!
  const total = tokenCache[ai]!.length
  typed.value = 0
  const tick = () => {
    if (typed.value >= total) {
      timers.push(setTimeout(() => { step.value += 1; typeEntry() }, PAUSE_MS))
      return
    }
    typed.value += 1
    timers.push(setTimeout(tick, WORD_MS))
  }
  tick()
}

function start() {
  // landing: reveal ~`instantPortion` of the entries at once, then type the remainder.
  const instant = Math.floor(order.value.length * props.instantPortion)
  step.value = instant
  typeEntry()
}

onMounted(() => {
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    step.value = order.value.length // everything revealed at once
    return
  }
  // Wait until the box is in view before the effect plays.
  if (typeof IntersectionObserver === 'undefined' || !rootEl.value) {
    start()
    return
  }
  observer = new IntersectionObserver(
    (obs) => {
      if (obs.some((o) => o.isIntersecting && o.intersectionRatio >= 0.6)) {
        observer?.disconnect()
        start()
      }
    },
    { threshold: [0.6] },
  )
  observer.observe(rootEl.value)
})

onUnmounted(() => {
  timers.forEach(clearTimeout)
  observer?.disconnect()
})
</script>

<style scoped>
.chatbox {
  background: var(--color-popover-bg, #0f0f0f);
  color: var(--color-popover-contrast, #d0d0d0);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: clamp(1.25rem, 2.5vw, 2rem);
  font-family: ui-monospace, "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  font-size: clamp(0.875rem, 1.1vw, 1rem);
  line-height: 1.65;
  min-height: 16rem;
}

.chatbox-entry {
  margin: 0 0 1rem;
}

.chatbox-entry:last-child {
  margin-bottom: 0;
}

/* speaker-turn rail (chat mode) */
.chatbox-entry--system,
.chatbox-entry--hm,
.chatbox-entry--claude {
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-border);
}

.chatbox-entry--hm { border-left-color: var(--color-primary-bg); }
.chatbox-entry--claude { border-left-color: var(--color-positive-bg); }

.chatbox-speaker {
  margin: 0 0 0.35rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted-contrast);
}

.chatbox-line {
  margin: 0;
  white-space: pre-wrap; /* preserve the spaces + line-breaks the typewriter builds */
}

/* the system instruction reads as quoted machinery */
.chatbox-entry--system .chatbox-line {
  font-style: italic;
  opacity: 0.85;
}

/* accented entries (CCC/CCCS shortcode-pointer lines on the letter) */
.chatbox-entry--accent .chatbox-line {
  color: var(--color-primary-bg);
  font-weight: 700;
}
</style>
