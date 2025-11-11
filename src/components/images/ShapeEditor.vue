<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
    shape: 'square' | 'wide' | 'vertical' | 'thumb'
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

/**
 * Detect if Cloudinary URL has chained transformations
 * Pattern: .../upload/TRANSFORM_1/TRANSFORM_2/v123/...
 * Example: .../upload/c_crop,g_face,h_200,w_200/c_fill,g_auto,w_128,h_128/v123/...
 */
const hasChainedTransformations = computed(() => {
    if (props.adapter !== 'cloudinary') return false

    try {
        // Match pattern: /upload/STUFF/STUFF/vXXX/
        // If there are 2+ transformation blocks, it's chained
        const match = props.data.url.match(/\/image\/upload\/(.+?)\/v\d+\//)
        if (match) {
            const transformPath = match[1]
            // Count slashes - if more than 0, it's chained
            const slashCount = (transformPath.match(/\//g) || []).length
            return slashCount > 0
        }
    } catch (e) {
        // Invalid URL
    }
    return false
})

/**
 * Reset chained transformations to simple default transformation
 * Switches mode back to 'automation' after reset
 */
const handleChainedReset = () => {
    if (confirm('CHAINED TRANSFORMATION\n\nReset to simple transformation with default settings?\n\nThis will remove the transformation chain and switch to Auto mode.')) {
        // Extract base URL and rebuild with default settings
        try {
            const baseUrlMatch = props.data.url.match(/^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)(.+?)(\/v\d+\/.+)$/)
            if (baseUrlMatch) {
                const [, prefix, , suffix] = baseUrlMatch
                // Apply default transformation based on shape
                // thumb uses c_crop, others use c_fill
                const dimensions = getDefaultDimensions(props.shape)
                const cropMode = props.shape === 'thumb' ? 'c_crop' : 'c_fill'
                const defaultTransform = `${cropMode},g_auto,w_${dimensions.width},h_${dimensions.height}`
                const newUrl = `${prefix}${defaultTransform}${suffix}`

                emit('update', {
                    url: newUrl,
                    x: null,
                    y: null,
                    z: null
                })

                // Switch back to automation mode
                editMode.value = 'automation'
                userManualSwitch.value = false
            }
        } catch (e) {
            console.error('Failed to reset chained transformations:', e)
        }
    }
}

/**
 * Get default dimensions for shape
 */
const getDefaultDimensions = (shape: string): { width: number; height: number } => {
    switch (shape) {
        case 'square': return { width: 128, height: 128 }
        case 'thumb': return { width: 64, height: 64 }
        case 'avatar': return { width: 64, height: 64 }
        case 'wide': return { width: 336, height: 168 }
        case 'vertical': return { width: 126, height: 224 }
        default: return { width: 128, height: 128 }
    }
}

/**
 * Detect mode based on XYZ values and chained transformations
 * If chained transformations exist, force direct mode
 * If X, Y, or Z is not NULL, use XYZ mode (user has set explicit focal point)
 * If all XYZ are NULL, use Auto mode (adapter's default cropping)
 */
const detectMode = (): 'automation' | 'xyz' | 'direct' => {
    // RULE B: Force direct mode if chained transformations detected
    if (hasChainedTransformations.value) {
        console.log('[ShapeEditor] Chained transformations detected, forcing direct mode')
        return 'direct'
    }

    console.log('[ShapeEditor] Detecting mode for shape:', props.shape, 'XYZ:', { x: props.data.x, y: props.data.y, z: props.data.z })

    // Check if ANY of X, Y, or Z have values
    const hasX = props.data.x !== null && props.data.x !== undefined
    const hasY = props.data.y !== null && props.data.y !== undefined
    const hasZ = props.data.z !== null && props.data.z !== undefined

    if (hasX || hasY || hasZ) {
        console.log('[ShapeEditor] Mode detected: XYZ (has values)')
        return 'xyz'
    }
    console.log('[ShapeEditor] Mode detected: Auto')
    return 'automation'
}

const editMode = ref<'automation' | 'xyz' | 'direct'>(detectMode())

// Track if user manually switched mode (use ref for reactivity)
const userManualSwitch = ref(false)

// Computed property that watches props and auto-updates mode
const currentMode = computed(() => {
    const detectedMode = detectMode()

    // If user hasn't manually switched, use detected mode
    if (!userManualSwitch.value) {
        // Update editMode to match detected mode
        if (editMode.value !== detectedMode) {
            editMode.value = detectedMode
            console.log('[ShapeEditor] Mode auto-updated to:', detectedMode)
        }
    }

    return editMode.value
})

// Override mode switching to track user changes
const switchMode = (mode: 'automation' | 'xyz' | 'direct') => {
    userManualSwitch.value = true
    editMode.value = mode
    console.log('[ShapeEditor] User switched to:', mode)
}

// Reset manual switch flag when shape or image changes
watch(() => [props.shape, props.data.url], () => {
    userManualSwitch.value = false
    console.log('[ShapeEditor] Shape/image changed, resetting manual switch flag')
})


// Automation presets per shape + adapter
// CLOUDINARY RULES:
// - Always use c_fill OR c_crop (never omit crop mode)
// - c_crop: thumb shape (focal point automation)
// - c_fill: square, wide, vertical shapes (standard fills)
// - ImgShape.vue adds c_crop when user sets x/y/z manually
const automationPresets: Record<string, Record<string, Record<string, string>>> = {
    unsplash: {
        square: { crop: 'entropy', fit: 'crop' },
        wide: { crop: 'focalpoint', fit: 'crop' },
        vertical: { crop: 'faces', fit: 'crop' },
        thumb: { crop: 'entropy', fit: 'crop', auto: 'format' },
        avatar: { crop: 'faces', fit: 'crop', auto: 'format' }
    },
    cloudinary: {
        // c_crop for thumb (focal point automation), c_fill for others
        square: { c: 'fill', g: 'auto' },
        wide: { c: 'fill', g: 'auto' },
        vertical: { c: 'fill', g: 'auto' },
        thumb: { c: 'crop', g: 'auto' },
        avatar: { c: 'fill', g: 'faces' }
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

const updateUrl = (event: Event) => {
    const value = (event.target as HTMLTextAreaElement).value
    emit('update', { url: value || '' })
}
</script>

<template>
    <div class="shape-editor">
        <!-- Chained Transformations Warning (RULE B) -->
        <div v-if="hasChainedTransformations" class="chained-warning">
            <div class="warning-header">
                ⚠️ CHAINED TRANSFORMATION
            </div>
            <p class="warning-text">
                Directly edit URL in Direct mode OR Reset (creates simple transformation)
            </p>
            <button @click="handleChainedReset" class="btn-reset-chain">
                Reset to Simple Transformation
            </button>
        </div>

        <!-- Header: Shape + Adapter Info -->
        <div class="editor-header">
            <div class="shape-info">
                <span class="shape-name">{{ shape }}</span>
                <span class="adapter-badge">{{ adapter }}</span>
            </div>

            <!-- Mode Switcher -->
            <div class="mode-switcher">
                <button :class="{ active: currentMode === 'automation' }" @click="switchMode('automation')">
                    Auto
                </button>
                <button :class="{ active: currentMode === 'xyz' }" @click="switchMode('xyz')"
                    :disabled="hasChainedTransformations">
                    XYZ
                </button>
                <button :class="{ active: currentMode === 'direct' }" @click="switchMode('direct')">
                    Direct
                </button>
            </div>
        </div>

        <!-- Mode 1: Automation -->
        <div v-if="currentMode === 'automation'" class="editor-content">
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
        <!-- Mode 2: XYZ -->
        <div v-else-if="currentMode === 'xyz'" class="editor-content">
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
            <p class="hint">Edit transformation string, URL template, and full URL</p>

            <!-- Full URL (always displayed for all adapters) -->
            <div class="url-editor">
                <label>Full URL</label>
                <textarea :value="data.url" @input="updateUrl" rows="3" placeholder="https://..." class="url-input" />
            </div>

            <!-- Transformation String -->
            <div class="url-editor">
                <label>Transformation String (turl)</label>
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

/* Chained Transformations Warning */
.chained-warning {
    background: var(--color-warning-bg, #fff3cd);
    border: 2px solid var(--color-warning-base, #ffc107);
    border-radius: var(--radius-medium);
    padding: 1rem;
    margin-bottom: 1rem;
}

.warning-header {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-warning-contrast, #856404);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.warning-text {
    font-size: 0.8125rem;
    color: var(--color-warning-contrast, #856404);
    margin: 0 0 0.75rem 0;
}

.btn-reset-chain {
    width: 100%;
    padding: 0.625rem 1rem;
    background: var(--color-warning-base, #ffc107);
    color: var(--color-warning-contrast, #212529);
    border: none;
    border-radius: var(--radius-small);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 1rem;
}

.btn-reset-chain:hover {
    background: var(--color-warning-hover, #e0a800);
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
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    font-weight: 600;
}

.mode-switcher button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: transparent;
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

.tpar-input,
.url-input {
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
