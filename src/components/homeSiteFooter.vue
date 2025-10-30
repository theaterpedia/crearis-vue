<template>
    <div class="home-site-footer">
        <Container>
            <div class="footer-content">
                <!-- About Section -->
                <div class="footer-section footer-about">
                    <Prose>
                        <p><strong>Theaterpedia</strong> - {{ pageSettings.claim }}</p>
                        <p>Connecting artists, projects, and audiences in the world of theater. Building the future of
                            theater community platforms.</p>
                    </Prose>
                </div>

                <!-- Quick Links -->
                <div class="footer-section footer-links">
                    <Prose>
                        <p><strong>Seiten</strong></p>
                    </Prose>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/blog">Blog</a></li>
                        <li><a href="/team">Team</a></li>
                        <li><a href="/start">Get Started</a></li>
                    </ul>
                </div>

                <!-- Resources -->
                <div class="footer-section footer-resources">
                    <Prose>
                        <p><strong>Rechtliches</strong></p>
                    </Prose>
                    <ul>
                        <li><a href="/contact">Kontakt</a></li>
                        <li><a href="/impressum">Impressum</a></li>
                        <li><a href="/datenschutz">Datenschutz</a></li>
                    </ul>
                </div>

                <!-- Social & Copyright -->
                <div class="footer-section footer-social">
                    <Prose>
                        <p><strong>Connect</strong></p>
                    </Prose>
                    <div class="footer-social-media">
                        <SocialMediaSection size="small" :is-vertical="true" />
                    </div>
                    <div class="copyright">
                        <Prose>
                            <p>&copy; 2025 Theaterpedia.org Network. All rights reserved.</p>
                        </Prose>
                    </div>
                </div>
            </div>
        </Container>
    </div>
</template>

<script lang="ts" setup>
import Container from './Container.vue'
import Prose from './Prose.vue'
import SocialMediaSection from '@/views/Home/HomeComponents/SocialMediaSection.vue'
import { pageSettings } from '@/settings'
</script>

<style scoped>
.home-site-footer {
    --color-bg: var(--color-accent-bg);
    --color-contrast: var(--color-accent-contrast);
    --color-muted-contrast: var(--color-accent-contrast);
    --link: var(--color-primary-base);
    width: 100%;
    background-color: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    padding: 3rem 0 1.5rem;
    margin-top: 4rem;
}

.footer-content {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1.5fr;
    gap: 2rem;
    font-size: 0.875rem;
}

.footer-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.footer-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.footer-section ul li a {
    color: var(--color-accent-contrast);
    text-decoration: none;
    transition: color 0.2s ease;
}

.footer-section ul li a:hover,
.footer-section ul li a:focus {
    color: var(--link);
    text-decoration: underline;
}

.footer-about {
    max-width: 280px;
}

.footer-social-media {
    margin: 0;
}

.footer-social-media :deep(.social-compact-row) {
    justify-content: flex-start;
}

.footer-social-media :deep(.social-compact-btn) {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--color-accent-contrast);
}

.footer-social-media :deep(.social-compact-btn:hover) {
    background-color: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
}

.footer-social-media :deep(.social-compact-icon) {
    color: var(--color-accent-contrast);
}

.social-links {
    margin-bottom: 1.5rem;
}

.copyright {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.75rem;
    opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .footer-content {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .footer-about {
        max-width: 100%;
    }
}

@media (max-width: 640px) {
    .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }

    .home-site-footer {
        padding: 2rem 0 1rem;
        margin-top: 3rem;
    }

    .social-links {
        margin-bottom: 1rem;
    }

    .copyright {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
    }
}
</style>
