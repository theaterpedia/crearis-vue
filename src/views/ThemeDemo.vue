<template>
    <div class="theme-demo-container">
        <div class="demo-header">
            <h1>Theme System Demo</h1>
            <p>Showcasing the 4 core theme functions</p>
        </div>

        <!-- Function 0: setTheme(id) -->
        <section class="demo-section">
            <h2>
                <span class="function-badge">Function 0</span>
                setTheme(id)
            </h2>
            <p>Set the active theme for the page</p>

            <div class="theme-selector">
                <button v-for="theme in themes" :key="theme.id" @click="handleSetTheme(theme.id)"
                    :class="{ active: currentTheme === theme.id }" class="theme-button">
                    <img :src="theme.cimg" :alt="theme.name" />
                    <div class="theme-info">
                        <strong>{{ theme.name }}</strong>
                        <span class="theme-id">ID: {{ theme.id }}</span>
                    </div>
                </button>
            </div>

            <div class="code-example">
                <pre><code>await setTheme({{ selectedThemeId }})</code></pre>
            </div>
        </section>

        <!-- Function 1: getThemeVars(id) -->
        <section class="demo-section">
            <h2>
                <span class="function-badge">Function 1</span>
                getThemeVars(id)
            </h2>
            <p>Get CSS variables for a specific theme</p>

            <div class="theme-vars-selector">
                <label>
                    Select theme to view vars:
                    <select v-model="varsThemeId" @change="loadThemeVars">
                        <option v-for="theme in themes" :key="theme.id" :value="theme.id">
                            {{ theme.name }} (ID: {{ theme.id }})
                        </option>
                    </select>
                </label>
            </div>

            <div v-if="selectedThemeVars" class="vars-display">
                <div class="vars-grid">
                    <div v-for="(value, key) in selectedThemeVars" :key="key" class="var-item">
                        <div class="var-key">{{ key }}</div>
                        <div class="var-value">{{ value }}</div>
                        <div class="var-color" :style="{ backgroundColor: value }"></div>
                    </div>
                </div>
            </div>

            <div class="code-example">
                <pre><code>const vars = await getThemeVars({{ varsThemeId }})
// Returns: { "--color-primary-base": "oklch(...)", ... }</code></pre>
            </div>
        </section>

        <!-- Function 2: getThemes() -->
        <section class="demo-section">
            <h2>
                <span class="function-badge">Function 2</span>
                getThemes()
            </h2>
            <p>Get all available themes with metadata</p>

            <div class="themes-list">
                <div v-for="theme in themes" :key="theme.id" class="theme-card">
                    <img :src="theme.cimg" :alt="theme.name" class="theme-card-img" />
                    <div class="theme-card-content">
                        <h3>{{ theme.name }}</h3>
                        <p class="theme-id-badge">ID: {{ theme.id }}</p>
                        <p class="theme-description">{{ theme.description }}</p>
                    </div>
                </div>
            </div>

            <div class="code-example">
                <pre><code>const themes = await getThemes()
// Returns: [{ id, name, description, cimg }, ...]
// Count: {{ themes.length }} themes</code></pre>
            </div>
        </section>

        <!-- Function 3: currentVars() -->
        <section class="demo-section">
            <h2>
                <span class="function-badge">Function 3</span>
                currentVars()
            </h2>
            <p>Get CSS variables for the currently active theme</p>

            <div class="current-theme-info">
                <div class="info-card">
                    <h3>Current Theme</h3>
                    <p class="current-theme-name">
                        {{ currentThemeName }}
                        <span class="current-theme-id">(ID: {{ currentTheme }})</span>
                    </p>
                </div>

                <div class="info-card">
                    <h3>Variable Count</h3>
                    <p class="var-count">{{ currentVarsCount }} CSS variables</p>
                </div>
            </div>

            <div v-if="currentVars" class="color-swatches">
                <h4>Current Theme Colors</h4>
                <div class="swatches-grid">
                    <div v-for="(value, key) in currentVars" :key="key" class="swatch" :title="`${key}: ${value}`">
                        <div class="swatch-color" :style="{ backgroundColor: value }"></div>
                        <div class="swatch-label">{{ key.replace('--color-', '') }}</div>
                    </div>
                </div>
            </div>

            <div class="code-example">
                <pre><code>const vars = currentVars()
