<script setup lang="ts">
import { ref } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import OdooEventsList from '@/components/events/OdooEventsList.vue'
import CreateEventForm from '@/components/events/CreateEventForm.vue'

// State
const showCreateForm = ref(false)
const eventsListRef = ref<InstanceType<typeof OdooEventsList> | null>(null)

function handleEventCreated(event: any) {
    console.log('Event created:', event)
    showCreateForm.value = false
    // Refresh the list
    eventsListRef.value?.refresh?.()
}

function handleCancelCreate() {
    showCreateForm.value = false
}

function handleCreateEvent() {
    showCreateForm.value = true
}
</script>

<template>
    <PageLayout>
        <template #header>
            <h1 class="page-title">
                <span class="title-icon">📅</span>
                Odoo Events (Alpha)
            </h1>
            <p class="page-subtitle">
                Direkter XML-RPC Zugriff auf Odoo Events - Alpha Workaround für test-drive Phase
            </p>
        </template>

        <div class="admin-events-container">
            <!-- Info Banner -->
            <div class="info-banner">
                <div class="banner-icon">ℹ️</div>
                <div class="banner-content">
                    <strong>Alpha Workaround</strong>
                    <p>
                        Diese Ansicht verwendet XML-RPC um direkt mit Odoo zu kommunizieren.
                        Änderungen werden sofort in Odoo wirksam.
                    </p>
                </div>
            </div>

            <!-- Create Event Form (toggleable) -->
            <Transition name="slide">
                <div v-if="showCreateForm" class="create-form-section">
                    <CreateEventForm @created="handleEventCreated" @cancel="handleCancelCreate" />
                </div>
            </Transition>

            <!-- Events List -->
            <div class="events-list-section">
                <OdooEventsList ref="eventsListRef" @create="handleCreateEvent" />
            </div>
        </div>
    </PageLayout>
</template>

<style scoped>
.page-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-contrast);
}

.title-icon {
    font-size: 1.5rem;
}

.page-subtitle {
    margin: 0.5rem 0 0 0;
    color: var(--color-dimmed);
    font-size: 0.9375rem;
}

.admin-events-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
}

/* Info Banner */
.info-banner {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--color-secondary-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
}

.banner-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.banner-content {
    flex: 1;
}

.banner-content strong {
    display: block;
    color: var(--color-secondary-contrast);
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.banner-content p {
    margin: 0;
    color: var(--color-dimmed);
    font-size: 0.875rem;
    line-height: 1.5;
}

/* Create Form Section */
.create-form-section {
    margin-bottom: 0.5rem;
}

/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.slide-enter-to,
.slide-leave-from {
    opacity: 1;
    max-height: 800px;
    transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
    .admin-events-container {
        padding: 1rem;
    }

    .page-title {
        font-size: 1.5rem;
    }

    .info-banner {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>
