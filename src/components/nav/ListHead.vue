<template>
  <header class="list-head" :class="[`list-head--${mode}`, { 'list-head--dense': isDense }]">
    <!-- Overline Extension (optional): Logo/Project + Search -->
    <div v-if="showOverline" class="list-head__overline">
      <slot name="overline">
        <div class="list-head__brand">
          <slot name="logo">
            <span class="list-head__project-name">{{ projectName }}</span>
          </slot>
        </div>
        <button class="list-head__search-btn" @click="$emit('search')">
          <Icon name="lucide:search" />
        </button>
      </slot>
    </div>

    <!-- Main Navigation Row -->
    <nav class="list-head__nav">
      <!-- Tabbed Mode: All 5 items inline -->
      <template v-if="mode === 'tabs'">
        <button 
          class="list-head__tab list-head__tab--icon" 
          :class="{ 'list-head__tab--active': activeTab === 'home' }"
          @click="setTab('home')"
          aria-label="Home"
        >
          <Icon name="lucide:home" />
        </button>
        
        <button 
          v-for="tab in entityTabs" 
          :key="tab.id"
          class="list-head__tab"
          :class="{ 'list-head__tab--active': activeTab === tab.id }"
          @click="setTab(tab.id)"
        >
          {{ tab.label }}
        </button>
        
        <button 
          class="list-head__tab list-head__tab--icon" 
          :class="{ 'list-head__tab--active': activeTab === 'settings' }"
          @click="setTab('settings')"
          aria-label="Settings"
        >
          <Icon name="lucide:settings" />
        </button>
      </template>

      <!-- Hamburger Mode: Home icon + Dropdown + Cog -->
      <template v-else>
        <button 
          class="list-head__tab list-head__tab--icon" 
          :class="{ 'list-head__tab--active': activeTab === 'home' }"
          @click="setTab('home')"
          aria-label="Home"
        >
          <Icon name="lucide:home" />
        </button>

        <div class="list-head__dropdown-wrapper">
          <button 
            class="list-head__dropdown-trigger"
            @click="toggleDropdown"
            :aria-expanded="dropdownOpen"
          >
            <span class="list-head__dropdown-label">{{ currentTabLabel }}</span>
            <Icon :name="dropdownOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
          </button>
          
          <Transition name="dropdown">
            <div v-if="dropdownOpen" class="list-head__dropdown-menu">
              <button 
                v-for="tab in entityTabs" 
                :key="tab.id"
                class="list-head__dropdown-item"
                :class="{ 'list-head__dropdown-item--active': activeTab === tab.id }"
                @click="selectFromDropdown(tab.id)"
              >
                {{ tab.label }}
              </button>
            </div>
          </Transition>
        </div>

        <button 
          class="list-head__tab list-head__tab--icon" 
          :class="{ 'list-head__tab--active': activeTab === 'settings' }"
          @click="setTab('settings')"
          aria-label="Settings"
        >
          <Icon name="lucide:settings" />
        </button>
      </template>
    </nav>

    <!-- Subline Extension (optional): Filters/Ordering -->
    <div v-if="showSubline" class="list-head__subline">
      <slot name="subline">
        <!-- Default filter chips slot -->
        <div class="list-head__filters">
          <slot name="filters" />
        </div>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '#components'

export interface ListHeadTab {
  id: string
  label: string
}

interface Props {
  /** Navigation mode: 'tabs' for inline, 'hamburger' for dropdown */
  mode?: 'tabs' | 'hamburger'
  /** Currently active tab */
  modelValue?: string
  /** Project/brand name for overline */
  projectName?: string
  /** Show overline extension (logo + search) */
  showOverline?: boolean
  /** Show subline extension (filters) */
  showSubline?: boolean
  /** Custom entity tabs (default: AGENDA, THEMEN, AKTEURE) */
  tabs?: ListHeadTab[]
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'tabs',
  modelValue: 'home',
  projectName: '',
  showOverline: false,
  showSubline: false,
  tabs: () => [
    { id: 'agenda', label: 'AGENDA' },
    { id: 'themen', label: 'THEMEN' },
    { id: 'akteure', label: 'AKTEURE' }
  ]
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': []
  'tab-change': [tabId: string]
}>()

