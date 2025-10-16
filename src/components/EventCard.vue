<template>
    <div class="event-card">
        <div v-if="event.cimg" class="event-card-image">
            <img :src="event.cimg" :alt="event.name" />
        </div>
        <div class="event-card-content">
            <div class="event-card-heading">
                <HeadingParser :content="event.name" as="h4" />
            </div>
            <p v-if="event.teaser" class="event-card-teaser">{{ event.teaser }}</p>
            <div v-if="instructor" class="event-card-instructor">
                <span class="instructor-label">Instructor:</span>
                <span class="instructor-name">{{ instructor.name }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import HeadingParser from './HeadingParser.vue'

const props = defineProps<{
    event: any
    instructors?: any[]
}>()

const instructor = computed(() => {
    if (!props.event.public_user || !props.instructors) return null
    return props.instructors.find((i: any) => i.id === props.event.public_user)
})
</script>

<style scoped>
.event-card {
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
    cursor: pointer;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.event-card:hover {
    border-color: var(--color-border-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.event-card-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--color-background-mute);
}

.event-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.event-card-content {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.event-card-heading {
    font-weight: 600;
    color: var(--color-heading);
}

.event-card-teaser {
    font-size: 0.875rem;
    color: var(--color-text);
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex: 1;
}

.event-card-instructor {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border);
    margin-top: auto;
}

.instructor-label {
    font-weight: 600;
}

.instructor-name {
    color: var(--color-text);
}
</style>
