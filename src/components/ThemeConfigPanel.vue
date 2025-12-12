<template>
    <div class="config-panel">
        <h4>Theme</h4>
        <p class="panel-description">Wähle ein Theme für Dein Projekt
        </p>

        <div class="config-content">
            <div class="form-group">
                <label class="form-label">Theme auswählen</label>
                <div class="theme-selector">
                    <ProjectThemeSelector :project-id="projectId" v-model="projectThemeId" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProjectThemeSelector from '@/components/dashboard/ProjectThemeSelector.vue'

interface Props {
    projectId: string
    isLocked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
})

const projectThemeId = ref<number | null>(null)

// Load current project theme on mount
onMounted(async () => {
    try {
        const response = await fetch(`/api/projects/${props.projectId}`)
        if (response.ok) {
            const project = await response.json()
            projectThemeId.value = project.theme_id ?? null
        }
    } catch (e) {
        console.error('Failed to load project theme:', e)
    }
})
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

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
}

.theme-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
</style>
