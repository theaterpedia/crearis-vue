<template>
    <div class="dashboard-layout" :class="{ 'dashboard-layout--list-mode': isListMode }">
        <!-- ListHead Navigation (5 NavStops) -->
        <ListHead v-model="activeNavStop" :mode="listHeadMode" :project-name="projectName" :show-overline="showOverline"
            :show-subline="showFilters" :tabs="navStopTabs" @tab-change="handleNavStopChange" @search="handleSearch">
            <template #filters>
                <FilterChip v-for="filter in activeFilters" :key="filter.id" :label="filter.label"
                    :active="filter.active" :clearable="filter.clearable" @click="toggleFilter(filter.id)"
                    @clear="clearFilter(filter.id)" />
            </template>
        </ListHead>

        <!-- Main Content Area -->
        <div class="dashboard-content">
            <!-- Home View (overview with pGallery + lists) -->
            <div v-if="activeNavStop === 'home'" class="home-view">
                <div class="home-welcome">
                    <h2>{{ projectName || 'Projekt' }}</h2>
                    <p class="home-subtitle">Willkommen im Dashboard</p>
                </div>
                <!-- Placeholder for home content -->
                <div class="home-sections">
                    <div class="home-section">
                        <h3>Neueste Events</h3>
                        <pList entity="events" :project="projectId" :limit="3" size="small" />
                    </div>
                    <div class="home-section">
                        <h3>Neueste Posts</h3>
                        <pList entity="posts" :project="projectId" :limit="3" size="small" />
                    </div>
                </div>
            </div>

            <!-- Entity List View (AGENDA, THEMEN, AKTEURE) -->
            <div v-else-if="isEntityView" class="entity-view">
                <!-- 2-column: list + browser -->
                <div class="entity-list-column">
                    <div class="list-header">
                        <h3 class="list-title">{{ currentNavLabel }}</h3>
                        <span v-if="entityCount > 0" class="list-count">{{ entityCount }}</span>
                    </div>
                    <div class="list-content">
                        <pList :entity="currentEntityType" :project="projectId" :status-gt="0" size="small"
                            variant="default" :anatomy="false" on-activate="route" @item-click="handleEntitySelect" />
                    </div>
                </div>

                <div class="entity-browser-column">
                    <EntityBrowser v-if="selectedEntity" :entity="selectedEntity" :entity-type="currentEntityType"
                        :project-id="projectId" :alpha="alpha" @open-external="handleOpenExternal"
                        @open-postits="handleOpenPostIts" @tab-change="handleBrowserTabChange" />
                    <div v-else class="empty-browser">
                        <div class="empty-content">
                            <span class="empty-icon">📋</span>
                            <p class="empty-title">Element auswählen</p>
                            <p class="empty-text">Wähle ein Element aus der Liste</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings View (COG) -->
            <div v-else-if="activeNavStop === 'settings'" class="settings-view">
                <ProjectSettingsPanel 
                    :project-id="projectId" 
                    :is-owner="isOwner"
                    :is-locked="isLocked"
                    :show-activation="showActivation"
                    @activate-project="handleActivateProject"
                />
            </div>
        </div>

        <!-- Legacy: CollapsibleTabs for backwards compatibility (hidden by default) -->
        <CollapsibleTabs v-if="showLegacyTabs" :tabs="navigationTabs" v-model="legacyActiveSection"
            :default-collapsed="defaultTabsCollapsed" @tab-change="handleSectionChange"
            @collapse-change="handleCollapseChange" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import CollapsibleTabs from './CollapsibleTabs.vue'
import EntityBrowser from './EntityBrowser.vue'
import ProjectSettingsPanel from './ProjectSettingsPanel.vue'
import pList from '@/components/page/pList.vue'
import ListHead from '@/components/nav/ListHead.vue'
import FilterChip from '@/components/nav/FilterChip.vue'
import { useTheme } from '@/composables/useTheme'
import type { ListHeadTab } from '@/components/nav/ListHead.vue'

// ============================================================
// INTERNAL THEME CONTEXT
// ============================================================

const { setInternalContext } = useTheme()

onMounted(() => {
    setInternalContext(true, 'default')
})

onUnmounted(() => {
    setInternalContext(false)
})

// ============================================================
// TYPES
// ============================================================

