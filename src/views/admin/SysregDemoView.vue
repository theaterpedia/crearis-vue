<template>
    <div class="sysreg-demo">
        <div class="demo-header">
            <h1>🏷️ Sysreg System Demo</h1>
            <p class="subtitle">Comprehensive demo and testing interface for tag families</p>
        </div>

        <!-- All 6 families -->
        <section class="demo-section">
            <h2>All Tag Families (Fullwidth Layout)</h2>
            <p>Display all six tag families with full editing capabilities</p>

            <TagFamilies v-model:status="demoData.status" v-model:config="demoData.config"
                v-model:rtags="demoData.rtags" v-model:ttags="demoData.ttags" v-model:ctags="demoData.ctags"
                v-model:dtags="demoData.dtags" :enable-edit="true" group-selection="all" layout="wrap" />
        </section>

        <!-- Core groups only -->
        <section class="demo-section">
            <h2>Core Groups Only</h2>
            <p>Display only core (non-optional) tag groups</p>

            <TagFamilies v-model:ttags="demoData.ttags" v-model:ctags="demoData.ctags" v-model:dtags="demoData.dtags"
                :enable-edit="true" group-selection="core" layout="wrap" />
        </section>

        <!-- Optional groups only -->
        <section class="demo-section">
            <h2>Optional Groups Only</h2>
            <p>Display only optional tag groups</p>

            <TagFamilies v-model:dtags="demoData.dtags" :enable-edit="true" group-selection="options" layout="wrap" />
        </section>

        <!-- Vertical layout demo -->
        <section class="demo-section">
            <h2>Vertical Layout (Sidebar)</h2>
            <p>Vertical stacked layout, ideal for sidebars or narrow columns</p>

            <div class="demo-grid">
                <main class="demo-main">
                    <h3>Main Content Area</h3>
                    <p>This is where your primary content would go. The sidebar on the right shows tags in vertical
                        layout.</p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua.</p>
                </main>

                <aside class="demo-sidebar">
                    <h3>Sidebar Tags</h3>
                    <TagFamilies v-model:ttags="demoData.ttags" v-model:ctags="demoData.ctags"
                        v-model:dtags="demoData.dtags" :enable-edit="['ttags', 'ctags']" layout="vertical"
                        group-selection="core" />
                </aside>
            </div>
        </section>

        <!-- Individual tiles -->
        <section class="demo-section">
            <h2>Individual Tiles</h2>
            <p>Single tiles can be used independently</p>

            <div class="tile-grid">
                <TagFamilyTile v-model="demoData.dtags" family-name="dtags" :enable-edit="true" group-selection="all" />
                <TagFamilyTile :model-value="demoData.status" family-name="status" @activated="handleStatusActivated" />
                <TagFamilyTile v-model="demoData.ttags" family-name="ttags" :enable-edit="true"
                    group-selection="core" />
            </div>
        </section>

        <!-- Migration 037 V2 Info -->
        <section class="demo-section">
            <h2>Migration 037 V2: New dtags Structure</h2>
            <div class="info-grid">
                <div class="info-card">
                    <h3>📊 Statistics</h3>
                    <ul>
                        <li><strong>Total Entries:</strong> 43 dtags</li>
                        <li><strong>Categories:</strong> 16</li>
                        <li><strong>Subcategories:</strong> 27</li>
                        <li><strong>Bits Used:</strong> 31 (0-30)</li>
                        <li><strong>Bit 31:</strong> Unused (sign bit)</li>
                    </ul>
                </div>

                <div class="info-card">
                    <h3>🎭 TagGroup 1: Spielform (8 bits)</h3>
                    <ul>
                        <li>Kreisspiele (2 subcats)</li>
                        <li>Raumlauf (2 subcats)</li>
                        <li>Kleingruppen (2 subcats)</li>
                        <li>Forum (2 subcats)</li>
                    </ul>
                </div>

                <div class="info-card">
                    <h3>✨ TagGroup 2: Animiertes (7 bits)</h3>
                    <ul>
                        <li>El. Animation (2 subcats)</li>
                        <li>Sz. Animation (2 subcats)</li>
                        <li>Impro (2 subcats)</li>
                        <li>animiert (1 subcat)</li>
                    </ul>
                </div>

                <div class="info-card">
                    <h3>🎬 TagGroup 3: Szenische (10 bits)</h3>
                    <ul>
                        <li>Standbilder (2 subcats)</li>
                        <li>Rollenspiel (2 subcats)</li>
                        <li>TdU (2 subcats)</li>
                        <li>Soziometrie (1 subcat)</li>
                        <li>bewegte Themenarbeit (2 subcats)</li>
                    </ul>
                </div>

                <div class="info-card">
                    <h3>🎪 TagGroup 4: Päd. Regie (6 bits)</h3>
                    <ul>
                        <li>zyklisch (2 subcats)</li>
                        <li>linear (2 subcats)</li>
                        <li>klassisch (1 subcat)</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Raw data viewer -->
        <section class="demo-section">
            <h2>Current Values (Debug)</h2>
            <div class="debug-display">
                <pre>{{ JSON.stringify(demoData, null, 2) }}</pre>
            </div>

            <h3>Bit Breakdown</h3>
            <div class="bit-breakdown">
                <div v-for="(value, family) in demoData" :key="family" class="bit-row">
                    <strong>{{ family }}:</strong>
                    <span class="value">{{ value ?? 'null' }}</span>
                    <code v-if="value" class="binary">
                        {{ '0b' + value.toString(2).padStart(32, '0') }}
                    </code>
                </div>
            </div>
        </section>

        <!-- Controls -->
        <section class="demo-section">
            <h2>Demo Controls</h2>
            <div class="controls">
                <button @click="resetValues" class="btn-secondary">Reset All Values</button>
                <button @click="setExampleValues" class="btn-primary">Load Example Values</button>
                <button @click="clearValues" class="btn-secondary">Clear All Values</button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TagFamilies from '@/components/sysreg/TagFamilies.vue'
