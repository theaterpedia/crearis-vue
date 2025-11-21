<template>
    <div class="sysreg-tag-display">
        <div class="tag-rows">
            <!-- Config: visibility (always shown) -->
            <div class="tag-row">
                <span class="tag-label">Visibility:</span>
                <div class="inline-radio-group">
                    <label v-for="opt in visibilityOptions" :key="opt.value" class="radio-option">
                        <input type="radio" :value="opt.value" v-model="localConfigVisibility" name="visibility" />
                        <span>{{ opt.label }}</span>
                    </label>
                </div>
            </div>

            <!-- CTags: age_group (always shown) -->
            <div class="tag-row">
                <span class="tag-label">Age:</span>
                <div class="inline-radio-group">
                    <label v-for="opt in ageGroupOptions" :key="opt.value" class="radio-option">
                        <input type="radio" :value="opt.value" v-model="localAgeGroup" name="age_group" />
                        <span>{{ opt.label }}</span>
                    </label>
                </div>
            </div>

            <!-- TTags: core_themes (shown if allTags) -->
            <div v-if="allTags" class="tag-row">
                <span class="tag-label">Topics:</span>
                <SysregMultiToggle v-model="localCoreThemes" tagfamily="ttags" :columns="4" />
            </div>

            <!-- DTags: domains (shown if allTags) -->
            <div v-if="allTags" class="tag-row">
                <span class="tag-label">Domains:</span>
                <SysregMultiToggle v-model="localDomains" tagfamily="dtags" :columns="4" />
            </div>

            <!-- CTags: subject_type (shown if allTags) -->
            <div v-if="allTags" class="tag-row">
                <span class="tag-label">Subject:</span>
                <div class="inline-radio-group">
                    <label v-for="opt in subjectTypeOptions" :key="opt.value" class="radio-option">
                        <input type="radio" :value="opt.value" v-model="localSubjectType" name="subject_type" />
                        <span>{{ opt.label }}</span>
                    </label>
                </div>
            </div>
        </div>

        <button type="button" class="tag-toggle-btn" @click="toggleAllTags"
            :title="allTags ? 'Show less' : 'Show all tags'">
            <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z" />
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SysregMultiToggle from './SysregMultiToggle.vue'

interface Props {
    allTags?: boolean
    configVisibility?: number
    ageGroup?: number
    subjectType?: number
    coreThemes?: string
    domains?: string
}

const props = withDefaults(defineProps<Props>(), {
    allTags: false,
    configVisibility: 0,
    ageGroup: 0,
    subjectType: 0,
    coreThemes: '\\x00',
    domains: '\\x00'
})

const emit = defineEmits<{
    'update:allTags': [value: boolean]
    'update:configVisibility': [value: number]
    'update:ageGroup': [value: number]
    'update:subjectType': [value: number]
    'update:coreThemes': [value: string]
    'update:domains': [value: string]
}>()

const localConfigVisibility = ref(props.configVisibility)
const localAgeGroup = ref(props.ageGroup)
const localSubjectType = ref(props.subjectType)
const localCoreThemes = ref(props.coreThemes)
const localDomains = ref(props.domains)

// Inline options (hardcoded for simplicity)
const visibilityOptions = [
    { value: 0, label: 'Hidden' },
    { value: 1, label: 'Public' }
]

const ageGroupOptions = [
    { value: 0, label: 'Andere' },
    { value: 1, label: 'Kind' },
    { value: 2, label: 'Teens' },
    { value: 3, label: 'Erwachsen' }
]

const subjectTypeOptions = [
    { value: 0, label: 'Andere' },
    { value: 1, label: 'Location' },
    { value: 2, label: 'Person' },
    { value: 3, label: 'Gruppe/Portrait' }
]

function toggleAllTags() {
    emit('update:allTags', !props.allTags)
}

// Watch for changes and emit updates
watch(localConfigVisibility, (val) => emit('update:configVisibility', val))
watch(localAgeGroup, (val) => emit('update:ageGroup', val))
watch(localSubjectType, (val) => emit('update:subjectType', val))
watch(localCoreThemes, (val) => emit('update:coreThemes', val))
watch(localDomains, (val) => emit('update:domains', val))

// Watch for prop changes
watch(() => props.configVisibility, (val) => localConfigVisibility.value = val)
watch(() => props.ageGroup, (val) => localAgeGroup.value = val)
watch(() => props.subjectType, (val) => localSubjectType.value = val)
watch(() => props.coreThemes, (val) => localCoreThemes.value = val)
watch(() => props.domains, (val) => localDomains.value = val)
</script>

<style scoped>
.sysreg-tag-display {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 0.75rem 0.75rem 3rem;
    background: var(--color-background, #f9fafb);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
}

.tag-rows {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}

.tag-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.tag-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text, #374151);
    min-width: 70px;
    flex-shrink: 0;
}

.inline-radio-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: var(--color-card-bg, white);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8125rem;
}

.radio-option:hover {
    background: var(--color-hover-bg, #f3f4f6);
    border-color: var(--color-primary-bg, #3b82f6);
}

.radio-option input[type="radio"] {
    margin: 0;
    cursor: pointer;
}

.radio-option input[type="radio"]:checked+span {
    font-weight: 600;
    color: var(--color-primary-bg, #3b82f6);
}

.tag-toggle-btn {
    position: absolute;
    top: 0.625rem;
    left: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    background: var(--color-card-bg, white);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    color: var(--color-text, #374151);
    cursor: pointer;
    transition: all 0.2s ease;
}

.tag-toggle-btn:hover {
    background: var(--color-primary-bg, #3b82f6);
    color: white;
    border-color: var(--color-primary-bg, #3b82f6);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-toggle-btn svg {
    flex-shrink: 0;
}

/* Responsive: stack on small screens */
@media (max-width: 640px) {
    .tag-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.375rem;
    }

    .tag-label {
        min-width: auto;
    }

    .sysreg-tag-display {
        padding-left: 0.75rem;
        padding-top: 3rem;
    }

    .tag-toggle-btn {
        top: 0.625rem;
        left: auto;
        right: 0.625rem;
    }
}
</style>
