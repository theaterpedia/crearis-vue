<template>
    <button class="back-action" @click="handleClick" aria-label="Go back">
        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z">
            </path>
        </svg>
    </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
    click: []
}>()

function handleClick() {
    emit('click')
}
</script>

<style scoped>
.back-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-contrast);
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: var(--transition);
    transition-property: background-color, color;
}

.back-action:hover {
    background-color: var(--color-muted-bg);
}

.back-action:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}
</style>
