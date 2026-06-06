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

// This destructive branch is the whole Magnifica site → Theme 7 (Theaterpedia)
// is the app-wide base theme (initial scope · not route-local). Per dispatch §2.
onMounted(() => {
  setupLocalScopeWatcher(router)
  void setTheme(7, 'initial')
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
