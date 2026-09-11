<!--
  StubPage · the shared „in Arbeit" view behind every `ready: false` navstop.
  Routes: `/vision` · `/blog` · `/kontakt`.

  §1: the three empty navstops render and are reachable. They are NOT hidden from
  the nav — "a nav that lies about what exists is worse than a nav with a stub
  behind it". So this page's whole job is to be honest about being empty and to
  point at the two things that do exist.

  Copy is `content/nav.ts` → `stub`, verbatim. Nothing is written here.

  In the negative spec (§1) and therefore not attempted: Blog & Presse content ·
  the Vision page · the `/start` Solidarpreis picker.
-->

<template>
    <UiaPageFrame :title="`${stub.headline} · Utopia in Action`">
        <template #header>
            <UiaHero :overline="stub.overline" :headline="stub.headline" :teaser="stub.body"
                :action="{ href: stub.link.href, label: stub.link.label }" />
        </template>

        <Section background="default">
            <Container>
                <Prose>
                    <!-- The one other thing that exists: the collective's inbox. -->
                    <p>
                        Schreib uns:
                        <a :href="`mailto:${contact.email}`">{{ contact.email }}</a>
                        · <a :href="contact.instagram.href" target="_blank" rel="noopener">{{
                            contact.instagram.label }}</a>
                    </p>
                </Prose>
            </Container>
        </Section>
    </UiaPageFrame>
</template>

<script setup lang="ts">
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Prose from '@/components/Prose.vue'
import UiaPageFrame from './UiaPageFrame.vue'
import UiaHero from './UiaHero.vue'
import { stub } from './content/nav'
import { contact } from './content/landing'
</script>
