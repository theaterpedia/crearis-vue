<template>
    <div class="demo-hero-container">
        <h2>Hero Image Anatomy Demo</h2>

        <div class="demo-grid">
            <!-- Small Hero -->
            <div class="demo-item">
                <h3>Small Hero</h3>
                <ItemCard heading="**Small** Hero Card" :cimg="demoImage" size="small" anatomy="heroimage">
                    <ItemTag>Music</ItemTag>
                    <ItemTag>Concert</ItemTag>
                </ItemCard>
            </div>

            <!-- Medium Hero -->
            <div class="demo-item">
                <h3>Medium Hero</h3>
                <ItemCard heading="**Medium** Hero Card" :cimg="demoImage" size="medium" anatomy="heroimage">
                    <ItemTag>Theater</ItemTag>
                    <ItemTag>Performance</ItemTag>
                </ItemCard>
            </div>

            <!-- Large Hero -->
            <div class="demo-item">
                <h3>Large Hero</h3>
                <ItemCard heading="**Large** Hero Card" :cimg="demoImage" size="large" anatomy="heroimage">
                    <ItemTag>Workshop</ItemTag>
                    <ItemTag>Dance</ItemTag>
                    <ItemTag>Youth</ItemTag>
                </ItemCard>
            </div>
        </div>

        <!-- Modal Demo -->
        <div class="demo-modal-trigger">
            <button @click="isModalOpen = true" class="demo-button">
                Open Hero Modal
            </button>
        </div>

        <ItemModalCard :is-open="isModalOpen" heading="**Hero** Modal Card"
            teaser="This is a hero image layout in a modal with a banner heading overlay at the bottom of the image."
            :cimg="demoImage" anatomy="heroimage" @close="isModalOpen = false" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ItemCard from '@/components/clist/ItemCard.vue'
import ItemModalCard from '@/components/clist/ItemModalCard.vue'
import ItemTag from '@/components/clist/ItemTag.vue'

const isModalOpen = ref(false)

// Demo image (replace with actual image URL)
const demoImage = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
</script>

<style scoped>
.demo-hero-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

h2 {
    margin-bottom: 2rem;
    color: var(--color-text);
}

.demo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.demo-item h3 {
    margin-bottom: 1rem;
    color: var(--color-text);
    font-size: 1.125rem;
}

.demo-modal-trigger {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
}

.demo-button {
    padding: 1rem 2rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.demo-button:hover {
    background: var(--color-primary-hover, var(--color-primary-bg));
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
