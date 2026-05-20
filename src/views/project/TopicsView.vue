<!--
  TopicsView — Item-2 Variant-C nested view at /projects/:id/topics.
  Posts NavStop. A-scope entity #1 (post-its-prominent).

  Demonstrates the post-its-prominent pattern: posts surface their fpostit
  annotations through anchored triggers in-line. Activity feed in the right-
  rail summarizes recent post-it interactions across the project's posts.

  Mock-level data — real post-fetch lands when graphql-client matures
  (T3a-Basic upstream connectivity + posts query).
-->

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useFpostitController } from '@/fpostit/composables/useFpostitController'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))

const controller = useFpostitController()

interface PostMock {
    id: string
    title: string
    teaser: string
    body: string
    postitKey: string
    postitTitle: string
    postitContent: string
    postitColor: 'primary' | 'positive' | 'warning' | 'negative'
}

const posts = ref<PostMock[]>([
    {
        id: 'kreis-einfuehrung',
        title: 'Am Anfang war der Kreis',
        teaser: 'Einführung in die elementare Animation — Workshop-Tag 1',
        body: 'Reflexion über die ersten Begegnungen im Kreis und wie sich Vertrauen über Bewegung aufbaut.',
        postitKey: 'topics-kreis',
        postitTitle: '🟢 Franzi: Material angepasst',
        postitContent:
            '<p>HM, Franzi hier — wir haben das Material für die Klasse 3a leicht reduziert.</p>' +
            '<p>Die Konzentrationsspanne ist morgens stärker; deshalb verschoben wir die Stille-Übung nach vorne.</p>',
        postitColor: 'positive',
    },
    {
        id: 'maske-grundformen',
        title: 'Spiel mit Maske',
        teaser: 'Maskenspiel-Grundformen für die zweite Workshop-Session',
        body: 'Drei Grundtypen — neutrale Maske, Charakter-Maske, Stimmungs-Maske — und wie wir sie pädagogisch einsetzen.',
        postitKey: 'topics-maske',
        postitTitle: '🟡 Frage: Anzahl der Masken?',
        postitContent:
            '<p>Reichen 12 neutrale Masken für 8 Pupillen + 4 Reserve, oder packen wir mehr ein?</p>' +
            '<p>Letztes Mal hatten wir Engpässe in Gruppe B.</p>',
        postitColor: 'warning',
    },
    {
        id: 'ergebnis-praesentation',
        title: 'Ergebnispräsentation',
        teaser: 'Workshop-Abschluss am Dienstag — Eltern + Lehrkräfte eingeladen',
        body: 'Der dramaturgische Aufbau der Präsentation: Eröffnung, Einzelszenen, Abschlusskreis.',
        postitKey: 'topics-praes',
        postitTitle: '🟢 HM: Aula bestätigt',
        postitContent:
            '<p>Die Aula ist für Dienstag 13:00 reserviert.</p>' +
            '<p>Konrektorin Müller hat zugesagt, die Familieneinladungen über die Schul-Mail zu versenden.</p>',
        postitColor: 'positive',
    },
])

const recentActivity = ref([
    { post: 'kreis-einfuehrung', actor: 'Franzi', when: 'gestern 16:42', kind: 'positive' as const },
    { post: 'maske-grundformen', actor: 'Franzi', when: 'gestern 17:08', kind: 'warning' as const },
    { post: 'ergebnis-praesentation', actor: 'HM', when: 'heute 09:15', kind: 'positive' as const },
])

function openPostit(post: PostMock, event: MouseEvent) {
    controller.openPostit(post.postitKey, event.currentTarget as HTMLElement)
}

onMounted(() => {
    // Register all posts' fpostits up-front so the trigger-buttons can open them
    // and so the right-rail activity-feed can reach the same registrations.
    posts.value.forEach((p) => {
        controller.create({
            key: p.postitKey,
            title: p.postitTitle,
            content: p.postitContent,
            color: p.postitColor,
            hlogic: 'default',
        })
    })
})

