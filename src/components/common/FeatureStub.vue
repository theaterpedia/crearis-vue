<template>
    <div class="feature-stub" :class="[`stub-${variant}`, { 'stub-compact': compact }]">
        <div class="stub-icon">
            <slot name="icon">
                <span class="default-icon">🚧</span>
            </slot>
        </div>

        <div class="stub-content">
            <h4 v-if="title" class="stub-title">{{ title }}</h4>
            <p class="stub-message">
                <slot>
                    {{ message || defaultMessage }}
                </slot>
            </p>

            <div v-if="targetVersion" class="stub-version">
                <span class="version-badge">v{{ targetVersion }}</span>
                <span v-if="mode" class="mode-badge">{{ modeLabel }}</span>
            </div>
        </div>

        <slot name="action">
            <button v-if="showLearnMore" class="stub-action" @click="$emit('learnMore')">
                Mehr erfahren
            </button>
        </slot>
    </div>
</template>

<script setup lang="ts">
/**
 * FeatureStub Component
 * 
 * Placeholder for features that are coming in future versions.
 * Used with useAlphaFlags to show what's coming.
 * 
 * Usage:
 * ```vue
 * <FeatureStub 
 *   v-if="!enabled"
 *   title="Workitems" 
 *   alpha="v0.5"
 *   message="Task management coming soon"
 * />
 * ```
 */
import { computed } from 'vue'
import { getTargetVersion } from '@/composables/useAlphaFlags'

const props = withDefaults(defineProps<{
    /** Feature title */
    title?: string
    /** Custom message (overrides default) */
    message?: string
    /** Alpha flag string for version info */
    alpha?: string
    /** Visual variant */
    variant?: 'default' | 'card' | 'inline' | 'banner'
    /** Compact mode (less padding) */
    compact?: boolean
    /** Show "Learn more" button */
    showLearnMore?: boolean
}>(), {
    variant: 'default',
    compact: false,
    showLearnMore: false
})

defineEmits<{
    learnMore: []
}>()

const targetVersion = computed(() => getTargetVersion(props.alpha))

const mode = computed(() => {
    if (!props.alpha) return null
    if (props.alpha.includes('dev')) return 'dev'
    if (props.alpha.includes('opt')) return 'opt'
    if (props.alpha.includes('owner')) return 'owner'
    return null
})

const modeLabel = computed(() => {
    switch (mode.value) {
        case 'dev': return 'Dev only'
        case 'opt': return 'Opt-in'
        case 'owner': return 'Owner'
        default: return ''
    }
})

const defaultMessage = computed(() => {
    if (targetVersion.value) {
        return `Dieses Feature kommt in Version ${targetVersion.value}`
    }
    return 'Dieses Feature ist noch in Entwicklung'
})
</script>

<style scoped>
.feature-stub {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    background: var(--surface-ground, #f8f9fa);
    border: 2px dashed var(--surface-border, #dee2e6);
    border-radius: 12px;
    gap: 1rem;
}

.stub-compact {
    padding: 1rem;
    gap: 0.5rem;
}

/* Variants */
.stub-card {
    background: var(--surface-card, white);
    border: 1px solid var(--surface-border, #dee2e6);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stub-inline {
    flex-direction: row;
    text-align: left;
    padding: 0.75rem 1rem;
}

.stub-banner {
    flex-direction: row;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
}

.stub-banner .stub-title,
.stub-banner .stub-message {
    color: white;
}

/* Icon */
.stub-icon {
    font-size: 2rem;
}

.stub-compact .stub-icon {
    font-size: 1.5rem;
}

.stub-inline .stub-icon {
    font-size: 1.25rem;
}

/* Content */
.stub-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stub-inline .stub-content {
    flex: 1;
}

.stub-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color, #333);
}

.stub-message {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-color-secondary, #666);
}

/* Version badges */
.stub-version {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 0.25rem;
}

.stub-inline .stub-version {
    justify-content: flex-start;
}

.version-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--primary-color, #667eea);
    color: white;
    border-radius: 999px;
}

.mode-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: var(--surface-200, #e9ecef);
    color: var(--text-color-secondary, #666);
    border-radius: 999px;
}

/* Action button */
.stub-action {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--primary-color, #667eea);
    background: transparent;
    border: 1px solid var(--primary-color, #667eea);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.stub-action:hover {
    background: var(--primary-color, #667eea);
    color: white;
}

.stub-banner .stub-action {
    color: white;
    border-color: white;
}

.stub-banner .stub-action:hover {
    background: rgba(255, 255, 255, 0.2);
}
</style>
