<template>
    <Container>
        <Section>
            <div class="auth-container">
                <div class="auth-card">
                    <Heading headline="Create an account" />
                    <p class="auth-subheader">
                        Sign up as instructor or organiser. Parents and pupils
                        use the <router-link to="/getstarted">/getstarted</router-link>
                        flow.
                    </p>

                    <form
                        v-if="status !== 'success'"
                        @submit.prevent="handleSubmit"
                        class="auth-form"
                    >
                        <div class="form-group">
                            <Input
                                id="name"
                                name="name"
                                label="Name"
                                v-model="name"
                                type="text"
                                placeholder="Your full name"
                                required
                                :disabled="isSubmitting"
                            />
                        </div>

                        <div class="form-group">
                            <Input
                                id="email"
                                name="email"
                                label="Email"
                                v-model="email"
                                type="email"
                                placeholder="you@example.org"
                                required
                                :disabled="isSubmitting"
                            />
                        </div>

                        <div class="form-group">
                            <Input
                                id="password"
                                name="password"
                                label="Password"
                                v-model="password"
                                type="password"
                                placeholder="At least 8 characters"
                                required
                                :disabled="isSubmitting"
                            />
                        </div>

                        <div class="form-group checkbox-group">
                            <input
                                id="subscribeNewsletter"
                                v-model="subscribeNewsletter"
                                type="checkbox"
                                :disabled="isSubmitting"
                            />
                            <label for="subscribeNewsletter">
                                Subscribe to the newsletter (optional)
                            </label>
                        </div>

                        <div v-if="error" class="error-message">{{ error }}</div>

                        <Button
                            type="submit"
                            :disabled="isSubmitting || !canSubmit"
                            class="auth-button"
                        >
                            {{ isSubmitting ? 'Creating account…' : 'Create account' }}
                        </Button>

                        <p class="auth-help">
                            Already have an account?
                            <router-link to="/login">Log in</router-link>
                        </p>
                    </form>

                    <div v-else class="auth-help">
                        Account created. Redirecting…
                    </div>
                </div>
            </div>
        </Section>
    </Container>
</template>

<script setup lang="ts">
/**
 * /auth/register — Phase-A C8 · plan §9.
 *
 * Creator-tier registration form (instructor / organiser). Posts to the C2
 * endpoint /api/auth/odoo-register which creates an Odoo partner.
 *
 * Post-Stage-1-addon (crearis_auth_resolver_patches): the upstream resolver
 * adds request.session.authenticate() after signup → endpoint forwards
 * Set-Cookie → bridgeFromOdoo mirrors → checkSession() picks up the
 * bridged session → redirect to /home.
 *
 * Pre-Stage-1-addon: the partner is created but no Set-Cookie is issued →
 * no CV session created → redirect to /login so the user signs in fresh
 * with the credentials they just chose.
 *
 * Identity-principle ([[project-identity-principle-2-relation-stage-gates]]):
 * CREATOR-tier ONLY. The subheader directs parents/pupils to /getstarted
 * (CV-LOCAL-DB · zero-Odoo-presence). The UI must NOT offer this endpoint
 * as the registration path for /getstarted-originated users — that's enforced
 * here by labelling and by the absence of any other UI affordance routing
 * /getstarted-originated traffic into this page.
 *
 * Copy ("Create an account" / "Sign up as instructor or organiser") is
 * placeholder pending HM-review.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'

const router = useRouter()
const { checkSession, isAuthenticated } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const subscribeNewsletter = ref(false)
const error = ref('')
const isSubmitting = ref(false)
type Status = 'idle' | 'success'
const status = ref<Status>('idle')

const canSubmit = computed(
    () =>
        name.value.trim().length > 0 &&
        email.value.trim().length > 0 &&
        password.value.length >= 8,
)

onMounted(() => {
    if (isAuthenticated.value) router.replace('/home')
})

async function handleSubmit() {
    error.value = ''
    if (!canSubmit.value) {
        error.value =
            password.value.length < 8
                ? 'Please pick a password with at least 8 characters.'
                : 'Please fill in name, email, and password.'
        return
    }

    isSubmitting.value = true
    try {
        const response = await fetch('/api/auth/odoo-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: name.value.trim(),
                email: email.value.trim(),
                password: password.value,
                subscribeNewsletter: subscribeNewsletter.value,
            }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            if (response.status === 409) {
                error.value =
                    data.message ||
                    'An account already exists for this email. Try logging in.'
            } else {
                error.value = data.message || 'Could not create the account.'
            }
            return
        }

        status.value = 'success'
        // Post-Stage-1-addon: register auto-logs-in; checkSession sees the
        // bridged CV session; head to /home. Pre-Stage-1-addon: head to
        // /login so the user signs in with the credentials they chose.
        await checkSession()
        router.replace(isAuthenticated.value ? '/home' : '/login')
    } catch (err) {
        console.error('[RegisterPage] submit error:', err)
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
    max-width: 420px;
    padding: 2.5rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.auth-subheader {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #4b5563;
}

.auth-form {
    margin-top: 1.5rem;
}

.form-group {
    margin-bottom: 1.25rem;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #374151;
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
    margin-top: 1rem;
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
