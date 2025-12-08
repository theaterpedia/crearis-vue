<template>
    <div class="odoo-event-card" :class="[`kanban-${event.kanban_state}`]">
        <!-- Stage Badge -->
        <div class="event-state-badge" :style="{ background: stageInfo.color }">
            {{ stageInfo.label }}
        </div>

        <!-- Hero Image (if cimg exists) -->
        <div v-if="event.cimg" class="event-hero">
            <img :src="event.cimg" :alt="event.name" class="hero-image" />
        </div>

        <!-- Event Header -->
        <div class="event-header">
            <h4 class="event-name">{{ event.rectitle || event.name }}</h4>
            <div class="event-meta">
                <span v-if="event.cid" class="event-cid">{{ event.cid }}</span>
                <span v-else class="event-id">#{{ event.odoo_id }}</span>
                <span v-if="event.event_type_id" class="event-type-tag">
                    {{ event.event_type_id.name }}
                </span>
            </div>
        </div>

        <!-- Teasertext -->
        <p v-if="event.teasertext" class="event-teaser">
            {{ event.teasertext }}
        </p>

        <!-- Event Dates -->
        <div class="event-dates">
            <div class="date-row">
                <span class="date-icon">🗓️</span>
                <span class="date-value">{{ formattedDateBegin }}</span>
            </div>
            <div v-if="!isSingleDay" class="date-row date-end">
                <span class="date-icon">→</span>
                <span class="date-value">{{ formattedDateEnd }}</span>
            </div>
            <div class="duration-badge">
                {{ duration }}
            </div>
        </div>

        <!-- Domain Badge -->
        <div v-if="event.domain_code" class="event-domain">
            <span class="domain-icon">🌐</span>
            <span class="domain-name">{{ event.domain_code.name }}</span>
        </div>

        <!-- Seats Info -->
        <div v-if="event.seats_max > 0" class="event-seats">
            <div class="seats-bar">
                <div class="seats-filled" :style="{ width: seatsPercentage + '%' }"></div>
            </div>
            <div class="seats-text">
                {{ event.seats_used }} / {{ event.seats_max }} Plätze
                <span v-if="event.seats_available > 0" class="seats-available">
                    ({{ event.seats_available }} frei)
                </span>
            </div>
        </div>

        <!-- Location -->
        <div v-if="event.location" class="event-location">
            <span class="location-icon">📍</span>
            <span class="location-name">{{ event.location.name }}</span>
        </div>

        <!-- Version & Edit Mode -->
        <div class="event-footer">
            <span class="version-badge" :title="`Version ${event.version}`">
                v{{ event.version }}
            </span>
            <span class="edit-mode-badge" :class="`edit-${event.edit_mode}`">
                {{ event.edit_mode }}
            </span>
        </div>

        <!-- Actions -->
        <div class="event-actions">
            <button v-if="event.website_url" class="action-btn view-btn" @click="openWebsite"
                title="Auf Website ansehen">
                🌐
            </button>
            <button class="action-btn edit-btn" @click="$emit('edit', event)" title="In Odoo bearbeiten">
                ✏️
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OdooEvent } from '@/types/odooEvent'
import { getStageDisplayInfo, formatEventDate, isSingleDayEvent, getEventDuration } from '@/types/odooEvent'

const props = defineProps<{
    event: OdooEvent
}>()

defineEmits<{
    edit: [event: OdooEvent]
}>()

const stageInfo = computed(() => getStageDisplayInfo(props.event.stage_id?.name || null))

const formattedDateBegin = computed(() => formatEventDate(props.event.date_begin))
const formattedDateEnd = computed(() => formatEventDate(props.event.date_end))
const isSingleDay = computed(() => isSingleDayEvent(props.event))
const duration = computed(() => getEventDuration(props.event))

const seatsPercentage = computed(() => {
    if (!props.event.seats_max) return 0
    return Math.round((props.event.seats_used / props.event.seats_max) * 100)
})

