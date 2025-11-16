<template>
    <button v-if="canEdit" class="edit-panel-btn" @click="$emit('open')" aria-label="Edit content" title="Edit content">
        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z">
            </path>
        </svg>
        <span class="btn-text">Edit</span>
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    isAuthenticated: boolean
    isAdmin?: boolean
    isOwner?: boolean
    isMember?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isAdmin: false,
    isOwner: false,
    isMember: false
})

defineEmits<{
    open: []
}>()

// Permission check: must be authenticated AND (admin OR owner OR member)
const canEdit = computed(() => {
    if (!props.isAuthenticated) return false
    return props.isAdmin || props.isOwner || props.isMember
})
</script>

<style scoped>
.edit-panel-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary-bg, #3b82f6);
    color: var(--color-primary-contrast, #ffffff);
    border: none;
    border-radius: 0.375rem;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: var(--font, system-ui, sans-serif);
}

.edit-panel-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.edit-panel-btn:active {
    transform: translateY(0);
}

.btn-text {
    display: inline;
}

/* Hide text on smaller screens to save space */
@media (max-width: 640px) {
    .edit-panel-btn {
        padding: 0.5rem;
    }

    .btn-text {
        display: none;
    }
}
</style>
