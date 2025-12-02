<template>
    <div class="tag-family-editor">
        <!-- Validation errors -->
        <div v-if="validationErrors.length > 0" class="tag-family-editor__errors">
            <div v-for="(error, index) in validationErrors" :key="index" class="tag-family-editor__error">
                ⚠️ {{ error }}
            </div>
        </div>

        <!-- Tag groups -->
        <div class="tag-family-editor__groups">
            <div v-for="group in groups" :key="group.name" class="tag-family-editor__group">
                <div class="tag-family-editor__group-header">
                    <span class="tag-family-editor__group-icon">{{ group.icon }}</span>
                    <span class="tag-family-editor__group-label">{{ getGroupLabel(group) }}</span>
                    <span v-if="group.optional" class="tag-family-editor__group-optional">
                        (optional)
                    </span>
                </div>

                <!-- Group editor -->
                <TagGroupEditor :family-name="familyName" :group="group" :model-value="getGroupValue(group.name)"
                    @update:model-value="setGroupValue(group.name, $event)" />
            </div>
        </div>

        <!-- Action buttons -->
        <div class="tag-family-editor__actions">
            <button class="tag-family-editor__btn tag-family-editor__btn--secondary" @click="handleCancel">
                Cancel
            </button>

            <button class="tag-family-editor__btn tag-family-editor__btn--danger" @click="handleReset">
                Reset All
            </button>

            <button class="tag-family-editor__btn tag-family-editor__btn--primary" :disabled="!isValid || !isDirty"
                @click="handleSave">
                Save Changes
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTagFamilyEditor } from '@/composables/useTagFamilyEditor'
import type { TagGroup } from '@/composables/useTagFamily'
import TagGroupEditor from './TagGroupEditor.vue'

type FamilyName = 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'

export interface TagFamilyEditorProps {
    familyName: FamilyName
    modelValue: number | null
    groupSelection?: 'all' | 'core' | 'options'
}

const props = withDefaults(defineProps<TagFamilyEditorProps>(), {
    groupSelection: 'all'
})

const emit = defineEmits<{
    (e: 'save', value: number): void
    (e: 'cancel'): void
}>()

// Get editor composable
const editor = useTagFamilyEditor({
    familyName: props.familyName,
    modelValue: props.modelValue ?? 0,
    groupSelection: props.groupSelection
})

const {
    editValue,
    isDirty,
    isValid,
    groups,
    getGroupValue,
    setGroupValue,
    save,
    cancel,
    reset,
    getValidationErrors
} = editor

// Validation errors
const validationErrors = computed(() => getValidationErrors())

// Get localized group label
function getGroupLabel(group: TagGroup): string {
    return group.label?.en || group.name
}

// Handle save
function handleSave() {
    if (isValid.value) {
        save()
        emit('save', editValue.value)
    }
}

// Handle cancel
function handleCancel() {
    cancel()
    emit('cancel')
}

// Handle reset
function handleReset() {
    if (confirm('Are you sure you want to reset all selections?')) {
        reset()
    }
}
</script>

<style scoped>
.tag-family-editor {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.tag-family-editor__errors {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tag-family-editor__error {
    padding: 10px 12px;
    background: var(--color-error-background, #fee);
    border: 1px solid var(--color-error-border, #fcc);
    border-radius: 6px;
    color: var(--color-error-text, #c33);
    font-size: 13px;
}

.tag-family-editor__groups {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.tag-family-editor__group {
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    padding: 16px;
    background: var(--color-background-subtle, #fafafa);
}

.tag-family-editor__group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.tag-family-editor__group-icon {
    font-size: 18px;
}

.tag-family-editor__group-label {
    font-weight: 600;
    font-size: 15px;
    color: var(--color-text-primary, #333333);
}

.tag-family-editor__group-optional {
    font-size: 12px;
    color: var(--color-text-muted, #999999);
    font-weight: normal;
}

.tag-family-editor__actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border, #e0e0e0);
}

.tag-family-editor__btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}

.tag-family-editor__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tag-family-editor__btn--primary {
    background: var(--color-primary, #4a90e2);
    color: white;
}

.tag-family-editor__btn--primary:hover:not(:disabled) {
    background: var(--color-primary-dark, #357abd);
}

.tag-family-editor__btn--secondary {
    background: var(--color-background, #ffffff);
    color: var(--color-text-primary, #333333);
    border: 1px solid var(--color-border, #e0e0e0);
}

.tag-family-editor__btn--secondary:hover {
    background: var(--color-background-hover, #f5f5f5);
}

.tag-family-editor__btn--danger {
    background: var(--color-danger, #e74c3c);
    color: white;
}

.tag-family-editor__btn--danger:hover {
    background: var(--color-danger-dark, #c0392b);
}
</style>
