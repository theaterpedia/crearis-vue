<template>
    <div class="config-panel">
        <h4>Theme</h4>
        <p class="panel-description">Wählen Sie ein Theme für Ihr Projekt (wird in config gespeichert, nicht aktiv
            geschaltet)</p>

        <div class="config-content">
            <div class="form-group">
                <label class="form-label">Theme auswählen</label>
                <div class="theme-selector">
                    <ThemeDropdown />
                    <p class="form-hint">
                        Hinweis: Das Theme wird im Projekt-Config gespeichert, aber nicht aktiv geschaltet.
                        Besucher sehen das Theme erst nach Veröffentlichung des Projekts.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import ThemeDropdown from '@/components/ThemeDropdown.vue'

interface Props {
    projectId: string
    isLocked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
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

.form-hint {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    margin: 0;
    padding: 0.75rem;
    background: var(--color-bg-soft);
    border-radius: var(--radius-button);
    border-left: 3px solid var(--color-warning-bg);
}
</style>
