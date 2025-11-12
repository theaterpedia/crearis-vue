<script setup lang="ts">
interface Props {
    image: any // Full image record with facade fields
    statusName?: string
}

const props = defineProps<Props>()

/**
 * Get facade URL for a shape
 * Returns the URL from the facade field (img_*)
 */
function getFacadeUrl(facadeField: any): string {
    if (!facadeField) return '—'
    if (typeof facadeField === 'object' && facadeField.url) {
        return facadeField.url
    }
    return '—'
}

/**
 * Get mobile hero URL for a shape
 * Placeholder for Phase 5 implementation
 */
function getMobileUrl(shape: string): string {
    return `/* Mobile hero URL for ${shape} - Phase 5 */`
}

/**
 * Get tablet hero URL for a shape
 * Placeholder for Phase 5 implementation
 */
function getTabletUrl(shape: string): string {
    return `/* Tablet hero URL for ${shape} - Phase 5 */`
}

// Truncate long URLs for display
function truncateUrl(url: string, maxLength = 60): string {
    if (url === '—' || url.startsWith('/*')) return url
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength - 3) + '...'
}
</script>

<template>
    <div class="image-information">
        <div class="info-header">
            <h3>Image Information</h3>
        </div>

        <!-- Core Fields (read-only) -->
        <div class="info-section">
            <div class="section-title">Core Fields</div>

            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">{{ statusName || '—' }}</span>
            </div>

            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">{{ image.name || 'Untitled' }}</span>
            </div>

            <div class="info-row">
                <span class="info-label">Alt Text:</span>
                <span class="info-value">{{ image.alt_text || '—' }}</span>
            </div>

            <div class="info-row">
                <span class="info-label">About:</span>
                <span class="info-value">{{ image.about || '—' }}</span>
            </div>

            <div class="info-row">
                <span class="info-label">XML ID:</span>
                <span class="info-value">{{ image.xmlid || '—' }}</span>
            </div>
        </div>

        <!-- Facade URL Matrix -->
        <div class="info-section">
            <div class="section-title">Facade URLs</div>

            <div class="facade-matrix">
                <!-- Header Row -->
                <div class="matrix-row matrix-header">
                    <span class="matrix-cell"></span>
                    <span class="matrix-cell">Square</span>
                    <span class="matrix-cell">Wide</span>
                    <span class="matrix-cell">Vertical</span>
                </div>

                <!-- Element URLs Row -->
                <div class="matrix-row">
                    <span class="matrix-cell row-label">Element</span>
                    <span class="matrix-cell url-cell" :title="getFacadeUrl(image.img_square)">
                        {{ truncateUrl(getFacadeUrl(image.img_square), 30) }}
                    </span>
                    <span class="matrix-cell url-cell" :title="getFacadeUrl(image.img_wide)">
                        {{ truncateUrl(getFacadeUrl(image.img_wide), 30) }}
                    </span>
                    <span class="matrix-cell url-cell" :title="getFacadeUrl(image.img_vert)">
                        {{ truncateUrl(getFacadeUrl(image.img_vert), 30) }}
                    </span>
                </div>

                <!-- Mobile URLs Row -->
                <div class="matrix-row">
                    <span class="matrix-cell row-label">Mobile</span>
                    <span class="matrix-cell url-cell placeholder" :title="getMobileUrl('square')">
                        {{ truncateUrl(getMobileUrl('square'), 30) }}
                    </span>
                    <span class="matrix-cell url-cell placeholder" :title="getMobileUrl('wide')">
                        {{ truncateUrl(getMobileUrl('wide'), 30) }}
                    </span>
                    <span class="matrix-cell url-cell placeholder" :title="getMobileUrl('vertical')">
                        {{ truncateUrl(getMobileUrl('vertical'), 30) }}
                    </span>
                </div>

                <!-- Tablet URLs Row -->
                <div class="matrix-row">
                    <span class="matrix-cell row-label">Tablet</span>
                    <span class="matrix-cell url-cell placeholder" :title="getTabletUrl('square')">
                        {{ truncateUrl(getTabletUrl('square'), 30) }}
                    </span>
                    <span class="matrix-cell url-cell placeholder" :title="getTabletUrl('wide')">
                        {{ truncateUrl(getTabletUrl('wide'), 30) }}
                    </span>
                    <span class="matrix-cell url-cell placeholder" :title="getTabletUrl('vertical')">
                        {{ truncateUrl(getTabletUrl('vertical'), 30) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Additional Info -->
        <div class="info-section">
            <div class="section-title">Details</div>

            <div class="info-row">
                <span class="info-label">Created:</span>
                <span class="info-value">{{ image.created_at ? new Date(image.created_at).toLocaleDateString() : '—'
                    }}</span>
            </div>

            <div class="info-row">
                <span class="info-label">Updated:</span>
                <span class="info-value">{{ image.updated_at ? new Date(image.updated_at).toLocaleDateString() : '—'
                    }}</span>
            </div>

            <div class="info-row">
                <span class="info-label">Owner:</span>
                <span class="info-value">{{ image.owner_username || '—' }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.image-information {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    background: var(--color-card-bg);
    border-radius: var(--radius-medium);
    max-height: calc(100vh - 200px);
    overflow-y: auto;
}

.info-header {
    border-bottom: 2px solid var(--color-border-base);
    padding-bottom: 0.75rem;
}

.info-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-base);
}

.info-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section-title {
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
}

.info-row {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 0.75rem;
    align-items: baseline;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border-light);
}

.info-row:last-child {
    border-bottom: none;
}

.info-label {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.info-value {
    font-size: 0.875rem;
    color: var(--color-text-base);
    word-break: break-word;
}

/* Facade URL Matrix */
.facade-matrix {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border-base);
    border-radius: var(--radius-small);
    overflow: hidden;
}

.matrix-row {
    display: grid;
    grid-template-columns: 80px repeat(3, 1fr);
    border-bottom: 1px solid var(--color-border-light);
}

.matrix-row:last-child {
    border-bottom: none;
}

.matrix-header {
    background: var(--color-muted-bg);
    font-weight: 600;
}

.matrix-cell {
    padding: 0.5rem;
    font-size: 0.75rem;
    border-right: 1px solid var(--color-border-light);
    display: flex;
    align-items: center;
    min-height: 2.5rem;
}

.matrix-cell:last-child {
    border-right: none;
}

.row-label {
    font-weight: 500;
    color: var(--color-text-muted);
    background: var(--color-muted-bg);
}

.url-cell {
    font-family: monospace;
    font-size: 0.7rem;
    color: var(--color-primary-base);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
}

.url-cell.placeholder {
    color: var(--color-text-muted);
    font-style: italic;
}

/* Scrollbar styling */
.image-information::-webkit-scrollbar {
    width: 8px;
}

.image-information::-webkit-scrollbar-track {
    background: var(--color-muted-bg);
    border-radius: 4px;
}

.image-information::-webkit-scrollbar-thumb {
    background: var(--color-border-base);
    border-radius: 4px;
}

.image-information::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-muted);
}
</style>
