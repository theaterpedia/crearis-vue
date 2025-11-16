<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    image: {
        id: number
        url: string
        shape_square?: string
    }
}>()

// URL parameters for manipulation
const width = ref(200)
const height = ref(200)
const fit = ref('crop')

// Computed URL with parameters
const previewUrl = computed(() => {
    const base = props.image.shape_square || props.image.url
    return `${base}?w=${width.value}&h=${height.value}&fit=${fit.value}`
})

// Expand/collapse state
const isExpanded = ref(false)

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
}
</script>

<template>
    <div class="preview-config" :class="{ 'expanded': isExpanded }">
        <div class="preview-card" @click="toggleExpand">
            <div class="preview-image-wrapper">
                <img :src="previewUrl" alt="Preview" class="preview-image" />
            </div>

            <div v-if="!isExpanded" class="preview-summary">
                <span>{{ width }}×{{ height }}</span>
                <span class="fit-badge">{{ fit }}</span>
            </div>
        </div>

        <div v-if="isExpanded" class="preview-controls">
            <div class="control-group">
                <label>Width</label>
                <input v-model.number="width" type="number" min="50" max="1200" />
            </div>
            <div class="control-group">
                <label>Height</label>
                <input v-model.number="height" type="number" min="50" max="1200" />
            </div>
            <div class="control-group">
                <label>Fit Mode</label>
                <select v-model="fit">
                    <option value="crop">Crop</option>
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                </select>
            </div>
            <div class="control-group">
                <label>URL</label>
                <input :value="previewUrl" readonly class="url-field" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.preview-config {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all var(--duration) var(--ease);
}

.preview-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    padding: 1rem;
    background: hsl(var(--color-card-bg));
    border-radius: var(--radius-medium);
    transition: background var(--duration) var(--ease);
}

.preview-card:hover {
    background: hsl(var(--color-muted-bg));
}

.preview-image-wrapper {
    width: var(--card-height-min);
    height: var(--card-height-min);
    border-radius: var(--radius-small);
    overflow: hidden;
    flex-shrink: 0;
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.preview-summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
}

.fit-badge {
    padding: 0.25rem 0.5rem;
    background: hsl(var(--color-accent-bg));
    border-radius: var(--radius-small);
    font-size: 0.75rem;
    text-transform: uppercase;
}

.preview-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background: hsl(var(--color-muted-bg));
    border-radius: var(--radius-medium);
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.control-group label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: hsl(var(--color-muted-contrast));
}

.control-group input,
.control-group select {
    padding: 0.5rem;
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-small);
    background: hsl(var(--color-card-bg));
    font-size: 0.875rem;
}

.url-field {
    font-family: monospace;
    font-size: 0.75rem;
}

.expanded .preview-card {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

@media (max-width: 768px) {
    .preview-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .preview-image-wrapper {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
    }
}
</style>
