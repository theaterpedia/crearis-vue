/**
 * Alpha Flags Composable
 * 
 * Version-gated feature flags for next-version specs (Stub system).
 * Enables progressive rollout of features based on:
 * - Version number (v0.5, v0.6, etc.)
 * - Development mode (dev_*)
 * - Optional user preference (opt_*)
 * - Owner-only access (*_owner)
 * 
 * Dec 8, 2025 - Part of v0.5-v0.8 planning
 */

import { computed, type ComputedRef } from 'vue'
import { useProjectActivation } from './useProjectActivation'

/**
 * Current application version from package.json
 * This should match the version in package.json
 */
const CURRENT_VERSION = '0.4'

/**
 * Alpha flag parsing result
 */
export interface AlphaFlags {
  /** Whether the feature is enabled */
  enabled: ComputedRef<boolean>
  /** The target version (e.g., "0.5") */
  version: string | null
  /** The mode modifier (dev, opt, owner, or null) */
  mode: 'dev' | 'opt' | 'owner' | null
  /** Raw alpha string for debugging */
  raw: string | undefined
}

/**
 * Parse alpha prop string into components
 * 
 * Formats:
 * - "v0.5"       → version=0.5, mode=null
 * - "dev_v0.5"   → version=0.5, mode=dev (dev mode only)
 * - "opt_v0.5"   → version=0.5, mode=opt (user preference)
 * - "v0.5_owner" → version=0.5, mode=owner (project owner only)
 * - "v0.6"       → version=0.6, mode=null
 */
function parseAlpha(alpha?: string): { version: string | null; mode: 'dev' | 'opt' | 'owner' | null } {
  if (!alpha) {
    return { version: null, mode: null }
  }

  const parts = alpha.toLowerCase().split('_')
  
  // Extract version (looks like "v0.5" or "v1.0")
  const versionPart = parts.find(p => p.startsWith('v') && /^v\d+(\.\d+)?$/.test(p))
  const version = versionPart ? versionPart.slice(1) : null
  
  // Extract mode
  let mode: 'dev' | 'opt' | 'owner' | null = null
  if (parts.includes('dev')) mode = 'dev'
  else if (parts.includes('opt')) mode = 'opt'
  else if (parts.includes('owner')) mode = 'owner'
  
  return { version, mode }
}

/**
 * Compare version strings
 * Returns true if current >= target
 */
function versionSatisfies(current: string, target: string): boolean {
  const currentParts = current.split('.').map(Number)
  const targetParts = target.split('.').map(Number)
  
  for (let i = 0; i < Math.max(currentParts.length, targetParts.length); i++) {
    const c = currentParts[i] || 0
    const t = targetParts[i] || 0
    
    if (c > t) return true
    if (c < t) return false
  }
  
  return true // equal
}

/**
 * User preferences for experimental features
 * In a real implementation, this would come from user settings
 */
function useExperimentalPreference(): ComputedRef<boolean> {
  // TODO: Wire to actual user preferences when implemented
  // For now, check localStorage or return false
  return computed(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('experimental_features') === 'true'
  })
}

/**
 * Check if currently in development mode
 */
function isDevelopmentMode(): boolean {
  return import.meta.env?.DEV === true
}

/**
 * Alpha Flags Composable
 * 
 * Usage:
 * ```vue
 * <script setup>
 * const props = defineProps<{ alpha?: string }>()
 * const { enabled } = useAlphaFlags(props.alpha)
 * </script>
 * 
 * <template>
 *   <WorkitemsPanel v-if="enabled" />
 *   <WorkitemsPanelStub v-else />
 * </template>
 * ```
 * 
 * @param alpha - Alpha flag string (e.g., "v0.5", "dev_v0.5", "v0.5_owner")
 * @param currentVersion - Override current version (for testing)
 */
export function useAlphaFlags(alpha?: string, currentVersion = CURRENT_VERSION): AlphaFlags {
  const { version, mode } = parseAlpha(alpha)
  const experimentalEnabled = useExperimentalPreference()
  
  // Get project activation for owner check
  // This is safe to call even outside project context (will return false)
  let isPOwner: ComputedRef<boolean>
  try {
    const activation = useProjectActivation()
    isPOwner = activation.isPOwner
  } catch {
    isPOwner = computed(() => false)
  }
  
  const enabled = computed(() => {
    // No alpha prop = disabled
    if (!alpha || !version) {
      return false
    }
    
    // Check version requirement
    const versionOk = versionSatisfies(currentVersion, version)
    if (!versionOk) {
      return false
    }
    
    // Check mode-specific requirements
    switch (mode) {
      case 'dev':
        // Only enabled in development mode
        return isDevelopmentMode()
      
      case 'opt':
        // Only enabled if user has opted in to experimental features
        return experimentalEnabled.value
      
      case 'owner':
        // Only enabled for project owners
        return isPOwner.value
      
      default:
        // No mode restriction, just version
        return true
    }
  })
  
  return {
    enabled,
    version,
    mode,
    raw: alpha
  }
}

/**
 * Helper to check if a feature version is upcoming (not yet enabled)
 */
export function isUpcoming(alpha?: string, currentVersion = CURRENT_VERSION): boolean {
  if (!alpha) return false
  const { version } = parseAlpha(alpha)
  if (!version) return false
  return !versionSatisfies(currentVersion, version)
}

/**
 * Get the target version from an alpha string
 */
export function getTargetVersion(alpha?: string): string | null {
  const { version } = parseAlpha(alpha)
  return version
}

/**
 * Default export for convenience
 */
export default useAlphaFlags
