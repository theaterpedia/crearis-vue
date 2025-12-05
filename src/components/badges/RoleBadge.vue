<template>
    <span class="role-badge" :class="[variant, roleClass, { clickable: showTooltip }]" :title="tooltip"
        @click="handleClick" @mouseenter="showTooltipPopup = true" @mouseleave="showTooltipPopup = false">
        <span v-if="showIcon" class="badge-icon">{{ roleIcon }}</span>
        <span v-if="showLabel" class="badge-label">{{ roleLabel }}</span>

        <!-- Permission tooltip popup -->
        <Teleport to="body" v-if="showTooltip && showTooltipPopup">
            <div class="role-tooltip" :style="tooltipStyle">
                <div class="tooltip-header">
                    <span class="tooltip-icon">{{ roleIcon }}</span>
                    <span class="tooltip-title">{{ roleLabel }}</span>
                </div>
                <div class="tooltip-summary">{{ permissionSummary }}</div>

                <div v-if="showPermissions" class="tooltip-permissions">
                    <div v-for="perm in permissionItems" :key="perm.label" class="perm-item"
                        :class="{ allowed: perm.allowed, denied: !perm.allowed }">
                        <span class="perm-icon">{{ perm.allowed ? '✓' : '✗' }}</span>
                        <span class="perm-label">{{ perm.label }}</span>
                    </div>
                </div>
            </div>
        </Teleport>
    </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProjectRelation } from '@/composables/useProjectActivation'
import { usePermissionTooltip } from '@/composables/usePermissionTooltip'

const props = withDefaults(defineProps<{
    relation: ProjectRelation
    status?: number
    variant?: 'default' | 'compact' | 'expanded' | 'pill'
    showIcon?: boolean
    showLabel?: boolean
    showTooltip?: boolean
    showPermissions?: boolean
}>(), {
    status: 64, // draft default
    variant: 'default',
    showIcon: true,
    showLabel: true,
    showTooltip: false,
    showPermissions: true,
})

const emit = defineEmits<{
    click: []
}>()

const showTooltipPopup = ref(false)

// Role metadata
const ROLE_META: Record<ProjectRelation, { icon: string; label: string; labelDe: string }> = {
    p_owner: { icon: '👑', label: 'Owner', labelDe: 'Eigentümer' },
    p_creator: { icon: '✨', label: 'Creator', labelDe: 'Ersteller' },
    member: { icon: '👤', label: 'Member', labelDe: 'Mitglied' },
    participant: { icon: '👁', label: 'Participant', labelDe: 'Teilnehmer' },
    partner: { icon: '🤝', label: 'Partner', labelDe: 'Partner' },
    anonym: { icon: '🌐', label: 'Guest', labelDe: 'Gast' },
}

const roleIcon = computed(() => ROLE_META[props.relation]?.icon ?? '👤')
const roleLabel = computed(() => ROLE_META[props.relation]?.labelDe ?? 'Unbekannt')
const roleClass = computed(() => `role-${props.relation.replace('p_', '')}`)

// Permission tooltip
const relationRef = computed(() => props.relation)
const statusRef = computed(() => props.status)

const {
    permissionInfo,
    allowedPermissions,
    deniedPermissions,
    summary: permissionSummary,
} = usePermissionTooltip(relationRef, statusRef)

const permissionItems = computed(() => permissionInfo.value?.permissions ?? [])

// Simple tooltip text
const tooltip = computed(() => {
    if (props.showTooltip) return '' // Using popup instead
    return `${roleLabel.value}: ${permissionSummary.value}`
})

// Tooltip positioning (simplified - in production would use floating-ui)
const tooltipStyle = computed(() => ({
    position: 'fixed' as const,
    zIndex: 9999,
}))

function handleClick() {
    emit('click')
}
</script>

<style scoped>
/* Following Opus CSS conventions: oklch, theme vars */

.role-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-small, 0.25rem);
    font-family: var(--font);
    font-size: 0.75rem;
    font-weight: 500;
    transition: var(--transition, all 150ms ease);
    white-space: nowrap;
}

.role-badge.clickable {
    cursor: pointer;
}

.role-badge.clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px oklch(0% 0 0 / 0.1);
}

/* Variants */
.role-badge.compact {
    padding: 0.125rem 0.375rem;
    font-size: 0.6875rem;
}

.role-badge.expanded {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
}

.role-badge.pill {
    border-radius: 9999px;
    padding: 0.25rem 0.625rem;
}

/* Role colors (oklch) */
.role-badge.role-owner {
    background: oklch(85% 0.14 65);
    color: oklch(35% 0.10 65);
}

.role-badge.role-creator {
    background: oklch(82% 0.12 300);
    color: oklch(35% 0.10 300);
}

.role-badge.role-member {
    background: oklch(92% 0.12 95);
    color: oklch(40% 0.10 95);
}

.role-badge.role-participant {
    background: oklch(85% 0.10 230);
    color: oklch(35% 0.08 230);
}

.role-badge.role-partner {
    background: oklch(82% 0.12 145);
    color: oklch(32% 0.10 145);
}

.role-badge.role-anonym {
    background: oklch(90% 0.04 0);
    color: oklch(40% 0 0);
}

.badge-icon {
    font-size: 0.875em;
    line-height: 1;
}

.badge-label {
    line-height: 1;
}

/* Tooltip popup */
.role-tooltip {
    background: var(--color-contrast, oklch(15% 0 0));
    color: oklch(95% 0 0);
    border-radius: var(--radius-medium, 0.5rem);
    padding: 0.75rem;
    font-family: var(--font);
    font-size: 0.75rem;
    box-shadow: 0 4px 12px oklch(0% 0 0 / 0.3);
    max-width: 250px;
    pointer-events: none;
}

.tooltip-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.375rem;
}

.tooltip-icon {
    font-size: 1rem;
}

.tooltip-title {
    font-weight: 600;
    font-size: 0.875rem;
}

.tooltip-summary {
    color: oklch(75% 0 0);
    margin-bottom: 0.5rem;
}

.tooltip-permissions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.375rem;
    border-top: 1px solid oklch(40% 0 0);
}

.perm-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.perm-item.allowed {
    color: oklch(70% 0.12 145);
}

.perm-item.denied {
    color: oklch(65% 0.08 0);
    text-decoration: line-through;
    opacity: 0.6;
}

.perm-icon {
    font-size: 0.625rem;
    width: 0.75rem;
}

/* Responsive */
@media (max-width: 640px) {
    .role-badge {
        font-size: 0.6875rem;
        padding: 0.1875rem 0.375rem;
    }

    .role-badge.expanded {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
    }
}
</style>
