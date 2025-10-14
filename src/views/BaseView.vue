<template>
    <div class="base-view">
        <!-- Top Bar -->
        <div class="topbar">
            <div class="topbar-left">
                <h1 class="topbar-title">📦 Basis-Daten</h1>
            </div>

            <div class="topbar-center">
                <!-- Events Dropdown -->
                <div class="events-selector" ref="eventsSelectorRef">
                    <button class="events-toggle-btn" @click="toggleEventsDropdown" :aria-expanded="isEventsOpen">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V96H40ZM40,112H96v88H40Zm176,88H112V112H216v88Z">
                            </path>
                        </svg>
                        <span v-if="currentEvent">{{ currentEvent.name }}</span>
                    </button>

                    <div v-if="isEventsOpen" class="events-dropdown">
                        <div class="events-dropdown-header">
                            <span>Veranstaltung wählen</span>
                        </div>

                        <button v-for="event in events" :key="event.id" class="event-option"
                            :class="{ 'event-option-active': currentEventId === event.id }" @click="selectEvent(event.id)">
                            <img v-if="event.cimg" :src="event.cimg" :alt="event.name" class="event-option-image" />

                            <div class="event-option-label">
                                <strong>{{ event.name }}</strong>
                                <span v-if="event.rectitle" class="event-option-desc">{{ event.rectitle }}</span>
                            </div>

                            <svg v-if="currentEventId === event.id" fill="currentColor" height="16" viewBox="0 0 256 256"
                                width="16" xmlns="http://www.w3.org/2000/svg" class="event-option-check">
                                <path
                                    d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="topbar-right">
                <!-- View/Edit Mode Toggle (renamed from csv/sql) -->
                <div class="mode-toggle">
                    <button :class="['mode-btn', { active: dataSource === 'csv' }]" @click="setViewMode"
                        title="Ansicht (alte Daten)">
                        view/old
                    </button>
                    <button :class="['mode-btn', { active: dataSource === 'sql' }]" @click="setEditMode"
                        title="Bearbeiten/Erstellen">
                        edit/create
                    </button>
                </div>

                <!-- Save/Cancel Buttons (only visible when hasActiveEdits) -->
                <div v-if="hasActiveEdits" class="action-buttons">
                    <button class="action-btn cancel-btn" @click="handleCancel" title="Änderungen verwerfen">
                        <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                            </path>
                        </svg>
                        Abbrechen
                    </button>
                    <button class="action-btn save-btn" @click="handleSave" title="Änderungen speichern">
                        <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                            </path>
                        </svg>
                        Speichern
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Content: 2-Column Layout -->
        <div class="main-content">
            <!-- Left Column: Demo Content (65%) -->
            <div class="left-column" :class="{ 'full-width': dataSource === 'csv' }">
                <!-- Hero Section (same as /demo) -->
                <div v-if="currentEvent" class="demo-hero">
                    <!-- Edit button (only visible in edit mode) -->
                    <button v-if="dataSource === 'sql'" class="hero-edit-btn" @click="activateEntity('event', currentEvent)"
                        title="Event bearbeiten" :class="{ 'is-active': activeEntityType === 'event' }">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path
                                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>

                    <div class="hero-image" v-if="currentEvent.cimg">
                        <img :src="currentEvent.cimg" :alt="currentEvent.name" />
                    </div>

                    <div class="hero-content">
                        <h2>{{ currentEvent.name }}</h2>
                        <p v-if="currentEvent.rectitle" class="hero-subtitle">{{ currentEvent.rectitle }}</p>
                        <p v-if="currentEvent.teaser" class="hero-teaser">{{ currentEvent.teaser }}</p>
                        <div class="hero-dates">
                            {{ formatEventDate(currentEvent.date_begin) }} – {{ formatEventDate(currentEvent.date_end) }}
                        </div>
                    </div>
                </div>

                <!-- Posts Section -->
                <div v-if="currentEventPosts.length > 0" class="content-section">
                    <h3 class="section-title">Aktuelle Beiträge</h3>
                    <div class="entity-grid">
                        <div v-for="post in currentEventPosts" :key="post.id" class="entity-card"
                            :class="{ 'is-active': activeEntityId === post.id && activeEntityType === 'post' }">
                            <!-- Edit button (only visible in edit mode) -->
                            <button v-if="dataSource === 'sql'" class="entity-edit-btn" @click="activateEntity('post', post)"
                                title="Beitrag bearbeiten">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>

                            <img v-if="post.cimg" :src="post.cimg" :alt="post.name" class="entity-image" />

                            <div class="entity-content">
                                <h4>{{ post.name }}</h4>
                                <p v-if="post.subtitle" class="entity-subtitle">{{ post.subtitle }}</p>
                                <p v-if="post.teaser" class="entity-teaser">{{ post.teaser }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Locations Section -->
                <div v-if="currentEventLocations.length > 0" class="content-section">
                    <h3 class="section-title">Veranstaltungsorte</h3>
                    <div class="entity-grid">
                        <div v-for="location in currentEventLocations" :key="location.id" class="entity-card"
                            :class="{ 'is-active': activeEntityId === location.id && activeEntityType === 'location' }">
                            <!-- Edit button (only visible in edit mode) -->
                            <button v-if="dataSource === 'sql'" class="entity-edit-btn"
                                @click="activateEntity('location', location)" title="Ort bearbeiten">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>

                            <img v-if="location.cimg" :src="location.cimg" :alt="location.name" class="entity-image" />

                            <div class="entity-content">
                                <h4>{{ location.name }}</h4>
                                <p v-if="location.street" class="entity-info">{{ location.street }}</p>
                                <p v-if="location.zip || location.city" class="entity-info">{{ location.zip }} {{
                                    location.city }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Instructors Section -->
                <div v-if="currentEventInstructors.length > 0" class="content-section">
                    <h3 class="section-title">Kursleiter</h3>
                    <div class="entity-grid">
                        <div v-for="instructor in currentEventInstructors" :key="instructor.id" class="entity-card"
                            :class="{ 'is-active': activeEntityId === instructor.id && activeEntityType === 'instructor' }">
                            <!-- Edit button (only visible in edit mode) -->
                            <button v-if="dataSource === 'sql'" class="entity-edit-btn"
                                @click="activateEntity('instructor', instructor)" title="Kursleiter bearbeiten">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>

                            <img v-if="instructor.cimg" :src="instructor.cimg" :alt="instructor.name"
                                class="entity-image" />

                            <div class="entity-content">
                                <h4>{{ instructor.name }}</h4>
                                <p v-if="instructor.description" class="entity-info">{{ instructor.description }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Editing Forms (35%, hidden in view mode) -->
            <div v-if="dataSource === 'sql'" class="right-column">
                <div class="right-column-content">
                    <p class="placeholder-text">🚧 Editing forms coming soon</p>
                    <p class="placeholder-subtext">
                        Active: {{ activeEntityType || 'none' }}<br>
                        Entity ID: {{ activeEntityId || 'none' }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDemoData } from '@/composables/useDemoData'
import { useAuth } from '@/composables/useAuth'

const { user, requireAuth } = useAuth()

// Demo data composable
const {
    events,
    currentEvent,
    currentEventId,
    currentEventPosts,
    currentEventLocations,
    currentEventInstructors,
    switchEvent,
    dataSource,
    refreshSqlData
} = useDemoData()

// Events dropdown
const isEventsOpen = ref(false)
const eventsSelectorRef = ref<HTMLElement>()

// Active entity (currently being edited)
const activeEntityType = ref<'event' | 'post' | 'location' | 'instructor' | null>(null)
const activeEntityId = ref<string | null>(null)

// Edit state
const hasActiveEdits = ref(false)

// Methods
const toggleEventsDropdown = () => {
    isEventsOpen.value = !isEventsOpen.value
}

const selectEvent = (eventId: string) => {
    switchEvent(eventId)
    isEventsOpen.value = false
    // Reset active entity when switching events
    if (dataSource.value === 'sql' && currentEvent.value) {
        activateEntity('event', currentEvent.value)
    }
}

const setViewMode = () => {
    dataSource.value = 'csv'
    // Clear active entity in view mode
    activeEntityType.value = null
    activeEntityId.value = null
    hasActiveEdits.value = false
}

const setEditMode = async () => {
    dataSource.value = 'sql'
    await refreshSqlData()
    // Activate event by default when entering edit mode
    if (currentEvent.value) {
        activateEntity('event', currentEvent.value)
    }
}

const activateEntity = (type: 'event' | 'post' | 'location' | 'instructor', entity: any) => {
    activeEntityType.value = type
    activeEntityId.value = entity.id
    console.log('Activated entity:', type, entity.id)
    // TODO: Load entity data into forms
}

const handleSave = async () => {
    try {
        // TODO: Implement save logic
        console.log('Saving changes...')
        await refreshSqlData()
        hasActiveEdits.value = false

        // If in subEntity mode, return to event
        if (activeEntityType.value !== 'event' && currentEvent.value) {
            activateEntity('event', currentEvent.value)
        }
    } catch (error) {
        console.error('Error saving:', error)
        alert('Fehler beim Speichern!')
    }
}

const handleCancel = () => {
    if (hasActiveEdits.value) {
        const confirmed = window.confirm('Änderungen verwerfen?')
        if (!confirmed) return
    }

    hasActiveEdits.value = false

    // If in subEntity mode, return to event
    if (activeEntityType.value !== 'event' && currentEvent.value) {
        activateEntity('event', currentEvent.value)
    }
}

const formatEventDate = (dateString: string) => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    } catch {
        return dateString
    }
}

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
    if (eventsSelectorRef.value && !eventsSelectorRef.value.contains(event.target as Node)) {
        isEventsOpen.value = false
    }
}

