<!--
  ImagesView — Item-2 Variant-C nested view at /projects/:id/images.
  Bilder NavStop. A-scope entity #2 (birds-view-prominent).

  "Birds-view-prominent" — the right-rail is a thumbnail-grid overview used as
  the primary navigator. Clicking a thumbnail surfaces it in the main detail-
  area. Mock-level: 9 placeholder thumbs in 3-col grid; main shows the
  currently-selected thumb and stub metadata.

  Real cimg integration (useImageFetch / cimgRegistry) lands when graphql-
  client matures — the structure here is the consumer-shape for that.
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))

interface ThumbMock {
    id: number
    label: string
    caption: string
}

const thumbs = ref<ThumbMock[]>(
    Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        label: `IMG-${(i + 1).toString().padStart(2, '0')}`,
        caption: `Workshop-Foto ${i + 1}`,
    })),
)

const selectedId = ref<number>(1)
const selected = computed<ThumbMock | undefined>(() =>
    thumbs.value.find((t) => t.id === selectedId.value),
)

function selectThumb(id: number) {
    selectedId.value = id
}
</script>

<template>
    <div class="images-view">
        <section class="images-view__main" aria-label="Image detail">
            <header class="images-view__header">
                <h2 class="images-view__title">Images</h2>
                <p class="images-view__subtitle">
                    Selected · Projekt <code>{{ projectId }}</code>
                </p>
            </header>

            <div class="images-view__detail">
                <div class="images-view__detail-canvas" :data-selected="selected?.label">
                    <span class="images-view__detail-label">{{ selected?.label }}</span>
                </div>
                <div class="images-view__detail-meta">
                    <h3 class="images-view__detail-caption">{{ selected?.caption }}</h3>
                    <dl class="images-view__detail-fields">
                        <dt>ID</dt>
                        <dd>{{ selected?.id }}</dd>
                        <dt>Status</dt>
                        <dd>draft (mock)</dd>
                        <dt>Image-policy</dt>
                        <dd>foto-to-sketch (default for schule-project)</dd>
                    </dl>
                </div>
            </div>
        </section>

        <aside class="images-view__rail" aria-label="Birds-view thumbnails">
            <header class="images-view__rail-header">
                Birds-view <span class="images-view__rail-count">({{ thumbs.length }})</span>
            </header>
            <div class="images-view__rail-grid">
                <button v-for="thumb in thumbs" :key="thumb.id"
                    class="images-view__thumb"
                    :class="{ 'is-selected': thumb.id === selectedId }"
                    type="button"
                    :aria-pressed="thumb.id === selectedId"
                    :title="thumb.caption"
                    @click="selectThumb(thumb.id)">
                    <span class="images-view__thumb-id">{{ thumb.id }}</span>
                </button>
            </div>
            <p class="images-view__rail-hint">Click thumbnail → detail in main</p>
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

.images-view__subtitle code {
    background: var(--color-surface, #fff);
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
}

.images-view__detail {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    min-height: 0;
}

.images-view__detail-canvas {
    aspect-ratio: 16 / 10;
    background: var(--color-surface-muted, #f3f4f6);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 200ms ease;
}

.images-view__detail-label {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-text-muted, #9ca3af);
    letter-spacing: 0.05em;
}

.images-view__detail-caption {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.images-view__detail-fields {
    display: grid;
    grid-template-columns: 8rem 1fr;
    gap: 0.25rem 0.875rem;
    margin: 0;
    font-size: 0.875rem;
}

.images-view__detail-fields dt {
    color: var(--color-text-muted, #6b7280);
}

.images-view__detail-fields dd {
    margin: 0;
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

.images-view__rail-count {
    font-weight: 400;
    color: var(--color-text-muted, #6b7280);
}

.images-view__rail-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.images-view__thumb {
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
    padding: 0;
    transition: background 120ms ease, border-color 120ms ease;
}

.images-view__thumb:hover {
    background: var(--color-surface-hover, #e5e7eb);
    border-color: var(--color-text-muted, #6b7280);
}

.images-view__thumb.is-selected {
    background: var(--color-primary-bg, #1f2937);
    color: var(--color-primary-contrast, #ffffff);
    border-color: var(--color-primary-bg, #1f2937);
}

.images-view__thumb-id {
    font-weight: 600;
}

.images-view__rail-hint {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.75rem;
    font-style: italic;
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
