<template>
    <div class="step-component">
        <div class="step-header">
            <h3>Veranstaltungen</h3>
            <p class="step-subtitle">Wählen Sie die Events aus, die in Ihrem Projekt erscheinen sollen</p>
        </div>

        <div class="step-content-container">
            <!-- Left: Events Gallery -->
            <div class="events-gallery">
                <div v-if="projectEvents.length === 0" class="empty-state">
                    <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-68-76a12,12,0,1,1-12-12A12,12,0,0,1,140,132Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,132ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,140,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z">
                        </path>
                    </svg>
                    <p class="empty-title">Noch keine Events</p>
                    <p class="empty-text">Fügen Sie Events über das Panel rechts hinzu</p>
                </div>

                <div v-else class="events-grid">
                    <EventCard v-for="event in projectEvents" :key="event.id" :event="event"
                        :instructors="allInstructors" />
                </div>
            </div>

            <!-- Right: Add Event Panel -->
            <div class="add-panel-container">
                <AddEventPanel :project-id="projectId" :base-events="baseEvents" :all-instructors="allInstructors"
                    @event-added="handleEventAdded" />
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
import { ref, onMounted } from 'vue'
import EventCard from '@/components/EventCard.vue'
import AddEventPanel from '@/components/AddEventPanel.vue'

interface Emits {
    (e: 'next'): void
}

const emit = defineEmits<Emits>()

// Temporary hardcoded projectId - will be passed from parent later
const projectId = ref('project1')

const baseEvents = ref<any[]>([])
const projectEvents = ref<any[]>([])
const allInstructors = ref<any[]>([])

async function loadBaseEvents() {
    try {
        const response = await fetch('/api/events?isbase=1')
        if (response.ok) {
            baseEvents.value = await response.json()
        }
    } catch (error) {
        console.error('Error loading base events:', error)
    }
}

async function loadProjectEvents() {
    try {
        const response = await fetch(`/api/events?project=${projectId.value}&isbase=0`)
        if (response.ok) {
            projectEvents.value = await response.json()
        }
    } catch (error) {
        console.error('Error loading project events:', error)
    }
}

async function loadInstructors() {
    try {
        const response = await fetch('/api/instructors')
        if (response.ok) {
            allInstructors.value = await response.json()
        }
    } catch (error) {
        console.error('Error loading instructors:', error)
    }
}

async function handleEventAdded(eventId: string) {
    console.log('Event added:', eventId)
    // Reload project events
    await loadProjectEvents()
}

function handleNext() {
    emit('next')
}

onMounted(async () => {
    await Promise.all([
        loadBaseEvents(),
        loadProjectEvents(),
        loadInstructors()
    ])
})
</script>

<style scoped>
.step-component {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100%;
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

.step-content-container {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
    flex: 1;
    min-height: 500px;
}

/* Left: Events Gallery */
.events-gallery {
    display: flex;
    flex-direction: column;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    background: var(--color-background-soft);
    border: 2px dashed var(--color-border);
    border-radius: 8px;
    text-align: center;
    min-height: 400px;
}

.empty-state svg {
    color: var(--color-primary, #3b82f6);
    opacity: 0.5;
    margin-bottom: 1rem;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-heading);
    margin: 0 0 0.5rem 0;
}

.empty-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0;
    max-width: 400px;
}

.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

@media (min-width: 1024px) {
    .events-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Right: Add Panel */
.add-panel-container {
    display: flex;
    flex-direction: column;
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