// Watch data source changes
watch(dataSource, (newSource) => {
    if (newSource === 'csv') {
        // In view mode, clear active entity
        activeEntityType.value = null
        activeEntityId.value = null
        hasActiveEdits.value = false
    }
})

// Initialize
onMounted(async () => {
    await requireAuth()
    document.addEventListener('click', handleClickOutside)

    // Start in view mode with CSV data
    dataSource.value = 'csv'
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.base-view {
    min-height: 100vh;
    background: var(--color-bg);
    display: flex;
    flex-direction: column;
}

/* ===== TOP BAR ===== */
.topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--color-card-bg);
    border-bottom: var(--border) solid var(--color-border);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.05);
}

.topbar-left {
    flex-shrink: 0;
}

.topbar-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0;
}

.topbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
}

.topbar-right {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Events Selector */
.events-selector {
    position: relative;
}

.events-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-muted-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-contrast);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.events-toggle-btn:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.events-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    min-width: 20rem;
    max-width: 24rem;
    background: var(--color-popover-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: 0 10px 25px -3px oklch(0% 0 0 / 0.1);
    max-height: 70vh;
    overflow-y: auto;
    z-index: 200;
}

.events-dropdown-header {
    padding: 0.75rem 1rem;
    border-bottom: var(--border) solid var(--color-border);
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-contrast);
}

