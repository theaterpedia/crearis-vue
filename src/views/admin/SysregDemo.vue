<template>
    <PageLayout>
        <div class="sysreg-demo">
            <div class="demo-header">
                <h1>Sysreg System Components Demo</h1>
                <p class="demo-subtitle">
                    Phase 1 + Phase 2 Implementation: Core composables and base components
                </p>
            </div>

            <div v-if="isLoading" class="loading-state">
                <p>Loading sysreg data...</p>
            </div>

            <div v-else class="demo-sections">
                <!-- Section 1: Status Badge -->
                <section class="demo-section">
                    <h2>StatusBadge Component</h2>
                    <p class="section-description">
                        Display status values with automatic color coding and i18n labels.
                    </p>

                    <div class="demo-grid">
                        <div class="demo-item">
                            <h4>Status Values</h4>
                            <div class="badge-row">
                                <StatusBadge :value="'\\x00'" label="Neu" variant="soft" />
                                <StatusBadge :value="'\\x01'" label="Entwurf" variant="soft" />
                                <StatusBadge :value="'\\x02'" label="Geplant" variant="soft" />
                                <StatusBadge :value="'\\x04'" label="Aktiv" variant="soft" />
                                <StatusBadge :value="'\\x08'" label="Abgeschlossen" variant="soft" />
                                <StatusBadge :value="'\\x10'" label="Archiviert" variant="soft" />
                            </div>
                        </div>

                        <div class="demo-item">
                            <h4>Variants</h4>
                            <div class="badge-row">
                                <StatusBadge :value="'\\x04'" label="Soft" variant="soft" />
                                <StatusBadge :value="'\\x04'" label="Solid" variant="solid" />
                                <StatusBadge :value="'\\x04'" label="Outline" variant="outline" />
                            </div>
                        </div>

                        <div class="demo-item">
                            <h4>Sizes</h4>
                            <div class="badge-row">
                                <StatusBadge :value="'\\x02'" label="Small" size="small" />
                                <StatusBadge :value="'\\x02'" label="Medium" size="medium" />
                                <StatusBadge :value="'\\x02'" label="Large" size="large" />
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section 2: Sysreg Select -->
                <section class="demo-section">
                    <h2>SysregSelect Component</h2>
                    <p class="section-description">
                        Single-value dropdown for status and tag selection.
                    </p>

                    <div class="demo-grid">
                        <div class="demo-item">
                            <SysregSelect v-model="selectedStatus" tagfamily="status" label="Project Status"
                                hint="Select the current status of your project" @change="handleStatusChange" />
                            <div class="demo-output" v-if="selectedStatus">
                                Selected: <code>{{ selectedStatus }}</code>
                            </div>
                        </div>

                        <div class="demo-item">
                            <SysregSelect v-model="selectedTopic" tagfamily="ttags" label="Primary Topic"
                                placeholder="Choose a topic..." required />
                            <div class="demo-output" v-if="selectedTopic">
                                Selected: <code>{{ selectedTopic }}</code>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section 3: Multi-Toggle -->
                <section class="demo-section">
                    <h2>SysregMultiToggle Component</h2>
                    <p class="section-description">
                        Multi-select checkboxes for config flags and tags.
                    </p>

                    <div class="demo-grid">
                        <div class="demo-item">
                            <SysregMultiToggle v-model="selectedConfigFlags" tagfamily="config"
                                label="Configuration Flags" hint="Select applicable configuration options" :columns="2"
                                @change="handleConfigChange" />
                            <div class="demo-output" v-if="selectedConfigFlags">
                                Value: <code>{{ selectedConfigFlags }}</code>
                                <br />
                                Bits: <code>{{ getActiveBits(selectedConfigFlags).join(', ') }}</code>
                            </div>
                        </div>

                        <div class="demo-item">
                            <SysregMultiToggle v-model="selectedTopics" tagfamily="ttags" label="Topics"
                                hint="Select up to 3 topics" :max-selection="3" :columns="2" />
                            <div class="demo-output" v-if="selectedTopics">
                                Value: <code>{{ selectedTopics }}</code>
                                <br />
                                Bits: <code>{{ getActiveBits(selectedTopics).join(', ') }}</code>
                            </div>
                        </div>

                        <div class="demo-item">
                            <SysregMultiToggle v-model="selectedDomains" tagfamily="dtags" label="Domains"
                                :columns="2" />
                            <div class="demo-output" v-if="selectedDomains">
                                Value: <code>{{ selectedDomains }}</code>
                                <br />
                                Bits: <code>{{ getActiveBits(selectedDomains).join(', ') }}</code>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section 4: Bit Group Select -->
                <section class="demo-section">
                    <h2>SysregBitGroupSelect Component</h2>
                    <p class="section-description">
                        Radio buttons for CTags bit groups with semantic labels from bit group configuration.
                    </p>

                    <div class="demo-grid">
                        <div class="demo-item">
                            <h4>{{ getBitGroupLabel('ctags', 'age_group') }}</h4>
                            <SysregBitGroupSelect v-model="selectedAgeGroup" bit-group="age_group"
                                @change="handleAgeGroupChange" />
                            <div class="demo-output">
                                Value: <code>{{ selectedAgeGroup }}</code> (bits 0-1)
                            </div>
                        </div>

                        <div class="demo-item">
                            <h4>{{ getBitGroupLabel('ctags', 'subject_type') }}</h4>
                            <SysregBitGroupSelect v-model="selectedSubjectType" bit-group="subject_type" />
                            <div class="demo-output">
                                Value: <code>{{ selectedSubjectType }}</code> (bits 2-3)
                            </div>
                        </div>

                        <div class="demo-item">
                            <h4>{{ getBitGroupLabel('ctags', 'access_level') }}</h4>
                            <SysregBitGroupSelect v-model="selectedAccessLevel" bit-group="access_level" />
                            <div class="demo-output">
                                Value: <code>{{ selectedAccessLevel }}</code> (bits 4-5)
                            </div>
                        </div>

                        <div class="demo-item">
                            <h4>{{ getBitGroupLabel('ctags', 'quality') }}</h4>
                            <SysregBitGroupSelect v-model="selectedQuality" bit-group="quality" />
                            <div class="demo-output">
                                Value: <code>{{ selectedQuality }}</code> (bits 6-7)
                            </div>
                        </div>
                    </div>

                    <!-- CTags Byte Builder -->
                    <div class="demo-item full-width">
                        <h4>Combined CTags Byte</h4>
                        <div class="ctags-output">
                            <code>{{ ctagsByte }}</code>
                            <p class="explanation">
                                This BYTEA value combines all 4 bit groups into a single byte:
                                <br />
                                age_group ({{ selectedAgeGroup }}) | subject_type ({{ selectedSubjectType }}) |
                                access_level ({{ selectedAccessLevel }}) | quality ({{ selectedQuality }})
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Section 4.5: Bit Group System -->
                <section class="demo-section">
                    <h2>Bit Group Configuration System</h2>
                    <p class="section-description">
                        Semantic naming for bit groups across all tag families with i18n support.
                    </p>

                    <div class="bit-groups-overview">
                        <div v-for="family in ['ctags', 'dtags', 'ttags', 'rtags', 'config']" :key="family"
                            class="family-group">
                            <h4>{{ family.toUpperCase() }}</h4>
                            <div class="groups-list">
                                <div v-for="group in getBitGroupsWithLabels(family).value" :key="group.name"
                                    class="group-item">
                                    <strong>{{ group.label }}</strong>
                                    <span class="bit-range">Bits {{ group.bitRange }}</span>
                                    <p v-if="group.description" class="group-desc">{{ group.description }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Section 5: Composable Utilities -->
                <section class="demo-section">
                    <h2>Composable Utilities Demo</h2>
                    <p class="section-description">
                        Test bit operations and BYTEA conversions.
                    </p>

                    <div class="demo-grid">
                        <div class="demo-item">
                            <h4>Bit Operations</h4>
                            <div class="utility-demo">
                                <label>Test Value:</label>
                                <input v-model="testBytea" placeholder="\\x00" class="test-input" />

                                <div class="bit-toggles">
                                    <button v-for="bit in 8" :key="bit - 1" @click="toggleTestBit(bit - 1)"
                                        :class="{ active: isBitSet(bit - 1) }" class="bit-button">
                                        Bit {{ bit - 1 }}
                                    </button>
                                </div>

                                <div class="demo-output">
                                    Hex: <code>{{ testBytea }}</code><br />
                                    Decimal: <code>{{ parseByteaHex(testBytea) }}</code><br />
                                    Binary: <code>{{ getBinary(testBytea) }}</code><br />
                                    Active Bits: <code>{{ getActiveBits(testBytea).join(', ') }}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { StatusBadge, SysregSelect, SysregMultiToggle, SysregBitGroupSelect } from '@/components/sysreg'
import {
    useSysregTags,
    parseByteaHex,
    byteaFromNumber,
    toggleBit,
    hasBit,
    byteArrayToBits,
    buildCtagsByte
} from '@/composables/useSysregTags'
import { useSysregBitGroups } from '@/composables/useSysregBitGroups'

// Initialize composables
const { initCache } = useSysregTags()
const { getBitGroupsWithLabels, getBitGroupLabel } = useSysregBitGroups()
const isLoading = ref(true)

onMounted(async () => {
    try {
        await initCache()
    } catch (error) {
        console.error('Failed to initialize sysreg cache:', error)
    } finally {
        isLoading.value = false
    }
})

// Status select state
const selectedStatus = ref<string | null>(null)

function handleStatusChange(option: any) {
    console.log('Status changed:', option)
}

// Topic select state
const selectedTopic = ref<string | null>(null)

// Config flags state
const selectedConfigFlags = ref<string>('\\x00')

function handleConfigChange(bits: number[], values: string[]) {
    console.log('Config changed - bits:', bits, 'values:', values)
}

// Multi-tag states
const selectedTopics = ref<string>('\\x00')
const selectedDomains = ref<string>('\\x00')

// CTags bit group states
const selectedAgeGroup = ref<number>(0)
const selectedSubjectType = ref<number>(0)
const selectedAccessLevel = ref<number>(0)
const selectedQuality = ref<number>(0)

function handleAgeGroupChange(value: number, label: string) {
    console.log('Age group changed:', value, label)
}

// Computed CTags byte
const ctagsByte = computed(() => {
    return buildCtagsByte({
        age_group: selectedAgeGroup.value,
        subject_type: selectedSubjectType.value,
        access_level: selectedAccessLevel.value,
        quality: selectedQuality.value
    })
})

// Test utilities
const testBytea = ref<string>('\\x00')

function toggleTestBit(bit: number) {
    testBytea.value = toggleBit(testBytea.value, bit)
}

function isBitSet(bit: number): boolean {
    return hasBit(testBytea.value, bit)
}

function getActiveBits(bytea: string | null): number[] {
    const bytes = parseByteaHex(bytea)
    return byteArrayToBits(bytes)
}

function getBinary(bytea: string | null): string {
    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0
    return num.toString(2).padStart(8, '0')
}
</script>

<style scoped>
.sysreg-demo {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.demo-header {
    text-align: center;
    margin-bottom: 3rem;
}

.demo-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 0.5rem;
}

.demo-subtitle {
    font-size: 1rem;
    color: var(--color-dimmed);
}

.loading-state {
    text-align: center;
    padding: 3rem;
    font-size: 1.125rem;
    color: var(--color-dimmed);
}

.demo-sections {
    display: flex;
    flex-direction: column;
    gap: 3rem;
}

.demo-section {
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 2rem;
}

.demo-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.5rem;
}

