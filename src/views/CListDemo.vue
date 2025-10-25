<!-- Demo page for clist components -->
<template>
    <div class="clist-demo">
        <Container>
            <Section>
                <Heading headline="CList Components Demo" overline="Component Library" as="h1" />

                <!-- Row Demo - Events -->
                <div class="demo-section">
                    <Heading headline="ItemRow" overline="Events from Database" as="h3" />
                    <p class="demo-description">
                        Row layout with image, content, and optional slot. Fixed widths on first and third columns.
                    </p>

                    <div class="demo-variants">
                        <h4>Size Variants</h4>
                        <ItemRow v-if="eventItems[0]" :content="eventItems[0].content" :cimg="eventItems[0].cimg"
                            size="small" />
                        <ItemRow v-if="eventItems[1]" :content="eventItems[1].content" :cimg="eventItems[1].cimg"
                            size="medium" />
                        <ItemRow v-if="eventItems[2]" :content="eventItems[2].content" :cimg="eventItems[2].cimg"
                            size="large" />
                    </div>

                    <div class="demo-variants">
                        <h4>With Slot (3rd Column)</h4>
                        <ItemRow v-if="eventItems[3]" :content="eventItems[3].content" :cimg="eventItems[3].cimg"
                            size="medium">
                            <button class="demo-action-btn">View</button>
                        </ItemRow>
                    </div>
                </div>

                <!-- Tile Demo - Instructors -->
                <div class="demo-section">
                    <Heading headline="ItemTile" overline="Instructors from Database" as="h3" />
                    <p class="demo-description">
                        Tile layout like TaskCard but no padding/margin on header, no left color marker.
                    </p>

                    <div class="demo-grid">
                        <ItemTile v-if="instructorItems[0]" :content="instructorItems[0].content"
                            :cimg="instructorItems[0].cimg" size="small" />
                        <ItemTile v-if="instructorItems[1]" :content="instructorItems[1].content"
                            :cimg="instructorItems[1].cimg" size="medium" />
                        <ItemTile v-if="instructorItems[2]" :content="instructorItems[2].content"
                            :cimg="instructorItems[2].cimg" size="large" />
                    </div>
                </div>

                <!-- Card Demo - Posts -->
                <div class="demo-section">
                    <Heading headline="ItemCard" overline="Posts from Database" as="h3" />
                    <p class="demo-description">
                        Card layout like TaskCard but 30% taller with accent border on left.
                    </p>

                    <div class="demo-grid">
                        <ItemCard v-if="postItems[0]" :content="postItems[0].content" :cimg="postItems[0].cimg"
                            size="small">
                            <span class="demo-badge">New</span>
                        </ItemCard>
                        <ItemCard v-if="postItems[1]" :content="postItems[1].content" :cimg="postItems[1].cimg"
                            size="medium">
                            <span class="demo-badge">Popular</span>
                        </ItemCard>
                        <ItemCard v-if="postItems[2]" :content="postItems[2].content" :cimg="postItems[2].cimg"
                            size="large">
                            <span class="demo-badge">Premium</span>
                        </ItemCard>
                    </div>
                </div>

                <!-- List Container Demo - Instructors -->
                <div class="demo-section">
                    <Heading headline="ItemList Container" overline="Instructors from Database" as="h3" />
                    <p class="demo-description">
                        Container for list items with different interaction modes.
                    </p>

                    <div class="demo-variants">
                        <h4>Static List (Tiles)</h4>
                        <ItemList :items="instructorItems" item-type="tile" size="medium" interaction="static" />
                    </div>

                    <div class="demo-variants">
                        <h4>Static List (Rows)</h4>
                        <ItemList :items="instructorItems" item-type="row" size="medium" interaction="static" />
                    </div>

                    <div class="demo-variants">
                        <h4>Popup Interaction</h4>
                        <button @click="listPopupOpen = true" class="demo-trigger-btn">Open List Popup</button>
                        <ItemList v-model="listPopupOpen" :items="instructorItems" item-type="row" size="medium"
                            interaction="popup" title="Select an Instructor" />
                    </div>

                    <div class="demo-variants">
                        <h4>Zoom Interaction</h4>
                        <ItemList :items="instructorItems" item-type="tile" size="medium" interaction="zoom">
                            <template #trigger>
                                <button class="demo-trigger-btn">Expand List</button>
                            </template>
                        </ItemList>
                    </div>
                </div>

                <!-- Gallery Container Demo - Events -->
                <div class="demo-section">
                    <Heading headline="ItemGallery Container" overline="Events from Database" as="h3" />
                    <p class="demo-description">
                        Gallery container with larger items, defaults to cards.
                    </p>

                    <div class="demo-variants">
                        <h4>Static Gallery (Cards)</h4>
                        <ItemGallery :items="eventItems" item-type="card" size="medium" interaction="static" />
                    </div>

                    <div class="demo-variants">
                        <h4>Popup Interaction</h4>
                        <button @click="galleryPopupOpen = true" class="demo-trigger-btn">Open Gallery Popup</button>
                        <ItemGallery v-model="galleryPopupOpen" :items="eventItems" item-type="card" size="medium"
                            interaction="popup" title="Event Gallery" />
                    </div>
                </div>
            </Section>
        </Container>
        <DemoToggle />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import { ItemRow, ItemTile, ItemCard, ItemList, ItemGallery } from '@/components/clist'