// Returns current theme vars or null
// Current: {{ currentTheme !== null ? `Theme ${currentTheme}` : 'None' }}</code></pre>
            </div>
        </section>

        <!-- Live Demo: Apply Styles -->
        <section class="demo-section live-demo">
            <h2>Live Demo: Theme in Action</h2>
            <p>These elements use the current theme colors</p>

            <div class="demo-elements">
                <div class="demo-element"
                    style="background: var(--color-primary-bg); color: var(--color-primary-contrast);">
                    Primary Background
                </div>
                <div class="demo-element"
                    style="background: var(--color-secondary-bg); color: var(--color-secondary-contrast);">
                    Secondary Background
                </div>
                <div class="demo-element"
                    style="background: var(--color-positive-bg); color: var(--color-positive-contrast);">
                    Positive Background
                </div>
                <div class="demo-element"
                    style="background: var(--color-negative-bg); color: var(--color-negative-contrast);">
                    Negative Background
                </div>
                <div class="demo-element"
                    style="background: var(--color-warning-bg); color: var(--color-warning-contrast);">
                    Warning Background
                </div>
            </div>
        </section>

        <!-- Singleton State Info -->
        <section class="demo-section info-section">
            <h2>🔒 Singleton Pattern</h2>
            <p>The theme state is shared across all composable instances</p>

            <div class="singleton-info">
                <div class="info-box">
                    <strong>✓ Consistent State</strong>
                    <p>All components see the same current theme</p>
                </div>
                <div class="info-box">
                    <strong>✓ Performance</strong>
                    <p>Theme data cached in memory</p>
                </div>
                <div class="info-box">
                    <strong>✓ No Prop Drilling</strong>
                    <p>Access theme anywhere without passing props</p>
                </div>
            </div>
        </section>
    </div>
    <DemoToggle />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme, type Theme, type ThemeVars } from '../composables/useTheme'
import DemoToggle from '@/components/DemoToggle.vue'

// Initialize theme composable
const {
    setTheme,
    getThemeVars,
    getThemes,
    currentVars,
    currentTheme,
    init
} = useTheme()

// Component state
const themes = ref<Theme[]>([])
const selectedThemeId = ref(0)
const varsThemeId = ref(0)
const selectedThemeVars = ref<ThemeVars | null>(null)

// Computed values
const currentThemeName = computed(() => {
    const theme = themes.value.find(t => t.id === currentTheme.value)
    return theme?.name || 'Unknown'
})

const currentVarsCount = computed(() => {
    return currentVars.value ? Object.keys(currentVars.value).length : 0
})

// Function 0: Set Theme
const handleSetTheme = async (id: number) => {
    selectedThemeId.value = id
    try {
        await setTheme(id)
        console.log(`✓ Theme ${id} applied successfully`)
    } catch (error) {
        console.error(`Failed to set theme ${id}:`, error)
    }
}

// Function 1: Get Theme Vars
const loadThemeVars = async () => {
    try {
        selectedThemeVars.value = await getThemeVars(varsThemeId.value)
        console.log(`✓ Loaded vars for theme ${varsThemeId.value}`)
    } catch (error) {
        console.error(`Failed to load vars for theme ${varsThemeId.value}:`, error)
    }
}

// Initialize on mount
onMounted(async () => {
    try {
        // Initialize theme system
        await init()

        // Function 2: Get all themes
        themes.value = await getThemes()
        console.log(`✓ Loaded ${themes.value.length} themes`)

        // Load initial theme vars
        await loadThemeVars()
    } catch (error) {
        console.error('Failed to initialize theme demo:', error)
    }
})
</script>

<style scoped>
.theme-demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
}

.demo-header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid var(--color-border, #e0e0e0);
}

.demo-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-contrast, #000);
}

