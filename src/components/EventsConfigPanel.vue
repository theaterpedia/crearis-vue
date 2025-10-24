<template>
    <div class="config-panel">
        <h4>Events-Konfiguration</h4>
        <p class="panel-description">Konfigurieren Sie die Anzeige Ihrer Veranstaltungen</p>

        <div class="config-content">
            <div class="placeholder-box">
                <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z">
                    </path>
                </svg>
                <p>Event-Ansichtsoptionen in Entwicklung</p>
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
