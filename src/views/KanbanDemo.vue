<template>
    <div class="kanban-demo-wrapper">
        <Navbar :user="user" :full-width="true" logo-text="📋 Kanban Demo" @logout="handleLogout">
            <template #menus>
                <div v-if="isAuthenticated" class="navbar-item">
                    <Button @click="goBack">← Zurück</Button>
                </div>
            </template>
        </Navbar>

        <div class="kanban-demo-content">
            <Section>
                <div class="demo-header">
                    <h1>Kanban Board Demo</h1>
                    <p class="demo-description">
                        Mixed content demonstration with TaskCard, PostCard, EventCard, and PostIt components.
                        Drag and drop items between columns to change their status.
                    </p>
                </div>

                <Kanban :items="kanbanItems" :columns="kanbanColumns" empty-text="No items"
                    @item-moved="handleItemMoved" />
            </Section>
        </div>
        <DemoToggle />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Navbar from '@/components/Navbar.vue'
import Button from '@/components/Button.vue'
import Section from '@/components/Section.vue'
import Kanban from '@/components/Kanban.vue'
import DemoToggle from '@/components/DemoToggle.vue'

const router = useRouter()
const { user, isAuthenticated, logout } = useAuth()

const kanbanColumns = [
    { id: 'idea', title: 'Ideas', icon: '💡' },
    { id: 'progress', title: 'In Progress', icon: '⚡' },
    { id: 'review', title: 'Review', icon: '👀' },
    { id: 'done', title: 'Done', icon: '✓' }
]

const kanbanItems = ref([
    // TaskCards with different colors
    {
        id: 1,
        type: 'task',
        status: 'idea',
        heading: '**Implement** new feature',
        description: 'Add dark mode support to the application',
        color: 'primary',
        priority: 'high',
        cimg: 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_400,h_200/v1722972081/dasei/thematische_warmups_wfwtzh.jpg'
    },
    {
        id: 2,
        type: 'task',
        status: 'idea',
        heading: '**Fix** critical bug',
        description: 'Resolve memory leak in data processing module',
        color: 'negative',
        priority: 'urgent'
    },

    // PostIts with different colors
    {
        id: 3,
        type: 'postit',
        status: 'progress',
        heading: 'Design **Sprint** Planning',
        color: 'warning'
    },
    {
        id: 4,
        type: 'postit',
        status: 'progress',
        heading: '**Brainstorm** session notes',
        color: 'secondary'
    },

    // PostCards
    {
        id: 5,
        type: 'post',
        status: 'progress',
        heading: 'Blog **Post** About Vue 3',
        teaser: 'Deep dive into the Composition API and its benefits for large-scale applications',
        cimg: 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_400,h_200/v1722972081/dasei/thematische_warmups_wfwtzh.jpg'
    },
    {
        id: 6,
        type: 'post',
        status: 'review',
        heading: 'Tutorial: **TypeScript** Best Practices',
        teaser: 'Learn how to write maintainable TypeScript code with practical examples'
    },

    // EventCards
    {
        id: 7,
        type: 'event',
        status: 'review',
        heading: 'Workshop: **Modern** Web Development',
        teaser: 'A hands-on workshop covering the latest web technologies and frameworks',
        cimg: 'https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_400,h_200/v1722972081/dasei/thematische_warmups_wfwtzh.jpg'
    },
    {
        id: 8,
        type: 'event',
        status: 'done',
        heading: 'Meetup: **Vue.js** Community',
        teaser: 'Monthly meetup for Vue.js developers to share knowledge and experiences'
    },

    // More PostIts
    {
        id: 9,
        type: 'postit',
        status: 'done',
        heading: '**Launch** checklist completed',
        color: 'positive'
    },
    {
        id: 10,
        type: 'postit',
        status: 'idea',
        heading: 'Research **new** tech stack',
        color: 'accent'
    },

    // Mixed items
    {
        id: 11,
        type: 'task',
        status: 'review',
        heading: 'Update **documentation**',
        description: 'Revise API documentation with new endpoints',
        color: 'secondary',
        priority: 'medium'
    },
    {
        id: 12,
        type: 'postit',
        status: 'done',
        heading: 'Team **retrospective** done',
        color: 'muted'
    }
])

function handleItemMoved(item: any, newStatus: string) {
    const index = kanbanItems.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
        kanbanItems.value[index].status = newStatus
        console.log(`Item ${item.id} moved to ${newStatus}`)
    }
}

function goBack() {
    router.push('/')
}

function handleLogout() {
    logout()
    router.push('/login')
}
</script>

<style scoped>
.kanban-demo-wrapper {
    min-height: 100vh;
    background: var(--color-bg);
    color: var(--color-contrast);
}

.kanban-demo-content {
    width: 100%;
    padding: 0 2rem;
}

@media (max-width: 768px) {
    .kanban-demo-content {
        padding: 0 1rem;
    }
}

.demo-header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid var(--color-border);
}

.demo-header h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--color-contrast);
}

.demo-description {
    font-size: 1rem;
    color: var(--color-dimmed);
    margin: 0;
    line-height: 1.6;
}

.navbar-item {
    display: flex;
    align-items: center;
}
</style>
