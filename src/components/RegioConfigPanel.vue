<template>
    <div class="config-panel">
        <h4>Regio-Konfiguration</h4>
        <p class="panel-description">Verwalten Sie regionale Einstellungen</p>

        <div class="config-content">
            <div class="placeholder-box">
                <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z">
                    </path>
                </svg>
                <p>Regio-Einstellungen in Entwicklung</p>
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
    min-height: 200px;
}

.placeholder-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--color-bg-soft);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-card);
    text-align: center;
    min-height: 200px;
}

.placeholder-box svg {
    color: var(--color-dimmed);
    opacity: 0.5;
    margin-bottom: 0.75rem;
}

.placeholder-box p {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}
</style>
