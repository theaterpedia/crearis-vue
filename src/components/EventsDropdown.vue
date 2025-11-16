<template>
    <div class="events-dropdown">
        <div class="events-dropdown-header">
            <span>{{ headerText }}</span>
        </div>

        <button v-for="event in events" :key="event.id" class="event-option"
            :class="{ 'event-option-active': isSelected(event.id) }" :style="getEventBackgroundStyle(event)"
            @click="handleSelect(event)">

            <!-- Background Fade Overlay (similar to TaskCard) -->
            <div v-if="event.cimg" class="event-background-fade"></div>

            <!-- Event Image -->
            <img v-if="event.cimg" :src="event.cimg" :alt="event.name" class="event-option-image" />

            <!-- Event Label with HeadingParser -->
            <div class="event-option-label">
                <HeadingParser :content="event.name" as="p" :compact="true" />
            </div>

            <!-- Check Mark for Selected Event -->
            <svg v-if="showCheckMark && isSelected(event.id)" fill="currentColor" height="16" viewBox="0 0 256 256"
                width="16" xmlns="http://www.w3.org/2000/svg" class="event-option-check">
                <path
                    d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                </path>
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
import HeadingParser from './HeadingParser.vue'

interface Event {
    id: string
    name: string
    cimg?: string
    teaser?: string
    [key: string]: any
}

const props = withDefaults(defineProps<{
    events: Event[]
    selectedEventId?: string | null
    headerText?: string
    showCheckMark?: boolean
}>(), {
    headerText: 'Veranstaltung wählen',
    showCheckMark: true
})

const emit = defineEmits<{
    select: [event: Event]
}>()

const isSelected = (eventId: string) => {
    return props.selectedEventId === eventId
}

const getEventBackgroundStyle = (event: Event) => {
    if (event.cimg) {
        return {
            backgroundImage: `url('${event.cimg}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }
    }
    return {}
}

const handleSelect = (event: Event) => {
    emit('select', event)
}
</script>

<style scoped>
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
    background: var(--color-popover-bg);
    position: sticky;
    top: 0;
    z-index: 1;
}

.event-option {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 4rem;
    padding: 0.75rem 1rem;
    border: none;
    background: var(--color-popover-bg);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;
    gap: 0.75rem;
    overflow: hidden;
}

.event-option:hover {
    background: var(--color-muted-bg);
}

.event-option-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* Background fade overlay (similar to TaskCard) */
.event-background-fade {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right,
            oklch(100% 0 0 / 0) 0%,
            oklch(100% 0 0 / 0.7) 50%,
            oklch(100% 0 0 / 1) 100%);
    pointer-events: none;
    z-index: 0;
}

.event-option-image {
    width: 3rem;
    height: 3rem;
    object-fit: cover;
    border-radius: 0.375rem;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.event-option-label {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
    background: oklch(100% 0 0 / 0.4);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
}

.event-option-label :deep(p) {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-option-check {
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

/* Active state overrides for better contrast */
.event-option-active .event-option-label {
    background: oklch(100% 0 0 / 0.6);
}

.event-option-active .event-background-fade {
    background: linear-gradient(to right,
            var(--color-primary-bg) 0%,
            var(--color-primary-bg) 50%,
            var(--color-primary-bg) 100%);
    opacity: 0.9;
}
</style>
