<!--
  MagnificaChatbox · the typewriter codebox · reused for both Magnifica chat/letter views:
    - landing: Hans's letter to Olah (no speakers · CCC/CCCS lines accented)
    - /ethnography: the Nahtod compaction-chat (speaker-turns · the system-entry pins TOP
      but types LAST — Hans did not know about these makings until after the exchange).
  Entries type word-by-word in reveal-order (pinTop entries last); they render in array
  order (pinTop at top). Non-interactive. prefers-reduced-motion → everything at once.
-->

<template>
  <div class="chatbox" aria-live="polite">
    <template v-for="(entry, i) in entries" :key="i">
      <div
        v-if="rank[i] <= step"
        class="chatbox-entry"
        :class="[entry.role ? `chatbox-entry--${entry.role}` : '', { 'chatbox-entry--accent': entry.accent }]"
      >
        <p v-if="entry.speaker" class="chatbox-speaker">{{ entry.speaker }}</p>
        <p class="chatbox-line">
          <template v-for="(tok, j) in shownTokens(i)" :key="j">
            <br v-if="tok.br" />
            <template v-else>{{ tok.t }} </template>
          </template>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ChatEntry } from './content/chat'

const props = defineProps<{ entries: ReadonlyArray<ChatEntry> }>()

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

function shownTokens(arrayIndex: number): Tok[] {
  const pos = rank.value[arrayIndex]!
  if (pos < step.value) return tokenCache[arrayIndex]! // fully typed
  if (pos === step.value) return tokenCache[arrayIndex]!.slice(0, typed.value) // typing
  return []
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

onMounted(() => {
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    step.value = order.value.length // all entries revealed (pos < step) → full
    return
  }
  typeEntry()
})

onUnmounted(() => timers.forEach(clearTimeout))
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
