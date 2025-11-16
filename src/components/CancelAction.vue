<template>
    <button class="cancel-action" @click="handleClick" aria-label="Cancel">
        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
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
.cancel-action {
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

.cancel-action:hover {
    background-color: var(--color-muted-bg);
    color: var(--color-negative);
}

.cancel-action:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}
</style>
