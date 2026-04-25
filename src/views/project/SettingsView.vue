<!--
  SettingsView — Item-2 Variant-C nested view at /projects/:id/settings.
  Einstellungen NavStop. Stub — full ProjectSettingsPanel integration follows
  once stepper/dashboard mode-switch is wired (HM CSS-polish session pending).
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))
</script>

<template>
    <div class="settings-view">
        <section class="settings-view__main">
            <header class="settings-view__header">
                <h2 class="settings-view__title">Settings</h2>
                <p class="settings-view__subtitle">Einstellungen · activation · theme · layout</p>
            </header>
            <div class="settings-view__placeholder">
                <p>Settings view (stub) for project <code>{{ projectId }}</code>.</p>
                <p class="settings-view__hint">
                    Existing ProjectSettingsPanel will mount here once stepper-vs-dashboard
                    mode-switch is wired.
                </p>
            </div>
        </section>
    </div>
</template>

<style scoped>
.settings-view {
    padding: 1.25rem;
    flex: 1;
}

.settings-view__main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 56rem;
}

.settings-view__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.settings-view__subtitle {
    margin: 0;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}

.settings-view__placeholder {
    border: 1px dashed var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    padding: 1.25rem;
    background: var(--color-surface-muted, #f9fafb);
}

.settings-view__placeholder code {
    background: var(--color-surface, #fff);
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.settings-view__hint {
    margin-top: 0.75rem;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
}
</style>
