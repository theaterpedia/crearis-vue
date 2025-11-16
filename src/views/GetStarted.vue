<template>
    <div class="getstarted-page">
        <Navbar :user="user" @logout="handleLogout">
            <template #menus v-if="user && user.activeRole === 'admin'">
                <AdminMenu />
            </template>
        </Navbar>

        <Box layout="full-width">
            <Main>
                <Section background="default">
                    <Container>
                        <Columns gap="medium" align="top">
                            <!-- Main Content -->
                            <Column width="2/3">
                                <Prose>
                                    <Heading overline="Join Us" level="h1">Theaterpedia **Conference** 2025</Heading>

                                    <h2>Munich, Germany</h2>
                                    <p><strong>November 20-23, 2025</strong></p>

                                    <h3>About the Conference</h3>
                                    <p>
                                        Join theater professionals, educators, and enthusiasts from around the world
                                        for four days of workshops, performances, and networking at the annual
                                        Theaterpedia Conference.
                                    </p>

                                    <h3>What to Expect</h3>
                                    <ul>
                                        <li><strong>Workshops & Masterclasses:</strong> Learn from industry leaders and
                                            experienced practitioners</li>
                                        <li><strong>Performances:</strong> Evening showcase of innovative theater
                                            productions
                                        </li>
                                        <li><strong>Networking:</strong> Connect with theater professionals from across
                                            Europe
                                        </li>
                                        <li><strong>Panel Discussions:</strong> Explore current trends and challenges in
                                            theater
                                            education</li>
                                    </ul>

                                    <h3>Schedule Overview</h3>
                                    <ul>
                                        <li><strong>November 20:</strong> Opening Ceremony & Keynote Speech</li>
                                        <li><strong>November 21:</strong> Workshop Day 1 & Evening Performance</li>
                                        <li><strong>November 22:</strong> Workshop Day 2 & Panel Discussions</li>
                                        <li><strong>November 23:</strong> Final Presentations & Closing Event</li>
                                    </ul>

                                    <h3>Venue</h3>
                                    <p>
                                        The conference will be held at the historic <strong>Münchner
                                            Volkstheater</strong>,
                                        located in the heart of Munich's cultural district.
                                    </p>

                                    <h3>Registration</h3>
                                    <p>
                                        Early bird registration is now open! Complete the registration form to secure
                                        your spot. Space is limited to 150 participants.
                                    </p>

                                    <p><strong>Registration Fees:</strong></p>
                                    <ul>
                                        <li>Early Bird (until Oct 31): €250</li>
                                        <li>Standard (Nov 1-10): €350</li>
                                        <li>Late Registration (after Nov 10): €450</li>
                                        <li>Student Rate: €150 (with valid ID)</li>
                                    </ul>
                                </Prose>
                            </Column>

                            <!-- Registration Form Aside -->
                            <Column width="1/3" sticky="top-20">
                                <Box>
                                    <div class="registration-form">
                                        <Prose>
                                            <h3>Register Now</h3>
                                        </Prose>

                                        <form @submit.prevent="handleRegistration">
                                            <div class="form-group">
                                                <label for="name">Full Name *</label>
                                                <input type="text" id="name" v-model="form.name" required
                                                    placeholder="Your name" />
                                            </div>

                                            <div class="form-group">
                                                <label for="email">Email Address *</label>
                                                <input type="email" id="email" v-model="form.email" required
                                                    placeholder="your@email.com" />
                                            </div>

                                            <div class="form-group">
                                                <label for="organization">Organization</label>
                                                <input type="text" id="organization" v-model="form.organization"
                                                    placeholder="Theater, University, etc." />
                                            </div>

                                            <div class="form-group">
                                                <label for="role">Your Role</label>
                                                <select id="role" v-model="form.role">
                                                    <option value="">Select a role</option>
                                                    <option value="director">Director</option>
                                                    <option value="actor">Actor</option>
                                                    <option value="educator">Educator</option>
                                                    <option value="student">Student</option>
                                                    <option value="producer">Producer</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>

                                            <div class="form-group">
                                                <label for="ticket-type">Ticket Type *</label>
                                                <select id="ticket-type" v-model="form.ticketType" required>
                                                    <option value="">Select ticket type</option>
                                                    <option value="earlybird">Early Bird - €250</option>
                                                    <option value="standard">Standard - €350</option>
                                                    <option value="late">Late Registration - €450</option>
                                                    <option value="student">Student - €150</option>
                                                </select>
                                            </div>

                                            <div class="form-group">
                                                <label>
                                                    <input type="checkbox" v-model="form.newsletter" />
                                                    Subscribe to newsletter
                                                </label>
                                            </div>

                                            <div class="form-group">
                                                <label>
                                                    <input type="checkbox" v-model="form.terms" required />
                                                    I accept the terms and conditions *
                                                </label>
                                            </div>

                                            <Button type="submit" variant="primary" size="medium"
                                                :disabled="registrationStatus === 'submitting'">
                                                {{ submitButtonText }}
                                            </Button>

                                            <p v-if="registrationStatus === 'success'" class="success-message">
                                                ✓ Registration submitted! Check your email for confirmation.
                                            </p>
                                            <p v-if="registrationStatus === 'error'" class="error-message">
                                                ✗ Registration failed. Please try again.
                                            </p>
                                        </form>
                                    </div>
                                </Box>
                            </Column>
                        </Columns>
                    </Container>
                </Section>
            </Main>
        </Box>

        <!-- New Home Site Footer -->
        <HomeSiteFooter />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeRoutes } from '@/config/homeroutes'
