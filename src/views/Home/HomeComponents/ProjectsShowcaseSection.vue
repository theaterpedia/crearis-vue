<template>
    <Section v-if="projects.length > 0" background="default">
        <CornerBanner size="large" />
        <Container>
            <Prose>
                <Heading overline="Showcase für entstehende Projekte" level="h2"
                    headline="Ca. 10 Websites in der Pipeline">New **Projects** in
                    the Pipeline</Heading>
            </Prose>

            <Columns gap="small" align="top" wrap>
                <Column v-for="project in projects.slice(0, 4)" :key="project.id" width="1/4">
                    <a :href="`/sites/${project.id}`" style="text-decoration: none; color: inherit; display: block;">
                        <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.id"
                            style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                        <Prose>
                            <h4>{{ project.heading || project.id }}</h4>
                            <p v-if="project.status_id && project.status_id === 67"><strong>Status:</strong> Entwurf</p>
                            <p v-else-if="project.status_id && project.status_id === 19"><strong>Status:</strong> Demo
                            </p>
                            <p v-else-if="project.status_id && project.status_id === 68"><strong>Status:</strong>
                                veröffentlicht</p>
                        </Prose>
                    </a>
                </Column>
            </Columns>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import { useStatus } from '@/composables/useStatus'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import CornerBanner from '@/components/CornerBanner.vue'

console.log('ProjectsShowcaseSection component loaded.')
const props = defineProps<{
    projects: any[]
}>()

const { getStatusDisplayName } = useStatus()
</script>
