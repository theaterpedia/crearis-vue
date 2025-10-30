<template>
    <div v-if="isCollapsible" class="command-prompt-wrapper" :class="{ 'command-prompt-expanded': isExpanded }">
        <button v-if="!isExpanded" class="command-prompt" @click="handleClick" aria-label="Command prompt">
            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M32,128H224a8,8,0,0,0,0-16H32a8,8,0,0,0,0,16Z"></path>
            </svg>
        </button>
        <div v-else class="command-prompt-expanded-control">
            <input ref="commandInputRef" type="text" class="command-prompt-input" placeholder="Enter command..."
                @blur="handleBlur" @keydown.escape="handleBlur" />
            <button class="command-prompt-collapse" @click="handleBlur" aria-label="Collapse command prompt">
                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                    </path>
                </svg>
            </button>
        </div>
    </div>
    <button v-else class="command-prompt" @click="handleClick" aria-label="Command prompt">
        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M32,128H224a8,8,0,0,0,0-16H32a8,8,0,0,0,0,16Z"></path>
        </svg>
    </button>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
    isCollapsible?: boolean
    isExpanded?: boolean
}>()

const emit = defineEmits<{
    click: []
    blur: []
}>()

const commandInputRef = ref<HTMLInputElement>()

function handleClick() {
    emit('click')
}

function handleBlur() {
    emit('blur')
}

// Auto-focus input when expanded
watch(() => props.isExpanded, (newVal) => {
    if (newVal && props.isCollapsible) {
        nextTick(() => {
            commandInputRef.value?.focus()
        })
    }
})
</script>

<style scoped>
.command-prompt-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    transition: var(--transition);
    transition-property: width;
}

.command-prompt {
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

.command-prompt:hover {
    background-color: var(--color-muted-bg);
}

.command-prompt:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}

.command-prompt-expanded-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 16rem;
    padding: 0.5rem;
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.command-prompt-input {
    flex: 1;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    color: var(--color-contrast);
    background: transparent;
    border: none;
    outline: none;
}

.command-prompt-input::placeholder {
    color: var(--color-contrast);
    opacity: 0.5;
}

.command-prompt-collapse {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    color: var(--color-contrast);
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: var(--transition);
    transition-property: background-color, color;
    flex-shrink: 0;
}

.command-prompt-collapse:hover {
    background-color: var(--color-muted-bg);
}
</style>