import DemoToggle from '@/components/DemoToggle.vue'

const listPopupOpen = ref(false)
const galleryPopupOpen = ref(false)

// Real data from database
const events = ref<any[]>([])
const posts = ref<any[]>([])
const instructors = ref<any[]>([])

// Formatted items for components
const eventItems = ref<any[]>([])
const postItems = ref<any[]>([])
const instructorItems = ref<any[]>([])

// Fetch data from API
async function fetchData() {
    try {
        // Fetch events
        const eventsRes = await fetch('/api/events')
        if (eventsRes.ok) {
            events.value = await eventsRes.json()
            eventItems.value = events.value.slice(0, 6).map(event => ({
                content: `${event.heading || event.id}${event.teaser ? ' **' + event.teaser + '**' : ''}`,
                cimg: event.cimg || 'https://picsum.photos/400/300?random=event'
            }))
        }

        // Fetch posts
        const postsRes = await fetch('/api/posts')
        if (postsRes.ok) {
            posts.value = await postsRes.json()
            postItems.value = posts.value.slice(0, 6).map(post => ({
                content: `${post.heading || post.id}${post.teaser ? ' **' + post.teaser + '**' : ''}`,
                cimg: post.cimg || 'https://picsum.photos/400/300?random=post'
            }))
        }

        // Fetch instructors
        const instructorsRes = await fetch('/api/instructors')
        if (instructorsRes.ok) {
            instructors.value = await instructorsRes.json()
            instructorItems.value = instructors.value.slice(0, 6).map(instructor => ({
                content: `${instructor.heading || instructor.id}${instructor.teaser ? ' **' + instructor.teaser + '**' : ''}`,
                cimg: instructor.cimg || 'https://picsum.photos/400/300?random=instructor'
            }))
        }
    } catch (error) {
        console.error('Error fetching demo data:', error)
    }
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.clist-demo {
    min-height: 100vh;
    background: var(--color-neutral-bg);
    padding: 2rem 0;
}

.demo-section {
    margin: 3rem 0;
    padding: 2rem;
    background: var(--color-card-bg);
    border-radius: 0.75rem;
}

.demo-description {
    color: var(--color-dimmed);
    margin: 1rem 0 2rem;
}

.demo-variants {
    margin: 2rem 0;
}

.demo-variants h4 {
    font-family: var(--headings);
    color: var(--color-card-contrast);
    margin-bottom: 1rem;
}

.demo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

.demo-action-btn,
.demo-trigger-btn {
    padding: 0.5rem 1rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-family: var(--headings);
    font-weight: 500;
    transition: opacity 0.2s;
}

.demo-action-btn:hover,
.demo-trigger-btn:hover {
    opacity: 0.9;
}

.demo-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border-radius: 1rem;
    font-size: 0.875rem;
    font-weight: 500;
}
</style>
