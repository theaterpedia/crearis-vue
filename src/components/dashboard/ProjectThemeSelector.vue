<!--
  ProjectThemeSelector.vue - Theme selector for project configuration
  
  This component allows selecting a theme for the PROJECT's public site.
  IMPORTANT: It does NOT apply the theme to the current dashboard view.
  The dashboard uses internal theming (via useTheme.setInternalContext).
  
  The selected theme is saved to the project's settings and will be applied
  when viewing the project's public site (/sites/:domaincode/...).
-->
<template>
    <div class="project-theme-selector" ref="selectorRef">
        <button class="theme-toggle-btn" @click="toggleDropdown" :aria-expanded="isOpen" :title="currentThemeLabel">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M200.12,60.68a71.9,71.9,0,0,0-101.82,0L128,90.34l29.7-29.66a71.9,71.9,0,1,1,0,101.82L128,192.16,98.3,162.5a71.9,71.9,0,1,0,0-101.82L128,90.34,98.3,60.68a71.9,71.9,0,0,1,101.82,0ZM128,152a24,24,0,1,1,24-24A24,24,0,0,1,128,152Z">
                </path>
            </svg>
            <span>{{ currentThemeLabel }}</span>
        </button>

        <div v-if="isOpen" class="theme-dropdown">
            <div class="theme-dropdown-header">
                <h3>🎨 Theme wählen</h3>
                <button class="close-btn" @click="closeDropdown">&times;</button>
            </div>

            <div class="theme-dropdown-body">
                <!-- Site (Default) Option -->
                <div class="theme-option" :class="{ active: selectedThemeId === null }" @click="selectTheme(null)">
                    <div class="theme-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div class="theme-preview-text">CSS</div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">Site</div>
                        <div class="theme-description">Standard CSS Variables</div>
                    </div>
                    <div v-if="selectedThemeId === null" class="theme-check">✓</div>
                </div>

                <!-- Theme Options -->
                <div v-for="theme in themes" :key="theme.id" class="theme-option"
                    :class="{ active: selectedThemeId === theme.id }" @click="selectTheme(theme.id)">
                    <div class="theme-preview">
                        <img v-if="theme.cimg" :src="theme.cimg" :alt="theme.name" />
                        <div v-else class="theme-preview-placeholder">{{ theme.name.charAt(0) }}</div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">{{ theme.name }}</div>
                        <div class="theme-description">{{ theme.description || `Theme ${theme.id}` }}</div>
                    </div>
                    <div v-if="selectedThemeId === theme.id" class="theme-check">✓</div>
                </div>

                <div v-if="loading" class="theme-loading">Themes werden geladen...</div>
                <div v-if="error" class="theme-error">{{ error }}</div>
            </div>

            <div class="theme-dropdown-footer">
                <p class="theme-note">
                    <strong>Hinweis:</strong> Das Theme wird für die öffentliche Projekt-Website gespeichert,
                    nicht für dieses Dashboard.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'

interface Props {
    projectId: string
    modelValue?: number | null
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null
})

const emit = defineEmits<{
    'update:modelValue': [themeId: number | null]
    'change': [themeId: number | null]
}>()

const { getThemes } = useTheme()

const isOpen = ref(false)
const selectorRef = ref<HTMLElement | null>(null)
const themes = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const selectedThemeId = ref<number | null>(props.modelValue)

// Sync with v-model
watch(() => props.modelValue, (val) => {
    selectedThemeId.value = val
})

const currentThemeLabel = computed(() => {
    if (selectedThemeId.value === null || selectedThemeId.value === undefined) {
        return 'Site'
    }
    const theme = themes.value.find(t => t.id === selectedThemeId.value)
    return theme ? theme.name : `Theme ${selectedThemeId.value}`
})

async function loadThemes() {
    loading.value = true
    error.value = ''
    try {
        themes.value = await getThemes()
    } catch (e) {
        error.value = 'Fehler beim Laden der Themes'
        console.error('Failed to load themes:', e)
    } finally {
        loading.value = false
    }
}

function toggleDropdown() {
    isOpen.value = !isOpen.value
    if (isOpen.value && themes.value.length === 0) {
        loadThemes()
    }
}

function closeDropdown() {
    isOpen.value = false
}

async function selectTheme(themeId: number | null) {
    try {
        selectedThemeId.value = themeId

        // Save to project settings (NOT applying globally!)
        await saveProjectTheme(themeId)

        emit('update:modelValue', themeId)
        emit('change', themeId)
        closeDropdown()
    } catch (e) {
        error.value = 'Fehler beim Speichern des Themes'
        console.error('Failed to save theme:', e)
    }
}

async function saveProjectTheme(themeId: number | null) {
    // Save theme_id to project settings
    const response = await fetch(`/api/projects/${props.projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_id: themeId })
    })

    if (!response.ok) {
        throw new Error('Failed to save project theme')
    }
}

function handleClickOutside(event: MouseEvent) {
    if (selectorRef.value && !selectorRef.value.contains(event.target as Node)) {
        closeDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    // Load themes immediately
    loadThemes()
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.project-theme-selector {
    position: relative;
    display: inline-block;
}

.theme-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    color: var(--color-card-contrast);
    font-family: var(--headings);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.theme-toggle-btn:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.theme-toggle-btn svg {
    flex-shrink: 0;
}

.theme-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 320px;
    max-width: 400px;
    background: var(--color-card-bg, white);
    border-radius: 0.75rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    overflow: hidden;
    animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.theme-dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.theme-dropdown-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.close-btn {
    background: transparent;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: background 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.theme-dropdown-body {
    max-height: 300px;
    overflow-y: auto;
    padding: 0.5rem;
}

.theme-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
}

.theme-option:hover {
    background: var(--color-muted-bg, #f5f5f5);
}

.theme-option.active {
    background: var(--color-primary-lighter, #eff6ff);
}

.theme-preview {
    width: 48px;
    height: 48px;
    border-radius: 0.375rem;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-muted-bg, #f0f0f0);
}

.theme-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.theme-preview-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
}

.theme-preview-placeholder {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-muted, #666);
}

.theme-info {
    flex: 1;
    min-width: 0;
}

.theme-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text, #333);
}

.theme-description {
    font-size: 0.75rem;
    color: var(--color-muted, #666);
}

.theme-check {
    color: var(--color-positive-bg, #22c55e);
    font-size: 1.25rem;
    font-weight: 600;
}

.theme-loading,
.theme-error {
    padding: 1rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-muted, #666);
}

.theme-error {
    color: var(--color-negative-bg, #ef4444);
}

.theme-dropdown-footer {
    padding: 0.75rem 1rem;
    background: var(--color-muted-bg, #f5f5f5);
    border-top: 1px solid var(--color-border, #e5e5e5);
}

.theme-note {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-muted, #666);
    line-height: 1.4;
}

.theme-note strong {
    color: var(--color-text, #333);
}
</style>