import Navbar from '@/components/Navbar.vue'
import AdminMenu from '@/components/AdminMenu.vue'
import Box from '@/components/Box.vue'
import Main from '@/components/Main.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Button from '@/components/Button.vue'
import Footer from '@/components/Footer.vue'
import HomeSiteFooter from '@/views/Home/HomeComponents/homeSiteFooter.vue'

const router = useRouter()

// Auth state
const user = ref<any>(null)

// Form state
const form = ref({
    name: '',
    email: '',
    organization: '',
    role: '',
    ticketType: '',
    newsletter: false,
    terms: false
})

const registrationStatus = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')

// Button text computed
const submitButtonText = computed(() => {
    return registrationStatus.value === 'submitting' ? 'Submitting...' : 'Register Now'
})

// SEO: Set meta tags for get started page
function setMetaTags() {
    const meta = homeRoutes.getstarted;
    if (!meta) return;

    document.title = meta.title;

    const setMeta = (selector: string, attributes: Record<string, string>) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            const tagMatch = selector.match(/^(\w+)\[/);
            const tag = tagMatch && tagMatch[1] ? tagMatch[1] : 'meta';
            element = document.createElement(tag);
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            element!.setAttribute(key, value);
        });
    };

    setMeta('meta[name="description"]', { name: 'description', content: meta.description });
    if (meta.keywords) {
        setMeta('meta[name="keywords"]', { name: 'keywords', content: meta.keywords });
    }
    setMeta('meta[property="og:title"]', { property: 'og:title', content: meta.ogTitle || meta.title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: meta.ogDescription || meta.description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: meta.twitterCard || 'summary' });
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data.authenticated) {
            user.value = data.user
        }
    } catch (error) {
        console.error('Auth check failed:', error)
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' })
        user.value = null
        router.push('/login')
    } catch (error) {
        console.error('Logout failed:', error)
    }
}

// Handle registration
async function handleRegistration() {
    registrationStatus.value = 'submitting'

    try {
        // Simulate API call (replace with actual endpoint)
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log('Registration data:', form.value)

        registrationStatus.value = 'success'

        // Reset form after 3 seconds
        setTimeout(() => {
            form.value = {
                name: '',
                email: '',
                organization: '',
                role: '',
                ticketType: '',
                newsletter: false,
                terms: false
            }
            registrationStatus.value = 'idle'
        }, 3000)
    } catch (error) {
        console.error('Registration failed:', error)
        registrationStatus.value = 'error'
        setTimeout(() => {
            registrationStatus.value = 'idle'
        }, 3000)
    }
}

onMounted(async () => {
    setMetaTags()
    await checkAuth()
})
</script>

<style scoped>
.getstarted-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

.registration-form {
    padding: 1.5rem;
    background-color: var(--color-card-bg);
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
}

.registration-form h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1.25rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-contrast);
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group select {
    width: 100%;
    padding: 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background-color: var(--color-bg);
    color: var(--color-contrast);
    font-family: inherit;
    font-size: 0.875rem;
}

.form-group input[type="text"]:focus,
.form-group input[type="email"]:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
}

.form-group input[type="checkbox"] {
    margin-right: 0.5rem;
}

.form-group label:has(input[type="checkbox"]) {
    display: flex;
    align-items: center;
    font-weight: normal;
    cursor: pointer;
}

.success-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: var(--color-positive-bg);
    color: var(--color-positive-contrast);
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: var(--color-negative-bg);
    color: var(--color-negative-contrast);
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

@media (max-width: 767px) {
    .registration-form {
        padding: 1rem;
    }
}
</style>
