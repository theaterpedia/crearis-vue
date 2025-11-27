<template>
    <div class="tag-family-tile" :class="{
        'tag-family-tile--zoomed': isZoomed,
        'tag-family-tile--empty': !hasActiveTags,
        'tag-family-tile--editable': showEditButton
    }" @click="handleTileClick">
        <!-- Compact View -->
        <div v-if="!isZoomed" class="tag-family-tile__compact">
            <div class="tag-family-tile__header">
                <span class="tag-family-tile__family-label">
                    {{ familyLabel }}
                </span>
                <button v-if="showEditButton" class="tag-family-tile__edit-btn" @click.stop="handleEditClick"
                    :aria-label="`Edit ${familyLabel}`">
                    ✏️
                </button>
            </div>

            <div v-if="hasActiveTags" class="tag-family-tile__content">
                {{ compactText }}
            </div>
            <div v-else class="tag-family-tile__empty-state">
                {{ emptyText }}
            </div>
        </div>

        <!-- Zoomed View -->
        <div v-else class="tag-family-tile__zoomed">
            <div class="tag-family-tile__header">
                <span class="tag-family-tile__family-label">
                    {{ familyLabel }}
                </span>
                <button v-if="showEditButton" class="tag-family-tile__edit-btn" @click.stop="handleEditClick"
                    :aria-label="`Edit ${familyLabel}`">
                    ✏️
                </button>
            </div>

            <div v-if="hasActiveTags" class="tag-family-tile__groups">
                <div v-for="group in displayGroups" :key="group.groupName" class="tag-family-tile__group">
                    <div class="tag-family-tile__group-header">
                        <span class="tag-family-tile__group-icon">{{ group.groupIcon }}</span>
                        <span class="tag-family-tile__group-label">{{ group.groupLabel }}</span>
                    </div>

                    <div class="tag-family-tile__tags">
                        <div v-for="tag in group.tags" :key="tag.bit" class="tag-family-tile__tag" :class="{
                            'tag-family-tile__tag--category': tag.isCategory,
                            'tag-family-tile__tag--subcategory': tag.isSubcategory
                        }">
                            {{ tag.label }}
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="tag-family-tile__empty-state">
                {{ emptyText }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTagFamilyDisplay } from '@/composables/useTagFamilyDisplay'
import { useI18n } from '@/composables/useI18n'

export interface TagFamilyTileProps {
    familyName: 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'
    modelValue: number | null
    groupSelection?: 'all' | 'core' | 'options'
    initialZoom?: boolean
    showEditButton?: boolean
    clickToZoom?: boolean
    emptyText?: string
}

const props = withDefaults(defineProps<TagFamilyTileProps>(), {
    groupSelection: 'all',
    initialZoom: false,
    showEditButton: false,
    clickToZoom: true,
    emptyText: 'No tags selected'
})

const emit = defineEmits<{
    (e: 'edit'): void
    (e: 'zoom', value: boolean): void
}>()

// Zoom state
const isZoomed = ref(props.initialZoom)

// Get i18n
const { sysreg } = useI18n()

// Get display composable
const display = useTagFamilyDisplay({
    familyName: props.familyName,
    modelValue: props.modelValue,
    groupSelection: props.groupSelection
})

const {
    displayGroups,
    compactText,
    hasActiveTags
} = display

// Get family label from sysreg
const familyLabel = computed(() => {
    // Map family names to sysreg keys
    const labelMap: Record<string, string> = {
        dtags: 'didactic_model',
        ttags: 'target_groups',
        ctags: 'context',
        rtags: 'resources',
        status: 'status',
        config: 'config'
    }

    const sysregKey = labelMap[props.familyName] || props.familyName
    return sysreg(sysregKey).then(label => label || props.familyName)
})

// Handle tile click (toggle zoom)
function handleTileClick() {
    if (props.clickToZoom) {
        isZoomed.value = !isZoomed.value
        emit('zoom', isZoomed.value)
    }
}

// Handle edit button click
function handleEditClick() {
    emit('edit')
}
</script>

<style scoped>
.tag-family-tile {
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    padding: 12px 16px;
    background: var(--color-background, #ffffff);
    transition: all 0.2s ease;
    cursor: pointer;
}

.tag-family-tile:hover {
    border-color: var(--color-primary, #4a90e2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tag-family-tile--empty {
    opacity: 0.6;
}

.tag-family-tile--zoomed {
    padding: 16px 20px;
}

.tag-family-tile__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.tag-family-tile__family-label {
    font-weight: 600;
    font-size: 14px;
    color: var(--color-text-primary, #333333);
}

.tag-family-tile__edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    opacity: 0.6;
    transition: opacity 0.2s ease;
}

.tag-family-tile__edit-btn:hover {
    opacity: 1;
}

.tag-family-tile__content {
    font-size: 13px;
    color: var(--color-text-secondary, #666666);
    line-height: 1.5;
}

.tag-family-tile__empty-state {
    font-size: 13px;
    color: var(--color-text-muted, #999999);
    font-style: italic;
}

/* Zoomed view styles */
.tag-family-tile__groups {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tag-family-tile__group {
    border-left: 3px solid var(--color-primary, #4a90e2);
    padding-left: 12px;
}

.tag-family-tile__group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.tag-family-tile__group-icon {
    font-size: 16px;
}

.tag-family-tile__group-label {
    font-weight: 500;
    font-size: 13px;
    color: var(--color-text-primary, #333333);
}

.tag-family-tile__tags {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tag-family-tile__tag {
    font-size: 12px;
    color: var(--color-text-secondary, #666666);
    padding-left: 12px;
    position: relative;
}

.tag-family-tile__tag::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--color-primary, #4a90e2);
}

.tag-family-tile__tag--category {
    font-weight: 500;
}

.tag-family-tile__tag--subcategory {
    padding-left: 24px;
    font-size: 11px;
}

.tag-family-tile__tag--subcategory::before {
    left: 12px;
    opacity: 0.6;
}
</style>
