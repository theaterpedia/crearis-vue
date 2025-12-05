/**
 * Permission Tooltip Composable
 * 
 * Provides detailed permission explanations for UI tooltips.
 * Shows what a user can/cannot do based on their role and current project state.
 * 
 * Uses capability matrix from project-capabilities-foundation.md
 * 
 * December 2025
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import { PROJECT_STATUS, STATUS_TO_NAME, type ProjectRelation } from './useProjectActivation'

/**
 * Permission explanation item
 */
export interface PermissionItem {
  icon: string
  label: string
  allowed: boolean
  reason?: string
}

/**
 * Full permission info for tooltip
 */
export interface PermissionInfo {
  role: ProjectRelation
  roleLabelDe: string
  roleIcon: string
  stateName: string
  stateLabel: string
  permissions: PermissionItem[]
  summary: string
}

/**
 * Role metadata
 */
const ROLE_META: Record<ProjectRelation, { icon: string; labelDe: string; priority: number }> = {
  p_owner: { icon: '👑', labelDe: 'Eigentümer', priority: 6 },
  p_creator: { icon: '✨', labelDe: 'Ersteller', priority: 5 },
  member: { icon: '👤', labelDe: 'Mitglied', priority: 4 },
  participant: { icon: '👁', labelDe: 'Teilnehmer', priority: 3 },
  partner: { icon: '🤝', labelDe: 'Partner', priority: 2 },
  anonym: { icon: '🌐', labelDe: 'Gast', priority: 1 },
}

/**
 * State labels in German
 */
const STATE_LABELS_DE: Record<string, string> = {
  new: 'Neu',
  demo: 'Demo',
  draft: 'Entwurf',
  confirmed: 'Bestätigt',
  released: 'Veröffentlicht',
  archived: 'Archiviert',
  trash: 'Papierkorb',
}

/**
 * Permission definitions per state and role
 * Derived from project-capabilities-foundation.md
 */
interface StatePermissions {
  canRead: boolean
  canReadConfig: boolean
  canEdit: boolean
  canEditConfig: boolean
  canManageTeam: boolean
  canManageStatus: boolean
  canTrash: boolean
  canShare: boolean
  canList: boolean
}

const PERMISSION_MATRIX: Record<string, Record<ProjectRelation, StatePermissions>> = {
  new: {
    p_owner: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: true, canShare: true, canList: true },
    p_creator: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: false, canShare: true, canList: true },
    member: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
    participant: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
    partner: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
    anonym: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
  },
  demo: {
    p_owner: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: true, canShare: true, canList: true },
    p_creator: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    member: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    participant: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
    partner: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
    anonym: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
  },
  draft: {
    p_owner: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: true, canShare: true, canList: true },
    p_creator: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: false, canShare: true, canList: true },
    member: { canRead: true, canReadConfig: false, canEdit: true, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: true, canList: true },
    participant: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    partner: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
    anonym: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
  },
  confirmed: {
    p_owner: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: true, canShare: true, canList: true },
    p_creator: { canRead: true, canReadConfig: false, canEdit: true, canEditConfig: false, canManageTeam: false, canManageStatus: true, canTrash: false, canShare: true, canList: true },
    member: { canRead: true, canReadConfig: false, canEdit: true, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: true, canList: true },
    participant: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    partner: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    anonym: { canRead: false, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: false },
  },
  released: {
    p_owner: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: true, canShare: true, canList: true },
    p_creator: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    member: { canRead: true, canReadConfig: false, canEdit: true, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: true, canList: true },
    participant: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    partner: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    anonym: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
  },
  archived: {
    p_owner: { canRead: true, canReadConfig: true, canEdit: true, canEditConfig: true, canManageTeam: true, canManageStatus: true, canTrash: true, canShare: false, canList: true },
    p_creator: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    member: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    participant: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    partner: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
    anonym: { canRead: true, canReadConfig: false, canEdit: false, canEditConfig: false, canManageTeam: false, canManageStatus: false, canTrash: false, canShare: false, canList: true },
  },
}

/**
 * Build permission items from state permissions
 */
function buildPermissionItems(perms: StatePermissions): PermissionItem[] {
  return [
    { icon: '👁', label: 'Inhalte lesen', allowed: perms.canRead },
    { icon: '⚙️', label: 'Einstellungen sehen', allowed: perms.canReadConfig },
    { icon: '✏️', label: 'Inhalte bearbeiten', allowed: perms.canEdit },
    { icon: '🔧', label: 'Einstellungen ändern', allowed: perms.canEditConfig },
    { icon: '👥', label: 'Team verwalten', allowed: perms.canManageTeam },
    { icon: '📊', label: 'Status ändern', allowed: perms.canManageStatus },
    { icon: '📤', label: 'Teilen', allowed: perms.canShare },
  ]
}

/**
 * Generate summary text
 */
