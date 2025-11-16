<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
    baseUrl: string
    initialX?: number
    initialY?: number
    initialZ?: number
}>()

// Parameters for URL manipulation
const x = ref(props.initialX || 400)
const y = ref(props.initialY || 300)
const z = ref(props.initialZ || 100)

// Computed preview URL
const previewUrl = computed(() => {
    const url = new URL(props.baseUrl)
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('w', x.value.toString())
    url.searchParams.set('h', y.value.toString())
    // z can be used for quality or other params in the future
    return url.toString()
})

// Image loading state
const imageLoading = ref(false)
const imageKey = ref(0)

// Debounced reload
let reloadTimeout: NodeJS.Timeout | null = null

const reloadImage = () => {
    if (reloadTimeout) {
        clearTimeout(reloadTimeout)
    }

    reloadTimeout = setTimeout(() => {
        imageLoading.value = true
        imageKey.value++

        // Simulate loading
        setTimeout(() => {
            imageLoading.value = false
        }, 500)
    }, 300)
}

// Watch parameters for changes
watch([x, y, z], () => {
    reloadImage()
})

// Reset to defaults
const reset = () => {
    x.value = props.initialX || 400
    y.value = props.initialY || 300
    z.value = props.initialZ || 100
}

// Copy URL to clipboard
const copyUrl = async () => {
    try {
        await navigator.clipboard.writeText(previewUrl.value)
        alert('URL copied to clipboard!')
    } catch (err) {
        console.error('Failed to copy URL:', err)
    }
}
</script>

<template>
    <div class="unsplash-adapter">
        <div class="adapter-preview">
            <div v-if="imageLoading" class="loading-overlay">
                <span class="loading-spinner"></span>
            </div>
            <img :key="imageKey" :src="previewUrl" alt="Unsplash preview" class="preview-image"
                @load="imageLoading = false" />
        </div>

        <div class="adapter-controls">
            <div class="control-grid">
                <div class="control-field">
                    <label for="width-input">Width (x)</label>
                    <input id="width-input" v-model.number="x" type="number" min="50" max="2000" step="10"
                        class="control-input" />
                </div>

                <div class="control-field">
                    <label for="height-input">Height (y)</label>
                    <input id="height-input" v-model.number="y" type="number" min="50" max="2000" step="10"
                        class="control-input" />
                </div>

                <div class="control-field">
                    <label for="quality-input">Quality (z)</label>
                    <input id="quality-input" v-model.number="z" type="number" min="1" max="100" step="1"
                        class="control-input" />
                </div>
            </div>

            <div class="adapter-actions">
                <button class="btn-action" @click="reset">
                    Reset
                </button>
                <button class="btn-action primary" @click="copyUrl">
                    Copy URL
                </button>
            </div>

            <div class="url-display">
                <input :value="previewUrl" readonly class="url-field" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.unsplash-adapter {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: hsl(var(--color-card-bg));
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-medium);
    padding: 1rem;
}

.adapter-preview {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-small);
    overflow: hidden;
    background: hsl(var(--color-muted-bg));
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity var(--duration) var(--ease);
}

.loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsla(var(--color-card-bg), 0.8);
    backdrop-filter: blur(4px);
    z-index: 1;
}

.loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid hsl(var(--color-muted-bg));
    border-top-color: hsl(var(--color-primary-base));
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.adapter-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.control-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
}

.control-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.control-field label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: hsl(var(--color-muted-contrast));
}

.control-input {
    padding: 0.5rem;
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-small);
    background: hsl(var(--color-card-bg));
    font-size: 0.875rem;
    font-family: monospace;
}

.control-input:focus {
    outline: none;
    border-color: hsl(var(--color-primary-base));
}

.adapter-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-action {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-card-bg));
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-action:hover {
    background: hsl(var(--color-muted-bg));
}

.btn-action.primary {
    background: hsl(var(--color-primary-base));
    color: hsl(var(--color-primary-contrast));
    border-color: hsl(var(--color-primary-base));
}

.btn-action.primary:hover {
    opacity: 0.9;
}

.url-display {
    width: 100%;
}

.url-field {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-small);
    background: hsl(var(--color-muted-bg));
    font-size: 0.75rem;
    font-family: monospace;
    color: hsl(var(--color-muted-contrast));
}

@media (max-width: 768px) {
    .control-grid {
        grid-template-columns: 1fr;
    }
}
</style>
