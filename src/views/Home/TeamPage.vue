<template>
    <div class="team-page">
        <PageLayout :navItems="navItems" navbarMode="page">
            <Section background="default">
                <Container>
                    <Prose>
                        <Heading level="h1">Team Page</Heading>
                        <p><em>Coming soon...</em></p>
                    </Prose>
                </Container>
            </Section>

            <template #footer>
                <HomeSiteFooter />
            </template>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import HomeSiteFooter from '@/components/homeSiteFooter.vue'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'

// Get public navigation items
const navItems = computed<TopnavParentItem[]>(() => {
    return getPublicNavItems().map(item => ({
        label: item.label,
        link: item.link
    }))
})
</script>

<style scoped>
.team-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}
</style>
