<template>
    <div class="config-panel">
        <h4>Benutzer</h4>
        <p class="panel-description">Verwalten Sie Projekt-Eigentümer und Mitglieder</p>

        <div class="config-content">
            <div class="form-group">
                <label class="form-label">Eigentümer (Owner)</label>
                <input type="text" class="form-input readonly" :value="ownerName" readonly disabled />
                <p class="form-hint">Der Eigentümer kann nicht geändert werden</p>
            </div>

            <div class="form-group">
                <label class="form-label">Projekt-Mitglieder</label>
                <div class="members-list">
                    <div class="placeholder-text">
                        Multi-Select für Mitglieder in Entwicklung
                    </div>
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

const ownerName = ref('Loading...')

onMounted(async () => {
    // Fetch project owner
    try {
        const response = await fetch(`/api/projects/${props.projectId}`)
        if (response.ok) {
            const project = await response.json()
            // Fetch owner user details
            if (project.owner_id) {
                const userResponse = await fetch(`/api/users/${project.owner_id}`)
                if (userResponse.ok) {
                    const user = await userResponse.json()
                    ownerName.value = user.username || user.email || `User ${project.owner_id}`
                }
            }
        }
    } catch (error) {
        console.error('Failed to load owner:', error)
        ownerName.value = 'N/A'
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

.form-input {
    padding: 0.5rem 0.75rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
}

.form-input.readonly {
    background: var(--color-bg-soft);
    color: var(--color-dimmed);
    cursor: not-allowed;
}

.form-hint {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    margin: 0;
}

.members-list {
    min-height: 100px;
    padding: 1rem;
    background: var(--color-bg-soft);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-card);
}

.placeholder-text {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    text-align: center;
}
</style>
