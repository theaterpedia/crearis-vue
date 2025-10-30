<template>
  <div class="container">
    <RouterView />
    <!-- Floating Post-It Renderer (Global) -->
    <FpostitRenderer />
  </div>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router'
import FpostitRenderer from '@/fpostit/components/FpostitRenderer.vue'
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
