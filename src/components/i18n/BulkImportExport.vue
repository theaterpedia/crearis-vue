<template>
    <div class="bulk-import-export">
        <h2>Bulk Import/Export</h2>

        <!-- Export Section -->
        <div class="section">
            <h3>📤 Export Translations</h3>
            <p class="section-description">
                Export all translations to CSV format for editing in spreadsheet applications.
            </p>

            <div class="export-options">
                <div class="option-group">
                    <label>
                        <input type="checkbox" v-model="exportOptions.includeRoot" />
                        Include root entries (variation = false)
                    </label>
                </div>
                <div class="option-group">
                    <label>
                        <input type="checkbox" v-model="exportOptions.includeVariations" />
                        Include context variations
                    </label>
                </div>
                <div class="option-group">
                    <label>Filter by status:</label>
                    <select v-model="exportOptions.status">
                        <option value="">All</option>
                        <option value="ok">✅ Complete</option>
                        <option value="de">🇩🇪 Needs Translation</option>
                        <option value="en">🇬🇧 English Pending</option>
                        <option value="cz">🇨🇿 Czech Pending</option>
                        <option value="draft">📝 Draft</option>
                    </select>
                </div>
            </div>

            <Button @click="exportToCSV" :disabled="exporting">
                {{ exporting ? 'Exporting...' : '📥 Download CSV' }}
            </Button>
        </div>

        <div class="divider"></div>

        <!-- Import Section -->
        <div class="section">
            <h3>📥 Import Translations</h3>
            <p class="section-description">
                Import translations from CSV file. The CSV must have the following columns:
                <code>name, variation, type, de, en, cz, status</code>
            </p>

            <div class="import-zone">
                <input type="file" ref="fileInput" @change="handleFileSelect" accept=".csv" style="display: none" />

                <div class="drop-zone" @click="$refs.fileInput?.click()" @dragover.prevent
                    @drop.prevent="handleFileDrop">
                    <div v-if="!selectedFile" class="drop-zone-content">
                        <div class="drop-icon">📄</div>
                        <p>Click to select CSV file or drag & drop here</p>
                    </div>
                    <div v-else class="file-selected">
                        <div class="file-icon">✅</div>
                        <p><strong>{{ selectedFile.name }}</strong></p>
                        <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                    </div>
                </div>

                <div v-if="selectedFile" class="import-options">
                    <label>
                        <input type="checkbox" v-model="importOptions.updateExisting" />
                        Update existing translations (merge by name+variation+type)
                    </label>
                    <label>
                        <input type="checkbox" v-model="importOptions.skipErrors" />
                        Skip rows with errors (continue import)
                    </label>
                </div>

                <Button v-if="selectedFile" @click="importFromCSV" :disabled="importing" class="import-btn">
                    {{ importing ? 'Importing...' : '📤 Import CSV' }}
                </Button>
            </div>

            <!-- Import Results -->
            <div v-if="importResult" class="import-result">
                <div :class="['result-message', importResult.success ? 'success' : 'error']">
                    {{ importResult.success ? '✅' : '❌' }} {{ importResult.message }}
                </div>
                <div v-if="importResult.details" class="result-details">
                    <p><strong>Processed:</strong> {{ importResult.details.processed }}</p>
                    <p><strong>Created:</strong> {{ importResult.details.created }}</p>
                    <p><strong>Updated:</strong> {{ importResult.details.updated }}</p>
                    <p v-if="importResult.details.errors > 0" class="errors">
                        <strong>Errors:</strong> {{ importResult.details.errors }}
                    </p>
                </div>
                <div v-if="importResult.errors && importResult.errors.length > 0" class="error-list">
                    <h4>Errors:</h4>
                    <ul>
                        <li v-for="(error, index) in importResult.errors" :key="index">
                            {{ error }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- CSV Template -->
        <div class="section">
            <h3>📋 CSV Template</h3>
            <p class="section-description">
                Download a template CSV file to get started with the correct format.
            </p>
            <Button @click="downloadTemplate">
                📥 Download Template
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/Button.vue'

const exporting = ref(false)
const importing = ref(false)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

const exportOptions = ref({
    includeRoot: true,
    includeVariations: true,
    status: ''
})

const importOptions = ref({
    updateExisting: true,
    skipErrors: true
})

const importResult = ref<{
    success: boolean
    message: string
    details?: {
        processed: number
        created: number
        updated: number
        errors: number
    }
    errors?: string[]
} | null>(null)

async function exportToCSV() {
    exporting.value = true

    try {
        const params = new URLSearchParams()
        if (exportOptions.value.status) {
            params.append('status', exportOptions.value.status)
        }

        const response = await fetch(`/api/i18n?${params}`)

        if (!response.ok) {
            throw new Error('Failed to fetch translations')
        }

        const data = await response.json()
        const translations = data.i18n_codes || []

        // Filter based on options
        let filtered = translations
        if (!exportOptions.value.includeRoot) {
            filtered = filtered.filter((t: any) => t.variation !== 'false')
        }
        if (!exportOptions.value.includeVariations) {
            filtered = filtered.filter((t: any) => t.variation === 'false')
        }

        // Generate CSV
        const csv = generateCSV(filtered)

        // Download
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `i18n-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)

    } catch (err: any) {
        alert(`Export failed: ${err.message}`)
    } finally {
        exporting.value = false
    }
}

function generateCSV(translations: any[]): string {
    const headers = ['name', 'variation', 'type', 'de', 'en', 'cz', 'status']
    const rows = [headers.join(',')]

    for (const t of translations) {
        const text = typeof t.text === 'string' ? JSON.parse(t.text) : t.text
        const row = [
            escapeCSV(t.name),
            escapeCSV(t.variation),
            escapeCSV(t.type),
            escapeCSV(text.de || ''),
            escapeCSV(text.en || ''),
            escapeCSV(text.cz || ''),
            escapeCSV(t.status)
        ]
        rows.push(row.join(','))
    }

    return rows.join('\n')
}

function escapeCSV(value: string): string {
    if (!value) return ''
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0]
        importResult.value = null
    }
}

function handleFileDrop(event: DragEvent) {
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        selectedFile.value = event.dataTransfer.files[0]
        importResult.value = null
    }
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function importFromCSV() {
    if (!selectedFile.value) return

    importing.value = true
    importResult.value = null

    try {
        const text = await selectedFile.value.text()
        const rows = parseCSV(text)

        if (rows.length === 0) {
            throw new Error('CSV file is empty')
        }

        const headers = rows[0]
        const requiredHeaders = ['name', 'type', 'de']
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

        if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`)
        }

        let processed = 0
        let created = 0
        let updated = 0
        let errors = 0
        const errorMessages: string[] = []

        for (let i = 1; i < rows.length; i++) {
            try {
                const row = rows[i]
                const translation = {
                    name: row[headers.indexOf('name')],
                    variation: row[headers.indexOf('variation')] || 'false',
                    type: row[headers.indexOf('type')],
                    text: {
                        de: row[headers.indexOf('de')] || '',
                        en: row[headers.indexOf('en')] || '',
                        cz: row[headers.indexOf('cz')] || ''
                    },
                    status: row[headers.indexOf('status')] || 'de'
                }

                // Validate
                if (!translation.name || !translation.type || !translation.text.de) {
                    throw new Error(`Row ${i + 1}: Missing required fields`)
                }

                // Create or update
                const response = await fetch('/api/i18n/get-or-create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(translation)
                })

                if (!response.ok) {
                    throw new Error(`Row ${i + 1}: API error`)
                }

                const result = await response.json()

                if (result.created) {
                    created++
                } else {
                    updated++
                }

                processed++

            } catch (err: any) {
                errors++
                errorMessages.push(err.message)

                if (!importOptions.value.skipErrors) {
                    throw err
                }
            }
        }

        importResult.value = {
            success: true,
            message: 'Import completed successfully',
            details: { processed, created, updated, errors },
            errors: errorMessages
        }

        selectedFile.value = null

    } catch (err: any) {
        importResult.value = {
            success: false,
            message: `Import failed: ${err.message}`,
            errors: [err.message]
        }
    } finally {
        importing.value = false
    }
}

