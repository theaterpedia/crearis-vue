<!--
  TopicsView — Item-2 Variant-C nested view at /projects/:id/topics.
  Posts NavStop. A-scope entity #1 (post-its-prominent).

  Stub-content for first cut. Real post-list integration + fpostit content-
  embedded post-its land in a follow-up commit per A-scope brief §1.
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))
</script>

<template>
    <div class="topics-view">
        <section class="topics-view__main" aria-label="Topics main view">
            <header class="topics-view__header">
                <h2 class="topics-view__title">Topics</h2>
                <p class="topics-view__subtitle">Posts mit eingebetteten Post-its</p>
            </header>
            <div class="topics-view__placeholder" data-stub="topics-list">
                <p>Post-list (stub) for project <code>{{ projectId }}</code>.</p>
                <p class="topics-view__hint">
                    Post-its appear inline within post-content (fpostit embed-routes:
                    programmatic / HTML-attr / markdown shortcode) — not as a separate panel.
                </p>
            </div>
        </section>

        <aside class="topics-view__rail" aria-label="Topics right-rail">
            <header class="topics-view__rail-header">Post-its activity</header>
            <p class="topics-view__rail-stub">
                <em>Recent post-it interactions across this project's posts.</em>
            </p>
        </aside>
    </div>
</template>

<style scoped>
.topics-view {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.25rem;
    padding: 1.25rem;
    flex: 1;
    min-height: 0;
}

.topics-view__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
}

.topics-view__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.topics-view__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.topics-view__subtitle {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.topics-view__placeholder {
    border: 1px dashed var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1.25rem;
    background: var(--color-surface-muted, #f9fafb);
}

.topics-view__placeholder code {
    background: var(--color-surface, #fff);
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.topics-view__hint {
    margin-top: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.topics-view__rail {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--color-border, #e5e7eb);
    padding-left: 1rem;
}

.topics-view__rail-header {
    font-weight: 600;
    color: var(--color-text, #111827);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.topics-view__rail-stub {
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

@media (max-width: 768px) {
    .topics-view {
        grid-template-columns: 1fr;
    }

    .topics-view__rail {
        border-left: none;
        border-top: 1px solid var(--color-border, #e5e7eb);
        padding-left: 0;
        padding-top: 1rem;
    }
}
</style>
