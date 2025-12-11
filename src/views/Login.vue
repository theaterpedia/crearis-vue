<template>
    <Container>
        <Section>
            <div class="login-container">
                <div class="login-card">
                    <Heading headline="Login" />

                    <form @submit.prevent="handleLogin" class="login-form">
                        <div class="form-group">
                            <Input id="userId" name="userId" label="User ID (Email)" v-model="userId" type="email"
                                placeholder="Enter your email" required :disabled="isLoading" />
                        </div>

                        <div class="form-group">
                            <Input id="password" name="password" label="Password" v-model="password" type="password"
                                placeholder="Enter your password" required :disabled="isLoading" />
                        </div>

                        <div v-if="error" class="error-message">
                            {{ error }}
                        </div>

                        <Button type="submit" :disabled="isLoading || !userId || !password" class="login-button">
                            {{ isLoading ? 'Logging in...' : 'Login' }}
                        </Button>
                    </form>
                </div>
            </div>
        </Section>
    </Container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'

const router = useRouter()
const { login, isLoading, isAuthenticated } = useAuth()

// Redirect if already logged in
onMounted(() => {
    if (isAuthenticated.value) {
        router.replace('/home')
    }
})

const userId = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
    error.value = ''

    const result = await login(userId.value, password.value)

    if (result.success) {
        // Redirect based on activeRole
        const { user } = useAuth()

        if (user.value?.activeRole === 'admin') {
            router.push('/home')
        } else if (user.value?.activeRole === 'base') {
            router.push('/home')
        } else if (user.value?.activeRole === 'project') {
            router.push('/projects')
        } else {
            router.push('/home')
        }
    } else {
        error.value = result.error || 'Login failed. Please check your credentials.'
    }
}
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem 0;
}

.login-card {
    width: 100%;
    max-width: 400px;
    padding: 2.5rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.login-form {
    margin-top: 2rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
}

.error-message {
    padding: 0.75rem;
    margin-bottom: 1rem;
    background-color: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    font-size: 0.875rem;
}

.login-button {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
}

.login-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