function generateSummary(perms: StatePermissions, role: ProjectRelation): string {
  if (role === 'p_owner') return 'Vollzugriff als Eigentümer'
  
  const abilities: string[] = []
  if (perms.canEditConfig) abilities.push('Konfigurieren')
  else if (perms.canEdit) abilities.push('Bearbeiten')
  else if (perms.canRead) abilities.push('Lesen')
  
  if (perms.canManageTeam) abilities.push('Team verwalten')
  else if (perms.canManageStatus) abilities.push('Status ändern')
  
  if (abilities.length === 0) return 'Kein Zugriff'
  return abilities.join(', ')
}

/**
 * Get permission info for a role in a specific state
 */
export function getPermissionInfo(
  role: ProjectRelation,
  statusValue: number
): PermissionInfo | null {
  const stateName = STATUS_TO_NAME[statusValue]
  if (!stateName) return null

  const statePerms = PERMISSION_MATRIX[stateName]
  if (!statePerms) return null

  const rolePerms = statePerms[role]
  if (!rolePerms) return null

  const roleMeta = ROLE_META[role]

  return {
    role,
    roleLabelDe: roleMeta.labelDe,
    roleIcon: roleMeta.icon,
    stateName,
    stateLabel: STATE_LABELS_DE[stateName] || stateName,
    permissions: buildPermissionItems(rolePerms),
    summary: generateSummary(rolePerms, role)
  }
}

/**
 * Compare permissions between two roles
 */
export function compareRolePermissions(
  role1: ProjectRelation,
  role2: ProjectRelation,
  statusValue: number
): { role1Advantages: string[]; role2Advantages: string[] } {
  const stateName = STATUS_TO_NAME[statusValue]
  if (!stateName) return { role1Advantages: [], role2Advantages: [] }

  const perms1 = PERMISSION_MATRIX[stateName]?.[role1]
  const perms2 = PERMISSION_MATRIX[stateName]?.[role2]
  if (!perms1 || !perms2) return { role1Advantages: [], role2Advantages: [] }

  const role1Advantages: string[] = []
  const role2Advantages: string[] = []

  const checks: { key: keyof StatePermissions; label: string }[] = [
    { key: 'canRead', label: 'Lesen' },
    { key: 'canReadConfig', label: 'Einstellungen sehen' },
    { key: 'canEdit', label: 'Bearbeiten' },
    { key: 'canEditConfig', label: 'Konfigurieren' },
    { key: 'canManageTeam', label: 'Team verwalten' },
    { key: 'canManageStatus', label: 'Status ändern' },
    { key: 'canTrash', label: 'Löschen' },
    { key: 'canShare', label: 'Teilen' },
  ]

  for (const { key, label } of checks) {
    if (perms1[key] && !perms2[key]) role1Advantages.push(label)
    if (perms2[key] && !perms1[key]) role2Advantages.push(label)
  }

  return { role1Advantages, role2Advantages }
}

/**
 * Permission Tooltip Composable
 */
export function usePermissionTooltip(
  currentRole: Ref<ProjectRelation>,
  currentStatus: Ref<number>
) {
  // Current permission info
  const permissionInfo = computed<PermissionInfo | null>(() =>
    getPermissionInfo(currentRole.value, currentStatus.value)
  )

  // Allowed permissions (filtered)
  const allowedPermissions = computed(() =>
    permissionInfo.value?.permissions.filter(p => p.allowed) ?? []
  )

  // Denied permissions (filtered)
  const deniedPermissions = computed(() =>
    permissionInfo.value?.permissions.filter(p => !p.allowed) ?? []
  )

  // Role icon
  const roleIcon = computed(() => ROLE_META[currentRole.value]?.icon ?? '👤')

  // Role label
  const roleLabelDe = computed(() => ROLE_META[currentRole.value]?.labelDe ?? 'Unbekannt')

  // State label
  const stateLabelDe = computed(() => {
    const name = STATUS_TO_NAME[currentStatus.value]
    return STATE_LABELS_DE[name] || name || 'Unbekannt'
  })

  // Summary
  const summary = computed(() => permissionInfo.value?.summary ?? '')

  // Check specific permission
  function hasPermission(permKey: keyof StatePermissions): boolean {
    const stateName = STATUS_TO_NAME[currentStatus.value]
    if (!stateName) return false
    return PERMISSION_MATRIX[stateName]?.[currentRole.value]?.[permKey] ?? false
  }

  // Get comparison with another role
  function compareWith(otherRole: ProjectRelation) {
    return compareRolePermissions(currentRole.value, otherRole, currentStatus.value)
  }

  return {
    // Info
    permissionInfo,
    allowedPermissions,
    deniedPermissions,
    roleIcon,
    roleLabelDe,
    stateLabelDe,
    summary,

    // Checks
    hasPermission,
    compareWith,

    // Static
    ROLE_META,
    STATE_LABELS_DE,
  }
}
