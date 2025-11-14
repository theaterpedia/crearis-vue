<template>
    <Hero height-tmp="prominent"
        img-tmp="https://res.cloudinary.com/little-papillon/image/upload/c_crop,g_north_east,h_1000,w_1800,x_0,y_230/c_scale,w_1200/v1665139609/lichtpunkte_ea_rh.jpg"
        img-tmp-align-x="cover" img-tmp-align-y="top" content-width="short" content-align-y="bottom">
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
