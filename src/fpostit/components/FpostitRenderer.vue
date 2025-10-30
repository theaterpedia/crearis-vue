<template>
    <!-- Render all open floating post-its -->
    <template v-for="key in Array.from(controller.openKeys)" :key="key">
        <FloatingPostIt v-if="controller.postits.get(key)" :data="controller.postits.get(key)!" :is-open="true"
            @close="controller.closePostit(key)" />
    </template>
</template>

<script setup lang="ts">
import { useFpostitController } from '../composables/useFpostitController'
import FloatingPostIt from './FloatingPostIt.vue'

const controller = useFpostitController()
</script>
