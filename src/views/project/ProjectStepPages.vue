<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Landing-Page, Heading und Pages</h3>
            <p class="step-subtitle">Gestalten Sie Ihre Landing-Page und weitere Seiten</p>
        </div>

        <div class="step-content">
            <!-- Placeholder content -->
            <div class="placeholder-box">
                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56ZM40,200V112H216v88Z">
                    </path>
                </svg>
                <p class="placeholder-title">Pages</p>
                <p class="placeholder-text">Hier können Sie später Ihre Seiten konfigurieren (noch in Entwicklung).</p>
            </div>
        </div>

        <div class="step-actions">
            <button class="action-btn secondary-btn" @click="handlePrev">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
                    </path>
                </svg>
                Zurück
            </button>
            <button class="action-btn success-btn" @click="handleNext">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69l-58.35-58.34a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                    </path>
                </svg>
                Weiter
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    projectId: string
    isLocked?: boolean
}

interface Emits {
    (e: 'prev'): void
    (e: 'next'): void
}

const props = withDefaults(defineProps<Props>(), {
    isLocked: false
})
const emit = defineEmits<Emits>()

function handlePrev() {
    emit('prev')
}

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
    color: var(--color-project);
    margin: 0 0 0.5rem 0;
}

.step-subtitle {
    font-size: 1rem;
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
    color: var(--color-contrast);
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
    justify-content: space-between;
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

.success-btn {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.success-btn:hover {
    opacity: 0.9;
}

.secondary-btn {
    background: var(--color-bg-soft);
    color: var(--color-contrast);
}

.secondary-btn:hover {
    background: var(--color-muted-bg);
}
</style>
