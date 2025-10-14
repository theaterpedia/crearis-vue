<template>
    <Container>
        <Section>
            <Heading headline="Base Dashboard" />

            <div class="content-placeholder">
                <p class="info-text">Welcome to the Base Dashboard</p>
                <p class="sub-text">This is a protected view accessible to users with 'base' role.</p>

                <div class="info-card">
                    <h3>Current User</h3>
                    <p><strong>Username:</strong> {{ user?.username }}</p>
                    <p><strong>Role:</strong> {{ user?.role }}</p>
                </div>

                <p class="note">
                    🚧 This view will have a similar structure to the demo view. Content coming soon.
                </p>

                <Button @click="logout" class="logout-btn">Logout</Button>
            </div>
        </Section>
    </Container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import Button from '@/components/Button.vue'

const { user, requireAuth, logout } = useAuth()

onMounted(async () => {
    await requireAuth()
})
</script>

<style scoped>
.content-placeholder {
    padding: 2rem;
    background: #f9fafb;
    border-radius: 8px;
    margin-top: 2rem;
}

.info-text {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
}

.sub-text {
    font-size: 1rem;
    color: #6b7280;
    margin-bottom: 2rem;
}

.info-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
}

.info-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #111827;
}

.info-card p {
    margin-bottom: 0.5rem;
    color: #374151;
}

.note {
    padding: 1rem;
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    border-radius: 4px;
    color: #92400e;
    margin-bottom: 2rem;
}

.logout-btn {
    margin-top: 1rem;
}
</style>
