<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Projekt aktivieren</h3>
            <p class="step-subtitle">Überprüfe die Einstellungen und aktiviere dein Projekt</p>
        </div>

        <div class="step-content">
            <div class="activate-summary">
                <!-- Project Info Card -->
                <div class="info-card">
                    <div class="info-icon">
                        <svg fill="currentColor" height="32" viewBox="0 0 256 256" width="32"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M216,64H176a48,48,0,0,0-96,0H40A16,16,0,0,0,24,80V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64ZM128,32a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm88,168H40V80H80v16a8,8,0,0,0,16,0V80h64v16a8,8,0,0,0,16,0V80h40Z">
                            </path>
                        </svg>
                    </div>
                    <div class="info-content">
                        <h4>{{ projectName || 'Dein Projekt' }}</h4>
                        <p class="info-text">
                            Nach der Aktivierung wird das Projekt in den <strong>Entwurf-Modus</strong> versetzt.
                            Du kannst dann weitere Anpassungen vornehmen und das Projekt später veröffentlichen.
                        </p>
                    </div>
                </div>

                <!-- Checklist -->
                <div class="checklist">
                    <h4>Vor der Aktivierung prüfen:</h4>
                    <ul class="check-items">
                        <li class="check-item">
                            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z">
                                </path>
                            </svg>
                            <span>Projektinformationen sind vollständig</span>
                        </li>
                        <li class="check-item">
                            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z">
                                </path>
                            </svg>
                            <span>Benutzer und Rollen sind konfiguriert</span>
                        </li>
                        <li class="check-item">
                            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z">
                                </path>
                            </svg>
                            <span>Theme und Layout sind angepasst</span>
                        </li>
                    </ul>
                </div>

                <!-- Status Info -->
                <div class="status-info">
                    <div class="status-badge current">
                        <span class="status-label">Aktueller Status:</span>
                        <span class="status-value">Neu</span>
                    </div>
                    <svg class="arrow-icon" fill="currentColor" height="24" viewBox="0 0 256 256" width="24"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69l-58.35-58.34a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z">
                        </path>
                    </svg>
                    <div class="status-badge next">
                        <span class="status-label">Neuer Status:</span>
                        <span class="status-value">Entwurf</span>
                    </div>
                </div>
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
            <button class="action-btn activate-btn" :disabled="isActivating" @click="handleActivate">
                <span v-if="isActivating" class="spinner"></span>
                <svg v-else fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z">
                    </path>
                </svg>
                {{ isActivating ? 'Aktiviere...' : 'Projekt aktivieren' }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
    projectId: string
    projectName?: string
    isLocked?: boolean
}

interface Emits {
    (e: 'prev'): void
    (e: 'activate'): void
}

const props = withDefaults(defineProps<Props>(), {
    projectName: '',
    isLocked: false
})
const emit = defineEmits<Emits>()

const isActivating = ref(false)

function handlePrev() {
    emit('prev')
}

async function handleActivate() {
    isActivating.value = true
    try {
        emit('activate')
    } finally {
        // Reset after a short delay (parent will handle navigation)
        setTimeout(() => {
            isActivating.value = false
        }, 1000)
    }
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

.activate-summary {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.info-card {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
}

.info-icon {
    flex-shrink: 0;
    color: var(--color-project);
}

.info-content h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0 0 0.5rem 0;
}

.info-text {
    font-size: 0.9375rem;
    color: var(--color-muted-contrast);
    margin: 0;
    line-height: 1.6;
}

.info-text strong {
    color: var(--color-accent);
}

.checklist {
    padding: 1.5rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
}

.checklist h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0 0 1rem 0;
}

.check-items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.check-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9375rem;
    color: var(--color-contrast);
}

.check-item svg {
    color: var(--color-positive-bg);
    flex-shrink: 0;
}

.status-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-bg-soft);
    border-radius: var(--radius-card);
}

.status-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem 1.5rem;
    border-radius: var(--radius-button);
}

.status-badge.current {
    background: var(--color-muted-bg);
}

.status-badge.next {
    background: var(--color-accent-bg);
}

.status-label {
    font-size: 0.75rem;
    color: var(--color-muted-contrast);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.status-badge.current .status-value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-muted-contrast);
}

.status-badge.next .status-value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-accent-contrast);
}

.arrow-icon {
    color: var(--color-dimmed);
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

.activate-btn {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.activate-btn:hover:not(:disabled) {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.activate-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.secondary-btn {
    background: var(--color-bg-soft);
    color: var(--color-contrast);
}

.secondary-btn:hover {
    background: var(--color-muted-bg);
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-accent-contrast);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Responsive: Tablet (900px) */
@media (max-width: 900px) {
    .info-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;
    }

    .status-info {
        flex-direction: column;
        gap: 1rem;
    }

    .arrow-icon {
        transform: rotate(90deg);
    }
}

/* Responsive: Mobile (640px) */
@media (max-width: 640px) {
    .step-actions {
        flex-direction: column-reverse;
    }

    .action-btn {
        justify-content: center;
        width: 100%;
    }

    .status-badge {
        width: 100%;
    }
}
</style>