.section-description {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin-bottom: 2rem;
}

.demo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.demo-item {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.demo-item.full-width {
    grid-column: 1 / -1;
}

.demo-item h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.5rem;
}

.badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
}

.demo-output {
    padding: 1rem;
    background: var(--color-background-soft);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--color-text);
}

.demo-output code {
    background: var(--color-background);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-primary, #3b82f6);
}

.ctags-output {
    padding: 1.5rem;
    background: var(--color-background-soft);
    border: 2px solid var(--color-primary, #3b82f6);
    border-radius: 8px;
    text-align: center;
}

.ctags-output code {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-primary, #3b82f6);
}

.ctags-output .explanation {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: var(--color-dimmed);
}

.utility-demo {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.test-input {
    padding: 0.625rem;
    font-size: 0.875rem;
    font-family: 'Courier New', monospace;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);
}

.bit-toggles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.bit-button {
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 2px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);
    cursor: pointer;
    transition: all 0.2s ease;
}

.bit-button:hover {
    border-color: var(--color-primary, #3b82f6);
}

.bit-button.active {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
}

.bit-groups-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}

.family-group {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1rem;
}

.family-group h4 {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-primary, #3b82f6);
    margin-bottom: 0.75rem;
    letter-spacing: 0.05em;
}

.groups-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.group-item {
    padding: 0.625rem;
    background: var(--color-card-bg);
    border-radius: 6px;
    border: 1px solid var(--color-border-light, rgba(0, 0, 0, 0.05));
}

.group-item strong {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.25rem;
}

.group-item .bit-range {
    display: inline-block;
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    color: var(--color-dimmed);
    background: rgba(0, 0, 0, 0.05);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
}

.group-item .group-desc {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: var(--color-dimmed);
    font-style: italic;
}
</style>
