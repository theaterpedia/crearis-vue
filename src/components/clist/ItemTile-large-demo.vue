<!--
  ItemTile Large Size Demo
  
  This demonstrates the large size variant with stats line and teaser text.
-->
<template>
    <div class="demo-container">
        <h2>ItemTile Size Variants</h2>

        <section class="demo-section">
            <h3>Medium Size (default)</h3>
            <ItemTile heading="Festival of Arts 2024" size="medium" :styleCompact="false" :data="{
                xmlid: 'tp.event.festival-2024',
                url: 'https://picsum.photos/128/128',
                alt: 'Festival event'
            }" :models="{
                    entityType: 'event'
                }" />
        </section>

        <section class="demo-section">
            <h3>Large Size with Stats Line (Event)</h3>
            <ItemTile heading="Festival of Arts 2024" size="large" :styleCompact="false" dateBegin="2024-11-20T10:00:00"
                dateEnd="2024-11-22T18:00:00"
                teaser="Join us for three days of creativity, performances, and workshops featuring local and international artists."
                :data="{
                    xmlid: 'tp.event.festival-2024',
                    url: 'https://picsum.photos/128/128',
                    alt: 'Festival event'
                }" :models="{
                    entityType: 'event'
                }" />
        </section>

        <section class="demo-section">
            <h3>Large Size with Teaser (No Stats)</h3>
            <ItemTile heading="Introduction to Vue.js" size="large" :styleCompact="false"
                teaser="Learn the fundamentals of Vue.js framework and build your first reactive web application."
                :data="{
                    xmlid: 'tp.project.vue-intro',
                    url: 'https://picsum.photos/128/128?random=2',
                    alt: 'Vue.js project'
                }" :models="{
                    entityType: 'project'
                }" />
        </section>
    </div>
</template>

<script setup lang="ts">
import ItemTile from './ItemTile.vue'
</script>

<style scoped>
.demo-container {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

.demo-section {
    margin-bottom: 3rem;
    padding: 1.5rem;
    background: var(--color-bg);
    border-radius: var(--radius);
}

.demo-section h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--color-text);
}
</style>
