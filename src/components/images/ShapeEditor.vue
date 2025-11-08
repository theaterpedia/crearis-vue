<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
    shape: 'square' | 'wide' | 'vertical' | 'thumb' | 'avatar'
    variant?: string
    adapter: 'unsplash' | 'cloudinary' | 'vimeo' | 'external'
    data: {
        x?: number | null
        y?: number | null
        z?: number | null
        url: string
        tpar?: string | null
    }
}

const props = defineProps<Props>()
const emit = defineEmits<{
    update: [data: Partial<Props['data']>]
    preview: []
    reset: []
}>()

const editMode = ref<'automation' | 'xyz' | 'direct'>('automation')

// Automation presets per shape + adapter
const automationPresets: Record<string, Record<string, Record<string, string>>> = {
    unsplash: {
        square: { crop: 'entropy', fit: 'crop' },
        wide: { crop: 'focalpoint', fit: 'crop' },
        vertical: { crop: 'faces', fit: 'crop' },
        thumb: { crop: 'entropy', fit: 'crop', auto: 'format' },
        avatar: { crop: 'faces', fit: 'crop', auto: 'format' }
    },
    cloudinary: {
        square: { gravity: 'auto', crop: 'fill' },
        wide: { gravity: 'face', crop: 'fill' },
        vertical: { gravity: 'faces', crop: 'fill' },
        thumb: { gravity: 'auto', crop: 'thumb' },
        avatar: { gravity: 'faces', crop: 'thumb' }
    }
}

// Get available params for current adapter
const availableParams = computed(() => {
    if (props.adapter === 'unsplash') {
        return ['w', 'h', 'fit', 'crop', 'fp-x', 'fp-y', 'fp-z', 'auto', 'q']
    } else if (props.adapter === 'cloudinary') {
        return ['w', 'h', 'c', 'g', 'x', 'y', 'z', 'q', 'f']
    }
    return []
})

// Parse transformation string from URL
const transformationString = computed(() => {
    try {
        if (props.adapter === 'unsplash') {
            const url = new URL(props.data.url)
            return url.search.substring(1) // Remove leading '?'
        } else if (props.adapter === 'cloudinary') {
            const match = props.data.url.match(/\/image\/upload\/([^/]+)\//)
            return match ? match[1] : ''
        }
    } catch (e) {
        // Invalid URL
    }
    return ''
})

// Update transformation
const updateTransformation = (newTransform: string) => {
    try {
        let newUrl = props.data.url

        if (props.adapter === 'unsplash') {
            const url = new URL(props.data.url)
            newUrl = `${url.origin}${url.pathname}?${newTransform}`
        } else if (props.adapter === 'cloudinary') {
            newUrl = props.data.url.replace(
                /\/image\/upload\/[^/]+\//,
                `/image/upload/${newTransform}/`
            )
        }

        emit('update', { url: newUrl })
    } catch (e) {
        // Invalid URL transformation
    }
}

// Get current preset for shape
const currentPreset = computed(() => {
    return automationPresets[props.adapter]?.[props.shape] || {}
})

// XYZ input handlers
const updateX = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update', { x: value ? parseInt(value) : null })
}

const updateY = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update', { y: value ? parseInt(value) : null })
}

const updateZ = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    emit('update', { z: value ? parseInt(value) : null })
}

const updateTpar = (event: Event) => {
    const value = (event.target as HTMLTextAreaElement).value
    emit('update', { tpar: value || null })
}
</script>

