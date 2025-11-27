<template>
    <div class="tag-families">
        <!-- Gallery of tag family tiles -->
        <div class="tag-families__grid">
            <TagFamilyTile v-for="family in visibleFamilies" :key="family" :family-name="family"
                :model-value="getFamilyValue(family)" :group-selection="groupSelection" :show-edit-button="editable"
                :click-to-zoom="allowZoom" @edit="openEditor(family)" />
        </div>

        <!-- Edit Modal -->
        <Teleport to="body">
            <div v-if="showEditor" class="tag-families__modal-overlay" @click.self="closeEditor">
                <div class="tag-families__modal">
                    <div class="tag-families__modal-header">
                        <h2 class="tag-families__modal-title">
                            {{ editorTitle }}
                        </h2>
                        <button class="tag-families__modal-close" @click="closeEditor" aria-label="Close editor">
                            ✕
                        </button>
                    </div>

                    <div class="tag-families__modal-content">
                        <TagFamilyEditor v-if="editingFamily" :family-name="editingFamily"
                            :model-value="getFamilyValue(editingFamily)" :group-selection="groupSelection"
                            @save="handleSave" @cancel="closeEditor" />
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TagFamilyTile from './TagFamilyTile.vue'
import TagFamilyEditor from './TagFamilyEditor.vue'
import { useI18n } from '@/composables/useI18n'

type FamilyName = 'status' | 'config' | 'rtags' | 'ttags' | 'ctags' | 'dtags'

export interface TagFamiliesProps {
    // Family values (object with family names as keys)
    values: {
        status?: number | null
        config?: number | null
        rtags?: number | null
        ttags?: number | null
        ctags?: number | null
        dtags?: number | null
    }
    // Which families to show
    families?: FamilyName[]
    // Group selection filter
    groupSelection?: 'all' | 'core' | 'options'
    // Enable editing
    editable?: boolean
    // Allow zoom on tiles
    allowZoom?: boolean
}

const props = withDefaults(defineProps<TagFamiliesProps>(), {
    families: () => ['dtags', 'ttags', 'ctags', 'rtags'],
    groupSelection: 'all',
    editable: false,
    allowZoom: true
})

const emit = defineEmits<{
    (e: 'update', family: FamilyName, value: number): void
}>()

// Editor state
const showEditor = ref(false)
const editingFamily = ref<FamilyName | null>(null)

// Get i18n
const { sysreg } = useI18n()

// Visible families (filtered)
const visibleFamilies = computed(() => {
    return props.families
})

// Get value for a family
function getFamilyValue(family: FamilyName): number | null {
    return props.values[family] ?? null
}

// Open editor for a family
function openEditor(family: FamilyName) {
    editingFamily.value = family
    showEditor.value = true
}

// Close editor
function closeEditor() {
    showEditor.value = false
    editingFamily.value = null
}

// Handle save from editor
function handleSave(value: number) {
    if (editingFamily.value) {
        emit('update', editingFamily.value, value)
    }
    closeEditor()
}

// Get editor title
const editorTitle = computed(() => {
    if (!editingFamily.value) return ''

    const labelMap: Record<FamilyName, string> = {
        dtags: 'didactic_model',
        ttags: 'target_groups',
        ctags: 'context',
        rtags: 'resources',
        status: 'status',
        config: 'config'
    }

    const sysregKey = labelMap[editingFamily.value]
    return sysreg(sysregKey).then(label => `Edit ${label}`)
})
</script>

<style scoped>
.tag-families {
    width: 100%;
}

.tag-families__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    padding: 16px 0;
}

/* Modal styles */
.tag-families__modal-overlay {
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
    padding: 20px;
}

.tag-families__modal {
    background: var(--color-background, #ffffff);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.tag-families__modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.tag-families__modal-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary, #333333);
}

.tag-families__modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--color-text-secondary, #666666);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s ease;
}

.tag-families__modal-close:hover {
    background: var(--color-background-hover, #f5f5f5);
}

.tag-families__modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

/* Responsive grid */
@media (max-width: 768px) {
    .tag-families__grid {
        grid-template-columns: 1fr;
    }

    .tag-families__modal {
        max-width: 100%;
        max-height: 90vh;
    }
}
</style>
