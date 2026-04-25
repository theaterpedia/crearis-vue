<!--
  ImagesView — Item-2 Variant-C nested view at /projects/:id/images.
  Bilder NavStop. A-scope entity #2 (birds-view-prominent).

  Stub-content for first cut. Real thumbnail-grid + selected-image-detail
  + cimg integration land in a follow-up commit per A-scope brief §1.

  "Birds-view-prominent" means the right-rail is a thumbnail-grid overview
  used for direct visual navigation — not a metadata-edit panel.
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))
</script>

<template>
    <div class="images-view">
        <section class="images-view__main" aria-label="Images main view">
            <header class="images-view__header">
                <h2 class="images-view__title">Images</h2>
                <p class="images-view__subtitle">Selected image · detail-area</p>
            </header>
            <div class="images-view__placeholder" data-stub="images-detail">
                <p>Selected image preview (stub) for project <code>{{ projectId }}</code>.</p>
                <p class="images-view__hint">
                    Click a thumbnail in the right-rail birds-view to land in main.
                </p>
            </div>
        </section>

        <aside class="images-view__rail" aria-label="Images birds-view">
            <header class="images-view__rail-header">Birds-view thumbnails</header>
            <div class="images-view__rail-grid">
                <div v-for="i in 9" :key="i" class="images-view__thumb-stub" :title="`Thumb ${i}`">
                    <span>{{ i }}</span>
                </div>
            </div>
        </aside>
    </div>
</template>

<style scoped>
.images-view {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.25rem;
    padding: 1.25rem;
    flex: 1;
    min-height: 0;
}

.images-view__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
}

.images-view__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.images-view__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.images-view__subtitle {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.images-view__placeholder {
    border: 1px dashed var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1.25rem;
    background: var(--color-surface-muted, #f9fafb);
    flex: 1;
}

.images-view__placeholder code {
    background: var(--color-surface, #fff);
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.images-view__hint {
    margin-top: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.images-view__rail {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-left: 1px solid var(--color-border, #e5e7eb);
    padding-left: 1rem;
}

.images-view__rail-header {
    font-weight: 600;
    color: var(--color-text, #111827);
    font-size: 0.875rem;
}

.images-view__rail-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.images-view__thumb-stub {
    aspect-ratio: 1;
    background: var(--color-surface-muted, #f3f4f6);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    cursor: pointer;
    transition: background 120ms ease, border-color 120ms ease;
}

.images-view__thumb-stub:hover {
    background: var(--color-surface-hover, #e5e7eb);
    border-color: var(--color-text-muted, #6b7280);
}

@media (max-width: 768px) {
    .images-view {
        grid-template-columns: 1fr;
    }

    .images-view__rail {
        border-left: none;
        border-top: 1px solid var(--color-border, #e5e7eb);
        padding-left: 0;
        padding-top: 1rem;
    }
}
</style>
