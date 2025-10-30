<template>
    <Section v-if="pageSections.length > 0" background="default">
        <Container>
            <Prose>
                <div v-for="section in pageSections" :key="section.id">
                    <div v-if="section.html" v-html="section.html"></div>
                    <p v-else><em>Section {{ section.scope }}</em></p>
                </div>
            </Prose>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'

const props = defineProps<{
    pageType: 'landing' | 'event' | 'post' | 'team'
    projectDomainCode: string
    projectId: string
}>()

const pages = ref<any[]>([])
const pageSections = ref<any[]>([])

async function fetchPageData() {
    try {
        // First, fetch the page by project and page_type
        const pageResponse = await fetch(`/api/pages?projectId=${props.projectId}&pageType=${props.pageType}`)
        if (!pageResponse.ok) {
            console.error('Failed to fetch page')
            return
        }

        const pageData = await pageResponse.json()
        pages.value = Array.isArray(pageData) ? pageData : [pageData]

        // If we have a page, fetch its sections
        if (pages.value.length > 0 && pages.value[0].id) {
            const pageId = pages.value[0].id
            const sectionsResponse = await fetch(`/api/page-sections?pageId=${pageId}`)
            if (!sectionsResponse.ok) {
                console.error('Failed to fetch page sections')
                return
            }

            const sectionsData = await sectionsResponse.json()
            pageSections.value = Array.isArray(sectionsData) ? sectionsData : []
        }
    } catch (error) {
        console.error('Error fetching page data:', error)
    }
}

onMounted(() => {
    fetchPageData()
})

// Watch for prop changes
watch(() => [props.projectId, props.pageType], () => {
    fetchPageData()
})
</script>
