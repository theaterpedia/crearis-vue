<!-- Example: Using DateTimeEdit and DateRangeEdit Components -->
<template>
    <div class="examples-container">
        <h2>Date/Time Component Examples</h2>

        <!-- Example 1: Single DateTime -->
        <section class="example-section">
            <h3>1. Single DateTime Input</h3>
            <DateTimeEdit label="Veranstaltungsbeginn" type="datetime" :stacked="false" size="medium"
                v-model="singleDateTime" />
            <p class="value-display">Value: {{ singleDateTime || '(empty)' }}</p>
        </section>

        <!-- Example 2: Date Only -->
        <section class="example-section">
            <h3>2. Date Only</h3>
            <DateTimeEdit label="Geburtsdatum" type="date" size="medium" v-model="birthDate" />
            <p class="value-display">Value: {{ birthDate || '(empty)' }}</p>
        </section>

        <!-- Example 3: Time Only -->
        <section class="example-section">
            <h3>3. Time Only</h3>
            <DateTimeEdit label="Beginnzeit" type="time" size="medium" v-model="startTime" />
            <p class="value-display">Value: {{ startTime || '(empty)' }}</p>
        </section>

        <!-- Example 4: DateTime Range (Side-by-side) -->
        <section class="example-section">
            <h3>4. DateTime Range (Side-by-side)</h3>
            <DateRangeEdit start-label="Beginn" end-label="Ende" type="datetime" :stacked="false" size="medium"
                v-model:start="rangeStart" v-model:end="rangeEnd" />
            <p class="value-display">Start: {{ rangeStart || '(empty)' }}</p>
            <p class="value-display">End: {{ rangeEnd || '(empty)' }}</p>
        </section>

        <!-- Example 5: DateTime Range (Stacked) -->
        <section class="example-section">
            <h3>5. DateTime Range (Stacked)</h3>
            <DateRangeEdit start-label="Von" end-label="Bis" type="datetime" :stacked="true" size="medium"
                v-model:start="stackedRangeStart" v-model:end="stackedRangeEnd" />
            <p class="value-display">Start: {{ stackedRangeStart || '(empty)' }}</p>
            <p class="value-display">End: {{ stackedRangeEnd || '(empty)' }}</p>
        </section>

        <!-- Example 6: Date Range -->
        <section class="example-section">
            <h3>6. Date Range (No Time)</h3>
            <DateRangeEdit start-label="Von" end-label="Bis" type="date" :stacked="false" size="medium"
                v-model:start="dateRangeStart" v-model:end="dateRangeEnd" />
            <p class="value-display">Start: {{ dateRangeStart || '(empty)' }}</p>
            <p class="value-display">End: {{ dateRangeEnd || '(empty)' }}</p>
        </section>

        <!-- Example 7: Time Range -->
        <section class="example-section">
            <h3>7. Time Range</h3>
            <DateRangeEdit start-label="Öffnung" end-label="Schließung" type="time" :stacked="false" size="medium"
                v-model:start="timeRangeStart" v-model:end="timeRangeEnd" />
            <p class="value-display">Start: {{ timeRangeStart || '(empty)' }}</p>
            <p class="value-display">End: {{ timeRangeEnd || '(empty)' }}</p>
        </section>

        <!-- Example 8: Size Variants -->
        <section class="example-section">
            <h3>8. Size Variants</h3>

            <div class="size-demo">
                <DateTimeEdit label="Small" type="datetime" :stacked="false" size="small" v-model="sizeSmall" />
            </div>

            <div class="size-demo">
                <DateTimeEdit label="Medium" type="datetime" :stacked="false" size="medium" v-model="sizeMedium" />
            </div>

            <div class="size-demo">
                <DateTimeEdit label="Large" type="datetime" :stacked="false" size="large" v-model="sizeLarge" />
            </div>
        </section>

        <!-- Example 9: Validation Error Demo -->
        <section class="example-section">
            <h3>9. Validation Error Demo</h3>
            <p class="info-text">Try setting end before start to see validation error:</p>
            <DateRangeEdit start-label="Beginn" end-label="Ende" type="datetime" :stacked="false" size="medium"
                v-model:start="validationStart" v-model:end="validationEnd" />
        </section>

        <!-- Example 10: Pre-populated Values -->
        <section class="example-section">
            <h3>10. Pre-populated Values</h3>
            <DateRangeEdit start-label="Workshop Start" end-label="Workshop End" type="datetime" :stacked="false"
                size="medium" v-model:start="prePopStart" v-model:end="prePopEnd" />
            <button @click="loadDefaults" class="demo-button">Load Default Values</button>
            <button @click="clearValues" class="demo-button">Clear Values</button>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DateTimeEdit from './DateTimeEdit.vue'
import DateRangeEdit from './DateRangeEdit.vue'

// Example 1
const singleDateTime = ref('')

// Example 2
const birthDate = ref('')

// Example 3
const startTime = ref('')

// Example 4
const rangeStart = ref('')
const rangeEnd = ref('')

// Example 5
const stackedRangeStart = ref('')
const stackedRangeEnd = ref('')

// Example 6
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

// Example 7
const timeRangeStart = ref('')
const timeRangeEnd = ref('')

// Example 8
const sizeSmall = ref('')
const sizeMedium = ref('')
const sizeLarge = ref('')

// Example 9
const validationStart = ref('2025-10-17T14:00')
const validationEnd = ref('2025-10-17T12:00') // Invalid: before start

// Example 10
const prePopStart = ref('')
const prePopEnd = ref('')

const loadDefaults = () => {
    const now = new Date()
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours later

    prePopStart.value = now.toISOString().slice(0, 16)
    prePopEnd.value = later.toISOString().slice(0, 16)
}

const clearValues = () => {
    prePopStart.value = ''
    prePopEnd.value = ''
}
</script>

<style scoped>
.examples-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: var(--color-text);
}

.example-section {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--color-border);
}

.example-section:last-child {
    border-bottom: none;
}

h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.value-display {
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: var(--color-background-soft);
    border-radius: 4px;
}

.size-demo {
    margin-bottom: 1rem;
}

.info-text {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin-bottom: 0.75rem;
}

.demo-button {
    margin-top: 1rem;
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.demo-button:hover {
    background: var(--color-primary-hover, #2563eb);
    transform: translateY(-1px);
}

.demo-button:active {
    transform: translateY(0);
}
</style>