import TagFamilyTile from '@/components/sysreg/TagFamilyTile.vue'

// Demo data
const demoData = ref({
    status: 1, // Status: draft
    config: 0,
    rtags: 0,
    ttags: 0,
    ctags: 0,
    dtags: 1 // Kreisspiele
})

function handleStatusActivated() {
    console.log('Status tile activated - would show status info modal')
}

function resetValues() {
    demoData.value = {
        status: 1,
        config: 0,
        rtags: 0,
        ttags: 0,
        ctags: 0,
        dtags: 1
    }
}

function setExampleValues() {
    demoData.value = {
        status: 2, // Published
        config: 0b0001, // Some feature enabled
        rtags: 0b0011, // Favorite + Pinned
        ttags: 0b0101, // Multiple topics
        ctags: 0b1001, // Multiple content tags
        dtags: 0b10001 // Kreisspiele + Raumlauf
    }
}

function clearValues() {
    demoData.value = {
        status: 0,
        config: 0,
        rtags: 0,
        ttags: 0,
        ctags: 0,
        dtags: 0
    }
}
</script>

<style scoped>
.sysreg-demo {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

.demo-header {
    margin-bottom: 3rem;
    text-align: center;
}

.demo-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: var(--color-heading);
}

.subtitle {
    font-size: 1.1rem;
    color: var(--color-text-muted);
}

.demo-section {
    margin-bottom: 4rem;
    padding: 2rem;
    background: var(--color-background-soft);
    border-radius: 12px;
}

.demo-section h2 {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
    color: var(--color-heading);
}

.demo-section>p {
    color: var(--color-text-muted);
    margin-bottom: 1.5rem;
}

.demo-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    margin-top: 1rem;
}

.demo-main {
    padding: 1.5rem;
    background: var(--color-background);
    border-radius: 8px;
}

.demo-main h3 {
    margin-top: 0;
}

.demo-sidebar {
    padding: 1.5rem;
    background: var(--color-background);
    border-radius: 8px;
}

.demo-sidebar h3 {
    margin-top: 0;
    font-size: 1.1rem;
}

.tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.info-card {
    background: var(--color-background);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--color-border);
}

.info-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.info-card ul {
    margin: 0;
    padding-left: 1.5rem;
}

.info-card li {
    margin-bottom: 0.5rem;
}

.debug-display {
    background: var(--color-background-mute);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 1.5rem;
}

.debug-display pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.bit-breakdown {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.bit-row {
    padding: 0.5rem;
    margin-bottom: 0.25rem;
    background: var(--color-background);
    border-radius: 4px;
    display: flex;
    gap: 1rem;
    align-items: center;
}

.bit-row strong {
    min-width: 80px;
    color: var(--color-heading);
}

.bit-row .value {
    min-width: 60px;
    color: var(--color-text);
}

.bit-row .binary {
    background: var(--color-background-mute);
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
}

.controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--color-accent);
    color: white;
}

.btn-primary:hover {
    background: var(--color-accent-dark);
    transform: translateY(-1px);
}

.btn-secondary {
    background: var(--color-background-mute);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.btn-secondary:hover {
    background: var(--color-background-soft);
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .demo-grid {
        grid-template-columns: 1fr;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .tile-grid {
        grid-template-columns: 1fr;
    }
}
</style>
