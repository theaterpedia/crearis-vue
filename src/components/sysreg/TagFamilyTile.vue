<template>
    <div class="tag-family-tile" :class="{ zoomed, empty: isEmpty, editable: enableEdit }" @click="handleTileClick">
        <!-- Compact View -->
        <div v-if="!zoomed" class="compact-view">
            <div class="family-label">{{ familyLabel }}</div>
            <div class="compact-content">
                <div v-if="!isEmpty" class="compact-text">
                    {{ compactText }}
                </div>
                <div v-else class="empty-message">
                    No tags set
                </div>
            </div>
            <div v-if="optionalTagsText" class="optional-tags">
                {{ optionalTagsText }}
            </div>
        </div>

        <!-- Zoomed View -->
        <div v-else class="zoomed-view">
            <div class="zoomed-header">
                <h3 class="family-label-large">{{ familyLabel }}</h3>
                <p v-if="familyDescription" class="family-description">
                    {{ familyDescription }}
                </p>
            </div>

            <div class="zoomed-content">
                <div v-for="block in zoomedBlocks" :key="block.groupLabel" class="zoomed-block">
                    <component :is="getIconComponent(block.icon)" class="block-icon" :size="20" />
                    <div class="block-content">
                        <div class="block-label">{{ block.groupLabel }}</div>
                        <div class="block-tags">{{ block.tags }}</div>
                    </div>
                </div>

                <div v-if="isEmpty" class="empty-message-zoomed">
                    No tags set
                </div>
            </div>

            <div v-if="enableEdit" class="zoomed-footer">
                <button type="button" class="edit-button" @click.stop="handleEditClick">
                    Edit
                </button>
            </div>
        </div>

        <!-- Zoom Toggle Button (compact mode only) -->
        <button type="button" v-if="!zoomed && !isEmpty" class="zoom-button" @click.stop="toggleZoom"
            aria-label="Expand tile">
            ⤢
        </button>

        <!-- Edit Button (compact mode) -->
        <button type="button" v-if="!zoomed && enableEdit" class="edit-button-compact" @click.stop="handleEditClick"
            aria-label="Edit">
            ✎
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTagFamilyDisplay } from '@/composables/useTagFamilyDisplay'
import { UsersRound, Sparkles, Theater, Clapperboard, Tag } from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'

const props = defineProps<{
    familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
    modelValue: number | null
    zoom?: boolean
    enableEdit?: boolean
    groupSelection?: 'core' | 'options' | 'all'
}>()

const emit = defineEmits<{
    activated: []
    'update:zoom': [value: boolean]
}>()

// Icon name to lucide component mapping
const iconMap: Record<string, LucideIcon> = {
    'users-round': UsersRound,
    'sparkles': Sparkles,
    'theater': Theater,
    'clapperboard': Clapperboard,
    'tag': Tag,
    'default': Tag
}

function getIconComponent(iconName: string): LucideIcon {
    return iconMap[iconName] || iconMap['default']
}// Use display composable
const {
    displayGroups,
    compactText,
    optionalTagsText,
    zoomedBlocks,
    isEmpty
} = useTagFamilyDisplay({
    familyName: props.familyName,
    modelValue: computed(() => props.modelValue),
    groupSelection: props.groupSelection || 'all',
    zoom: computed(() => props.zoom || false)
})

// Family metadata - simple labels
const familyLabels: Record<string, { label: string; description: string }> = {
    status: { label: 'Status', description: 'Processing status' },
    config: { label: 'Configuration', description: 'Feature flags and settings' },
    rtags: { label: 'Resources', description: 'Resource types' },
    ttags: { label: 'Themes', description: 'Thematic tags' },
    ctags: { label: 'Context', description: 'Contextual metadata' },
    dtags: { label: 'Didactic Model', description: 'Theater pedagogy methods' }
}

const familyLabel = computed(() => familyLabels[props.familyName]?.label || props.familyName)
const familyDescription = computed(() => familyLabels[props.familyName]?.description || '')

// Zoom state
const zoomed = computed(() => props.zoom || false)

function toggleZoom() {
    emit('update:zoom', !zoomed.value)
}

function handleTileClick() {
    if (!zoomed.value && !isEmpty.value) {
        toggleZoom()
    }
}

function handleEditClick() {
    emit('activated')
}
</script>

<style scoped>
.tag-family-tile {
    position: relative;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem;
    background: var(--color-background-soft);
    min-width: 190px;
    max-width: 270px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.tag-family-tile:hover {
    border-color: var(--color-border-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-family-tile.zoomed {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    min-width: 340px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    cursor: default;
}

.tag-family-tile.empty {
    opacity: 0.6;
    cursor: default;
}

.tag-family-tile.editable {
    padding-right: 2.5rem;
}

/* Compact View */
.compact-view {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.family-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.compact-content {
    font-size: 0.9rem;
    line-height: 1.4;
}

.compact-text {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
}

.optional-tags {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    padding-top: 0.25rem;
    border-top: 1px solid var(--color-border);
}

.empty-message {
    color: var(--color-text-muted);
    font-style: italic;
}

/* Zoomed View */
.zoomed-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.zoomed-header {
    border-bottom: 2px solid var(--color-border);
    padding-bottom: 0.75rem;
}

.family-label-large {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
}

.family-description {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin: 0;
}

.zoomed-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.zoomed-block {
    display: flex;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 4px;
    background: var(--color-background-mute);
}

.block-icon {
    width: 20px;
    height: 20px;
    color: var(--color-primary);
    flex-shrink: 0;
}

.block-content {
    flex: 1;
}

.block-label {
    font-weight: 500;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
}

.block-tags {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.empty-message-zoomed {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-muted);
    font-style: italic;
}

.zoomed-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
}

/* Buttons */
.zoom-button,
.edit-button-compact {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    transition: all 0.2s ease;
}

.edit-button-compact {
    right: 0.5rem;
}

.zoom-button {
    right: 2.5rem;
}

.zoom-button:hover,
.edit-button-compact:hover {
    background: var(--color-background-soft);
    border-color: var(--color-border-hover);
}

.edit-button {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.edit-button:hover {
    background: var(--color-primary-hover);
}

/* Overlay for zoomed state */
.tag-family-tile.zoomed::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
}
</style>
