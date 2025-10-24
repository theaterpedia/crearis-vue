<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n'

/**
 * Example component demonstrating i18n usage
 * 
 * Shows:
 * - Language switching
 * - Translation functions (button, nav, field, desc)
 * - Preload and lazy-load behavior
 * - Cache statistics
 */

const i18n = useI18n()

// Reactive translations
const okButton = ref('')
const cancelButton = ref('')
const nameField = ref('')
const instructorNameField = ref('')

// Load translations
onMounted(async () => {
    // Button translations (preloaded)
    okButton.value = await i18n.button('ok')
    cancelButton.value = await i18n.button('abbrechen')

    // Field translations (lazy-loaded)
    nameField.value = await i18n.field('name')
    instructorNameField.value = await i18n.field('name', 'instructors')
})

// Watch language changes to reload translations
watch(() => i18n.language.value, async () => {
    okButton.value = await i18n.button('ok')
    cancelButton.value = await i18n.button('abbrechen')
    nameField.value = await i18n.field('name')
    instructorNameField.value = await i18n.field('name', 'instructors')
})

function changeLanguage(lang: 'de' | 'en' | 'cz') {
    i18n.setLanguage(lang)
}
</script>

<template>
    <div class="i18n-demo">
        <h2>i18n System Demo</h2>

        <!-- Language Switcher -->
        <div class="language-switcher">
            <button @click="changeLanguage('de')" :class="{ active: i18n.language.value === 'de' }">
                🇩🇪 Deutsch
            </button>
            <button @click="changeLanguage('en')" :class="{ active: i18n.language.value === 'en' }">
                🇬🇧 English
            </button>
            <button @click="changeLanguage('cz')" :class="{ active: i18n.language.value === 'cz' }">
                🇨🇿 Čeština
            </button>
        </div>

        <!-- Translation Examples -->
        <div class="translations">
            <h3>Button Translations</h3>
            <p><strong>ok:</strong> {{ okButton }}</p>
            <p><strong>cancel:</strong> {{ cancelButton }}</p>

            <h3>Field Translations</h3>
            <p><strong>name (generic):</strong> {{ nameField }}</p>
            <p><strong>name (instructors):</strong> {{ instructorNameField }}</p>
        </div>

        <!-- System Info -->
        <div class="system-info">
            <h3>System Status</h3>
            <p><strong>Current Language:</strong> {{ i18n.language.value }}</p>
            <p><strong>Preloaded:</strong> {{ i18n.isPreloaded.value ? '✅' : '❌' }}</p>
            <p><strong>Loading:</strong> {{ i18n.isLoading.value ? '⏳' : '✅' }}</p>
            <p><strong>Cache Size:</strong> {{ i18n.cacheStats.value.total }} entries</p>
            <p><strong>By Type:</strong></p>
            <ul>
                <li>Button: {{ i18n.cacheStats.value.byType.button }}</li>
                <li>Nav: {{ i18n.cacheStats.value.byType.nav }}</li>
                <li>Field: {{ i18n.cacheStats.value.byType.field }}</li>
                <li>Desc: {{ i18n.cacheStats.value.byType.desc }}</li>
            </ul>
        </div>

        <!-- Clear Cache -->
        <button @click="i18n.clearCache()">Clear Cache</button>
    </div>
</template>

<style scoped>
.i18n-demo {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.language-switcher {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
}

.language-switcher button {
    padding: 10px 20px;
    border: 2px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 4px;
}

.language-switcher button.active {
    border-color: #42b883;
    background: #42b88320;
    font-weight: bold;
}

.translations,
.system-info {
    margin-bottom: 30px;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 4px;
}

h2,
h3 {
    margin-top: 0;
}
</style>
