<template>
    <Section background="default">
        <Container>
            <Prose>
                <Heading overline="Pipeline" level="h2" headline="New **Projects** in the Pipeline">New **Projects** in
                    the Pipeline</Heading>
            </Prose>

            <Columns gap="small" align="top" wrap v-if="projects.length > 0">
                <Column v-for="project in projects.slice(0, 4)" :key="project.id" width="1/4">
                    <a :href="`/sites/${project.id}`" style="text-decoration: none; color: inherit; display: block;">
                        <img v-if="project.cimg" :src="project.cimg" :alt="project.heading || project.id"
                            style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 1rem; border-radius: 0.5rem;" />
                        <Prose>
                            <h4>{{ project.heading || project.id }}</h4>
                            <p v-if="project.status_id"><strong>Status:</strong> {{
                                getStatusDisplayName(project.status_id, 'projects', 'de') }}</p>
                        </Prose>
                    </a>
                </Column>
            </Columns>
            <Prose v-else>
                <p><em>No projects in the pipeline.</em></p>
            </Prose>
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

const props = defineProps<{
    projects: any[]
}>()

const { getStatusDisplayName } = useStatus()
</script>
