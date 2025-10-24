<template>
  <div class="demo-page">
    <!-- Navbar -->
    <Navbar :user="user" :full-width="false" logo-text="🎭 Demo" @logout="logout">
      <template #menus>
        <!-- Events Dropdown (center content) -->
        <div class="navbar-item events-selector" ref="eventsSelectorRef">
          <button class="navbar-button events-toggle-btn" @click="toggleEventsDropdown" :aria-expanded="isEventsOpen">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
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
                <HeadingParser :content="event.name" as="p" />
              </div>

              <svg v-if="currentEventId === event.id" fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                xmlns="http://www.w3.org/2000/svg" class="event-option-check">
                <path
                  d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                </path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Data Source Toggle -->
        <div class="navbar-item mode-toggle">
          <button :class="['mode-btn', { active: dataSource === 'csv' }]" @click="dataSource = 'csv'"
            title="CSV Daten (alte Daten)">
            view/old
          </button>
          <button :class="['mode-btn', { active: dataSource === 'sql' }]" @click="switchToSql" title="SQL Daten">
            edit/create
          </button>
        </div>
      </template>
    </Navbar>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Hero Section -->
      <div v-if="currentEvent" class="demo-hero">
        <div class="hero-image" v-if="currentEvent.cimg">
          <img :src="currentEvent.cimg" :alt="currentEvent.name" />
        </div>

        <div class="hero-content">
          <HeadingParser :content="currentEvent.name" as="h2" />
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
          <div v-for="post in currentEventPosts" :key="post.id" class="entity-card">
            <img v-if="post.cimg" :src="post.cimg" :alt="post.name" class="entity-image" />

            <div class="entity-content">
              <HeadingParser :content="post.name" as="h4" />
              <p v-if="post.teaser" class="entity-teaser">{{ post.teaser }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Locations Section -->
      <div v-if="currentEventLocations.length > 0" class="content-section">
        <h3 class="section-title">Veranstaltungsorte</h3>
        <div class="entity-grid">
          <div v-for="location in currentEventLocations" :key="location.id" class="entity-card">
            <img v-if="location.cimg" :src="location.cimg" :alt="location.name" class="entity-image" />

            <div class="entity-content">
              <HeadingParser :content="location.name" as="h4" />
              <p v-if="location.street" class="entity-info">{{ location.street }}</p>
              <p v-if="location.zip || location.city" class="entity-info">{{ location.zip }} {{ location.city }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Instructors Section -->
      <div v-if="currentEventInstructors.length > 0" class="content-section">
        <h3 class="section-title">Kursleiter</h3>
        <div class="entity-grid">
          <div v-for="instructor in currentEventInstructors" :key="instructor.id" class="entity-card">
            <img v-if="instructor.cimg" :src="instructor.cimg" :alt="instructor.name" class="entity-image" />

            <div class="entity-content">
              <HeadingParser :content="instructor.name" as="h4" />
              <p v-if="instructor.description" class="entity-info">{{ instructor.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Participants Section -->
      <div v-if="hasParticipants" class="content-section">
        <h3 class="section-title">Teilnehmer</h3>

        <div v-if="currentEventChildren.length > 0" class="participant-subsection">
          <h4 class="subsection-title">Kinder</h4>
          <div class="entity-grid participants-grid">
            <div v-for="participant in currentEventChildren.slice(0, 4)" :key="participant.id" class="entity-card">
              <img v-if="participant.cimg" :src="participant.cimg" :alt="participant.name" class="entity-image" />
              <div class="entity-content">
                <HeadingParser :content="participant.name" as="h5" />
                <p v-if="participant.city" class="entity-info">{{ participant.city }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentEventTeens.length > 0" class="participant-subsection">
          <h4 class="subsection-title">Jugendliche</h4>
          <div class="entity-grid participants-grid">
            <div v-for="participant in currentEventTeens.slice(0, 4)" :key="participant.id" class="entity-card">
              <img v-if="participant.cimg" :src="participant.cimg" :alt="participant.name" class="entity-image" />
              <div class="entity-content">
                <HeadingParser :content="participant.name" as="h5" />
                <p v-if="participant.city" class="entity-info">{{ participant.city }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentEventAdults.length > 0" class="participant-subsection">
          <h4 class="subsection-title">Erwachsene</h4>
          <div class="entity-grid participants-grid">
            <div v-for="participant in currentEventAdults.slice(0, 4)" :key="participant.id" class="entity-card">
              <img v-if="participant.cimg" :src="participant.cimg" :alt="participant.name" class="entity-image" />
              <div class="entity-content">
                <HeadingParser :content="participant.name" as="h5" />
                <p v-if="participant.city" class="entity-info">{{ participant.city }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <DemoToggle />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useDemoData } from '../composables/useDemoData'
import DemoToggle from '@/components/DemoToggle.vue'
import { useAuth } from '@/composables/useAuth'
import Navbar from '@/components/Navbar.vue'
import HeadingParser from '@/components/HeadingParser.vue'

// Auth
const { user, logout: authLogout } = useAuth()

// Logout handler
const logout = () => {
  authLogout()
}

// Demo data
const {
  events,
  currentEvent,
  currentEventId,
  currentEventPosts,
  currentEventLocations,
  currentEventInstructors,
  currentEventChildren,
  currentEventTeens,
  currentEventAdults,
  switchEvent,
  dataSource,
  refreshSqlData
} = useDemoData()

// Events dropdown state
const isEventsOpen = ref(false)
const eventsSelectorRef = ref<HTMLElement>()

const toggleEventsDropdown = () => {
  isEventsOpen.value = !isEventsOpen.value
}

const selectEvent = (eventId: string) => {
  switchEvent(eventId)
  isEventsOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  if (eventsSelectorRef.value && !eventsSelectorRef.value.contains(event.target as Node)) {
    isEventsOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Date formatting
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

// Computed properties
const hasParticipants = computed(() => {
  return currentEventChildren.value.length > 0 ||
    currentEventTeens.value.length > 0 ||
    currentEventAdults.value.length > 0
})

// Switch to SQL data source
const switchToSql = async () => {
  dataSource.value = 'sql'
  await refreshSqlData()
}
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

/* ===== NAVBAR SLOT COMPONENTS ===== */

/* Events Selector */
.events-selector {
  position: relative;
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

/* ===== MAIN CONTENT ===== */
.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 100%;
}

/* ===== HERO SECTION ===== */
.demo-hero {
  background: var(--color-card-bg);
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
  overflow: hidden;
  margin-bottom: 2rem;
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

/* ===== CONTENT SECTIONS ===== */
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
  background: var(--color-card-bg);
  border: var(--border) solid var(--color-border);
  border-radius: var(--radius-button);
  overflow: hidden;
  transition: all 0.2s ease;
}

.entity-card:hover {
  box-shadow: 0 4px 12px oklch(0% 0 0 / 0.1);
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

.entity-content h5 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
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

/* Participants */
.participant-subsection {
  margin-bottom: 1.5rem;
}

.participant-subsection:last-child {
  margin-bottom: 0;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: var(--color-contrast);
}

.participants-grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* ===== RESPONSIVE ===== */
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