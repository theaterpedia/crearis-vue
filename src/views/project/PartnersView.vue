<!--
  PartnersView — Item-2 Variant-C nested view at /projects/:id/partners.
  Akteure NavStop. Stub only — partners is deferred to Wave-2 with Rubicon-UI
  (Item-5) per CV-BRIEF §1 ("trust-anchor-architectural; more design-discussion-needed").
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))
</script>

<template>
    <div class="partners-view">
        <section class="partners-view__main">
            <header class="partners-view__header">
                <h2 class="partners-view__title">Partners</h2>
                <p class="partners-view__subtitle">Akteure · trust-anchor + team</p>
            </header>
            <div class="partners-view__placeholder">
                <p>Partners view (stub) for project <code>{{ projectId }}</code>.</p>
                <p class="partners-view__hint">
                    Deferred to Wave-2 with Rubicon-UI per CV-BRIEF §1 — Kontaktlehrerin
                    trust-anchor + team-grid land alongside Item-5.
                </p>
            </div>
        </section>
    </div>
</template>

<style scoped>
.partners-view {
    padding: 1.25rem;
    flex: 1;
}

.partners-view__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 56rem;
}

.partners-view__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.partners-view__subtitle {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.partners-view__placeholder {
    border: 1px dashed var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1.25rem;
    background: var(--color-surface-muted, #f9fafb);
}

.partners-view__placeholder code {
    background: var(--color-surface, #fff);
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.partners-view__hint {
    margin-top: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}
</style>
