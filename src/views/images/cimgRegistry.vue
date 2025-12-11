<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import PreviewConfig from '@/components/images/PreviewConfig.vue'
import ShapesPreview from '@/components/images/ShapesPreview.vue'
import AdaptersPanel from '@/components/images/AdaptersPanel.vue'

const route = useRoute()

// Mock user role for now - will be replaced with actual auth
const userRole = ref<'admin' | 'base' | 'user'>('admin')

// Determine context from route
const context = computed(() => {
    if (route.path.startsWith('/admin/images')) return 'admin'
    if (route.path.startsWith('/users/')) return 'user'
    if (route.path.startsWith('/sites/')) return 'site'
    return 'admin'
})

// Selected image state
const selectedImage = ref<any>(null)
const isAdaptersPanelOpen = ref(false)

// Sample image URL from instructors CSV (using first Unsplash ID from tests)
const dummyImageUrl = 'https://images.unsplash.com/photo-1761491924438-c529b4789a12'

// Navigation items based on context and role
const navItems = computed(() => {
    const baseItems = []

    if (context.value === 'admin') {
        if (userRole.value === 'base' || userRole.value === 'admin') {
            baseItems.push({
                label: 'Manage',
                children: [
                    { label: 'Register images from URLs', action: 'register' },
                    { label: 'Edit labels and tags', action: 'edit-tags' },
                    { label: 'Verify and curate', action: 'verify' },
                    { label: 'Prepare release', action: 'release' }
                ]
            })
        }

        if (userRole.value === 'admin') {
            baseItems.push({
                label: 'Admin',
                children: [
                    { label: 'JSON Import', action: 'json-import' },
                    { label: 'JSON Export', action: 'json-export' },
                    {
                        label: 'Configure Adapters',
                        children: [
                            { label: 'Unsplash', action: 'config-unsplash' },
                            { label: 'Cloudinary', action: 'config-cloudinary' },
                            { label: 'Canva', action: 'config-canva' },
                            { label: 'Vimeo', action: 'config-vimeo' }
                        ]
                    }
                ]
            })
        }
    } else if (context.value === 'user') {
        baseItems.push({
            label: 'Manage',
            children: [
                { label: 'Register images from URLs', action: 'register' },
                { label: 'Edit labels and tags', action: 'edit-tags' },
                { label: 'Verify and curate', action: 'verify' },
                { label: 'Prepare release', action: 'release' }
            ]
        })
    } else if (context.value === 'site') {
        baseItems.push(
            {
                label: 'Collection',
                children: [
                    { label: 'View all', action: 'collection-view' },
                    { label: 'Add to collection', action: 'collection-add' },
                    { label: 'Organize', action: 'collection-organize' }
                ]
            },
            {
                label: 'Stories',
                children: [
                    { label: 'Create story', action: 'story-create' },
                    { label: 'View stories', action: 'story-view' },
                    { label: 'Share story', action: 'story-share' }
                ]
            }
        )
    }

    return baseItems
})

// Handle menu actions
const handleMenuAction = (action: string) => {
    console.log('Menu action triggered:', action)
    // Show toast message for now
    alert(`Action: ${action} - Coming soon!`)
}

// Toggle adapters panel
const toggleAdaptersPanel = () => {
    isAdaptersPanelOpen.value = !isAdaptersPanelOpen.value
}

// Set initial selected image
onMounted(() => {
    selectedImage.value = {
        id: 1,
        url: dummyImageUrl,
        shape_square: `${dummyImageUrl}?w=400&h=400&fit=crop`,
        shape_thumb: `${dummyImageUrl}?w=200&h=150&fit=crop`,
        shape_wide: `${dummyImageUrl}?w=800&h=400&fit=crop`,
        shape_vertical: `${dummyImageUrl}?w=400&h=600&fit=crop`
    }
})
</script>

