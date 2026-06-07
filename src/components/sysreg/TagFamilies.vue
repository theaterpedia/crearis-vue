<template>
    <div class="tag-families" :class="`layout-${layout}`">
        <!-- Status (read-only) -->
        <TagFamilyTile v-if="status !== undefined" family-name="status" :model-value="status"
            :group-selection="groupSelection" @activated="$emit('status:activated')" />

        <!-- Config (read-only) -->
        <TagFamilyTile v-if="config !== undefined" family-name="config" :model-value="config"
            :group-selection="groupSelection" @activated="$emit('config:activated')" />

        <!-- Rtags (editable) -->
        <TagFamilyTile v-if="rtags !== undefined" family-name="rtags" :model-value="rtags"
            :enable-edit="canEdit('rtags')" :group-selection="groupSelection" @activated="openEditor('rtags')" />

        <!-- Ttags (editable) -->
        <TagFamilyTile v-if="ttags !== undefined" family-name="ttags" :model-value="ttags"
            :enable-edit="canEdit('ttags')" :group-selection="groupSelection" @activated="openEditor('ttags')" />

        <!-- Ctags (editable) -->
        <TagFamilyTile v-if="ctags !== undefined" family-name="ctags" :model-value="ctags"
            :enable-edit="canEdit('ctags')" :group-selection="groupSelection" @activated="openEditor('ctags')" />

        <!-- Dtags (editable) -->
        <TagFamilyTile v-if="dtags !== undefined" family-name="dtags" :model-value="dtags"
            :enable-edit="canEdit('dtags')" :group-selection="groupSelection" @activated="openEditor('dtags')" />

        <!-- Editor Modal -->
        <TagFamilyEditor v-if="editorState.open" :model-value="editorState.value" :family-name="editorState.family"
            :group-selection="groupSelection" :open="editorState.open" @update:open="closeEditor"
            @save="handleEditorSave" @cancel="closeEditor" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TagFamilyTile from './TagFamilyTile.vue'
import TagFamilyEditor from './TagFamilyEditor.vue'

const props = defineProps<{
    // v-models for each family
    status?: number | null
    config?: number | null
    rtags?: number | null
    ttags?: number | null
    ctags?: number | null
    dtags?: number | null

    // Control
    enableEdit?: boolean | string[]
    groupSelection?: 'core' | 'options' | 'all'

    // Layout
    layout?: 'row' | 'wrap' | 'vertical' | 'inline'
}>()

const emit = defineEmits<{
    'update:rtags': [value: number]
    'update:ttags': [value: number]
    'update:ctags': [value: number]
    'update:dtags': [value: number]
    'status:activated': []
    'config:activated': []
}>()

// Editor state
const editorState = ref<{
    open: boolean
    family: string
    value: number
}>({
    open: false,
    family: '',
    value: 0
})

// Check if a family can be edited
function canEdit(family: string): boolean {
    if (typeof props.enableEdit === 'boolean') {
        return props.enableEdit
    }
    if (Array.isArray(props.enableEdit)) {
        return props.enableEdit.includes(family)
    }
    return false
}

// Open editor for a family
function openEditor(family: 'rtags' | 'ttags' | 'ctags' | 'dtags') {
    editorState.value = {
        open: true,
        family,
        value: props[family] || 0
    }
}

// Close editor
function closeEditor() {
    editorState.value.open = false
}

// Handle editor save
function handleEditorSave(value: number) {
    const family = editorState.value.family as 'rtags' | 'ttags' | 'ctags' | 'dtags'
    emit(`update:${family}`, value)
    closeEditor()
}
</script>

<style scoped>
.tag-families {
    display: flex;
    gap: 1rem;
}

.tag-families.layout-row {
    flex-wrap: wrap;
    justify-content: flex-start;
}

.tag-families.layout-wrap {
    flex-wrap: wrap;
}

.tag-families.layout-vertical {
    flex-direction: column;
}

.tag-families.layout-inline {
    flex-wrap: nowrap;
    gap: 0.5rem;
    align-items: center;
}

/* Tablet: 900px */
@media (max-width: 900px) {
    .tag-families {
        gap: 0.75rem;
    }
}

/* Mobile: 640px */
@media (max-width: 640px) {
    .tag-families {
        gap: 0.5rem;
    }

    .tag-families.layout-row,
    .tag-families.layout-wrap {
        flex-direction: column;
    }
}
</style>
