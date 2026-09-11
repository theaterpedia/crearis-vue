<!--
  UiaSiteFooter · `==footer==` · section: default · col: full · shape: band.

  Contact, the venue, the press link — and the accessibility note.

  ── The accessibility note renders. It is not a footnote to drop ─────────────
  „Die Räumlichkeiten sind im Erdgeschoss, aber es gibt keine barrierefreien
  Toiletten." (§7). It appears twice in the owners' own material, which is them
  deciding it matters. So it gets a real block with the venue, not small print
  under the copyright — a person who needs that sentence needs to find it.
-->

<template>
    <div class="uia-footer">
        <Container>
            <div class="uia-footer-grid">
                <!-- Ort · with the accessibility note attached to it, where it belongs -->
                <section class="uia-footer-col">
                    <h2 class="uia-footer-heading">Ort</h2>
                    <p class="uia-footer-lines">
                        <span v-for="line in contact.venue" :key="line">{{ line }}</span>
                    </p>
                    <p class="uia-footer-access">{{ contact.accessibility }}</p>
                </section>

                <!-- Kontakt -->
                <section class="uia-footer-col">
                    <h2 class="uia-footer-heading">Kontakt</h2>
                    <p class="uia-footer-lines">
                        <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
                        <a :href="contact.instagram.href" target="_blank" rel="noopener">
                            {{ contact.instagram.label }}
                        </a>
                    </p>
                </section>

                <!-- Presse -->
                <section v-if="contact.press.length" class="uia-footer-col">
                    <h2 class="uia-footer-heading">Presse</h2>
                    <p class="uia-footer-lines">
                        <a v-for="entry in contact.press" :key="entry.href" :href="entry.href" target="_blank"
                            rel="noopener">{{ entry.label }}</a>
                    </p>
                </section>
            </div>
        </Container>
    </div>
</template>

<script setup lang="ts">
import Container from '@/components/Container.vue'
import { contact } from './content/landing'
</script>

<style scoped>
.uia-footer {
    padding: 2.25rem 0 2.75rem;
    background-color: var(--color-muted-bg);
    color: var(--color-card-contrast);
}

.uia-footer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 1.75rem;
}

.uia-footer-heading {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-muted-contrast);
}

.uia-footer-lines {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
}

/* The accessibility note · its own surface, so it cannot read as fine print. */
.uia-footer-access {
    margin: 0.9rem 0 0;
    padding: 0.7rem 0.9rem;
    border-left: 4px solid var(--color-primary-bg);
    background-color: var(--color-card-bg);
    font-size: 0.875rem;
    line-height: 1.5;
}
</style>
