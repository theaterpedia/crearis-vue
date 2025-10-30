<template>
    <div class="demo-float-dyn">
        <Section background="default">
            <Container>
                <Prose>
                    <h1>Floating Post-Its Demo: HTML Discovery</h1>
                    <p>
                        This demo shows how to use the floating post-it system with <strong>HTML
                            data-attributes</strong>.
                        Post-its are automatically discovered from the DOM structure.
                    </p>
                </Prose>

                <div ref="demoRoot" class="demo-content">
                    <h2>Interactive Triggers</h2>
                    <p>Click the buttons below - they're configured via HTML attributes:</p>

                    <!-- Post-it 1: Warning theme with image -->
                    <div class="demo-postit-container" data-fpostcontainer data-fpostkey="p1">
                        <button class="demo-button warning" data-fpostlink data-hlogic="default">
                            ⚠️ Important Notice
                        </button>
                        <div style="display: none;" data-fpostcontent data-color="warning"
                            data-image="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop">
                            <h3>📢 System Maintenance</h3>
                            <p>Our systems will be undergoing scheduled maintenance this weekend.</p>
                            <p><strong>When:</strong> Saturday, 2 AM - 6 AM UTC</p>
                            <p><strong>Impact:</strong> Brief service interruptions may occur.</p>
                            <a href="#maintenance" data-fpostact1>View Schedule</a>
                            <a href="#" data-fpostact2>Dismiss</a>
                        </div>
                    </div>

                    <!-- Post-it 2: Positive theme, left positioning -->
                    <div class="demo-postit-container" data-fpostcontainer data-fpostkey="p2">
                        <button class="demo-button positive" data-fpostlink data-hlogic="left">
                            ✅ New Feature
                        </button>
                        <div style="display: none;" data-fpostcontent data-color="positive">
                            <h3>🎉 Dark Mode Released!</h3>
                            <p>We're excited to announce that dark mode is now available for all users.</p>
                            <ul>
                                <li>Auto-switching based on system preference</li>
                                <li>Manual toggle in settings</li>
                                <li>Reduced eye strain</li>
                            </ul>
                            <a href="#settings" data-fpostact1>Try It Now</a>
                        </div>
                    </div>

                    <!-- Post-it 3: Accent theme, element positioning, SVG icon -->
                    <div class="demo-postit-container" data-fpostcontainer data-fpostkey="p3">
                        <button class="demo-button accent" data-fpostlink data-hlogic="element">
                            💡 Quick Tip
                        </button>
                        <div style="display: none;" data-fpostcontent data-color="accent"
                            data-svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'>
                            <h3>💡 Pro Tip</h3>
                            <p>You can use keyboard shortcuts to speed up your workflow!</p>
                            <p><kbd>Ctrl + K</kbd> - Quick command palette</p>
                            <p><kbd>Ctrl + P</kbd> - Quick project search</p>
                            <p><kbd>Esc</kbd> - Close floating post-its</p>
                            <a href="#shortcuts" data-fpostact1>View All Shortcuts</a>
                            <a href="#" data-fpostact2>Got It!</a>
                        </div>
                    </div>

                    <!-- Post-it 4: Secondary theme, right positioning -->
                    <div class="demo-postit-container" data-fpostcontainer data-fpostkey="p4">
                        <button class="demo-button secondary" data-fpostlink data-hlogic="right">
                            📚 Documentation
                        </button>
                        <div style="display: none;" data-fpostcontent data-color="secondary">
                            <h3>📖 Getting Started</h3>
                            <p>Welcome to our comprehensive documentation!</p>
                            <p>Learn how to:</p>
                            <ul>
                                <li>Set up your first project</li>
                                <li>Configure advanced features</li>
                                <li>Integrate with third-party tools</li>
                            </ul>
                            <a href="#docs" data-fpostact1>Read Docs</a>
                        </div>
                    </div>

                    <div class="control-section">
                        <h3>Discovery Controls</h3>
                        <button @click="rediscover" class="demo-button muted">
                            🔄 Re-discover Post-Its
                        </button>
                        <button @click="closeAll" class="demo-button warning">
                            ❌ Close All
                        </button>
                    </div>

                    <div v-if="statusMessage" class="status-message">
                        {{ statusMessage }}
                    </div>
                </div>
            </Container>
        </Section>

        <!-- Floating Post-It Renderer -->
        <FpostitRenderer />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'

const controller = useFpostitController()
const demoRoot = ref<HTMLElement>()
const statusMessage = ref('')

onMounted(() => {
    // Discover post-its from DOM
    if (demoRoot.value) {
        const count = controller.discoverFromDOM({
            root: demoRoot.value,
            attachHandlers: true
        })
        statusMessage.value = `Discovered ${count} post-its from HTML`
        setTimeout(() => {
            statusMessage.value = ''
        }, 3000)
    }
})

function rediscover() {
    if (demoRoot.value) {
        controller.closeAll()
        const count = controller.discoverFromDOM({
            root: demoRoot.value,
            attachHandlers: true
        })
        statusMessage.value = `Re-discovered ${count} post-its`
        setTimeout(() => {
            statusMessage.value = ''
        }, 2000)
    }
}

function closeAll() {
    controller.closeAll()
    statusMessage.value = 'All post-its closed'
    setTimeout(() => {
        statusMessage.value = ''
    }, 2000)
}
</script>

<style scoped>
.demo-float-dyn {
    min-height: 100vh;
    padding: 2rem 0;
}

.demo-content {
    margin-top: 2rem;
}

.demo-content h2,
.demo-content h3 {
    margin-top: 2rem;
    margin-bottom: 1rem;
}

.demo-postit-container {
    margin: 1rem 0;
}

.demo-button {
    padding: 1rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s, opacity 0.2s;
    text-align: center;
    display: inline-block;
    margin: 0.5rem 0;
}

.demo-button:hover {
    transform: translateY(-2px);
    opacity: 0.9;
}

.demo-button:active {
    transform: translateY(0);
}

.demo-button.warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.demo-button.positive {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.demo-button.accent {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.demo-button.secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.demo-button.muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.control-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid var(--color-muted-bg);
}

.control-section button {
    margin-right: 1rem;
    margin-bottom: 0.5rem;
}

.status-message {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border-radius: 0.375rem;
    font-weight: 500;
}

kbd {
    padding: 0.2rem 0.4rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.9em;
}

@media (max-width: 767px) {
    .demo-button {
        display: block;
        width: 100%;
    }

    .control-section button {
        margin-right: 0;
    }
}
</style>
