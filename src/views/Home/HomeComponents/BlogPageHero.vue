<template>
    <Hero height-tmp="medium"
        img-tmp="https://res.cloudinary.com/little-papillon/image/upload/ar_16:7,c_crop/c_scale,w_1200/v1676756784/164_dasei2022_team_I8A7740_uzzmne.jpg"
        img-tmp-align-x="cover" img-tmp-align-y="left"
        :overlay="`linear-gradient(to bottom, rgba(0,0,0,0), rgba(255,255,255,0.6))`" content-width="short"
        content-align-y="bottom">
        <Prose>
            <h1><strong>Dev Blog</strong></h1>
        </Prose>
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
