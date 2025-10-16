<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Veranstaltungen auswählen</h3>
            <p class="step-subtitle">Wählen Sie die Events aus, die in Ihrem Projekt erscheinen sollen</p>
        </div>

        <div class="step-content">
            <!-- Placeholder content -->
            <div class="placeholder-box">
                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-68-76a12,12,0,1,1-12-12A12,12,0,0,1,140,132Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,132ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,140,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z">
                    </path>
                </svg>
                <p class="placeholder-title">Event-Auswahl</p>
                <p class="placeholder-text">Hier können Sie später Events auswählen und konfigurieren.</p>
            </div>
        </div>

        <div class="step-actions">
            <button class="action-btn primary-btn" @click="handleNext">
                Weiter
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Emits {
    (e: 'next'): void
}

const emit = defineEmits<Emits>()

function handleNext() {
    emit('next')
}
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.step-header h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
}

.step-content {
    flex: 1;
    min-height: 300px;
}

.placeholder-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    background: var(--color-bg-soft);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-card);
    text-align: center;
    min-height: 300px;
}

.placeholder-box svg {
    color: var(--color-project);
    opacity: 0.5;
    margin-bottom: 1rem;
}

.placeholder-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.5rem 0;
}

.placeholder-text {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
    max-width: 400px;
}

.step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: var(--border) solid var(--color-border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.primary-btn {
    background: var(--color-project);
    color: white;
}

.primary-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.primary-btn:active {
    transform: translateY(0);
}
</style>
