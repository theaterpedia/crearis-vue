<template>
    <Container>
        <Section>
            <Heading headline="i18n Management" />

            <div class="i18n-management">
                <!-- Tab Navigation -->
                <div class="tabs">
                    <button @click="activeTab = 'translations'" :class="{ active: activeTab === 'translations' }"
                        class="tab-button">
                        📝 Translations
                    </button>
                    <button @click="activeTab = 'status'" :class="{ active: activeTab === 'status' }"
                        class="tab-button">
                        📊 Status Overview
                    </button>
                    <button @click="activeTab = 'import'" :class="{ active: activeTab === 'import' }"
                        class="tab-button">
                        📦 Import/Export
                    </button>
                    <button @click="activeTab = 'demo'" :class="{ active: activeTab === 'demo' }" class="tab-button">
                        🌍 Language Demo
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="tab-content">
                    <!-- Translations Tab -->
                    <div v-if="activeTab === 'translations'" class="tab-panel">
                        <TranslationList />
                    </div>

                    <!-- Status Overview Tab -->
                    <div v-if="activeTab === 'status'" class="tab-panel">
                        <StatusOverview />
                    </div>

                    <!-- Import/Export Tab -->
                    <div v-if="activeTab === 'import'" class="tab-panel">
                        <BulkImportExport />
                    </div>

                    <!-- Language Demo Tab -->
                    <div v-if="activeTab === 'demo'" class="tab-panel">
                        <I18nDemo />
                    </div>
                </div>
            </div>
        </Section>
    </Container>
    <DemoToggle />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import Container from '@/components/Container.vue'
import Section from '@/components/Section.vue'
import Heading from '@/components/Heading.vue'
import TranslationList from '@/components/i18n/TranslationList.vue'
import StatusOverview from '@/components/i18n/StatusOverview.vue'
import BulkImportExport from '@/components/i18n/BulkImportExport.vue'
import I18nDemo from '@/components/I18nDemo.vue'
import DemoToggle from '@/components/DemoToggle.vue'

const { requireAuth, isAdmin } = useAuth()
const router = useRouter()
const activeTab = ref<'translations' | 'status' | 'import' | 'demo'>('translations')

onMounted(async () => {
    await requireAuth()

    // Require admin role
    if (!isAdmin.value) {
        console.error('Access denied: Admin role required')
        router.push('/')
    }
})
</script>

<style scoped>
.i18n-management {
    margin-top: 2rem;
}

.tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #e5e7eb;
    margin-bottom: 2rem;
}

.tab-button {
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.2s;
    margin-bottom: -2px;
}

.tab-button:hover {
    color: #111827;
    background: #f9fafb;
}

.tab-button.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
    background: transparent;
}

.tab-content {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-panel {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
