<template>
    <Hero height-tmp="prominent"
        img-tmp="https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg"
        img-tmp-align-x="cover" img-tmp-align-y="cover"
        :overlay="`linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))`" content-width="short"
        content-align-y="center">
        <Banner transparent>
            <slot />
        </Banner>
    </Hero>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Hero from '@/components/Hero.vue'
import Banner from '@/components/Banner.vue'
import Prose from '@/components/Prose.vue'
import Button from '@/components/Button.vue'

const props = defineProps<{
    user?: any
}>()

const router = useRouter()

function handleRegister() {
    router.push('/getstarted')
}
</script>

<style scoped>
.cta-group {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 2rem;
}

.cta-secondary {
    color: var(--color-primary-contrast);
    text-decoration: underline;
    font-size: 1.125rem;
    transition: opacity 0.3s;
}

.cta-secondary:hover {
    opacity: 0.8;
}

@media (max-width: 767px) {
    .cta-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}
</style>
