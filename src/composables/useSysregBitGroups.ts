/**
 * Composable: useSysregBitGroups
 * 
 * Provides bit group metadata and labels for tag families.
 * Loads configuration from sysreg-bitgroups.json.
 * 
 * Use cases:
 * - Display semantic names for bit ranges ("Altersgruppen" instead of "Bits 0-1")
 * - Group tags in UI by bit group
 * - Show descriptions for bit groups
 * - Support i18n for bit group labels
 */

import { computed } from 'vue'
import { useI18n } from './useI18n'
import bitGroupsConfig from '@/config/sysreg-bitgroups.json'

// ============================================================================
// Types
// ============================================================================

export interface BitGroupConfig {
    name: string
    label: Record<string, string>
    bits: number[]
    description?: Record<string, string>
}

export interface TagFamilyBitGroups {
    groups: BitGroupConfig[]
}

type BitGroupsConfig = Record<string, TagFamilyBitGroups>

// ============================================================================
// Main Composable
// ============================================================================

export function useSysregBitGroups() {
    const { language } = useI18n()

    // Cast the imported JSON to the correct type
    const config = bitGroupsConfig as BitGroupsConfig

    /**
     * Get all bit groups for a specific tag family
     */
    function getBitGroupsForFamily(tagfamily: string): BitGroupConfig[] {
        const familyConfig = config[tagfamily]
        return familyConfig?.groups || []
    }

    /**
     * Get translated label for a specific bit group
     */
    function getBitGroupLabel(tagfamily: string, groupName: string, lang?: string): string {
        const langCode = lang || language.value || 'de'
        const groups = getBitGroupsForFamily(tagfamily)
        const group = groups.find(g => g.name === groupName)

        if (!group) return groupName

        // Fallback chain: requested lang → de → en → name
        return group.label[langCode]
            || group.label['de']
            || group.label['en']
            || groupName
    }

    /**
     * Get translated description for a specific bit group
     */
    function getBitGroupDescription(tagfamily: string, groupName: string, lang?: string): string | undefined {
        const langCode = lang || language.value || 'de'
        const groups = getBitGroupsForFamily(tagfamily)
        const group = groups.find(g => g.name === groupName)

        if (!group?.description) return undefined

        // Fallback chain: requested lang → de → en → undefined
        return group.description[langCode]
            || group.description['de']
            || group.description['en']
    }

    /**
     * Find which bit group a specific bit belongs to
     */
    function findBitGroup(tagfamily: string, bit: number): BitGroupConfig | null {
        const groups = getBitGroupsForFamily(tagfamily)
        return groups.find(g => g.bits.includes(bit)) || null
    }

    /**
     * Get bit group name for a specific bit position
     */
    function getBitGroupName(tagfamily: string, bit: number): string | null {
        const group = findBitGroup(tagfamily, bit)
        return group?.name || null
    }

    /**
     * Get formatted bit range string (e.g., "0-1", "2-3")
     */
    function getBitRangeString(group: BitGroupConfig): string {
        if (group.bits.length === 0) return ''
        const min = Math.min(...group.bits)
        const max = Math.max(...group.bits)
        return min === max ? `${min}` : `${min}-${max}`
    }

    /**
     * Get all bit groups for a family with translated labels (computed)
     */
    function getBitGroupsWithLabels(tagfamily: string) {
        return computed(() => {
            const groups = getBitGroupsForFamily(tagfamily)
            return groups.map(group => ({
                name: group.name,
                label: getBitGroupLabel(tagfamily, group.name),
                description: getBitGroupDescription(tagfamily, group.name),
                bits: group.bits,
                bitRange: getBitRangeString(group)
            }))
        })
    }

    /**
     * Check if a tag family has bit groups defined
     */
    function hasBitGroups(tagfamily: string): boolean {
        return getBitGroupsForFamily(tagfamily).length > 0
    }

    /**
     * Get bit group label by bit range (e.g., "Bits 0-3" → "Raum-/Arbeitsformen")
     */
    function getLabelByBitRange(tagfamily: string, bitRange: string): string {
        // Parse bit range string (e.g., "Bits 0-3" or "0-3")
        const match = bitRange.match(/(\d+)-(\d+)/)
        if (!match || !match[1] || !match[2]) return bitRange

        const start = parseInt(match[1])
        const end = parseInt(match[2])

        // Find group that contains this range
        const groups = getBitGroupsForFamily(tagfamily)
        const group = groups.find(g => {
            const min = Math.min(...g.bits)
            const max = Math.max(...g.bits)
            return start >= min && end <= max
        })

        return group ? getBitGroupLabel(tagfamily, group.name) : bitRange
    }

    return {
        // Get bit groups
        getBitGroupsForFamily,
        getBitGroupsWithLabels,

        // Get labels and descriptions
        getBitGroupLabel,
        getBitGroupDescription,

        // Find bit groups
        findBitGroup,
        getBitGroupName,
        getLabelByBitRange,

        // Utility
        getBitRangeString,
        hasBitGroups
    }
}
