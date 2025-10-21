<!-- Demo page for clist components -->
<template>
    <div class="clist-demo">
        <Container>
            <Section>
                <Heading headline="CList Components Demo" overline="Component Library" as="h1" />

                <!-- Row Demo -->
                <div class="demo-section">
                    <Heading headline="ItemRow" overline="List Item" as="h3" />
                    <p class="demo-description">
                        Row layout with image, content, and optional slot. Fixed widths on first and third columns.
                    </p>

                    <div class="demo-variants">
                        <h4>Size Variants</h4>
                        <ItemRow content="Small Event **Summer Festival** 2024" cimg="https://picsum.photos/80/80?random=1"
                            size="small" />
                        <ItemRow content="Medium Event **Theater Conference** Premium" cimg="https://picsum.photos/80/80?random=2"
                            size="medium" />
                        <ItemRow content="Large Event **International Workshop** Series" cimg="https://picsum.photos/80/80?random=3"
                            size="large" />
                    </div>

                    <div class="demo-variants">
                        <h4>With Slot (3rd Column)</h4>
                        <ItemRow content="Event with Actions **Spring Concert** 2024" cimg="https://picsum.photos/80/80?random=4"
                            size="medium">
                            <button class="demo-action-btn">View</button>
                        </ItemRow>
                    </div>
                </div>

                <!-- Tile Demo -->
                <div class="demo-section">
                    <Heading headline="ItemTile" overline="Compact Card" as="h3" />
                    <p class="demo-description">
                        Tile layout like TaskCard but no padding/margin on header, no left color marker.
                    </p>

                    <div class="demo-grid">
                        <ItemTile content="Small Tile **Workshop** Basics" cimg="https://picsum.photos/300/200?random=5"
                            size="small" />
                        <ItemTile content="Medium Tile **Performance** Evening Show" cimg="https://picsum.photos/300/200?random=6"
                            size="medium" />
                        <ItemTile content="Large Tile **Festival** Annual Event" cimg="https://picsum.photos/300/200?random=7"
                            size="large" />
                    </div>
                </div>

                <!-- Card Demo -->
                <div class="demo-section">
                    <Heading headline="ItemCard" overline="Enhanced Card" as="h3" />
                    <p class="demo-description">
                        Card layout like TaskCard but 30% taller with accent border on left.
                    </p>

                    <div class="demo-grid">
                        <ItemCard content="Small Card **Introduction** Beginner Level" cimg="https://picsum.photos/300/200?random=8"
                            size="small">
                            <span class="demo-badge">New</span>
                        </ItemCard>
                        <ItemCard content="Medium Card **Advanced Course** Professional" cimg="https://picsum.photos/300/200?random=9"
                            size="medium">
                            <span class="demo-badge">Popular</span>
                        </ItemCard>
                        <ItemCard content="Large Card **Master Class** Expert Level" cimg="https://picsum.photos/300/200?random=10"
                            size="large">
                            <span class="demo-badge">Premium</span>
                        </ItemCard>
                    </div>
                </div>

                <!-- List Container Demo -->
                <div class="demo-section">
                    <Heading headline="ItemList Container" overline="Default: Tiles" as="h3" />
                    <p class="demo-description">
                        Container for list items with different interaction modes.
                    </p>

                    <div class="demo-variants">
                        <h4>Static List (Tiles)</h4>
                        <ItemList :items="sampleItems" item-type="tile" size="medium" interaction="static" />
                    </div>

                    <div class="demo-variants">
                        <h4>Static List (Rows)</h4>
                        <ItemList :items="sampleItems" item-type="row" size="medium" interaction="static" />
                    </div>

                    <div class="demo-variants">
                        <h4>Popup Interaction</h4>
                        <button @click="listPopupOpen = true" class="demo-trigger-btn">Open List Popup</button>
                        <ItemList v-model="listPopupOpen" :items="sampleItems" item-type="row" size="medium"
                            interaction="popup" title="Select an Event" />
                    </div>

                    <div class="demo-variants">
                        <h4>Zoom Interaction</h4>
                        <ItemList :items="sampleItems" item-type="tile" size="medium" interaction="zoom">
                            <template #trigger>
                                <button class="demo-trigger-btn">Expand List</button>
                            </template>
                        </ItemList>
                    </div>
                </div>

                <!-- Gallery Container Demo -->
                <div class="demo-section">
                    <Heading headline="ItemGallery Container" overline="Default: Cards" as="h3" />
                    <p class="demo-description">
                        Gallery container with larger items, defaults to cards.
                    </p>

                    <div class="demo-variants">
                        <h4>Static Gallery (Cards)</h4>
                        <ItemGallery :items="sampleItems" item-type="card" size="medium" interaction="static" />
                    </div>

                    <div class="demo-variants">
                        <h4>Popup Interaction</h4>
                        <button @click="galleryPopupOpen = true" class="demo-trigger-btn">Open Gallery Popup</button>
                        <ItemGallery v-model="galleryPopupOpen" :items="sampleItems" item-type="card" size="medium"
                            interaction="popup" title="Event Gallery" />
                    </div>
                </div>
            </Section>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import { ItemRow, ItemTile, ItemCard, ItemList, ItemGallery } from '@/components/clist'

const listPopupOpen = ref(false)
const galleryPopupOpen = ref(false)

const sampleItems = [
    {
        content: 'Summer Event **Jazz Festival** 2024',
        cimg: 'https://picsum.photos/400/300?random=11'
    },
    {
        content: 'Theater Production **Hamlet** Classic',
        cimg: 'https://picsum.photos/400/300?random=12'
    },
    {
        content: 'Workshop **Digital Arts** Masterclass',
        cimg: 'https://picsum.photos/400/300?random=13'
    },
    {
        content: 'Concert Series **Piano Recital** Monthly',
        cimg: 'https://picsum.photos/400/300?random=14'
    },
    {
        content: 'Exhibition **Modern Art** Contemporary',
        cimg: 'https://picsum.photos/400/300?random=15'
    },
    {
        content: 'Dance Performance **Ballet Gala** Annual',
        cimg: 'https://picsum.photos/400/300?random=16'
    }
]
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
