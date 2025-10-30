<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CreateInteraction from '@/components/forms/CreateInteraction.vue'

interface Props {
    usermode?: 'no' | 'guest' | 'user'
    projectId?: number
}

const props = withDefaults(defineProps<Props>(), {
    usermode: 'no',
    projectId: undefined
})

// State
const usermode = ref<'no' | 'guest' | 'user' | undefined>(props.usermode)
const emailInput = ref('')
const emailSuggestions = ref<string[]>([])
const allUserEmails = ref<string[]>([])
const selectedEmail = ref('')
const showSuggestions = ref(false)

// Computed
const showForm = computed(() => {
    return usermode.value && usermode.value !== 'no'
})

const interactionFields = computed(() => {
    if (!usermode.value || usermode.value === 'no') {
        return false
    }
    return usermode.value === 'guest' ? 'registration' : 'verification'
})

/**
 * Fetch all user emails on mount
 */
onMounted(async () => {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const users = await response.json()
            allUserEmails.value = users
                .map((u: any) => u.extmail || u.sysmail)
                .filter((email: string) => email)
        }
    } catch (error) {
        console.error('Error fetching user emails:', error)
    }
})

/**
 * Handle email input changes with lookahead support
 */
function handleEmailInput() {
    const input = emailInput.value.trim()

    // Start lookahead after 10 characters
    if (input.length >= 10) {
        emailSuggestions.value = allUserEmails.value.filter(email =>
            email.toLowerCase().startsWith(input.toLowerCase())
        )
        showSuggestions.value = emailSuggestions.value.length > 0
    } else {
        emailSuggestions.value = []
        showSuggestions.value = false
    }

    // Check if it's a valid email
    if (isValidEmail(input)) {
        checkEmailExists(input)
    }
}

/**
 * Select email from suggestions
 */
function selectEmail(email: string) {
    emailInput.value = email
    selectedEmail.value = email
    showSuggestions.value = false
    checkEmailExists(email)
}

/**
 * Check if email exists in users table
 */
