<template>
    <div class="config-panel">
        <h4>Layout</h4>
        <p class="panel-description">Konfigurieren Sie Layout-Optionen</p>

        <div class="config-content">
            <div class="toggle-group">
                <div class="toggle-item">
                    <div class="toggle-info">
                        <span class="toggle-label">Service</span>
                        <span class="toggle-description">Aktiviert Service-Modus</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="isService" :disabled="isLocked" @change="updateConfig">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="toggle-item">
                    <div class="toggle-info">
                        <span class="toggle-label">Onepage</span>
                        <span class="toggle-description">Aktiviert Onepage-Layout</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="isOnepage" :disabled="isLocked" @change="updateConfig">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="toggle-item">
                    <div class="toggle-info">
                        <span class="toggle-label">Sidebar</span>
                        <span class="toggle-description">Aktiviert Sidebar-Navigation</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" v-model="isSidebar" :disabled="isLocked" @change="updateConfig">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
    projectId: string
    isLocked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
})

const isService = ref(false)
const isOnepage = ref(false)
const isSidebar = ref(false)

onMounted(async () => {
    // Load current config from project
    try {
        const response = await fetch(`/api/projects/${props.projectId}`)
        if (response.ok) {
            const project = await response.json()
            if (project.config) {
                isService.value = project.config.service === true
                isOnepage.value = project.config.onepage === true
                isSidebar.value = project.config.sidebar === true
            }
        }
    } catch (error) {
        console.error('Failed to load layout config:', error)
    }
})

async function updateConfig() {
    if (props.isLocked) return

    try {
        // Fetch current project to get existing config
        const getResponse = await fetch(`/api/projects/${props.projectId}`)
        if (!getResponse.ok) return

        const project = await getResponse.json()
        const currentConfig = project.config || {}

        // Update config: set to true or remove key if false
        const updatedConfig = { ...currentConfig }

        if (isService.value) {
            updatedConfig.service = true
        } else {
            delete updatedConfig.service
        }

        if (isOnepage.value) {
            updatedConfig.onepage = true
        } else {
            delete updatedConfig.onepage
        }

        if (isSidebar.value) {
            updatedConfig.sidebar = true
        } else {
            delete updatedConfig.sidebar
        }

        // PATCH the project config
        const response = await fetch(`/api/projects/${props.projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: updatedConfig })
        })

        if (!response.ok) {
            console.error('Failed to update layout config')
        }
    } catch (error) {
        console.error('Error updating layout config:', error)
    }
}
</script>

<style scoped>
.config-panel {
    padding: 1.5rem;
}

.config-panel h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
}

.panel-description {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0 0 1.5rem 0;
}

.config-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.toggle-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.toggle-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
}

.toggle-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.toggle-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
}

.toggle-description {
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

/* Toggle Switch Styles */
.toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-border);
    transition: 0.3s;
    border-radius: 24px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
}

.toggle-switch input:checked+.toggle-slider {
    background-color: var(--color-project);
}

.toggle-switch input:checked+.toggle-slider:before {
    transform: translateX(24px);
}

.toggle-switch input:disabled+.toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
