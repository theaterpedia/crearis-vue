<template>
    <Hero :height-tmp="height"
        img-tmp="https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg"
        img-tmp-align-x="cover" img-tmp-align-y="cover"
        :overlay="`linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6))`" content-width="short"
        content-align-y="center">
        <Logo />
        <div ref="ctaGroup" class="cta-group">
            <Button size="medium" variant="primary" @click="handleRegister">
                hier anmelden
            </Button>
            <!-- Post-It: Header Height Demo -->
            <div data-fpostcontainer data-fpostkey="p4">
                <button class="cta-secondary cta-demo" data-fpostlink data-hlogic="default">
                    📐 Header Demo
                </button>
                <div style="display: none;" data-fpostcontent data-color="primary">
                    <h3>📐 Header Height Demo</h3>
                    <p>Try different header heights! Click to cycle through options.</p>

                    <div class="theme-demo-info">
                        <div class="current-theme-display">
                            <strong class="theme-name" data-height-display="name">Click to try heights</strong>
                            <p class="theme-desc" data-height-display="desc">Heights cycle: medium → full → prominent
                            </p>
                        </div>
                        <button class="theme-action-btn btn-accent" data-fpost-event="height-cycle"
                            data-fpost-payload='{"action":"next"}'>
                            📐 Try Next Height
                        </button>
                    </div>
                </div>
            </div>
            <!-- Post-It: Theme Demo -->
            <div data-fpostcontainer data-fpostkey="p5">
                <button class="cta-secondary cta-demo" data-fpostlink data-hlogic="default">
                    🎨 Theme Demo
                </button>
                <div style="display: none;" data-fpostcontent data-color="primary">
                    <h3>🎨 Theme Preview</h3>
                    <p>Try different themes temporarily! Theme will auto-reset in 30 seconds or when you navigate.</p>

                    <div class="theme-demo-info">
                        <div class="current-theme-display">
                            <strong class="theme-name" data-theme-display="name">Click to try a theme</strong>
                            <p class="theme-desc" data-theme-display="desc">Themes rotate through: E-Motion, Pastell,
                                Institut</p>
                        </div>
                        <button class="theme-action-btn btn-accent" data-fpost-event="theme-rotate"
                            data-fpost-payload='{"action":"next"}'>
                            🎨 Try Next Theme
                        </button>
                    </div>

                    <div class="demo-status" data-theme-display="status" style="display: none;">
                        <span class="status-indicator">🟢 Demo Active</span>
                        <span class="countdown" data-theme-display="countdown">Resets in 30s</span>
                    </div>
                </div>
            </div>

        </div>
    </Hero>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Hero from '@/components/Hero.vue'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import Button from '@/components/Button.vue'
import Logo from '@/components/Logo.vue'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'
import { useFpostitEvents } from '@/fpostit/composables/useFpostitEvents'
import { useTheme } from '@/composables/useTheme'

const controller = useFpostitController()
const events = useFpostitEvents()
const { setTheme, resetContext, contextTheme } = useTheme()
const router = useRouter()

const props = defineProps<{
    user?: any
}>()

const height = ref('prominent')
const ctaGroup = ref<HTMLElement>()

// Header height demo state
const heightOptions = [
    { value: 'medium', name: 'Medium', desc: 'Compact header for quick navigation' },
    { value: 'full', name: 'Full', desc: 'Balanced height with good visibility' },
    { value: 'prominent', name: 'Prominent', desc: 'Maximum impact and presence' }
]
let currentHeightIndex = 2 // Start at 'prominent'

// Update DOM elements with current height info
function updateHeightDisplay() {
    const heightOpt = heightOptions[currentHeightIndex]
    if (!heightOpt) return

    const nameEl = document.querySelector('[data-height-display="name"]')
    const descEl = document.querySelector('[data-height-display="desc"]')

    if (nameEl) nameEl.textContent = heightOpt.name
    if (descEl) descEl.textContent = heightOpt.desc
}

// Theme demo state
const demoThemes = [
    { id: 0, name: 'E-Motion', desc: 'Performance und Energie' },
    { id: 2, name: 'Pastell', desc: 'dezente Farben und Übergänge' },
    { id: 3, name: 'Institut', desc: 'professionell und seriös' }
]
let currentThemeIndex = 0
const countdown = ref<number>(0)
let countdownInterval: number | null = null

const isDemoActive = computed(() => contextTheme.value !== null)

// Update DOM elements with current theme info
function updateThemeDisplay() {
    const theme = demoThemes[currentThemeIndex]
    if (!theme) return

    const nameEl = document.querySelector('[data-theme-display="name"]')
    const descEl = document.querySelector('[data-theme-display="desc"]')

    if (nameEl) nameEl.textContent = theme.name
    if (descEl) descEl.textContent = theme.desc
}