.event-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;
    gap: 0.75rem;
}

.event-option:hover {
    background: var(--color-muted-bg);
}

.event-option-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.event-option-image {
    width: 3rem;
    height: 3rem;
    object-fit: cover;
    border-radius: 0.375rem;
    flex-shrink: 0;
}

.event-option-label {
    flex: 1;
    min-width: 0;
}

.event-option-label strong {
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
}

.event-option-desc {
    display: block;
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.125rem;
}

.event-option-check {
    flex-shrink: 0;
}

/* Mode Toggle */
.mode-toggle {
    display: flex;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
}

.mode-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: var(--color-dimmed);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mode-btn:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.mode-btn.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cancel-btn {
    background: var(--color-card-bg);
    color: var(--color-contrast);
}

.cancel-btn:hover {
    background: var(--color-muted-bg);
}

.save-btn {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.save-btn:hover {
    opacity: 0.9;
}

/* ===== MAIN CONTENT ===== */
.main-content {
    display: flex;
    flex: 1;
    gap: 1rem;
    padding: 2rem;
    max-width: 100%;
}

/* Left Column */
.left-column {
    flex: 0 0 65%;
    overflow-y: auto;
}

.left-column.full-width {
    flex: 1;
}

/* Right Column */
.right-column {
    flex: 0 0 35%;
    overflow-y: auto;
    border-left: var(--border) solid var(--color-border);
    padding-left: 1rem;
}

.right-column-content {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    padding: 2rem;
    text-align: center;
}

.placeholder-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0 0 1rem 0;
}

.placeholder-subtext {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    line-height: 1.6;
}

/* ===== DEMO CONTENT (LEFT COLUMN) ===== */
.demo-hero {
    position: relative;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
    margin-bottom: 2rem;
    transition: all 0.2s ease;
}

.hero-edit-btn {
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-contrast);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
}

.hero-edit-btn:hover,
.hero-edit-btn.is-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px oklch(0% 0 0 / 0.15);
}

.hero-edit-btn svg {
    width: 1.25rem;
    height: 1.25rem;
}

.hero-image {
    width: 100%;
    height: 16rem;
    overflow: hidden;
}

.hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.hero-content {
    padding: 1.5rem;
}

.hero-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--color-contrast);
}

.hero-subtitle {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-primary-bg);
    margin: 0 0 0.5rem 0;
}

.hero-teaser {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0 0 1rem 0;
    line-height: 1.5;
}

.hero-dates {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    font-weight: 500;
}

/* Content Sections */
.content-section {
    margin-bottom: 2rem;
}

.section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--color-contrast);
}

.entity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.entity-card {
    position: relative;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
    transition: all 0.2s ease;
}

.entity-card:hover {
    box-shadow: 0 4px 12px oklch(0% 0 0 / 0.1);
}

.entity-card.is-active {
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.entity-edit-btn {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-contrast);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
}

.entity-edit-btn:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    transform: translateY(-1px);
}

.entity-edit-btn svg {
    width: 1rem;
    height: 1rem;
}

.entity-image {
    width: 100%;
    height: 10rem;
    object-fit: cover;
}

.entity-content {
    padding: 1rem;
}

.entity-content h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--color-contrast);
}

.entity-subtitle,
.entity-teaser,
.entity-info {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0 0 0.25rem 0;
    line-height: 1.4;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
    .main-content {
        flex-direction: column;
    }

    .left-column,
    .right-column {
        flex: 1;
        border-left: none;
        padding-left: 0;
    }
}

@media (max-width: 768px) {
    .topbar {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .topbar-center {
        justify-content: flex-start;
    }

    .topbar-right {
        flex-wrap: wrap;
    }

    .entity-grid {
        grid-template-columns: 1fr;
    }

    .main-content {
        padding: 1rem;
    }
}
</style>
