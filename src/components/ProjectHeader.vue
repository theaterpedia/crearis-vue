<template>
    <div v-if="project" class="project-header">
        <div class="project-hero">
            <div v-if="project.cimg" class="project-image">
                <img :src="project.cimg" :alt="project.name" />
            </div>
            <div class="project-content">
                <div class="project-overline">Projekt</div>
                <h2 class="project-title">{{ project.name }}</h2>
                <p v-if="project.description" class="project-description">{{ project.description }}</p>
                <div v-if="project.date_begin || project.date_end" class="project-dates">
                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z">
                        </path>
                    </svg>
                    <span>{{ formatDate(project.date_begin) }} – {{ formatDate(project.date_end) }}</span>
                </div>
            </div>
        </div>
    </div>
    <div v-else-if="loading" class="project-header loading">
        <div class="loading-spinner">Lade Projekt...</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface Props {
    projectId: string | null
}

const props = defineProps<Props>()

const project = ref<any>(null)
const loading = ref(false)

const fetchProject = async (id: string) => {
    loading.value = true
    try {
        const response = await fetch(`/api/projects/${id}`)
        if (!response.ok) throw new Error('Failed to fetch project')
        project.value = await response.json()
    } catch (error) {
        console.error('Error fetching project:', error)
        project.value = null
    } finally {
        loading.value = false
    }
}

const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
        return new Date(dateString).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    } catch {
        return dateString
    }
}

watch(() => props.projectId, (newId) => {
    if (newId) {
        fetchProject(newId)
    } else {
        project.value = null
    }
}, { immediate: true })

onMounted(() => {
    if (props.projectId) {
        fetchProject(props.projectId)
    }
})
</script>

<style scoped>
.project-header {
    margin-bottom: 2rem;
}

.project-hero {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
}

.project-image {
    width: 100%;
    height: 12rem;
    overflow: hidden;
}

.project-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.project-content {
    padding: 1.5rem;
}

.project-overline {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--color-primary-bg);
    margin-bottom: 0.5rem;
}

.project-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: var(--color-contrast);
}

.project-description {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    line-height: 1.6;
    margin: 0 0 1rem 0;
}

.project-dates {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-dimmed);
    font-weight: 500;
}

.project-dates svg {
    flex-shrink: 0;
}

.loading {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    padding: 2rem;
    text-align: center;
}

.loading-spinner {
    font-size: 0.875rem;
    color: var(--color-dimmed);
}
</style>
