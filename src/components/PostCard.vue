<template>
    <div class="post-card">
        <button class="delete-btn" @click.stop="handleDelete" title="Post löschen">
            <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z">
                </path>
            </svg>
        </button>

        <div v-if="post.cimg" class="post-card-image">
            <img :src="post.cimg" :alt="post.name" loading="lazy" />
        </div>
        <div class="post-card-content">
            <div class="post-card-heading">
                <HeadingParser :content="post.name" as="h4" />
            </div>
            <p v-if="post.teaser" class="post-card-teaser">{{ post.teaser }}</p>
            <div v-if="instructor" class="post-card-instructor">
                <span class="instructor-label">Autor:</span>
                <span class="instructor-name">{{ instructor.name }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import HeadingParser from './HeadingParser.vue'
import type { Post, Instructor, Partner } from '@/types'

const props = defineProps<{
    post: Post
    instructors?: Instructor[]  // Legacy support
    partners?: Partner[]  // New unified type
}>()

const emit = defineEmits<{
    delete: [postId: string]
}>()

const instructor = computed(() => {
    if (!props.post.public_user) return null
    // Try partners first, then fall back to instructors
    if (props.partners) {
        return props.partners.find((p: Partner) => p.id === props.post.public_user)
    }
    if (props.instructors) {
        return props.instructors.find((i: Instructor) => i.id === props.post.public_user)
    }
    return null
})

const handleDelete = () => {
    if (confirm(`Post "${props.post.name}" wirklich löschen?`)) {
        emit('delete', props.post.id)
    }
}
</script>

<style scoped>
.post-card {
    position: relative;
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

.delete-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0;
}

.post-card:hover .delete-btn {
    opacity: 1;
}

.delete-btn:hover {
    background: #fee;
    border-color: #fcc;
    color: #c33;
    transform: scale(1.1);
}

.post-card:hover {
    border-color: var(--color-border-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.post-card-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--color-background-mute);
}

.post-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.post-card-content {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.post-card-heading {
    font-weight: 600;
    color: var(--color-heading);
}

.post-card-teaser {
    font-size: 0.875rem;
    color: var(--color-text);
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex: 1;
}

.post-card-instructor {
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
