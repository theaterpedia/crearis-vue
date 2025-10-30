<template>
    <div class="demo-float-hard">
        <Section background="default">
            <Container>
                <Prose>
                    <h1>Floating Post-Its Demo: Programmatic API</h1>
                    <p>
                        This demo shows how to use the floating post-it system with the <strong>programmatic
                            API</strong>.
                        Post-its are created and managed directly via the controller.
                    </p>
                </Prose>

                <div class="demo-controls">
                    <h2>Test Triggers</h2>
                    <p>Click the buttons below to open floating post-its:</p>

                    <div class="trigger-grid">
                        <!-- Trigger 1: Default positioning (right) -->
                        <button ref="trigger1" class="demo-button primary" @click="openPostit('p1', $event)">
                            📚 Open Post-It 1 (Default/Right)
                        </button>

                        <!-- Trigger 2: Left positioning -->
                        <button ref="trigger2" class="demo-button secondary" @click="openPostit('p2', $event)">
                            🎯 Open Post-It 2 (Left)
                        </button>

                        <!-- Trigger 3: Element-relative positioning -->
                        <button ref="trigger3" class="demo-button accent" @click="openPostit('p3', $event)">
                            ⚡ Open Post-It 3 (Element)
                        </button>
                    </div>

                    <div class="control-buttons">
                        <button @click="closeAll" class="demo-button warning">
                            Close All Post-Its
                        </button>
                        <button @click="showStatus" class="demo-button muted">
                            Show Status
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
const statusMessage = ref('')

const trigger1 = ref<HTMLElement>()
const trigger2 = ref<HTMLElement>()
const trigger3 = ref<HTMLElement>()

// Initialize post-its programmatically
onMounted(() => {
    // Post-it 1: Default (right) positioning
    controller.create({
        key: 'p1',
        title: '📚 Learning Resources',
        content: `
      <p>Welcome to the floating post-it system!</p>
      <p><strong>Features:</strong></p>
      <ul>
        <li>Smart positioning</li>
        <li>Mobile responsive</li>
        <li>Up to 9 post-its per page</li>
        <li>Customizable themes</li>
      </ul>
    `,
        color: 'primary',
        hlogic: 'default',
        actions: [
            {
                label: 'Learn More',
                handler: (close) => {
                    alert('Learn More clicked!')
                    close()
                }
            },
            {
                label: 'Got it!',
                handler: (close) => close()
            }
        ]
    })

    // Post-it 2: Left positioning
    controller.create({
        key: 'p2',
        title: '🎯 Quick Tip',
        content: `
      <p>This post-it is positioned on the <strong>left side</strong> of the screen.</p>
      <p>On mobile, it adapts based on where you clicked!</p>
    `,
        color: 'secondary',
        hlogic: 'left',
        actions: [
            {
                label: 'Awesome!',
                handler: (close) => close()
            }
        ]
    })

    // Post-it 3: Element-relative positioning
    controller.create({
        key: 'p3',
        title: '⚡ Pro Feature',
        content: `
      <p>This post-it positions itself <em>relative to the trigger element</em>.</p>
      <p>It intelligently chooses left or right based on available space.</p>
      <p><strong>Try it:</strong> Resize your browser window and click again!</p>
    `,
        color: 'accent',
        hlogic: 'element',
        image: 'https://images.unsplash.com/photo-1516450137517-162bfbeb8dba?w=400&h=200&fit=crop',
        actions: [
            {
                label: 'Cool!',
                handler: (close) => close()
            },
            {
                label: 'Learn More',
                href: '#',
                target: '_self'
            }
        ]
    })
})

function openPostit(key: string, event: Event) {
    const triggerElement = event.currentTarget as HTMLElement
    controller.openPostit(key, triggerElement)
    statusMessage.value = `Opened post-it: ${key}`
    setTimeout(() => {
        statusMessage.value = ''
    }, 2000)
}

function closeAll() {
    controller.closeAll()
    statusMessage.value = 'All post-its closed'
    setTimeout(() => {
        statusMessage.value = ''
    }, 2000)
}

function showStatus() {
    const keys = controller.getKeys()
    const openKeys = Array.from(controller.openKeys)
    statusMessage.value = `Registered: ${keys.length}, Open: ${openKeys.length} (${openKeys.join(', ') || 'none'})`
}
</script>

<style scoped>
.demo-float-hard {
    min-height: 100vh;
    padding: 2rem 0;
}

.demo-controls {
    margin-top: 2rem;
}

.demo-controls h2 {
    margin-bottom: 1rem;
}

.trigger-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
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
}

.demo-button:hover {
    transform: translateY(-2px);
    opacity: 0.9;
}

.demo-button:active {
    transform: translateY(0);
}

.demo-button.primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.demo-button.secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.demo-button.accent {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.demo-button.warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.demo-button.muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.control-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.status-message {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border-radius: 0.375rem;
    font-weight: 500;
}

@media (max-width: 767px) {
    .trigger-grid {
        grid-template-columns: 1fr;
    }

    .control-buttons {
        flex-direction: column;
    }
}
</style>
