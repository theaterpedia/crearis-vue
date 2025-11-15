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
const { setupLocalScopeWatcher } = useTheme()

// Setup route watcher for local scope auto-reset
onMounted(() => {
  setupLocalScopeWatcher(router)
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
