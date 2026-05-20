<template>
    <div class="not-published-page">
        <div class="not-published-container">
            <!-- Lock Icon -->
            <div class="lock-icon">
                <svg fill="currentColor" height="64" viewBox="0 0 256 256" width="64"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-80-88a24,24,0,0,0-8,46.62V184a8,8,0,0,0,16,0V166.62A24,24,0,0,0,128,120Zm0,32a8,8,0,1,1,8-8A8,8,0,0,1,128,152Z">
                    </path>
                </svg>
            </div>

            <!-- Message -->
            <h1 class="not-published-title">Projekt nicht veröffentlicht</h1>

            <div class="not-published-info">
                <p class="project-name">
                    <strong>{{ projectName || projectDomaincode }}</strong>
                </p>
                <p v-if="ownerName" class="owner-info">
                    von {{ ownerName }}
                </p>
            </div>

            <p class="not-published-description">
                Dieses Projekt wurde noch nicht öffentlich veröffentlicht.
                Bitte wende dich an den Projektinhaber oder melde dich an,
                falls du Zugriff haben solltest.
            </p>

            <!-- Actions -->
            <div class="not-published-actions">
                <RouterLink to="/login" class="action-btn primary-btn">
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M141.66,133.66l-40,40a8,8,0,0,1-11.32-11.32L116.69,136H24a8,8,0,0,1,0-16h92.69L90.34,93.66a8,8,0,0,1,11.32-11.32l40,40A8,8,0,0,1,141.66,133.66ZM192,32H136a8,8,0,0,0,0,16h56V208H136a8,8,0,0,0,0,16h56a16,16,0,0,0,16-16V48A16,16,0,0,0,192,32Z">
                        </path>
                    </svg>
                    Anmelden
                </RouterLink>

                <RouterLink to="/" class="action-btn secondary-btn">
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z">
                        </path>
                    </svg>
                    Zur Startseite
                </RouterLink>
            </div>

            <!-- Status Badge (dev info) -->
            <div v-if="showDevInfo" class="dev-info">
                <span class="status-badge">
                    Status: {{ projectStatusOld || 'unbekannt' }}
                </span>
                <span class="alpha-badge">
                    Alpha-Modus aktiv
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    projectDomaincode: string
    projectName?: string
    ownerName?: string
    projectStatusOld?: string | null
    showDevInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showDevInfo: import.meta.env.DEV
})
</script>

<style scoped>
/* ===== NOT PUBLISHED PAGE ===== */

.not-published-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg, oklch(98% 0 0));
    padding: 2rem;
}

.not-published-container {
    max-width: 28rem;
    text-align: center;
    background: var(--color-card-bg, oklch(100% 0 0));
    padding: 3rem 2rem;
    border-radius: var(--radius-large, 1rem);
    box-shadow: var(--theme-shadow, 0 0.25rem 1rem oklch(0% 0 0 / 0.1));
}

/* --- Lock Icon --- */
.lock-icon {
    color: var(--color-dimmed, oklch(60% 0 0));
    margin-bottom: 1.5rem;
}

/* --- Title --- */
.not-published-title {
    font-family: var(--headings, system-ui);
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-card-contrast, oklch(20% 0 0));
    margin: 0 0 1.5rem 0;
}

/* --- Project Info --- */
.not-published-info {
    margin-bottom: 1.5rem;
}

.project-name {
    font-size: 1.25rem;
    color: var(--color-primary-bg, oklch(50% 0.15 250));
    margin: 0 0 0.25rem 0;
}

.owner-info {
    font-size: 0.9375rem;
    color: var(--color-dimmed, oklch(60% 0 0));
    margin: 0;
}

/* --- Description --- */
.not-published-description {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-muted-contrast, oklch(40% 0 0));
    margin: 0 0 2rem 0;
}

/* --- Actions --- */
.not-published-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-button, 0.5rem);
    font-family: var(--headings, system-ui);
    font-size: 0.9375rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: var(--transition, all 0.2s ease);
}

.primary-btn {
    background: var(--color-primary-bg, oklch(50% 0.15 250));
    color: var(--color-primary-contrast, oklch(100% 0 0));
}

.primary-btn:hover {
    opacity: 0.85;
}

.secondary-btn {
    background: var(--color-muted-bg, oklch(95% 0 0));
    color: var(--color-card-contrast, oklch(20% 0 0));
}

.secondary-btn:hover {
    background: var(--color-border, oklch(90% 0 0));
}

/* --- Dev Info --- */
.dev-info {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: var(--border-small, 1px) solid var(--color-border, oklch(90% 0 0));
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.status-badge,
.alpha-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-large, 1rem);
    font-family: monospace;
}

.status-badge {
    background: var(--color-warning-bg, oklch(95% 0.05 85));
    color: var(--color-warning-contrast, oklch(35% 0.1 60));
}

.alpha-badge {
    background: var(--color-info-bg, oklch(95% 0.05 250));
    color: var(--color-info-contrast, oklch(35% 0.1 250));
}

/* --- Responsive --- */
@media (max-width: 640px) {
    .not-published-container {
        padding: 2rem 1.5rem;
    }

    .not-published-title {
        font-size: 1.5rem;
    }
}
</style>
