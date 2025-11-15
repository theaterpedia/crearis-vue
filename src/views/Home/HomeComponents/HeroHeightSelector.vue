<template>
    <div class="hero-height-selector">
        <label for="hero-height-select">Header-Typ wählen:</label>
        <select id="hero-height-select" v-model="selectedHeight" @change="handleChange">
            <option value="prominent">Prominent</option>
            <option value="medium">Medium</option>
            <option value="full">Cover (Vollbild)</option>
        </select>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    initialValue: 'prominent' | 'medium' | 'full'
    onChange: (value: 'prominent' | 'medium' | 'full') => void
}>()

const selectedHeight = ref(props.initialValue)

function handleChange() {
    console.log('[HeroHeightSelector] Selection changed to:', selectedHeight.value)
    props.onChange(selectedHeight.value)
}
</script>

<style scoped>
.hero-height-selector {
    margin: 1rem 0;
}

.hero-height-selector label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-contrast);
}

.hero-height-selector select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    background: var(--color-bg);
    color: var(--color-contrast);
    font-size: 1rem;
    cursor: pointer;
}

.hero-height-selector select:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}
</style>