onBeforeUnmount(() => {
    posts.value.forEach((p) => controller.closePostit(p.postitKey))
})

const kindIcon = (k: 'positive' | 'warning' | 'negative') =>
    k === 'positive' ? '🟢' : k === 'warning' ? '🟡' : '🔴'
</script>

<template>
    <div class="topics-view">
        <section class="topics-view__main" aria-label="Topics main view">
            <header class="topics-view__header">
                <h2 class="topics-view__title">Topics</h2>
                <p class="topics-view__subtitle">
                    Posts mit eingebetteten Post-its · Projekt <code>{{ projectId }}</code>
                </p>
            </header>

            <ul class="topics-view__post-list">
                <li v-for="post in posts" :key="post.id" class="topics-view__post-item">
                    <article class="topics-view__post">
                        <h3 class="topics-view__post-title">{{ post.title }}</h3>
                        <p class="topics-view__post-teaser">{{ post.teaser }}</p>
                        <p class="topics-view__post-body">{{ post.body }}</p>
                        <button type="button" class="topics-view__post-postit"
                            :class="`is-${post.postitColor}`" @click="openPostit(post, $event)">
                            <span class="topics-view__post-postit-icon" aria-hidden="true">📎</span>
                            <span class="topics-view__post-postit-label">{{ post.postitTitle }}</span>
                        </button>
                    </article>
                </li>
            </ul>
        </section>

        <aside class="topics-view__rail" aria-label="Post-its activity">
            <header class="topics-view__rail-header">Post-its activity</header>
            <ul class="topics-view__activity">
                <li v-for="(item, idx) in recentActivity" :key="idx" class="topics-view__activity-item">
                    <span class="topics-view__activity-icon">{{ kindIcon(item.kind) }}</span>
                    <span class="topics-view__activity-text">
                        <strong>{{ item.actor }}</strong> · {{ item.post }}
                        <span class="topics-view__activity-when">{{ item.when }}</span>
                    </span>
                </li>
            </ul>
        </aside>
    </div>
</template>

<style scoped>
.topics-view {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.25rem;
    padding: 1.25rem;
    flex: 1;
    min-height: 0;
}

.topics-view__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
}

.topics-view__header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.topics-view__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.topics-view__subtitle {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.topics-view__subtitle code {
    background: var(--color-surface, #fff);
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
}

.topics-view__post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
}

.topics-view__post {
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    background: var(--color-surface, #ffffff);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.topics-view__post-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.topics-view__post-teaser {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.topics-view__post-body {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
}

.topics-view__post-postit {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface-muted, #f9fafb);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: background 120ms ease;
}

.topics-view__post-postit:hover {
    background: var(--color-surface-hover, #e5e7eb);
}

.topics-view__post-postit.is-positive {
    border-left: 3px solid #16a34a;
}

.topics-view__post-postit.is-warning {
    border-left: 3px solid #eab308;
}

.topics-view__post-postit.is-negative {
    border-left: 3px solid #dc2626;
}

.topics-view__post-postit.is-primary {
    border-left: 3px solid #1f2937;
}

.topics-view__rail {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-left: 1px solid var(--color-border, #e5e7eb);
    padding-left: 1rem;
}

.topics-view__rail-header {
    font-weight: 600;
    color: var(--color-text, #111827);
    font-size: 0.875rem;
}

.topics-view__activity {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.topics-view__activity-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: var(--color-text-muted, #6b7280);
    line-height: 1.4;
}

.topics-view__activity-icon {
    flex-shrink: 0;
}

.topics-view__activity-when {
    display: block;
    font-size: 0.75rem;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .topics-view {
        grid-template-columns: 1fr;
    }

    .topics-view__rail {
        border-left: none;
        border-top: 1px solid var(--color-border, #e5e7eb);
        padding-left: 0;
        padding-top: 1rem;
    }
}
</style>
