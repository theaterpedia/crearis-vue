<template>
    <div class="theme-dropdown-wrapper" ref="dropdownRef">
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
                <div class="theme-option" :class="{ active: currentTheme === null }" @click="selectTheme(null)">
                    <div class="theme-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div class="theme-preview-text">CSS</div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">Site</div>
                        <div class="theme-description">Standard CSS Variables</div>
                    </div>
                    <div v-if="currentTheme === null" class="theme-check">✓</div>
                </div>

                <!-- Theme Options -->
                <div v-for="theme in themes" :key="theme.id" class="theme-option"
                    :class="{ active: currentTheme === theme.id }" @click="selectTheme(theme.id)">
                    <div class="theme-preview">
                        <img v-if="theme.cimg" :src="theme.cimg" :alt="theme.name" />
                        <div v-else class="theme-preview-placeholder">{{ theme.name.charAt(0) }}</div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">{{ theme.name }}</div>
                        <div class="theme-description">{{ theme.description || `Theme ${theme.id}` }}</div>
                    </div>
                    <div v-if="currentTheme === theme.id" class="theme-check">✓</div>
                </div>

                <div v-if="loading" class="theme-loading">Themes werden geladen...</div>
                <div v-if="error" class="theme-error">{{ error }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { setTheme, getThemes, currentTheme } = useTheme()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const themes = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const currentThemeLabel = computed(() => {
    if (currentTheme.value === null || currentTheme.value === undefined) {
        return 'Site'
    }
    const theme = themes.value.find(t => t.id === currentTheme.value)
    return theme ? theme.name : `Theme ${currentTheme.value}`
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
        if (themeId === null) {
            // Remove all theme variables to revert to site CSS
            await setTheme(null)
        } else {
            await setTheme(themeId)
        }
        closeDropdown()
    } catch (e) {
        error.value = 'Fehler beim Setzen des Themes'
        console.error('Failed to set theme:', e)
    }
}

function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        closeDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.theme-dropdown-wrapper {
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
    right: 0;
    min-width: 320px;
    max-width: 400px;
    background: white;
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
    max-height: 400px;
    overflow-y: auto;
    padding: 0.5rem;
}

.theme-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
    position: relative;
}

.theme-option:hover {
    background: rgba(102, 126, 234, 0.1);
}

.theme-option.active {
    background: rgba(102, 126, 234, 0.15);
    border-color: #667eea;
}

.theme-preview {
    width: 60px;
    height: 60px;
    border-radius: 0.5rem;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f0f0;
    border: 1px solid #e0e0e0;
}

.theme-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.theme-preview-text {
    color: white;
    font-weight: bold;
    font-size: 1.25rem;
}

.theme-preview-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
    font-size: 1.5rem;
}

.theme-info {
    flex: 1;
    min-width: 0;
}

.theme-name {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #333;
    margin-bottom: 0.25rem;
}

.theme-description {
    font-size: 0.8125rem;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.theme-check {
    color: #667eea;
    font-size: 1.25rem;
    font-weight: bold;
    flex-shrink: 0;
}

.theme-loading,
.theme-error {
    padding: 1rem;
    text-align: center;
    font-size: 0.875rem;
    color: #666;
}

.theme-error {
    color: #e53e3e;
}

/* Scrollbar styling */
.theme-dropdown-body::-webkit-scrollbar {
    width: 8px;
}

.theme-dropdown-body::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.theme-dropdown-body::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

.theme-dropdown-body::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>
