<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    isOpen: boolean
    image: any
    isMuted: boolean
}>()

defineEmits<{
    toggle: []
}>()

// Expanded adapter state
const expandedAdapter = ref<string | null>(null)

const toggleAdapter = (adapter: string) => {
    expandedAdapter.value = expandedAdapter.value === adapter ? null : adapter
}

// Mock adapter data
const adapters = ref([
    {
        id: 'unsplash',
        label: 'Unsplash',
        role: 'author',
        state: 'active',
        version: '1.0.2',
        hasConfig: true
    },
    {
        id: 'cloudinary',
        label: 'Cloudinary',
        role: 'producer',
        state: 'inactive',
        version: '1.1.0',
        hasConfig: false
    },
    {
        id: 'canva',
        label: 'Canva',
        role: 'publisher',
        state: 'inactive',
        version: '0.9.1',
        hasConfig: false
    }
])
</script>

<template>
    <div class="adapters-panel" :class="{ 'open': isOpen, 'muted': isMuted }">
        <div class="panel-header">
            <h3>Adapters</h3>
            <button class="btn-close" @click="$emit('toggle')">&times;</button>
        </div>

        <div class="panel-content">
            <!-- Info card at top -->
            <div class="info-card">
                <div class="info-row">
                    <span class="label">State:</span>
                    <span class="value">Active</span>
                </div>
                <div class="info-row">
                    <span class="label">Author:</span>
                    <span class="value">Unsplash API</span>
                </div>
                <div class="info-row">
                    <span class="label">Version:</span>
                    <span class="value">1.0.2</span>
                </div>
            </div>

            <!-- Adapter slots -->
            <div class="adapters-list">
                <div v-for="adapter in adapters" :key="adapter.id" class="adapter-slot" :class="{
                    'expanded': expandedAdapter === adapter.id,
                    'active': adapter.state === 'active',
                    'inactive': adapter.state === 'inactive'
                }">
                    <div class="adapter-header" @click="toggleAdapter(adapter.id)">
                        <div class="adapter-info">
                            <span class="adapter-role">{{ adapter.role }}</span>
                            <h4>{{ adapter.label }}</h4>
                            <span class="adapter-version">v{{ adapter.version }}</span>
                        </div>
                        <div class="adapter-actions">
                            <button v-if="!adapter.hasConfig" class="btn-action dimmed" disabled>
                                +
                            </button>
                            <button v-else class="btn-action">
                                ⚙
                            </button>
                        </div>
                    </div>

                    <!-- Expanded content -->
                    <div v-if="expandedAdapter === adapter.id" class="adapter-content">
                        <div class="adapter-preview">
                            <img :src="image?.shape_square || '/dummy.svg'" alt="Adapter preview"
                                class="preview-image" />
                        </div>
                        <div class="adapter-controls">
                            <button class="btn-control">Configure</button>
                            <button class="btn-control">Test</button>
                            <button class="btn-control">Reset</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action buttons at bottom -->
            <div class="panel-actions">
                <button class="btn-action-primary">Save Changes</button>
                <button class="btn-action-secondary">Reset All</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.adapters-panel {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    background: hsl(var(--color-card-bg));
    box-shadow: -4px 0 12px hsla(0, 0%, 0%, 0.15);
    transition: right var(--duration) var(--ease);
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

.adapters-panel.open {
    right: 0;
}

.adapters-panel.muted {
    opacity: 0.7;
    pointer-events: none;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid hsl(var(--color-border));
}

.panel-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
}

.btn-close {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    cursor: pointer;
    border-radius: var(--radius-small);
    transition: background var(--duration) var(--ease);
}

.btn-close:hover {
    background: hsl(var(--color-muted-bg));
}

.panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.info-card {
    padding: 1rem;
    background: hsl(var(--color-muted-bg));
    border-radius: var(--radius-medium);
}

.info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid hsl(var(--color-border));
}

.info-row:last-child {
    border-bottom: none;
}

.info-row .label {
    font-size: 0.875rem;
    font-weight: 600;
    color: hsl(var(--color-muted-contrast));
}

.info-row .value {
    font-size: 0.875rem;
}

.adapters-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.adapter-slot {
    border: 1px solid hsl(var(--color-border));
    border-radius: var(--radius-medium);
    overflow: hidden;
    transition: all var(--duration) var(--ease);
}

.adapter-slot.active {
    border-color: hsl(var(--color-success));
}

.adapter-slot.inactive {
    opacity: 0.6;
}

.adapter-slot.expanded {
    transform: scaleY(1.3);
    transform-origin: top;
}

.adapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    transition: background var(--duration) var(--ease);
}

.adapter-header:hover {
    background: hsl(var(--color-muted-bg));
}

.adapter-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.adapter-role {
    font-size: 0.625rem;
    text-transform: uppercase;
    font-weight: 600;
    color: hsl(var(--color-muted-contrast));
}

.adapter-info h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.adapter-version {
    font-size: 0.75rem;
    color: hsl(var(--color-muted-contrast));
}

.adapter-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-action {
    width: 2rem;
    height: 2rem;
    border: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-card-bg));
    border-radius: var(--radius-small);
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-action:hover:not(.dimmed) {
    background: hsl(var(--color-primary-base));
    color: hsl(var(--color-primary-contrast));
}

.btn-action.dimmed {
    opacity: 0.3;
    cursor: not-allowed;
}

.adapter-content {
    padding: 1rem;
    background: hsl(var(--color-muted-bg));
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.adapter-preview {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-small);
    overflow: hidden;
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.adapter-controls {
    display: flex;
    gap: 0.5rem;
}

.btn-control {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-card-bg));
    border-radius: var(--radius-small);
    cursor: pointer;
    font-size: 0.875rem;
    transition: all var(--duration) var(--ease);
}

.btn-control:hover {
    background: hsl(var(--color-accent-bg));
}

.panel-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid hsl(var(--color-border));
}

.btn-action-primary,
.btn-action-secondary {
    padding: 0.75rem;
    border: none;
    border-radius: var(--radius-small);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--duration) var(--ease);
}

.btn-action-primary {
    background: hsl(var(--color-primary-base));
    color: hsl(var(--color-primary-contrast));
}

.btn-action-primary:hover {
    opacity: 0.9;
}

.btn-action-secondary {
    background: transparent;
    border: 1px solid hsl(var(--color-border));
}

.btn-action-secondary:hover {
    background: hsl(var(--color-muted-bg));
}
</style>
