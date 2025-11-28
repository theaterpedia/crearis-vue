<template>
    <Teleport to="body">
        <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
            <div class="modal-dialog tag-family-editor" @click.stop>
                <div class="modal-header">
                    <h2 class="modal-title">{{ familyLabel }}</h2>
                    <p v-if="familyDescription" class="modal-description">
                        {{ familyDescription }}
                    </p>
                    <button class="close-button" @click="handleCancel">
                        ✕
                    </button>
                </div>

                <div class="modal-body">
                    <!-- Active groups -->
                    <div v-if="activeGroupNames.length > 0" class="active-groups">
                        <TagGroupEditor v-for="groupName in activeGroupNames" :key="groupName"
                            :group="getGroupConfig(groupName)!" :model-value="getGroupValue(groupName)"
                            :family-name="familyName" @update:model-value="updateGroup(groupName, $event)" />
                    </div>

                    <!-- Inactive groups (add buttons) -->
                    <div v-if="inactiveGroupNames.length > 0" class="inactive-groups">
                        <button v-for="groupName in inactiveGroupNames" :key="groupName" class="add-group-button"
                            @click="addGroup(groupName)">
                            <span class="add-icon">+</span>
                            {{ getGroupLabel(groupName) }}
                        </button>
                    </div>

                    <!-- Empty state -->
                    <div v-if="activeGroupNames.length === 0 && inactiveGroupNames.length === 0" class="empty-state">
                        <p>No groups available</p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="cancel-button" @click="handleCancel">
                        Cancel
                    </button>
                    <button class="save-button" @click="handleSave" :disabled="!isDirty">
                        Save
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTagFamilyEditor } from '@/composables/useTagFamilyEditor'
import TagGroupEditor from './TagGroupEditor.vue'
import type { TagGroup } from '@/composables/useTagFamily'

const props = defineProps<{
    modelValue: number
    familyName: string
    groupSelection?: 'core' | 'options' | 'all'
    open?: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: number]
    'update:open': [value: boolean]
    save: [value: number]
    cancel: []
}>()

// Simple locale constant
const locale = 'de'

const isOpen = computed(() => props.open ?? true)

// Use editor composable
const {
    editingValue,
    isDirty,
    activeGroupNames,
    inactiveGroupNames,
    groups,
    familyConfig,
    getGroupValue,
    updateGroup,
    addGroup,
    removeGroup,
    save,
    cancel
} = useTagFamilyEditor({
    familyName: props.familyName,
    modelValue: computed(() => props.modelValue),
    groupSelection: props.groupSelection || 'all'
})

// Family metadata - static labels
const familyLabels: Record<string, string> = {
    status: 'Status',
    config: 'Configuration',
    rtags: 'Resource Tags',
    ttags: 'Time Tags',
    ctags: 'Context Tags',
    dtags: 'Method Tags'
}

const familyDescriptions: Record<string, string> = {
    status: 'Project status and workflow state',
    config: 'Configuration options',
    rtags: 'Resource and material tags',
    ttags: 'Time and scheduling tags',
    ctags: 'Context and environment tags',
    dtags: 'Pedagogical methods and approaches'
}

const familyLabel = computed(() => familyLabels[props.familyName] || props.familyName)
const familyDescription = computed(() => familyDescriptions[props.familyName] || '')

function getGroupConfig(groupName: string): TagGroup | undefined {
    return groups.value.find((g: TagGroup) => g.name === groupName)
}

function getGroupLabel(groupName: string): string {
    const group = getGroupConfig(groupName)
    if (!group) return groupName

    return group.label[locale] || group.label['en'] || group.label['de'] || groupName
}

// Event handlers
function handleSave() {
    const newValue = save()
    emit('update:modelValue', newValue)
    emit('save', newValue)
    emit('update:open', false)
}

function handleCancel() {
    cancel()
    emit('cancel')
    emit('update:open', false)
}

function handleOverlayClick() {
    handleCancel()
}

// Keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        handleCancel()
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        if (isDirty.value) {
            handleSave()
        }
    }
}

// Add keyboard listener when modal is open
watch(isOpen, (open: boolean) => {
    if (open) {
        document.addEventListener('keydown', handleKeyDown)
    } else {
        document.removeEventListener('keydown', handleKeyDown)
    }
}, { immediate: true })
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-dialog {
    background: var(--color-bg);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    position: relative;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
}

.modal-title {
    margin: 0 2rem 0 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.modal-description {
    margin: 0.5rem 0 0 0;
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.close-button {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    padding: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s ease;
}

.close-button:hover {
    background: var(--color-background-soft);
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.active-groups {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.inactive-groups {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.add-group-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px dashed var(--color-border);
    border-radius: 4px;
    background: none;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.add-group-button:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-background-soft);
}

.add-icon {
    width: 16px;
    height: 16px;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-muted);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid var(--color-border);
}

.cancel-button,
.save-button {
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cancel-button {
    background: none;
    border: 1px solid var(--color-border);
    color: var(--color-text);
}

.cancel-button:hover {
    background: var(--color-background-soft);
    border-color: var(--color-border-hover);
}

.save-button {
    background: var(--color-accent-bg);
    border: none;
    color: white;
}

.save-button:hover:not(:disabled) {
    background: var(--color-primary-bg);
}

.save-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