const openWebsite = () => {
    if (props.event.website_url) {
        window.open(props.event.website_url, '_blank')
    }
}
</script>

<style scoped>
.odoo-event-card {
    position: relative;
    background: var(--color-card-bg, #fff);
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: var(--radius-card, 12px);
    padding: 1.25rem;
    transition: all 0.2s ease;
    overflow: hidden;
}

.odoo-event-card:hover {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* State Badge */
.event-state-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    z-index: 10;
}

/* Hero Image */
.event-hero {
    margin: -1.25rem -1.25rem 1rem -1.25rem;
    height: 120px;
    overflow: hidden;
}

.hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Header */
.event-header {
    margin-bottom: 0.75rem;
}

.event-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-contrast, #1a1a1a);
    margin: 0 0 0.375rem 0;
    line-height: 1.3;
}

.event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.event-cid,
.event-id {
    font-size: 0.7rem;
    color: var(--color-dimmed, #888);
    font-family: monospace;
    background: var(--color-bg, #f5f5f5);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
}

.event-type-tag {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
    background: oklch(90% 0.1 250);
    color: oklch(40% 0.15 250);
    border-radius: 10px;
    font-weight: 500;
}

/* Teaser */
.event-teaser {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #555);
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Dates */
.event-dates {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg, #f8f9fa);
    border-radius: 8px;
}

.date-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.date-icon {
    width: 1.25rem;
}

.date-value {
    color: var(--color-contrast, #1a1a1a);
}

.date-end {
    padding-left: 0.25rem;
}

.duration-badge {
    align-self: flex-start;
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: var(--color-primary-bg, #e0f2fe);
    color: var(--color-primary, #0284c7);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}

/* Domain */
.event-domain {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8rem;
    color: var(--color-dimmed, #666);
    margin-bottom: 0.5rem;
}

/* Seats */
.event-seats {
    margin-bottom: 0.75rem;
}

.seats-bar {
    height: 6px;
    background: var(--color-border, #e0e0e0);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.25rem;
}

.seats-filled {
    height: 100%;
    background: var(--color-primary, #3b82f6);
    transition: width 0.3s ease;
}

.seats-text {
    font-size: 0.75rem;
    color: var(--color-dimmed, #666);
}

.seats-available {
    color: var(--color-success, #22c55e);
}

/* Location */
.event-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text, #333);
    margin-bottom: 0.5rem;
}

.location-icon {
    width: 1.25rem;
}

/* Footer */
.event-footer {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
}

.version-badge {
    font-size: 0.7rem;
    padding: 0.125rem 0.375rem;
    background: var(--color-bg, #f0f0f0);
    color: var(--color-dimmed, #888);
    border-radius: 3px;
    font-family: monospace;
}

.edit-mode-badge {
    font-size: 0.7rem;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-weight: 500;
}

.edit-locked {
    background: oklch(90% 0.05 25);
    color: oklch(45% 0.15 25);
}

.edit-blocks {
    background: oklch(90% 0.05 250);
    color: oklch(45% 0.15 250);
}

.edit-content {
    background: oklch(90% 0.05 140);
    color: oklch(40% 0.15 140);
}

.edit-full {
    background: oklch(90% 0.05 300);
    color: oklch(45% 0.15 300);
}

/* Actions */
.event-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border, #e0e0e0);
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--color-border, #e0e0e0);
    border-radius: 6px;
    background: var(--color-bg, #fff);
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background: var(--color-primary-bg, #e0f2fe);
    border-color: var(--color-primary, #3b82f6);
}

/* State-specific styling */
.state-draft {
    border-left: 4px solid var(--color-warning, #f59e0b);
}

.state-confirm {
    border-left: 4px solid var(--color-success, #22c55e);
}

.state-done {
    border-left: 4px solid var(--color-dimmed, #888);
    opacity: 0.8;
}

.state-cancel {
    border-left: 4px solid var(--color-danger, #ef4444);
    opacity: 0.6;
}
</style>
