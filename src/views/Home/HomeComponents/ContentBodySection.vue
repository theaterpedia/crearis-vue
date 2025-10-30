<template>
    <Section v-if="htmlContent" background="default">
        <Container>
            <Prose>
                <div v-html="htmlContent"></div>
            </Prose>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'

const props = defineProps<{
    htmlContent?: string
}>()
</script>