function parseCSV(text: string): string[][] {
    const rows: string[][] = []
    const lines = text.split('\n')

    for (const line of lines) {
        if (!line.trim()) continue

        const row: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            const next = line[i + 1]

            if (char === '"') {
                if (inQuotes && next === '"') {
                    current += '"'
                    i++ // Skip next quote
                } else {
                    inQuotes = !inQuotes
                }
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }

        row.push(current.trim())
        rows.push(row)
    }

    return rows
}

function downloadTemplate() {
    const template = `name,variation,type,de,en,cz,status
save,false,button,Speichern,Save,Uložit,ok
cancel,false,button,Abbrechen,Cancel,Zrušit,ok
name,false,field,Titel,Heading,Titul,ok
name,instructors,field,Vor- und Nachname,Full name,Celé jméno,ok`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'i18n-template.csv'
    a.click()
    URL.revokeObjectURL(url)
}
</script>

<style scoped>
.bulk-import-export {
    max-width: 100%;
}

h2 {
    margin: 0 0 2rem 0;
    font-size: 1.5rem;
    color: #111827;
}

h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    color: #374151;
}

.section {
    margin-bottom: 3rem;
}

.section-description {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.section-description code {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.8125rem;
}

.divider {
    height: 2px;
    background: #e5e7eb;
    margin: 2rem 0;
}

.export-options,
.import-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 4px;
}

.option-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.option-group label {
    font-size: 0.875rem;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.option-group select {
    padding: 0.375rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
}

.import-zone {
    margin-top: 1rem;
}

.drop-zone {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 3rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.drop-zone:hover {
    border-color: #2563eb;
    background: #eff6ff;
}

.drop-zone-content,
.file-selected {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.drop-icon,
.file-icon {
    font-size: 3rem;
}

.file-selected {
    color: #059669;
}

.file-size {
    font-size: 0.75rem;
    color: #6b7280;
}

.import-btn {
    margin-top: 1rem;
}

.import-result {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 4px;
}

.result-message {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-weight: 500;
}

.result-message.success {
    background: #d1fae5;
    color: #065f46;
}

.result-message.error {
    background: #fef2f2;
    color: #991b1b;
}

.result-details {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 4px;
    margin-bottom: 1rem;
}

.result-details p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
}

.result-details .errors {
    color: #ef4444;
}

.error-list {
    padding: 1rem;
    background: #fef2f2;
    border-radius: 4px;
    border-left: 4px solid #ef4444;
}

.error-list h4 {
    margin: 0 0 0.5rem 0;
    color: #991b1b;
}

.error-list ul {
    margin: 0;
    padding-left: 1.5rem;
}

.error-list li {
    color: #991b1b;
    font-size: 0.875rem;
    margin: 0.25rem 0;
}
</style>
