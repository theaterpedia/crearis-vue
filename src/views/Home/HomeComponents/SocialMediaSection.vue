<template>
    <Section background="muted">
        <Container>
            <Prose>
                <Heading overline="Connect With Us" level="h2">Join Our **Community**</Heading>
            </Prose>

            <Columns gap="medium" align="center" wrap>
                <Column width="1/2">
                    <a href="https://signal.org" target="_blank" rel="noopener noreferrer" class="social-media-link">
                        <div class="social-media-card">
                            <div class="social-icon">
                                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28H116a28,28,0,0,1,0-56h24A28,28,0,0,1,168,148Zm-28-12H116a12,12,0,0,0,0,24h24a12,12,0,0,0,0-24Z" />
                                </svg>
                            </div>
                            <h3>Signal</h3>
                            <p>Secure messaging</p>
                        </div>
                    </a>
                </Column>

                <Column width="1/2">
                    <a href="https://discord.com" target="_blank" rel="noopener noreferrer" class="social-media-link">
                        <div class="social-media-card">
                            <div class="social-icon">
                                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M104,140a12,12,0,1,1-12-12A12,12,0,0,1,104,140Zm60-12a12,12,0,1,0,12,12A12,12,0,0,0,164,128Zm68,0A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                                </svg>
                            </div>
                            <h3>Discord</h3>
                            <p>Community chat</p>
                        </div>
                    </a>
                </Column>

                <Column width="1/2">
                    <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" class="social-media-link">
                        <div class="social-media-card">
                            <div class="social-icon">
                                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a88.11,88.11,0,0,1-44.65-12.08l-6.17-3.56-30.49,10.16,10.16-30.49-3.56-6.17A88,88,0,1,1,128,216Z" />
                                </svg>
                            </div>
                            <h3>WhatsApp</h3>
                            <p>Direct messaging</p>
                        </div>
                    </a>
                </Column>

                <Column width="1/2">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-media-link">
                        <div class="social-media-card">
                            <div class="social-icon">
                                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z" />
                                </svg>
                            </div>
                            <h3>Instagram</h3>
                            <p>Follow our journey</p>
                        </div>
                    </a>
                </Column>

                <Column width="1/2">
                    <a href="https://vimeo.com" target="_blank" rel="noopener noreferrer" class="social-media-link">
                        <div class="social-media-card">
                            <div class="social-icon">
                                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M164.44,121.34l-48-32A8,8,0,0,0,104,96v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,145.05V111l25.58,17ZM216,40H40A16,16,0,0,0,24,56V168a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,128H40V56H216V168Z" />
                                </svg>
                            </div>
                            <h3>Vimeo</h3>
                            <p>Watch our videos</p>
                        </div>
                    </a>
                </Column>
            </Columns>
        </Container>
    </Section>
</template>

<script setup lang="ts">
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
</script>

<style scoped>
.social-media-link {
    text-decoration: none;
    color: inherit;
    display: block;
}

.social-media-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    transition: var(--transition);
    transition-property: transform, box-shadow;
    text-align: center;
}

.social-media-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    margin-bottom: 1rem;
    color: var(--color-primary-bg);
    background-color: var(--color-primary-bg);
    background: linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-accent-bg) 100%);
    border-radius: 50%;
}

.social-icon svg {
    color: var(--color-primary-contrast);
}

.social-media-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-contrast);
}

.social-media-card p {
    font-size: 0.875rem;
    color: var(--color-contrast);
    opacity: 0.7;
    margin: 0;
}

@media (max-width: 767px) {
    .social-media-card {
        padding: 1.5rem;
    }

    .social-icon {
        width: 60px;
        height: 60px;
    }

    .social-icon svg {
        width: 32px;
        height: 32px;
    }
}
</style>