.demo-header p {
    color: var(--color-dimmed, #666);
    font-size: 1.125rem;
}

.demo-section {
    margin-bottom: 3rem;
    padding: 2rem;
    background: var(--color-card-bg, #fff);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-section h2 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: var(--color-contrast, #000);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.function-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary-bg, #007bff);
    color: var(--color-primary-contrast, #fff);
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
}

.demo-section>p {
    color: var(--color-dimmed, #666);
    margin-bottom: 1.5rem;
}

/* Theme Selector */
.theme-selector {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.theme-button {
    display: flex;
    flex-direction: column;
    padding: 0;
    border: 2px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    background: var(--color-bg, #fff);
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden;
}

.theme-button:hover {
    border-color: var(--color-primary-base, #007bff);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-button.active {
    border-color: var(--color-primary-base, #007bff);
    border-width: 3px;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.theme-button img {
    width: 100%;
    height: 120px;
    object-fit: cover;
}

.theme-info {
    padding: 0.75rem;
    text-align: left;
}

.theme-info strong {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--color-contrast, #000);
}

.theme-id {
    font-size: 0.75rem;
    color: var(--color-dimmed, #666);
}

/* Theme Vars Display */
.theme-vars-selector {
    margin-bottom: 1.5rem;
}

.theme-vars-selector label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-weight: 500;
}

.theme-vars-selector select {
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--color-input, #fff);
    color: var(--color-contrast, #000);
}

.vars-display {
    background: var(--color-muted-bg, #f5f5f5);
    padding: 1.5rem;
    border-radius: 8px;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
}

.vars-grid {
    display: grid;
    gap: 0.75rem;
}

.var-item {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 1rem;
    align-items: center;
    padding: 0.5rem;
    background: var(--color-bg, #fff);
    border-radius: 4px;
    font-size: 0.875rem;
}

.var-key {
    font-family: monospace;
    font-weight: 600;
    color: var(--color-contrast, #000);
}

.var-value {
    font-family: monospace;
    color: var(--color-dimmed, #666);
    overflow: hidden;
    text-overflow: ellipsis;
}

.var-color {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    border: 1px solid var(--color-border, #e0e0e0);
}

/* Themes List */
.themes-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.theme-card {
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-bg, #fff);
    transition: transform 0.2s;
}

.theme-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.theme-card-img {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.theme-card-content {
    padding: 1rem;
}

.theme-card-content h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-contrast, #000);
}

.theme-id-badge {
    display: inline-block;
    background: var(--color-accent-bg, #f0f0f0);
    color: var(--color-accent-contrast, #333);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.theme-description {
    color: var(--color-dimmed, #666);
    font-size: 0.875rem;
    margin: 0;
}

/* Current Theme Info */
.current-theme-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.info-card {
    background: var(--color-muted-bg, #f5f5f5);
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
}

.info-card h3 {
    margin: 0 0 0.75rem 0;
    color: var(--color-dimmed, #666);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.current-theme-name {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-contrast, #000);
    margin: 0;
}

.current-theme-id {
    display: block;
    font-size: 1rem;
    color: var(--color-dimmed, #666);
    font-weight: normal;
    margin-top: 0.25rem;
}

.var-count {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-primary-base, #007bff);
    margin: 0;
}

/* Color Swatches */
.color-swatches {
    margin-bottom: 1.5rem;
}

.color-swatches h4 {
    margin-bottom: 1rem;
    color: var(--color-contrast, #000);
}

.swatches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
}

.swatch {
    text-align: center;
}

.swatch-color {
    width: 100%;
    height: 60px;
    border-radius: 8px;
    border: 1px solid var(--color-border, #e0e0e0);
    margin-bottom: 0.5rem;
}

.swatch-label {
    font-size: 0.75rem;
    color: var(--color-dimmed, #666);
    word-break: break-word;
}

/* Live Demo Elements */
.demo-elements {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.demo-element {
    padding: 2rem 1rem;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    transition: transform 0.2s;
}

.demo-element:hover {
    transform: scale(1.05);
}

/* Code Examples */
.code-example {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
}

.code-example pre {
    margin: 0;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
}

.code-example code {
    color: #d4d4d4;
}

/* Info Section */
.info-section {
    background: linear-gradient(135deg, var(--color-primary-bg, #007bff) 0%, var(--color-secondary-bg, #6c757d) 100%);
    color: var(--color-primary-contrast, #fff);
}

.info-section h2,
.info-section p {
    color: inherit;
}

.singleton-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.info-box {
    background: rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
}

.info-box strong {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
}

.info-box p {
    margin: 0;
    opacity: 0.9;
}
</style>