// Reactive state
const activeTab = ref(props.modelValue)
const dropdownOpen = ref(false)
const isDense = ref(false)

// Computed
const entityTabs = computed(() => props.tabs)

const currentTabLabel = computed(() => {
  if (activeTab.value === 'home') return 'HOME'
  if (activeTab.value === 'settings') return 'EINSTELLUNGEN'
  const tab = entityTabs.value.find(t => t.id === activeTab.value)
  return tab?.label || 'MENÜ'
})

// Methods
function setTab(tabId: string) {
  activeTab.value = tabId
  emit('update:modelValue', tabId)
  emit('tab-change', tabId)
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function selectFromDropdown(tabId: string) {
  setTab(tabId)
  dropdownOpen.value = false
}

// Dense mode detection (via CSS custom property)
function checkDense() {
  const denseValue = getComputedStyle(document.documentElement).getPropertyValue('--dense').trim()
  isDense.value = denseValue === '1'
}

onMounted(() => {
  checkDense()
  window.addEventListener('resize', checkDense)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkDense)
})

// Close dropdown on outside click
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.list-head__dropdown-wrapper')) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.list-head {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: hsl(var(--color-bg));
  border-bottom: 1px solid hsl(var(--color-border));
  max-width: 400px;
}

/* Overline: Logo + Search */
.list-head__overline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.list-head__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.list-head__project-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: hsl(var(--color-contrast));
}

.list-head__search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-small);
  color: hsl(var(--color-muted-contrast));
  cursor: pointer;
  transition: var(--transition);
}

.list-head__search-btn:hover {
  background: hsl(var(--color-accent-bg));
  color: hsl(var(--color-contrast));
}

/* Main Navigation */
.list-head__nav {
  display: flex;
  align-items: center;
  gap: 0.125rem;
}

/* Tabs Mode */
.list-head__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.25rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-small);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  color: hsl(var(--color-muted-contrast));
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.list-head__tab:hover {
  background: hsl(var(--color-accent-bg));
  color: hsl(var(--color-contrast));
}

.list-head__tab--active {
  background: hsl(var(--color-primary-base));
  color: hsl(var(--color-primary-contrast));
}

.list-head__tab--icon {
  flex: 0 0 2.5rem;
  width: 2.5rem;
}

/* Hamburger/Dropdown Mode */
.list-head__dropdown-wrapper {
  flex: 1;
  position: relative;
}

.list-head__dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: hsl(var(--color-secondary-base));
  border: none;
  border-radius: var(--radius-small);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  color: hsl(var(--color-secondary-contrast));
  cursor: pointer;
  transition: var(--transition);
}

.list-head__dropdown-trigger:hover {
  background: hsl(var(--color-accent-bg));
}

.list-head__dropdown-label {
  flex: 1;
  text-align: left;
}

.list-head__dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: hsl(var(--color-popover-bg));
  border: 1px solid hsl(var(--color-border));
  border-radius: var(--radius-small);
  box-shadow: var(--theme-shadow);
  z-index: 50;
  overflow: hidden;
}

.list-head__dropdown-item {
  width: 100%;
  display: block;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  color: hsl(var(--color-popover-contrast));
  text-align: left;
  cursor: pointer;
  transition: var(--transition);
}

.list-head__dropdown-item:hover {
  background: hsl(var(--color-accent-bg));
}

.list-head__dropdown-item--active {
  background: hsl(var(--color-primary-base));
  color: hsl(var(--color-primary-contrast));
}

/* Subline: Filters */
.list-head__subline {
  padding: 0.25rem 0;
}

.list-head__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

/* Dense adjustments (automatic via CSS variable) */
.list-head--dense .list-head__tab {
  padding: 0.375rem 0.125rem;
  font-size: 0.6875rem;
}

.list-head--dense .list-head__tab--icon {
  flex: 0 0 2rem;
  width: 2rem;
}

.list-head--dense .list-head__dropdown-trigger {
  padding: 0.375rem 0.5rem;
  font-size: 0.6875rem;
}
</style>
