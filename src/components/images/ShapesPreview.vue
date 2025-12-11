<script setup lang="ts">
defineProps<{
    image: {
        shape_square?: string
        shape_thumb?: string
        shape_wide?: string
        shape_vertical?: string
    }
}>()
</script>

<template>
    <div class="shapes-preview">
        <div class="shape-card">
            <div class="shape-image vertical">
                <img :src="image.shape_vertical || '/dummy.svg'" alt="Vertical shape" />
            </div>
            <span class="shape-label">Vertical</span>
        </div>

        <div class="shape-card">
            <div class="shape-image thumb">
                <img :src="image.shape_thumb || '/dummy.svg'" alt="Thumbnail shape" />
            </div>
            <span class="shape-label">Thumb</span>
        </div>

        <div class="shape-card">
            <div class="shape-image wide">
                <img :src="image.shape_wide || '/dummy.svg'" alt="Wide shape" />
            </div>
            <span class="shape-label">Wide</span>
        </div>
    </div>
</template>

<style scoped>
.shapes-preview {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-medium);
    overflow-x: auto;
}

.shape-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
}

.shape-image {
    border-radius: var(--radius-small);
    overflow: hidden;
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.1);
    transition: transform var(--duration) var(--ease);
}

.shape-image:hover {
    transform: scale(1.05);
}

.shape-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.shape-image.vertical {
    width: 8rem;
    height: 12rem;
}

.shape-image.thumb {
    width: 10rem;
    height: 7.5rem;
}

.shape-image.wide {
    width: 14rem;
    height: 7rem;
}

.shape-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-muted-contrast);
}

@media (max-width: 768px) {
    .shapes-preview {
        justify-content: flex-start;
        padding: 1rem;
    }

    .shape-image.vertical {
        width: 6rem;
        height: 9rem;
    }

    .shape-image.thumb {
        width: 8rem;
        height: 6rem;
    }

    .shape-image.wide {
        width: 10rem;
        height: 5rem;
    }
}
</style>
