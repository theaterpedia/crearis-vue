<!--
  ItemRow.vue - Horizontal row layout with 64×64px avatars
  
  DESIGN SPECIFICATION: /docs/CLIST_DESIGN_SPEC.md
  Component README: /src/components/clist/README.md
  
  This component's design, dimensions, and behavior are controlled by the
  official CList Design Specification. Consult the spec before making changes.
  
  Usage: Automatically used when ItemList has size="small"
-->
<template>
    <div class="item-row" :class="{
        'is-selected': isSelected,
        [`marker-${markerColor}`]: showMarker
    }" @click="$emit('click', $event)">
        <div class="row-col-image">
            <!-- CornerBanner for demo entities (8x8 triangle) -->
            <CornerBanner size="thumb" :entity="models?.entity" />

            <!-- Warning icon overlay for deprecated cimg usage -->
            <div v-if="deprecated" class="deprecated-warning" title="Using deprecated cimg field">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1l6.928 12H1.072L8 1z" stroke="currentColor" stroke-width="1" fill="none" />
                    <path d="M8 6v3M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
            </div>

            <!-- Entity Icon (overlays on avatar) -->
            <div v-if="showEntityIcon && entityIcon" class="entity-icon" :title="entityType">
                {{ entityIcon }}
            </div>

            <!-- Badge with optional counter (top-right of avatar) -->
            <div v-if="showBadge" class="badge" :class="`badge-${badgeColor}`">
                <span v-if="showCounter">{{ counterValue }}</span>
            </div>

            <!-- Selection checkbox (bottom-left of avatar) -->
            <div v-if="showSelectable" class="checkbox" :class="{ checked: isSelected }">
                <svg v-if="isSelected" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.5 3.5L6 11l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" fill="none" />
                </svg>
            </div>

            <!-- Trash icon (bottom-right of avatar) -->
            <div v-if="showTrash" class="trash-icon" @click.stop="emit('trash')" title="Remove item">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5v6M8 5.5v6M10.5 5.5v6M3 3.5h10M6 3.5V2.5A.5.5 0 016.5 2h3a.5.5 0 01.5.5v1M4.5 3.5l.5 10a1 1 0 001 1h4a1 1 0 001-1l.5-10" 
                        stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                </svg>
            </div>

            <!-- Image with data mode -->
            <ImgShape v-if="dataMode && data" :data="data" :shape="shape || 'thumb'" :avatar="shouldUseAvatar"
                class="image-box" />
            <!-- Legacy image -->
            <img v-else-if="cimg" :src="cimg" :alt="heading" class="image-box" loading="lazy" />
            <!-- Placeholder -->
            <div v-else class="image-box image-placeholder"></div>
        </div>
        <div class="row-col-content">
            <HeadingParser :content="computedHeading" :as="headingLevel" :compact="true" scope="element"
                v-bind="$attrs" />
        </div>
        <div v-if="$slots.default" class="row-col-slot">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HeadingParser from '../HeadingParser.vue'
import ImgShape, { type ImgShapeData } from '@/components/images/ImgShape.vue'
import { useTheme } from '@/composables/useTheme'
import type { ItemOptions, ItemModels } from './types'
import CornerBanner from '@/components/CornerBanner.vue'
import { formatDateTime } from '@/plugins/dateTimeFormat'

interface Props {
    heading: string
    cimg?: string
    size?: 'small' // Only small size supported
    cols?: 1 | 2 | 3
    data?: ImgShapeData
    shape?: 'square' | 'wide' | 'thumb' | 'vertical'
    deprecated?: boolean // Flag for deprecated cimg usage
    headingLevel?: 'h3' | 'h4' | 'h5' // Configurable heading level
    headingPrefix?: string // Optional prefix for heading (e.g., event date)
    dateBegin?: string // ISO date string for events (date_begin)
    dateEnd?: string // ISO date string for events (date_end)
    options?: ItemOptions // Visual indicators config
    models?: ItemModels // Item state models
}

const props = withDefaults(defineProps<Props>(), {
    size: 'small',
    cols: 2,
    headingLevel: 'h5',
    options: () => ({}),
    models: () => ({})
})

const emit = defineEmits<{
    click: [event: MouseEvent]
    trash: []
}>()

const dataMode = computed(() => props.data !== undefined)

// Query useTheme for avatar dimensions
const { avatarWidth } = useTheme()
const imageDimension = computed(() => avatarWidth.value || 64)

// Computed helpers for options
const showEntityIcon = computed(() => props.options?.entityIcon === true)
const showBadge = computed(() => props.options?.badge === true)
const showCounter = computed(() => props.options?.counter === true)
const showSelectable = computed(() => props.options?.selectable === true)
const showMarker = computed(() => props.options?.marker === true)
const showTrash = computed(() => props.options?.trash === true)

// Get model values with defaults
const isSelected = computed(() => props.models?.selected === true)
const counterValue = computed(() => props.models?.count || 0)
const markerColor = computed(() => props.models?.marked || 'accent')
const entityType = computed(() => props.models?.entityType)
const badgeColor = computed(() => props.models?.badgeColor || 'primary')

// Icon mapping for entity types
const entityIcons = {
    'instructor': '👤',
    'user': '👤',
    'event': '👥',
    'location': '🎭',
    'blog-post': '📝',
    'project': '📁'
}

const entityIcon = computed(() => {
    if (!entityType.value) return ''
    return entityIcons[entityType.value as keyof typeof entityIcons] || ''
})

