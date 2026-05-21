<template>
    <Container>
        <Section>
            <div class="auth-container">
                <div class="auth-card">
                    <Heading headline="Set a new password" />

                    <p v-if="!token" class="auth-help error-message">
                        This reset link is missing its token. Request a new one
                        below.
                    </p>

                    <form
                        v-else-if="status !== 'success'"
                        @submit.prevent="handleSubmit"
                        class="auth-form"
                    >
                        <div class="form-group">
                            <Input
                                id="newPassword"
                                name="newPassword"
                                label="New password"
                                v-model="newPassword"
                                type="password"
                                placeholder="At least 8 characters"
                                required
                                :disabled="isSubmitting"
                            />
                        </div>

                        <div class="form-group">
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                label="Confirm new password"
                                v-model="confirmPassword"
                                type="password"
                                placeholder="Repeat the password"
                                required
                                :disabled="isSubmitting"
                            />
                        </div>

                        <div v-if="error" class="error-message">{{ error }}</div>

                        <Button
                            type="submit"
                            :disabled="isSubmitting || !canSubmit"
                            class="auth-button"
                        >
                            {{ isSubmitting ? 'Setting password…' : 'Set new password' }}
                        </Button>
                    </form>

                    <div v-if="status === 'success'" class="auth-help">
                        Password set. Redirecting…
                    </div>

                    <div v-if="status === 'rejected'" class="auth-help">
                        <router-link to="/login">Back to login</router-link>
                    </div>
                </div>
            </div>
        </Section>
    </Container>
</template>

<script setup lang="ts">
/**
 * /auth/reset — Phase-A C7 · plan §8.
 *
 * Landing-surface for Odoo's password-reset email (link target set by
 * CO@prod's `crearis_password_reset_cv_url` addon · Phase-C item-2).
 *
 * Flow:
 *   1. Reads `token` from `?token=...` query-param
 *   2. User picks newPassword + confirms
 *   3. POST /api/auth/odoo-password-reset-confirm (C4 endpoint)
 *   4. On success: checkSession() to pick up the bridged CV session
 *      (post-Stage-1-addon) · then redirect to /home. Pre-Stage-1-addon
 *      the endpoint returns success without Set-Cookie; checkSession sees
 *      no auth and we redirect to /login instead.
 *   5. On 401: "Invalid or expired link" + a "back to login" link · the
 *      C3 forgot-password request UI is a separate surface (not in plan
 *      Phase-A · Login.vue may grow a "forgot password" link in Phase-B).
 *
 * Identity-principle: token-based · no email/name handling needed here.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'

const route = useRoute()
const router = useRouter()
const { checkSession, isAuthenticated } = useAuth()

const token = computed(() => {
    const raw = route.query.token
    if (typeof raw === 'string' && raw.length > 0) return raw
    return ''
})

const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const isSubmitting = ref(false)
type Status = 'idle' | 'success' | 'rejected'
const status = ref<Status>('idle')

const canSubmit = computed(
    () =>
        newPassword.value.length >= 8 &&
        newPassword.value === confirmPassword.value,
)

onMounted(() => {
    // If user lands here already authed, redirect away.
    if (isAuthenticated.value) router.replace('/home')
})

async function handleSubmit() {
    error.value = ''
    if (!token.value) {
        error.value = 'This reset link is missing its token.'
        return
    }
    if (!canSubmit.value) {
        error.value =
            newPassword.value !== confirmPassword.value
                ? 'Passwords do not match.'
                : 'Please pick a password with at least 8 characters.'
        return
    }

    isSubmitting.value = true
    try {
        const response = await fetch('/api/auth/odoo-password-reset-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                token: token.value,
                newPassword: newPassword.value,
            }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            if (response.status === 401) {
                status.value = 'rejected'
                error.value = data.message || 'Invalid or expired link.'
            } else {
                error.value = data.message || 'Could not set the new password.'
            }
            return
        }

        status.value = 'success'
        // Stage-1 addon deployed → checkSession picks up the bridged CV
        // session and we land on /home. Pre-Stage-1 → no CV session, head to
        // /login so the user can sign in with the new password.
        await checkSession()
        router.replace(isAuthenticated.value ? '/home' : '/login')
    } catch (err) {
        console.error('[PasswordResetPage] submit error:', err)
        error.value = err instanceof Error ? err.message : 'Network error'
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem 0;
}

.auth-card {
    width: 100%;
    max-width: 400px;
    padding: 2.5rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.auth-form {
    margin-top: 2rem;
}

.form-group {
    margin-bottom: 1.5rem;
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

.auth-help {
    margin-top: 1.5rem;
    font-size: 0.875rem;
    color: #4b5563;
}

.auth-button {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
}

.auth-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
