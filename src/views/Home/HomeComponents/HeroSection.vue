<template>
    <Hero height-tmp="prominent"
        img-tmp="https://res.cloudinary.com/little-papillon/image/upload/c_fill,w_1440,h_900,g_auto/v1666847011/pedia_ipsum/core/theaterpedia.jpg"
        img-tmp-align-x="cover" img-tmp-align-y="cover"
        :overlay="`linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))`" content-width="short"
        content-align-y="center">
        <Banner transparent>
            <Prose>
                <h1><strong>Theater Community Platform</strong></h1>
                <p>Connecting artists, projects, and audiences in the world of theater.</p>
                <div class="cta-group">
                    <Button size="medium" variant="primary" @click="handleRegister">
                        Register for Conference
                    </Button>
                    <!-- Trigger 1: Secondary CTA for Demo -->
                    <button class="cta-secondary cta-demo" @click="handleDemoClick">
                        Demo erkunden
                    </button>
                </div>
            </Prose>
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

const emit = defineEmits<{
    'trigger-demo': [event: MouseEvent]
}>()

const router = useRouter()

function handleRegister() {
    router.push('/getstarted')
}

function handleDemoClick(event: MouseEvent) {
    emit('trigger-demo', event)
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
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
}

.cta-secondary:hover {
    opacity: 0.8;
}

.cta-demo {
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 500;
}

.cta-demo:hover {
    background: rgba(255, 255, 255, 0.25);
    opacity: 1;
}

@media (max-width: 767px) {
    .cta-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}
</style>
