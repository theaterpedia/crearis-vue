<template>
    <div class="config-panel">
        <h4>Projekte</h4>
        <p class="panel-description">Verwalten Sie Partner-Projekte und Regio-Einstellungen</p>

        <div class="config-content">
            <div class="form-group">
                <label class="form-label">Partner-Projekte</label>
                <div class="partners-list">
                    <div class="placeholder-text">
                        Multi-Select für Partner-Projekte in Entwicklung
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Regio</label>
                <div class="regio-select">
                    <div class="placeholder-text">
                        Regio-Auswahl in Entwicklung
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
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

.partners-list,
.regio-select {
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
