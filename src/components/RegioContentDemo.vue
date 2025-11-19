<template>
    <Section background="default" v-if="hasContent">
        <Container>
            <Prose>
                <Heading overline="Aus der Regio" level="h2">**{{ regio }}** Aktivitäten</Heading>
            </Prose>

            <Columns gap="medium" align="top" wrap>
                <!-- Events from the region -->
                <Column v-for="event in regioEvents" :key="'event-' + event.id" width="1/3">
                    <CardHero height-tmp="medium"
                        :img-tmp="event.cimg || 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_600,h_400,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg'"
                        content-align-y="bottom" content-type="text">
                        <Prose>
                            <p v-if="event.project_id" class="overline">{{ event.project_id }}</p>
                            <h3>{{ event.heading || event.id }}</h3>
                            <p v-if="event.date"><strong>{{ formatDate(event.date) }}</strong></p>
                            <p v-if="event.md">{{ truncateText(event.md, 80) }}</p>
                            <p v-else><em>Event Details</em></p>
                        </Prose>
                    </CardHero>
                </Column>

                <!-- Posts from the region -->
                <Column v-for="post in regioPosts" :key="'post-' + post.id" width="1/3">
                    <CardHero height-tmp="medium"
                        :img-tmp="post.cimg || 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_600,h_400,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg'"
                        content-align-y="bottom" content-type="text">
                        <Prose>
                            <p v-if="post.project_id" class="overline">{{ post.project_id }}</p>
                            <h3>{{ post.heading || post.id }}</h3>
                            <p v-if="post.md">{{ truncateText(post.md, 100) }}</p>
                            <p v-else><em>Post Content</em></p>
                        </Prose>
                    </CardHero>
                </Column>
            </Columns>

            <Prose v-if="!hasContent">
                <p><em>Noch keine Inhalte aus dieser Region.</em></p>
            </Prose>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStatus } from '@/composables/useStatus'
import Section from './Section.vue'
import Container from './Container.vue'
import Prose from './Prose.vue'
import Heading from './Heading.vue'
import Columns from './Columns.vue'
import Column from './Column.vue'
import CardHero from './CardHero.vue'

interface Props {
    regio: string
}

const props = defineProps<Props>()

const { getStatusIdByName } = useStatus()

// State
const regioEvents = ref<any[]>([])
const regioPosts = ref<any[]>([])

// Computed
const hasContent = computed(() => {
    return regioEvents.value.length > 0 || regioPosts.value.length > 0
})

// Fetch events from projects in this region with status demo/draft
async function fetchRegioEvents() {
    try {
        const response = await fetch('/api/events')
        if (response.ok) {
            const allEvents = await response.json()

            // Get status IDs for 'demo' and 'draft' for projects table
            const demoStatusId = getStatusIdByName('demo', 'projects')
            const draftStatusId = getStatusIdByName('draft', 'projects')

            // Filter events that belong to projects with matching regio and status demo/draft
            const filtered = await Promise.all(
                allEvents.map(async (event: any) => {
                    if (!event.project_id) return null

                    // Fetch the project to check its regio and status
                    const projectResponse = await fetch(`/api/projects/${encodeURIComponent(event.project_id)}`)
                    if (projectResponse.ok) {
                        const project = await projectResponse.json()
                        // Check if project is in demo or draft status
                        const statusLower = (project.status_display || '').toLowerCase()
                        const isDemoOrDraft = statusLower.includes('demo') || statusLower.includes('draft') || statusLower.includes('entwurf')
                        if (project.regio === props.regio && isDemoOrDraft) {
                            return event
                        }
                    }
                    return null
                })
            )

            regioEvents.value = filtered.filter(e => e !== null).slice(0, 6)
        }
    } catch (error) {
        console.error('Failed to fetch regio events:', error)
    }
}

// Fetch posts from projects in this region with status demo/draft
async function fetchRegioPosts() {
    try {
        const response = await fetch('/api/posts')
        if (response.ok) {
            const allPosts = await response.json()

            // Filter posts that belong to projects with matching regio and status demo/draft
            const filtered = await Promise.all(
                allPosts.map(async (post: any) => {
                    if (!post.project_id) return null

                    // Fetch the project to check its regio and status
                    const projectResponse = await fetch(`/api/projects/${encodeURIComponent(post.project_id)}`)
                    if (projectResponse.ok) {
                        const project = await projectResponse.json()
                        // Check if project is in demo or draft status
                        const statusLower = (project.status_display || '').toLowerCase()
                        const isDemoOrDraft = statusLower.includes('demo') || statusLower.includes('draft') || statusLower.includes('entwurf')
                        if (project.regio === props.regio && isDemoOrDraft) {
                            return post
                        }
                    }
                    return null
                })
            )

            regioPosts.value = filtered.filter(p => p !== null).slice(0, 6)
        }
    } catch (error) {
        console.error('Failed to fetch regio posts:', error)
    }
}

// Utility functions
function formatDate(date: string | null) {
    if (!date) return 'TBD'
    return new Date(date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })
}

function truncateText(text: string, maxLength: number) {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

onMounted(async () => {
    if (props.regio) {
        await Promise.all([
            fetchRegioEvents(),
            fetchRegioPosts()
        ])
    }
})
</script>

<style scoped>
.overline {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted, #666);
    margin-bottom: 0.5rem;
}
</style>
