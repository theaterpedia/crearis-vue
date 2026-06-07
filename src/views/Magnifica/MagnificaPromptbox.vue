<!--
  MagnificaPromptbox · the post-auth codebox (the 2022 hero's youtube-player slot).
  Hans's letter appears word-by-word (the typewriter that used to live in the gate's
  6-beat · now relocated here). Non-interactive. Codebox styling (popover surface).
  Replaces the landing post-its — Olah reads a letter, in the register he's used to.
  prefers-reduced-motion → the full text appears at once.
-->

<template>
  <div class="promptbox" aria-label="A letter to Anthropic" aria-live="polite">
    <template v-for="(line, i) in lines" :key="i">
      <p v-if="i < shownLines" class="promptbox-line" :class="{ 'promptbox-line--accent': line.accent }">
        <template v-for="(w, j) in wordsFor(i)" :key="j">{{ w }} </template>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { PromptboxLine } from './content/landing'

const props = defineProps<{ lines: ReadonlyArray<PromptboxLine> }>()

const WORD_MS = 45 // word-by-word cadence (a touch quicker than the gate · it's a longer text)

// How many lines are visible, and how many words of the currently-typing line.
const shownLines = ref(0)
const typedWords = ref(0)
const timers: ReturnType<typeof setTimeout>[] = []

const wordCache = props.lines.map((l) => l.text.split(' '))

function wordsFor(i: number): string[] {
    if (i < shownLines.value - 1) return wordCache[i]! // fully revealed line
    if (i === shownLines.value - 1) return wordCache[i]!.slice(0, typedWords.value) // typing line
    return []
}

function typeLine(i: number) {
    if (i >= props.lines.length) return
    shownLines.value = i + 1
    typedWords.value = 0
    const total = wordCache[i]!.length
    const step = () => {
        if (typedWords.value >= total) {
            timers.push(setTimeout(() => typeLine(i + 1), WORD_MS * 6)) // small inter-line pause
            return
        }
        typedWords.value += 1
        timers.push(setTimeout(step, WORD_MS))
    }
    step()
}

onMounted(() => {
    const reduce =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
        shownLines.value = props.lines.length
        typedWords.value = Number.MAX_SAFE_INTEGER
        return
    }
    typeLine(0)
})

onUnmounted(() => timers.forEach(clearTimeout))
</script>

<style scoped>
.promptbox {
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

.promptbox-line {
  margin: 0 0 1rem;
}

.promptbox-line:last-child {
  margin-bottom: 0;
}

/* the two shortcode-pointer lines (CCC · CCCS) */
.promptbox-line--accent {
  color: var(--color-primary-bg);
  font-weight: 700;
}
</style>
