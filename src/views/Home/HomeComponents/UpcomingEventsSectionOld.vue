<template>
    <Section v-if="events.length > 0" background="muted">
        <Container>
            <Prose>
                <Heading overline="What's Happening" level="h2" headline="Upcoming Events">Upcoming **Events**</Heading>
            </Prose>

            <Slider>
                <Slide v-for="event in events" :key="event.id">
                    <img v-if="event.cimg" :src="event.cimg" :alt="event.heading || event.id"
                        style="width: 100%; height: 200px; object-fit: cover; margin-bottom: 1rem;" />
                    <Prose>
                        <h3>{{ event.heading || event.id }}</h3>
                        <p v-if="event.date"><strong>Date:</strong> {{ formatDate(event.date) }}</p>
                        <p v-if="event.location">{{ event.location }}</p>
                        <p v-if="event.md">{{ event.md.substring(0, 100) }}...</p>
                    </Prose>
                </Slide>
            </Slider>
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
    events: any[]
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