<template>
    <div class="shape-editor">
        <!-- Header: Shape + Adapter Info -->
        <div class="editor-header">
            <div class="shape-info">
                <span class="shape-name">{{ shape }}<span v-if="variant" class="variant">:{{ variant }}</span></span>
                <span class="adapter-badge">{{ adapter }}</span>
            </div>

            <!-- Mode Switcher -->
            <div class="mode-switcher">
                <button :class="{ active: editMode === 'automation' }" @click="editMode = 'automation'">
                    Auto
                </button>
                <button :class="{ active: editMode === 'xyz' }" @click="editMode = 'xyz'">
                    XYZ
                </button>
                <button :class="{ active: editMode === 'direct' }" @click="editMode = 'direct'">
                    Direct
                </button>
            </div>
        </div>

        <!-- Mode 1: Automation -->
        <div v-if="editMode === 'automation'" class="editor-content">
            <h5>Shape-based Automation</h5>
            <p class="hint">Optimized settings for {{ shape }} on {{ adapter }}</p>

            <div v-if="Object.keys(currentPreset).length > 0" class="preset-info">
                <strong>Applied Params:</strong>
                <ul>
                    <li v-for="(value, key) in currentPreset" :key="key">
                        <code>{{ key }}</code>: {{ value }}
                    </li>
                </ul>
            </div>
            <div v-else class="no-preset">
                <p>No automation preset available for this combination.</p>
            </div>

            <div class="action-buttons">
                <button @click="$emit('preview')" class="btn-preview">
                    Apply & Preview
                </button>
                <button @click="$emit('reset')" class="btn-reset">
                    Reset
                </button>
            </div>
        </div>

        <!-- Mode 2: XYZ Input -->
        <div v-else-if="editMode === 'xyz'" class="editor-content">
            <h5>Manual Parameters</h5>
            <p class="hint">Focal point (X/Y) and zoom (Z) adjustments</p>

            <div class="param-inputs">
                <div class="param-field">
                    <label>X (horizontal %)</label>
                    <input type="number" :value="data.x ?? ''" @input="updateX" min="0" max="100" placeholder="50" />
                </div>

                <div class="param-field">
                    <label>Y (vertical %)</label>
                    <input type="number" :value="data.y ?? ''" @input="updateY" min="0" max="100" placeholder="50" />
                </div>

                <div class="param-field">
                    <label>Z (zoom %)</label>
                    <input type="number" :value="data.z ?? ''" @input="updateZ" min="0" max="100" placeholder="0" />
                </div>
            </div>

            <div class="action-buttons">
                <button @click="$emit('preview')" class="btn-preview">
                    Preview with XYZ
                </button>
                <button @click="$emit('reset')" class="btn-reset">
                    Reset
                </button>
            </div>
        </div>

        <!-- Mode 3: Direct URL Edit -->
        <div v-else class="editor-content">
            <h5>Direct Edit</h5>
            <p class="hint">Edit transformation string and URL template</p>

            <!-- Transformation String -->
            <div class="url-editor">
                <label>Transformation String</label>
                <div class="url-parts">
                    <span class="url-prefix dimmed">
                        {{ adapter === 'unsplash' ? '...?' : '.../upload/' }}
                    </span>
                    <input type="text" :value="transformationString"
                        @input="updateTransformation(($event.target as HTMLInputElement).value)"
                        placeholder="w=336&h=168&fit=crop" class="transform-input" />
                    <span class="url-suffix dimmed">
                        {{ adapter === 'unsplash' ? '' : '/v123/...' }}
                    </span>
                </div>
            </div>

            <!-- tpar (URL Template) -->
            <div class="url-editor">
                <label>tpar (URL Template)</label>
                <textarea :value="data.tpar ?? ''" @input="updateTpar" rows="3" placeholder="https://.../{turl}/..."
                    class="tpar-input" />
            </div>

            <!-- Available Params Reference -->
            <div v-if="availableParams.length > 0" class="params-reference">
                <strong>Available Params:</strong>
                <div class="param-chips">
                    <span v-for="param in availableParams" :key="param" class="param-chip">
                        {{ param }}
                    </span>
                </div>
            </div>

            <div class="action-buttons">
                <button @click="$emit('preview')" class="btn-preview">
                    Preview Changes
                </button>
                <button @click="$emit('reset')" class="btn-reset">
                    Reset
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.shape-editor {
    background: var(--color-card-bg);
    border-radius: var(--radius-medium);
    padding: 1rem;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border);
}

.shape-info {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.shape-name {
    font-family: var(--headings);
    font-size: 1rem;
    font-weight: 600;
    text-transform: capitalize;
}

.variant {
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--color-text-dimmed);
}

.adapter-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border-radius: var(--radius-small);
}

.mode-switcher {
    display: flex;
    gap: 0.25rem;
    background: var(--color-muted-bg);
    padding: 0.25rem;
    border-radius: var(--radius-small);
}

.mode-switcher button {
    padding: 0.375rem 0.75rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    border-radius: var(--radius-small);
    transition: background 0.2s;
}

.mode-switcher button.active {
    background: var(--color-card-bg);
    font-weight: 600;
}

.editor-content {
    padding-top: 0.5rem;
}

.editor-content h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
}

.hint {
    font-size: 0.75rem;
    color: var(--color-text-dimmed);
    margin-bottom: 1rem;
}

.preset-info {
    background: var(--color-muted-bg);
    padding: 0.75rem;
    border-radius: var(--radius-small);
    margin-bottom: 1rem;
}

.preset-info strong {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-dimmed);
}

.preset-info ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0 0;
}

.preset-info li {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
}

.preset-info code {
    background: var(--color-card-bg);
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-small);
    font-family: var(--mono);
    font-size: 0.8125rem;
}

.no-preset {
    background: var(--color-muted-bg);
    padding: 1rem;
    border-radius: var(--radius-small);
    text-align: center;
    margin-bottom: 1rem;
}

.no-preset p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-dimmed);
}

.param-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.param-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.param-field label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-dimmed);
}

.param-field input {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    font-size: 0.875rem;
    font-family: var(--mono);
}

.url-editor {
    margin-bottom: 1rem;
}

.url-editor label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-dimmed);
    margin-bottom: 0.5rem;
}

.url-parts {
    display: flex;
    align-items: center;
    background: var(--color-muted-bg);
    border-radius: var(--radius-small);
    padding: 0.5rem;
    gap: 0.25rem;
}

.url-prefix,
.url-suffix {
    font-size: 0.75rem;
    font-family: var(--mono);
    white-space: nowrap;
}

.dimmed {
    color: var(--color-text-dimmed);
}

.transform-input {
    flex: 1;
    border: none;
    background: var(--color-card-bg);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-small);
    font-family: var(--mono);
    font-size: 0.8125rem;
}

.tpar-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-small);
    background: var(--color-card-bg);
    font-family: var(--mono);
    font-size: 0.8125rem;
    resize: vertical;
}

.params-reference {
    background: var(--color-muted-bg);
    padding: 0.75rem;
    border-radius: var(--radius-small);
    margin-bottom: 1rem;
}

.params-reference strong {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-dimmed);
    display: block;
    margin-bottom: 0.5rem;
}

.param-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
}

.param-chip {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-small);
    font-family: var(--mono);
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.btn-preview,
.btn-reset {
    flex: 1;
    padding: 0.625rem 1rem;
    border: none;
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-preview {
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
}

.btn-preview:hover {
    background: var(--color-primary-hover);
}

.btn-reset {
    background: var(--color-muted-bg);
    color: var(--color-text-base);
}

.btn-reset:hover {
    background: var(--color-border);
}
</style>
