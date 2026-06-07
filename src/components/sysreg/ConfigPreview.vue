<template>
    <div class="config-preview">
        <div class="preview-visual" :class="[
            `size-${config.headerSize || 'mini'}`,
            config.isFullWidth ? 'full-width' : '',
            config.contentInBanner ? 'in-banner' : ''
        ]">
            <div class="preview-image" :style="{
                background: gradientStyle
            }">
                <div class="preview-content" :class="`align-${config.contentAlignY || 'center'}`">
                    <div class="content-placeholder"></div>
                </div>
            </div>
        </div>
        <div class="preview-props">
            <span v-for="(value, key) in displayedProps" :key="key" class="prop-tag"
                :class="{ 'prop-changed': showDiff && isChanged(key) }">
                {{ key }}: {{ formatValue(value) }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    config: Record<string, any>
    parentType: string
    showDiff?: boolean
    baseConfig?: Record<string, any>
}>()

const displayedProps = computed(() => {
    const important = ['headerSize', 'contentAlignY', 'gradientType', 'gradientDepth', 'isFullWidth', 'contentInBanner']
    const result: Record<string, any> = {}
    for (const key of important) {
        if (props.config[key] !== undefined) {
            result[key] = props.config[key]
        }
    }
    return result
})

const gradientStyle = computed(() => {
    if (props.config.gradientType === 'left-bottom' && props.config.gradientDepth > 0) {
        const depth = props.config.gradientDepth
        return `linear-gradient(to top right, rgba(0,0,0,${depth}) 0%, transparent 60%), var(--color-muted-bg)`
    }
    return 'var(--color-muted-bg)'
})

function isChanged(key: string): boolean {
    if (!props.showDiff || !props.baseConfig) return false
    return props.config[key] !== props.baseConfig[key]
}

function formatValue(value: any): string {
    if (typeof value === 'boolean') return value ? '✓' : '✗'
    if (typeof value === 'number') return value.toFixed(1)
    return String(value)
}
</script>

<style scoped>
.config-preview {
    /* Container */
}

.preview-visual {
    position: relative;
    border-radius: calc(var(--radius) / 2);
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.preview-visual.size-mini {
    height: 40px;
}

.preview-visual.size-medium {
    height: 60px;
}

.preview-visual.size-prominent {
    height: 80px;
}

.preview-visual.size-full {
    height: 100px;
}

.preview-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-content {
    width: 60%;
    display: flex;
}

.preview-content.align-top {
    align-self: flex-start;
    padding-top: 0.5rem;
}

.preview-content.align-center {
    align-self: center;
}

.preview-content.align-bottom {
    align-self: flex-end;
    padding-bottom: 0.5rem;
}

.content-placeholder {
    background: var(--color-primary-bg);
    height: 8px;
    width: 100%;
    border-radius: 2px;
    opacity: 0.7;
}

.preview-visual.in-banner .preview-content {
    background: var(--color-secondary-bg);
    padding: 0.25rem 0.5rem;
    border-radius: 2px;
}

.preview-visual.full-width .preview-content {
    width: 100%;
    padding-left: 1rem;
}

.preview-props {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.prop-tag {
    font-size: 0.7rem;
    padding: 0.125rem 0.375rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    color: var(--color-dimmed);
    font-family: monospace;
}

.prop-tag.prop-changed {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
    border-color: var(--color-warning-bg);
}
</style>