interface NavigationTab {
    id: string
    label: string
    icon: string
    entityType?: 'posts' | 'events' | 'pages' | 'images' | 'partners'
    badge?: number
}

interface FilterItem {
    id: string
    label: string
    active: boolean
    clearable?: boolean
}

// ============================================================
// PROPS & EMITS
// ============================================================

const props = withDefaults(defineProps<{
    projectId: string | number
    projectName?: string
    initialSection?: string
    defaultTabsCollapsed?: boolean
    alpha?: boolean
    /** ListHead mode: 'tabs' (inline) or 'hamburger' (dropdown) */
    listHeadMode?: 'tabs' | 'hamburger'
    /** Show overline with project name and search */
    showOverline?: boolean
    /** Show legacy CollapsibleTabs (for migration) */
    showLegacyTabs?: boolean
    /** Is current user the project owner (for settings panel) */
    isOwner?: boolean
    /** Is project locked for editing */
    isLocked?: boolean
    /** Show activation section in settings (stepper mode) */
    showActivation?: boolean
}>(), {
    initialSection: 'home',
    defaultTabsCollapsed: false,
    alpha: true,
    listHeadMode: 'tabs',
    showOverline: false,
    showLegacyTabs: false,
    isOwner: false,
    isLocked: false,
    showActivation: false
})

const emit = defineEmits<{
    'section-change': [sectionId: string]
    'entity-select': [entity: any]
    'open-external': [url: string]
    'open-postits': []
    'search': []
    'activate-project': []
}>()

// ============================================================
// STATE
// ============================================================

// New 5-NavStops state
const activeNavStop = ref(props.initialSection)
const selectedEntity = ref<any>(null)
const showFilters = ref(false)
const activeFilters = ref<FilterItem[]>([])

// Legacy state (for backwards compatibility)
const legacyActiveSection = ref(props.initialSection)
const isTabsCollapsed = ref(props.defaultTabsCollapsed)

// ============================================================
// 5 NAVSTOPS CONFIGURATION
// ============================================================

/** 
 * The 5 NavStops: HOME | AGENDA | TOPICS | PARTNERS | COG (settings via icon)
 * Route segments: /projects/:id/agenda, /projects/:id/topics, /projects/:id/partners
 * 
 * TODO v0.5: Clarify AGENDA scope - can contain more than just events.
 * Agenda is about dates, timeline, tasking, and workflow.
 */
const navStopTabs = computed((): ListHeadTab[] => [
    { id: 'agenda', label: 'AGENDA' },
    { id: 'topics', label: 'TOPICS' },
    { id: 'partners', label: 'PARTNERS' }
])

/** Map NavStop IDs to entity types */
const navStopEntityMap: Record<string, 'events' | 'posts' | 'partners'> = {
    'agenda': 'events',
    'topics': 'posts',
    'partners': 'partners'
}

// ============================================================
// COMPUTED
// ============================================================

const isListMode = computed(() => {
    return activeNavStop.value !== 'home' && activeNavStop.value !== 'settings'
})

const isEntityView = computed(() => {
    return ['agenda', 'topics', 'partners'].includes(activeNavStop.value)
})

const currentNavLabel = computed(() => {
    const labels: Record<string, string> = {
        'home': 'Übersicht',
        'agenda': 'Agenda & Events',
        'topics': 'Themen & Posts',
        'partners': 'Akteure & Partner',
        'settings': 'Einstellungen'
    }
    return labels[activeNavStop.value] || 'Items'
})

const currentEntityType = computed((): 'posts' | 'events' | 'partners' => {
    return navStopEntityMap[activeNavStop.value] || 'posts'
})

const entityCount = computed(() => {
    // Stub - would be populated from API
    return props.alpha ? 12 : 0
})

