<template>
    <Section background="accent" v-if="displayedPosts.length > 0">
        <Container>
            <Prose>
                <Heading overline="Recent Articles" level="h2" headline="Latest from Our **Blog**">Latest from Our
                    **Blog**</Heading>
            </Prose>

            <Columns gap="medium" align="top" wrap>
                <Column v-for="post in displayedPosts" :key="post.id" width="1/3">
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
        </Container>
    </Section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import CardHero from '@/components/CardHero.vue'

const props = withDefaults(defineProps<{
    posts: any[]
    showPosts?: number
}>(), {
    showPosts: 0
})

const displayedPosts = computed(() => {
    if (props.showPosts === 0) return []
    return props.posts.slice(0, Math.min(props.showPosts, 3))
})
</script>