<template>
    <div class="cimg-registry">
        <PageLayout setSiteLayout="centered" navbarMode="dashboard" :show-back-arrow="true">
            <!-- Logo slot -->
            <template #logo>
                <span class="images-logo">images</span>
            </template>

            <!-- Heading slot with settings preview -->
            <template #header>
                <div class="settings-preview" :class="{ 'simple': !selectedImage }"
                    :style="selectedImage ? { backgroundImage: `url(${selectedImage.shape_square})` } : {}">
                    <div class="settings-preview-content">
                        <!-- PreviewConfig component -->
                        <PreviewConfig v-if="selectedImage" :image="selectedImage" />
                        <div v-else class="no-selection">
                            <p>Select an image to preview settings</p>
                        </div>
                    </div>
                </div>

                <!-- ShapesPreview row -->
                <ShapesPreview v-if="selectedImage" :image="selectedImage" />
            </template>

            <!-- Main gallery content -->
            <div class="image-gallery">
                <div class="gallery-header">
                    <h2>Image Gallery</h2>
                    <button class="btn-toggle-sidebar" @click="() => { }">
                        Toggle Filters
                    </button>
                </div>

                <div class="gallery-grid">
                    <!-- Placeholder gallery items -->
                    <div v-for="i in 12" :key="i" class="gallery-item" @click="() => { }">
                        <img :src="`/dummy.svg`" alt="Gallery item" />
                        <div class="gallery-item-info">
                            <span>Image {{ i }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar with filters (can be toggled) -->
            <template #aside>
                <div class="filters-sidebar">
                    <h3>Filters & Sort</h3>
                    <div class="filter-section">
                        <h4>Categories</h4>
                        <ul>
                            <li><button>All Images</button></li>
                            <li><button>Photos</button></li>
                            <li><button>Graphics</button></li>
                            <li><button>Videos</button></li>
                        </ul>
                    </div>
                    <div class="filter-section">
                        <h4>Tags</h4>
                        <div class="tag-list">
                            <span class="tag">nature</span>
                            <span class="tag">architecture</span>
                            <span class="tag">people</span>
                        </div>
                    </div>
                </div>
            </template>
        </PageLayout>

        <!-- Adapters Panel (ConfigPanel-like) -->
        <AdaptersPanel v-if="selectedImage" :is-open="isAdaptersPanelOpen" :image="selectedImage"
            :is-muted="userRole === 'base' || userRole === 'user'" @toggle="toggleAdaptersPanel" />
    </div>
</template>

<style scoped>
.cimg-registry {
    min-height: 100vh;
}

.images-logo {
    font-weight: 600;
    font-size: 1.25rem;
    color: var(--color-primary-base);
}

/* Settings Preview in heading */
.settings-preview {
    width: 100%;
    min-height: 20rem;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 2rem;
    transition: min-height var(--duration) var(--ease);
}

.settings-preview.simple {
    min-height: 8rem;
    background: var(--color-muted-bg);
}

.settings-preview-content {
    width: 100%;
    background: oklch(from var(--color-card-bg) l c h / 0.9);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-medium);
    padding: 1.5rem;
}

.no-selection {
    text-align: center;
    color: var(--color-muted-contrast);
}

/* Image Gallery */
.image-gallery {
    padding: 2rem;
}

.gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.gallery-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
}

.btn-toggle-sidebar {
    padding: 0.5rem 1rem;
    background: var(--color-primary-base);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: var(--radius-small);
    cursor: pointer;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

.gallery-item {
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-medium);
    overflow: hidden;
    cursor: pointer;
    transition: transform var(--duration) var(--ease);
    background: var(--color-card-bg);
}

.gallery-item:hover {
    transform: translateY(-4px);
}

.gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.gallery-item-info {
    padding: 0.75rem;
    background: var(--color-card-bg);
}

/* Filters Sidebar */
.filters-sidebar {
    padding: 1.5rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-medium);
}

.filters-sidebar h3 {
    margin-bottom: 1.5rem;
    font-size: 1.125rem;
    font-weight: 600;
}

.filter-section {
    margin-bottom: 1.5rem;
}

.filter-section h4 {
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-muted-contrast);
}

.filter-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.filter-section li {
    margin-bottom: 0.5rem;
}

.filter-section button {
    width: 100%;
    text-align: left;
    padding: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-small);
    transition: background var(--duration) var(--ease);
}

.filter-section button:hover {
    background: var(--color-muted-bg);
}

.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag {
    padding: 0.25rem 0.75rem;
    background: var(--color-muted-bg);
    border-radius: 999px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background var(--duration) var(--ease);
}

.tag:hover {
    background: var(--color-accent-bg);
}
</style>
