<template>
  <div class="transition-summary" :class="{ compact, expanded: isExpanded }">
    <!-- Header (always visible) -->
    <div class="summary-header" @click="toggleExpanded">
      <div class="header-main">
        <!-- From → To states -->
        <div class="state-transition">
          <span class="state-badge from" :class="summary?.fromState.layout">
            {{ summary?.fromState.label }}
          </span>
          <span class="arrow">→</span>
          <span class="state-badge to" :class="summary?.toState.layout">
            {{ summary?.toState.label }}
          </span>
        </div>

        <!-- Quick indicators -->
        <div class="indicators">
          <span v-if="summary?.isBackward" class="indicator backward" title="Rückschritt">
            ↩️
          </span>
          <span v-if="summary?.isSkip" class="indicator skip" title="Überspringen">
            ⚡
          </span>
          <span v-if="summary?.layoutChange" class="indicator layout" title="Layout ändert sich">
            🔄
          </span>
        </div>
      </div>

      <!-- Expand toggle -->
      <button class="expand-toggle" :aria-expanded="isExpanded">
        <span class="toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </button>
    </div>

    <!-- Expanded content -->
    <Transition name="slide">
      <div v-if="isExpanded" class="summary-content">
        <!-- Layout change info -->
        <div v-if="summary?.layoutChange" class="layout-change-info">
          <span class="info-icon">🔄</span>
          <span class="info-text">
            Layout wechselt von 
            <strong>{{ summary.fromState.layout === 'stepper' ? 'Stepper' : 'Dashboard' }}</strong>
            zu
            <strong>{{ summary.toState.layout === 'stepper' ? 'Stepper' : 'Dashboard' }}</strong>
          </span>
        </div>

        <!-- State descriptions -->
        <div class="state-descriptions">
          <div class="description from">
            <span class="desc-label">Von:</span>
            <span class="desc-text">{{ summary?.fromState.description }}</span>
          </div>
          <div class="description to">
            <span class="desc-label">Nach:</span>
            <span class="desc-text">{{ summary?.toState.description }}</span>
          </div>
        </div>

        <!-- Role changes -->
        <div v-if="summary?.changes.length" class="role-changes">
          <h4 class="changes-title">Berechtigungsänderungen:</h4>
          <div class="changes-list">
            <div
              v-for="change in summary.changes"
              :key="change.relation"
              class="role-change"
              :class="getRoleClass(change.relation)"
            >
              <!-- Role header -->
              <div class="role-header">
                <span class="role-icon">{{ change.icon }}</span>
                <span class="role-name">{{ change.labelDe }}</span>
                <span class="change-summary">{{ getChangeSummary(change) }}</span>
              </div>

              <!-- Gained capabilities -->
              <div v-if="change.gainedCapabilities.length" class="capability-list gained">
                <span class="list-icon">✅</span>
                <ul>
                  <li v-for="cap in change.gainedCapabilities" :key="cap">{{ cap }}</li>
                </ul>
              </div>

              <!-- Lost capabilities -->
              <div v-if="change.lostCapabilities.length" class="capability-list lost">
                <span class="list-icon">⛔</span>
                <ul>
                  <li v-for="cap in change.lostCapabilities" :key="cap">{{ cap }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- No changes message -->
        <div v-else class="no-changes">
          <span class="no-changes-icon">✨</span>
          <span class="no-changes-text">Keine Berechtigungsänderungen</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TransitionSummary, RoleCapabilityChange } from '@/composables/useTransitionSummary'
import type { ProjectRelation } from '@/composables/useProjectActivation'

const props = withDefaults(defineProps<{
  summary: TransitionSummary | null
  compact?: boolean
  initiallyExpanded?: boolean
}>(), {
  compact: false,
  initiallyExpanded: false,
})

const isExpanded = ref(props.initiallyExpanded)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function getRoleClass(relation: ProjectRelation | string): string {
  return `role-${relation.replace('p_', '')}`
}

function getChangeSummary(change: RoleCapabilityChange): string {
  const gained = change.gainedCapabilities.length
  const lost = change.lostCapabilities.length
  
  if (gained > 0 && lost === 0) return `+${gained}`
  if (lost > 0 && gained === 0) return `-${lost}`
  if (gained > 0 && lost > 0) return `+${gained}/-${lost}`
  return '='
}
</script>

