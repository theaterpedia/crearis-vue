<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Landing-Page gestalten</h3>
            <p class="step-subtitle">Erstellen Sie die Startseite Ihres Projekts</p>
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
                <p class="placeholder-title">Landing-Page</p>
                <p class="placeholder-text">Hier können Sie später Ihre Startseite mit Hero-Bereich, Inhalten und
                    Call-to-Actions gestalten.</p>
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
            <button class="action-btn success-btn" @click="handleComplete">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                    </path>
                </svg>
                Abschließen
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Emits {
    (e: 'prev'): void
    (e: 'complete'): void
}

const emit = defineEmits<Emits>()

function handlePrev() {
    emit('prev')
}

function handleComplete() {
    emit('complete')
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
    background: var(--color-project);
    color: white;
}

.success-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.secondary-btn {
    background: var(--color-bg);
    color: var(--color-text);
    border: var(--border) solid var(--color-border);
}

.secondary-btn:hover {
    background: var(--color-bg-soft);
}

.action-btn:active {
    transform: translateY(0);
}
</style>
