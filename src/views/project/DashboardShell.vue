<!--
  DashboardShell — Variant-C frame (Item-2 SFR-76).

  Thin orchestration:
    - top NavStop bar (5 NavStops: agenda · topics · images · partners · settings)
    - <router-view/> outlet — each NavStop owns its own internal layout
      including its own right-rail (per §12 agenda-view-mode pattern; right-rail
      semantics are per-view not shell-managed)
    - auth-required (route meta); access-gating per-view as views land

  Mock-level chrome only — HM CSS-polish session is separate.
  Route-scaffold lives in src/router/index.ts (nested children of /projects/:projectId).
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'

const route = useRoute()

const projectId = computed(() => String(route.params.projectId ?? ''))

interface NavStop {
    key: string
    label: string
    path: string
}

const navStops = computed<NavStop[]>(() => [
    { key: 'agenda', label: 'Agenda', path: `/projects/${projectId.value}/agenda` },
    { key: 'topics', label: 'Topics', path: `/projects/${projectId.value}/topics` },
    { key: 'images', label: 'Images', path: `/projects/${projectId.value}/images` },
    { key: 'partners', label: 'Partners', path: `/projects/${projectId.value}/partners` },
    { key: 'settings', label: 'Settings', path: `/projects/${projectId.value}/settings` },
])
</script>

<template>
    <div class="dashboard-shell">
        <header class="dashboard-shell__topnav">
            <div class="dashboard-shell__brand">
                <RouterLink to="/home" class="dashboard-shell__home" title="Zur Übersicht">←</RouterLink>
                <span class="dashboard-shell__project">{{ projectId }}</span>
            </div>
            <nav class="dashboard-shell__navstops" role="navigation" aria-label="Project NavStops">
                <RouterLink v-for="stop in navStops" :key="stop.key" :to="stop.path"
                    class="dashboard-shell__navstop" active-class="is-active">
                    {{ stop.label }}
                </RouterLink>
            </nav>
        </header>

        <main class="dashboard-shell__outlet">
            <RouterView />
        </main>
    </div>
</template>

<style scoped>
.dashboard-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--color-bg, #ffffff);
}

.dashboard-shell__topnav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-surface, #fafafa);
    flex-shrink: 0;
}

.dashboard-shell__brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.dashboard-shell__home {
    color: var(--color-text-muted, #6b7280);
    text-decoration: none;
    font-size: 1.25rem;
    line-height: 1;
}

.dashboard-shell__home:hover {
    color: var(--color-text, #111827);
}

.dashboard-shell__project {
    font-weight: 600;
    color: var(--color-text, #111827);
    font-size: 0.875rem;
}

.dashboard-shell__navstops {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.dashboard-shell__navstop {
    padding: 0.5rem 0.875rem;
    border-radius: 0.375rem;
    color: var(--color-text-muted, #6b7280);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background 120ms ease, color 120ms ease;
}

.dashboard-shell__navstop:hover {
    background: var(--color-surface-hover, #e5e7eb);
    color: var(--color-text, #111827);
}

.dashboard-shell__navstop.is-active {
    background: var(--color-primary-bg, #1f2937);
    color: var(--color-primary-contrast, #ffffff);
}

.dashboard-shell__outlet {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}
</style>