<style scoped>
/* Following Opus CSS conventions */

.transition-summary {
  background: var(--color-muted-bg, oklch(97% 0 0));
  border: var(--border-button, 1px) solid var(--color-border, oklch(85% 0 0));
  border-radius: var(--radius-medium, 0.5rem);
  overflow: hidden;
  font-family: var(--font);
}

/* Header */
.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: var(--transition, all 150ms ease);
}

.summary-header:hover {
  background: oklch(95% 0 0 / 0.5);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* State transition display */
.state-transition {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.state-badge {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-small, 0.25rem);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.state-badge.from {
  background: oklch(90% 0.05 0);
  color: oklch(40% 0 0);
}

.state-badge.to {
  background: oklch(85% 0.12 145);
  color: oklch(30% 0.10 145);
}

.state-badge.stepper {
  border-left: 3px solid oklch(65% 0.15 250);
}

.state-badge.dashboard {
  border-left: 3px solid oklch(65% 0.15 145);
}

.arrow {
  color: var(--color-muted-contrast, oklch(50% 0 0));
}

/* Indicators */
.indicators {
  display: flex;
  gap: 0.25rem;
}

.indicator {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Expand toggle */
.expand-toggle {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--color-muted-contrast, oklch(50% 0 0));
  transition: var(--transition);
}

.expand-toggle:hover {
  color: var(--color-contrast, oklch(20% 0 0));
}

.toggle-icon {
  font-size: 0.625rem;
}

/* Content */
.summary-content {
  padding: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Layout change info */
.layout-change-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: oklch(90% 0.08 250);
  border-radius: var(--radius-small, 0.25rem);
  font-size: 0.8125rem;
  color: oklch(35% 0.08 250);
}

.info-icon {
  font-size: 1rem;
}

/* State descriptions */
.state-descriptions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.description {
  display: flex;
  gap: 0.5rem;
}

.desc-label {
  font-weight: 600;
  color: var(--color-muted-contrast, oklch(50% 0 0));
  min-width: 3rem;
}

.desc-text {
  color: var(--color-contrast, oklch(30% 0 0));
}

/* Role changes */
.changes-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-contrast, oklch(30% 0 0));
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.role-change {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-small, 0.25rem);
  background: oklch(98% 0 0);
  border-left: 3px solid var(--color-border);
}

/* Role-specific colors */
.role-change.role-owner {
  border-left-color: oklch(65% 0.14 65); /* orange */
}

.role-change.role-creator {
  border-left-color: oklch(65% 0.12 300); /* purple */
}

.role-change.role-member {
  border-left-color: oklch(75% 0.12 95); /* yellow */
}

.role-change.role-participant {
  border-left-color: oklch(65% 0.10 230); /* blue */
}

.role-change.role-partner {
  border-left-color: oklch(60% 0.12 145); /* green */
}

.role-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.role-icon {
  font-size: 1rem;
}

.role-name {
  font-weight: 600;
  font-size: 0.8125rem;
}

.change-summary {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-small, 0.25rem);
  background: var(--color-muted-bg);
}

/* Capability lists */
.capability-list {
  display: flex;
  gap: 0.375rem;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.capability-list ul {
  margin: 0;
  padding-left: 1rem;
  list-style: none;
}

.capability-list li {
  position: relative;
}

.capability-list.gained {
  color: oklch(40% 0.12 145);
}

.capability-list.lost {
  color: oklch(45% 0.12 25);
}

.list-icon {
  font-size: 0.875rem;
  flex-shrink: 0;
}

/* No changes */
.no-changes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-muted-contrast, oklch(50% 0 0));
  font-size: 0.875rem;
}

/* Compact mode */
.transition-summary.compact .summary-content {
  padding: 0 0.75rem 0.75rem;
}

.transition-summary.compact .role-changes {
  display: none;
}

/* Slide animation */
.slide-enter-active,
.slide-leave-active {
  transition: all var(--duration, 200ms) var(--ease, ease);
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
}

/* Responsive */
@media (max-width: 640px) {
  .summary-header {
    padding: 0.5rem 0.75rem;
  }
  
  .state-badge {
    font-size: 0.625rem;
    padding: 0.1875rem 0.375rem;
  }
  
  .role-header {
    flex-wrap: wrap;
  }
}
</style>
