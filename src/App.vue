<template>
  <div class="container">
    <RouterView />
    <!-- Floating Post-It Renderer (Global) -->
    <FpostitRenderer />
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { setTheme, setupLocalScopeWatcher } = useTheme()

// This destructive branch is the whole Magnifica site → one app-wide base theme
// (initial scope · not route-local). Default Theme 7 (Theaterpedia/magnifica).
// Override for testing via env: VITE_MAGNIFICA_THEME=<0..7> in .env, restart dev.
// No live-switching — set, restart, decide. Per HM 2026-06-06.
const envTheme = Number(import.meta.env.VITE_MAGNIFICA_THEME)
const MAGNIFICA_THEME_ID =
  Number.isInteger(envTheme) && envTheme >= 0 && envTheme <= 7 ? envTheme : 7

onMounted(() => {
  setupLocalScopeWatcher(router)
  void setTheme(MAGNIFICA_THEME_ID, 'initial')
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>

<!-- Unscoped · magnifica/Theme-7 post-it corners are square (HM 2026-06-06).
     FloatingPostIt uses var(--fpostit-radius); unset on mainline → falls back to 0.5rem,
     so mainline fpostit consumers are unaffected. -->
<style>
:root {
  --fpostit-radius: 0;
}
</style>
