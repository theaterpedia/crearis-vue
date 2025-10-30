<template>
    <Section background="accent">
        <Container>
            <Prose>
                <Heading overline="Recent Articles" level="h2">Latest from Our **Blog**</Heading>
            </Prose>

            <Columns gap="medium" align="top" wrap v-if="posts.length > 0">
                <Column v-for="post in posts.slice(0, 6)" :key="post.id" width="1/3">
                    <CardHero height-tmp="medium" :img-tmp="post.cimg || ''" content-align-y="bottom"
                        content-type="text">
                        <Prose>
                            <h3>{{ post.heading || post.id }}</h3>
                            <p v-if="post.md">{{ post.md.substring(0, 100) }}...</p>
                            <p v-else><em>No content available</em></p>
                        </Prose>
                    </CardHero>
                </Column>
            </Columns>
            <Prose v-else>
                <p><em>No blog posts available yet.</em></p>
            </Prose>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import CardHero from '@/components/CardHero.vue'

const props = defineProps<{
    posts: any[]
}>()
</script>
