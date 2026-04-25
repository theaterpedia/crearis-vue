<!--
  AgendaView — Item-2 Variant-C nested view (SFR-76 A-scope).

  §12 agenda-view-mode pattern (locked):
    - Two-mode-adaptive: `#inside` (event running OR schedule clicked) vs
      outer `#main` (no event running, default)
    - Right-rail absorbs variation (birds-view ↔ props-edit ↔ post-it-interactions)
    - Main-view stays stable across mode switches

  This commit ships the §12 frame STUB only:
    - Mode-state + right-rail slot are wired
    - Line-rendering area is a placeholder — the α/β/γ pick (CC-audit pending,
      HM new-design-material in flight) will fill this region

  No data fetch yet; mocked sample-state for layout shape.
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))

// §12 mode-state. Currently mocked; real driver = "is there a running event for this project?"
type AgendaMode = 'main' | 'inside'
const mode = ref<AgendaMode>('main')

// Mock-state: did user click into the schedule? Drives mode switch.
const isInsideAgenda = computed(() => mode.value === 'inside')

function enterInside() { mode.value = 'inside' }
function leaveInside() { mode.value = 'main' }
</script>

<template>
    <div class="agenda-view" :class="{ 'is-inside': isInsideAgenda }">
        <section class="agenda-view__main" aria-label="Agenda main view">
            <div class="agenda-view__header">
                <h2 class="agenda-view__title">Agenda</h2>
                <div class="agenda-view__mode-toggle" role="group" aria-label="Agenda mode">
                    <button :class="{ 'is-active': !isInsideAgenda }" @click="leaveInside" type="button">
                        Outer (#main)
                    </button>
                    <button :class="{ 'is-active': isInsideAgenda }" @click="enterInside" type="button">
                        Inside (#inside)
                    </button>
                </div>
            </div>

            <div class="agenda-view__line-area" data-stub="agenda-line-rendering">
                <p class="agenda-view__placeholder">
                    <strong>Line-rendering placeholder.</strong> α / β / γ pick pending (HM design-material in flight).
                    Mode: <code>{{ mode }}</code> · Project: <code>{{ projectId }}</code>.
                </p>
                <p class="agenda-view__hint">
                    When a variant lands, the area below populates with agenda-lines (compact + expanded).
                    The §12 frame holds during mode-switches — main-view does not jitter.
                </p>
            </div>
        </section>

        <aside class="agenda-view__rail" aria-label="Agenda right-rail">
            <header class="agenda-view__rail-header">
                <span v-if="!isInsideAgenda">Birds-view (outer)</span>
                <span v-else>Props · Post-its (inside)</span>
            </header>
            <div class="agenda-view__rail-content">
                <p class="agenda-view__rail-stub">
                    <em>Right-rail content swaps with mode per §12.</em>
                </p>
                <ul class="agenda-view__rail-list">
                    <li v-if="!isInsideAgenda">VSCode-style schedule outline</li>
                    <li v-if="!isInsideAgenda">Click a line → enters #inside</li>
                    <li v-if="isInsideAgenda">Selected-line props panel</li>
                    <li v-if="isInsideAgenda">Post-it interactions</li>
                </ul>
            </div>
        </aside>
    </div>
</template>

<style scoped>
.agenda-view {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.25rem;
    padding: 1.25rem;
    flex: 1;
    min-height: 0;
}

.agenda-view__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
}

.agenda-view__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.agenda-view__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.agenda-view__mode-toggle {
    display: inline-flex;
    gap: 0.25rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    padding: 0.125rem;
}

.agenda-view__mode-toggle button {
    padding: 0.375rem 0.75rem;
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    cursor: pointer;
    border-radius: 0.25rem;
    color: var(--color-text-muted, #6b7280);
}

.agenda-view__mode-toggle button.is-active {
    background: var(--color-primary-bg, #1f2937);
    color: var(--color-primary-contrast, #ffffff);
}

.agenda-view__line-area {
    border: 1px dashed var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1.25rem;
    flex: 1;
    background: var(--color-surface-muted, #f9fafb);
}

.agenda-view__placeholder code {
    background: var(--color-surface, #fff);
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.agenda-view__hint {
    margin-top: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.agenda-view__rail {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--color-border, #e5e7eb);
    padding-left: 1rem;
    min-height: 0;
}

.agenda-view__rail-header {
    font-weight: 600;
    color: var(--color-text, #111827);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.agenda-view__rail-stub {
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.agenda-view__rail-list {
    list-style: disc;
    padding-left: 1.25rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.8125rem;
}

@media (max-width: 768px) {
    .agenda-view {
        grid-template-columns: 1fr;
    }

    .agenda-view__rail {
        border-left: none;
        border-top: 1px solid var(--color-border, #e5e7eb);
        padding-left: 0;
        padding-top: 1rem;
    }
}
</style>