function checkEmailExists(email: string) {
    const exists = allUserEmails.value.some(
        userEmail => userEmail.toLowerCase() === email.toLowerCase()
    )

    if (exists) {
        usermode.value = 'user'
    } else {
        usermode.value = 'guest'
    }
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Handle form submission success
 */
function handleFormSaved(interactionId: number) {
    console.log('Interaction saved with ID:', interactionId)
    // Could show a success message or redirect
}

/**
 * Handle form submission error
 */
function handleFormError(error: string) {
    console.error('Form error:', error)
    // Could show an error message
}
</script>

<template>
    <div class="page-start">
        <!-- Hero/Heading Section -->
        <section class="hero-section">
            <div class="container">
                <h1 class="hero-title">Willkommen zur Theaterpädagogik-Konferenz 2025</h1>
                <p class="hero-subtitle">
                    20. - 23. November 2025 | München
                </p>
                <p class="hero-description">
                    Werden Sie Teil unserer jährlichen Konferenz für innovative Theaterpädagogik.
                    Lernen Sie neue Methoden kennen, tauschen Sie sich mit Kolleg:innen aus und
                    entwickeln Sie Ihre Praxis weiter.
                </p>
            </div>
        </section>

        <!-- Registration Section -->
        <section class="registration-section bg-accent">
            <div class="container">
                <div class="registration-header">
                    <h2>Anmeldung</h2>
                    <p>Bitte geben Sie Ihre E-Mail-Adresse ein, um fortzufahren</p>
                </div>

                <!-- Email Input Row -->
                <div class="email-input-row">
                    <div class="form-group">
                        <label for="email" class="form-label">E-Mail-Adresse</label>
                        <div class="email-input-wrapper">
                            <input id="email" v-model="emailInput" type="email" class="form-input"
                                placeholder="ihre.email@example.com" @input="handleEmailInput"
                                @focus="handleEmailInput" />

                            <!-- Email suggestions dropdown -->
                            <div v-if="showSuggestions" class="email-suggestions">
                                <button v-for="email in emailSuggestions" :key="email" type="button"
                                    class="suggestion-item" @click="selectEmail(email)">
                                    {{ email }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <div class="status-display">
                            <span v-if="!usermode || usermode === 'no'" class="status-badge status-none">
                                Keine E-Mail eingegeben
                            </span>
                            <span v-else-if="usermode === 'guest'" class="status-badge status-guest">
                                Neue Anmeldung
                            </span>
                            <span v-else-if="usermode === 'user'" class="status-badge status-user">
                                Bestehender Nutzer
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Interaction Form -->
                <div v-if="showForm && interactionFields" class="form-container">
                    <CreateInteraction :form-name="interactionFields" :show="showForm" :project-id="projectId"
                        :user-email="emailInput" @saved="handleFormSaved" @error="handleFormError" />
                </div>
            </div>
        </section>

        <!-- Additional Content Section -->
        <section class="content-section">
            <div class="container">
                <h2>Über die Konferenz</h2>
                <div class="content-grid">
                    <div class="content-card">
                        <h3>📅 Programm</h3>
                        <p>Vier Tage vollgepackt mit Workshops, Vorträgen und Networking-Möglichkeiten.</p>
                    </div>
                    <div class="content-card">
                        <h3>👥 Teilnehmer</h3>
                        <p>Über 200 Theaterpädagog:innen aus ganz Deutschland und Europa.</p>
                    </div>
                    <div class="content-card">
                        <h3>🎭 Workshops</h3>
                        <p>Praxisorientierte Sessions zu digitalen Methoden, Inklusion und mehr.</p>
                    </div>
                    <div class="content-card">
                        <h3>🏆 Zertifikat</h3>
                        <p>Teilnahmebescheinigung für Ihre professionelle Weiterbildung.</p>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.page-start {
    min-height: 100vh;
}

.hero-section {
    padding: 4rem 0;
    background: linear-gradient(135deg, var(--color-primary-light, #dbeafe) 0%, var(--color-primary-lighter, #f0f9ff) 100%);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

.hero-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--color-text, #1f2937);
}

.hero-subtitle {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-primary, #3b82f6);
    margin-bottom: 1rem;
}

.hero-description {
    font-size: 1.125rem;
    line-height: 1.75;
    color: var(--color-text-muted, #6b7280);
    max-width: 800px;
}

.registration-section {
    padding: 4rem 0;
    background: var(--color-accent-bg, #fef3c7);
}

.bg-accent {
    background: var(--color-accent-bg, #fef3c7);
}

.registration-header {
    margin-bottom: 2rem;
}

.registration-header h2 {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.email-input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    .email-input-row {
        grid-template-columns: 1fr;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--color-text, #1f2937);
}

.email-input-wrapper {
    position: relative;
}

.form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.email-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    margin-top: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    z-index: 10;
}

.suggestion-item {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.95rem;
    transition: background-color 0.15s;
}

.suggestion-item:hover {
    background: var(--color-primary-lighter, #eff6ff);
}

.status-display {
    display: flex;
    align-items: center;
    height: 100%;
    padding-top: 0.75rem;
}

.status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.status-none {
    background: var(--color-gray-light, #f3f4f6);
    color: var(--color-gray-dark, #6b7280);
}

.status-guest {
    background: var(--color-info-bg, #dbeafe);
    color: var(--color-info, #2563eb);
}

.status-user {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #16a34a);
}

.form-container {
    margin-top: 2rem;
    padding: 2rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.content-section {
    padding: 4rem 0;
}

.content-section h2 {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 2rem;
}

.content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.content-card {
    padding: 1.5rem;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.75rem;
    transition: box-shadow 0.2s;
}

.content-card:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.content-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.content-card p {
    color: var(--color-text-muted, #6b7280);
    line-height: 1.6;
}
</style>