// Start countdown display
function startCountdown() {
    const statusDiv = document.querySelector('[data-theme-display="status"]') as HTMLElement
    const countdownDisplay = document.querySelector('[data-theme-display="countdown"]')

    if (statusDiv) statusDiv.style.display = 'flex'

    countdown.value = 30
    if (countdownDisplay) {
        countdownDisplay.textContent = `Resets in ${countdown.value}s`
    }

    // Clear any existing countdown
    if (countdownInterval) {
        clearInterval(countdownInterval)
    }

    countdownInterval = window.setInterval(() => {
        countdown.value--
        if (countdownDisplay) {
            countdownDisplay.textContent = `Resets in ${countdown.value}s`
        }
        if (countdown.value <= 0 && countdownInterval) {
            clearInterval(countdownInterval)
            countdownInterval = null
        }
    }, 1000)
}

// Stop countdown display
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
    }

    const statusDiv = document.querySelector('[data-theme-display="status"]') as HTMLElement
    if (statusDiv) statusDiv.style.display = 'none'
}

// Setup event listeners
onMounted(async () => {
    console.log('[HomePageHero] Mounted, discovering post-its...')

    // Discover post-its from DOM
    if (ctaGroup.value) {
        const count = controller.discoverFromDOM({
            root: ctaGroup.value,
            attachHandlers: true
        })
        console.log(`[HomePageHero] Discovered ${count} post-its`)
    }

    // Register event handler for header height cycling
    events.on('height-cycle', (payload) => {
        console.log('[HomePageHero] Height cycle event received:', payload)

        // Cycle to next height
        currentHeightIndex = (currentHeightIndex + 1) % heightOptions.length
        const heightOpt = heightOptions[currentHeightIndex]

        if (!heightOpt) {
            console.error('[HomePageHero] No height found at index', currentHeightIndex)
            return
        }

        console.log('[HomePageHero] Applying height:', heightOpt.name, heightOpt.value)

        // Update display
        updateHeightDisplay()

        // Apply height
        height.value = heightOpt.value

        console.log('[HomePageHero] Height applied successfully')
    })

    // Register event handler for theme rotation
    events.on('theme-rotate', async (payload) => {
        console.log('[HomePageHero] Theme rotate event received:', payload)

        // Rotate to next theme
        currentThemeIndex = (currentThemeIndex + 1) % demoThemes.length
        const theme = demoThemes[currentThemeIndex]

        if (!theme) {
            console.error('[HomePageHero] No theme found at index', currentThemeIndex)
            return
        }

        console.log('[HomePageHero] Applying theme:', theme.name, theme.id)

        try {
            // Update display
            updateThemeDisplay()

            // Apply theme with 30 second timer
            await setTheme(theme.id, 'timer', 30)

            // Start countdown
            startCountdown()

            console.log('[HomePageHero] Theme applied successfully')
        } catch (error) {
            console.error('[HomePageHero] Failed to apply theme:', error)
        }
    })

    // Trigger event discovery after a short delay to catch Post-It content
    setTimeout(() => {
        events.discover()
    }, 500)
})

// Cleanup on unmount
onUnmounted(() => {
    stopCountdown()
})

function handleRegister() {
    router.push('/start')
}
</script>

<style scoped>
.cta-group {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 2rem;
}

.cta-secondary {
    color: var(--color-primary-contrast);
    text-decoration: underline;
    font-size: 1.125rem;
    transition: opacity 0.3s;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
}

.cta-secondary:hover {
    opacity: 0.8;
}

.cta-demo {
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
}

.cta-demo:hover {
    background: rgba(255, 255, 255, 0.25);
    opacity: 1;
}

.theme-demo-info {
    margin: 1.5rem 0;
}

.current-theme-display {
    padding: 1rem;
    background: rgba(var(--color-primary-rgb), 0.1);
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    text-align: center;
}

.current-theme-display strong {
    display: block;
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
}

.current-theme-display p {
    margin: 0;
    opacity: 0.8;
}

.theme-action-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: var(--color-primary);
    color: var(--color-primary-contrast);
    transition: transform 0.2s, opacity 0.2s;
}

.theme-action-btn.btn-accent {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
}

.theme-action-btn:hover {
    transform: translateY(-2px);
    opacity: 0.9;
}

.theme-action-btn:active {
    transform: translateY(0);
}

/* Post-It event elements get visual feedback */
:deep(.fpostit-event-element) {
    cursor: pointer;
    transition: transform 0.2s, opacity 0.2s;
}

:deep(.fpostit-event-element:hover) {
    transform: scale(1.02);
    opacity: 0.9;
}

:deep(.fpostit-event-element:active) {
    transform: scale(0.98);
}

.demo-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(var(--color-primary-rgb), 0.1);
    border-radius: 0.25rem;
    margin: 1rem 0;
    font-size: 0.875rem;
}

.status-indicator {
    font-weight: 600;
}

.countdown {
    font-family: monospace;
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-primary);
}

@media (max-width: 767px) {
    .cta-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .demo-status {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
    }
}
</style>