// Legacy navigation tabs (for backwards compatibility)
const navigationTabs = computed((): NavigationTab[] => [
    { id: 'events', label: 'Events', icon: '📅', entityType: 'events' },
    { id: 'posts', label: 'Posts', icon: '📝', entityType: 'posts' },
    { id: 'images', label: 'Images', icon: '🖼️', entityType: 'images' },
    { id: 'users', label: 'Team', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
])

// ============================================================
// METHODS - NavStop handlers
// ============================================================

function handleNavStopChange(navStopId: string) {
    activeNavStop.value = navStopId
    selectedEntity.value = null
    emit('section-change', navStopId)
}

function handleSearch() {
    emit('search')
    // Future: Open search modal/panel
}

function toggleFilter(filterId: string) {
    const filter = activeFilters.value.find(f => f.id === filterId)
    if (filter) {
        filter.active = !filter.active
    }
}

function clearFilter(filterId: string) {
    const filter = activeFilters.value.find(f => f.id === filterId)
    if (filter) {
        filter.active = false
    }
}

function handleEntitySelect(entity: any) {
    selectedEntity.value = entity
    emit('entity-select', entity)
}

function handleOpenExternal(url: string) {
    emit('open-external', url)
    window.open(url, '_blank')
}

function handleOpenPostIts() {
    emit('open-postits')
}

function handleBrowserTabChange(tabId: string) {
    console.log('[DashboardLayout] Browser tab changed:', tabId)
}

function handleActivateProject() {
    emit('activate-project')
}

// ============================================================
// METHODS - Legacy handlers (backwards compatibility)
// ============================================================

function handleSectionChange(sectionId: string) {
    legacyActiveSection.value = sectionId
    selectedEntity.value = null
    emit('section-change', sectionId)
}

function handleCollapseChange(collapsed: boolean) {
    isTabsCollapsed.value = collapsed
}

// ============================================================
// WATCHERS
// ============================================================

// Watch for route-based section changes (from ProjectDashboard)
watch(() => props.initialSection, (newVal: string | undefined) => {
    if (newVal && newVal !== activeNavStop.value) {
        activeNavStop.value = newVal
        legacyActiveSection.value = newVal
        selectedEntity.value = null // Clear selection on section change
    }
}, { immediate: true })
</script>

<style scoped>
.dashboard-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: hsl(var(--color-bg));
}

/* Main content area */
.dashboard-content {
    flex: 1;
    overflow: hidden;
}

/* Home View */
.home-view {
    padding: 1.5rem;
    overflow-y: auto;
    height: 100%;
}

.home-welcome {
    margin-bottom: 2rem;
}

.home-welcome h2 {
    margin: 0 0 0.25rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: hsl(var(--color-contrast));
}

.home-subtitle {
    margin: 0;
    color: hsl(var(--color-muted-contrast));
}

.home-sections {
    display: grid;
    gap: 1.5rem;
}

.home-section h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    color: hsl(var(--color-contrast));
}

/* Entity View (2-column) */
.entity-view {
    display: grid;
    grid-template-columns: 320px 1fr;
    height: 100%;
    gap: 0;
}

.entity-list-column {
    display: flex;
    flex-direction: column;
    background: hsl(var(--color-card-bg));
    border-right: 1px solid hsl(var(--color-border));
    height: 100%;
    overflow: hidden;
}

.list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid hsl(var(--color-border));
    background: hsl(var(--color-muted-bg));
}

.list-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: hsl(var(--color-contrast));
}

.list-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.375rem;
    background: hsl(var(--color-primary-base));
    color: hsl(var(--color-primary-contrast));
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 9999px;
}

.list-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
}

/* Entity Browser Column */
.entity-browser-column {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding: 1rem;
}

/* Empty Browser State */
.empty-browser {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: hsl(var(--color-card-bg));
    border-radius: var(--radius-large);
    border: 2px dashed hsl(var(--color-border));
}

.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}

.empty-icon {
    font-size: 2.5rem;
    opacity: 0.5;
}

.empty-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: hsl(var(--color-contrast));
}

.empty-text {
    margin: 0;
    font-size: 0.8125rem;
    color: hsl(var(--color-dimmed));
}

/* Settings View */
.settings-view {
    padding: 1.5rem;
}

.settings-view h2 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
    font-weight: 600;
}

/* List Mode modifier (when entity list is visible) */
.dashboard-layout--list-mode .dashboard-content {
    display: flex;
    flex-direction: column;
}

/* Responsive */
@media (max-width: 1024px) {
    .entity-view {
        grid-template-columns: 280px 1fr;
    }
}

@media (max-width: 768px) {
    .entity-view {
        grid-template-columns: 1fr;
    }

    .entity-browser-column {
        display: none;
    }
}

@media (max-width: 400px) {
    .home-view {
        padding: 1rem;
    }

    .home-welcome h2 {
        font-size: 1.25rem;
    }
}
</style>
