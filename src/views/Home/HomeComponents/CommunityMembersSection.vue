<template>
    <Section background="default">
        <Container>
            <Prose>
                <Heading overline="Join Us" level="h2">Community **Members**</Heading>
            </Prose>

            <Slider v-if="users.length > 0">
                <Slide v-for="userItem in users" :key="userItem.id">
                    <img v-if="userItem.cimg" :src="userItem.cimg" :alt="userItem.username"
                        style="width: 100%; height: 200px; object-fit: cover; margin-bottom: 1rem; border-radius: 50%;" />
                    <Prose>
                        <h4>{{ userItem.username }}</h4>
                        <p><strong>Role:</strong> {{ userItem.role }}</p>
                        <p v-if="userItem.created_at"><em>Member since {{ formatDate(userItem.created_at) }}</em></p>
                    </Prose>
                </Slide>
            </Slider>
            <Prose v-else>
                <p><em>No members to display.</em></p>
            </Prose>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Slider from '@/components/Slider.vue'
import Slide from '@/components/Slide.vue'

const props = defineProps<{
    users: any[]
}>()

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    } catch {
        return dateString
    }
}
</script>