// Avatar option decision logic
const shouldUseAvatar = computed(() => {
    if (!props.data?.xmlid) return false

    // Parse xmlID: "tp.event.festival-2024" → entity type is second fragment
    const parts = props.data.xmlid.split('.')
    if (parts.length < 2) return false

    const entityType = parts[1] // 'event', 'instructor', 'post', etc.

    // Avatar entities: events, instructors, posts
    const avatarEntities = ['event', 'instructor', 'post']
    const isAvatarEntity = avatarEntities.includes(entityType)

    // Avatar shapes: thumb, square only
    const currentShape = props.shape || 'thumb'
    const isAvatarShape = currentShape === 'thumb' || currentShape === 'square'

    // Both conditions must be true
    return isAvatarEntity && isAvatarShape
})

/**
 * Format date prefix using the dateTimeFormat plugin
 * Returns formatted date string for heading prefix (e.g., "FR 14.11 ")
 */
function formatDatePrefix(dateBegin: string, dateEnd?: string): string {
    const formatted = formatDateTime({
        start: dateBegin,
        end: dateEnd || undefined,
        format: 'standard',
        showTime: false,
        rows: 'row'
    })
    return formatted ? `${formatted} ` : ''
}

/**
 * Computed heading with optional prefix injected at the correct position
 */
const computedHeading = computed(() => {
    let prefix = props.headingPrefix

    // If no explicit prefix but dateBegin is provided, format the date
    if (!prefix && props.dateBegin) {
        prefix = formatDatePrefix(props.dateBegin, props.dateEnd)
    }

    if (!prefix) return props.heading

    const heading = props.heading

    // Check if heading has ** markers (indicates structured format)
    const firstStarPos = heading.indexOf('**')
    const secondStarPos = heading.indexOf('**', firstStarPos + 2)

    if (firstStarPos === -1) {
        // No ** markers: just prepend
        return prefix + heading
    }

    if (secondStarPos === -1) {
        // Only one ** marker: prepend before it
        return prefix + heading
    }

    // Two ** markers found
    if (firstStarPos === 0) {
        // Format: **Headline** subline
        // Insert after second **
        return heading.slice(0, secondStarPos + 2) + prefix + heading.slice(secondStarPos + 2)
    } else {
        // Format: overline **Headline**
        // Insert at beginning
        return prefix + heading
    }
})
</script>

<style scoped>
.item-row {
    display: grid;
    gap: 1rem;
    align-items: center;
    padding: 0;
    /* No padding as per spec */
    background-color: var(--color-card-bg);
    border-radius: var(--radius);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    height: v-bind('imageDimension + "px"');
    /* Follow imgShape height from useTheme */
}

.item-row:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Selected state */
.item-row.is-selected {
    box-shadow: 0 0 0 2px var(--color-primary-bg);
}

/* Marker bars (left side accent) */
.item-row.marker-primary {
    border-left: 3px solid var(--color-primary-bg);
}

.item-row.marker-secondary {
    border-left: 3px solid var(--color-secondary-bg);
}

.item-row.marker-accent {
    border-left: 3px solid var(--color-accent-bg);
}

.item-row.marker-muted {
    border-left: 3px solid var(--color-muted-bg);
}

.item-row.marker-warning {
    border-left: 3px solid var(--color-warning-bg);
}

.item-row.marker-positive {
    border-left: 3px solid var(--color-positive-bg);
}

.item-row.marker-negative {
    border-left: 3px solid var(--color-negative-bg);
}

/* Grid template with 2 columns by default */
.item-row {
    grid-template-columns: auto 1fr;
}

/* 3 columns when slot is provided */
.item-row:has(.row-col-slot) {
    grid-template-columns: auto 1fr auto;
}

/* Column widths - query from useTheme */
.row-col-image {
    width: v-bind('imageDimension + "px"');
    position: relative;
}

.row-col-slot {
    min-width: 120px;
}

/* Entity Icon (top-left of avatar) */
.entity-icon {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: oklch(from var(--color-card-bg) l c h / 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Badge (top-right of avatar) */
.badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.badge-primary {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.badge-secondary {
    background: var(--color-secondary-bg);
    color: var(--color-secondary-contrast);
}

.badge-accent {
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
}

.badge-muted {
    background: var(--color-muted-bg);
    color: var(--color-muted-contrast);
}

.badge-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-contrast);
}

.badge-positive {
    background: var(--color-positive-bg);
    color: var(--color-positive-contrast);
}

.badge-negative {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}

/* Checkbox (bottom-left of avatar) */
.checkbox {
    position: absolute;
    bottom: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: var(--color-card-bg);
    border: 2px solid var(--color-border);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s;
}

.checkbox:hover {
    border-color: var(--color-primary-bg);
    background: var(--color-primary-lighter, #eff6ff);
}

.checkbox.checked {
    background: var(--color-primary-bg);
    border-color: var(--color-primary-bg);
    color: white;
}

/* Trash icon (bottom-right of avatar) */
.trash-icon {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    background: var(--color-card-bg);
    border: 2px solid var(--color-border);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s;
    color: var(--color-muted);
}

.trash-icon:hover {
    border-color: var(--color-negative-bg);
    background: var(--color-negative-lighter, #fef2f2);
    color: var(--color-negative-bg);
}

/* Deprecated warning icon overlay */
.deprecated-warning {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background-color: rgba(245, 158, 11, 0.95);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
    z-index: 10;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: help;
}

.deprecated-warning svg {
    width: 12px;
    height: 12px;
}

/* Image box - dimensions from useTheme */
.image-box {
    width: v-bind('imageDimension + "px"');
    height: v-bind('imageDimension + "px"');
    border-radius: var(--radius);
    overflow: hidden;
    object-fit: cover;
}

.image-placeholder {
    background-color: var(--color-neutral-bg);
}

.row-col-content {
    overflow: hidden;
}
</style>
