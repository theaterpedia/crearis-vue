/**
 * Composable: useSysregSuggestions
 * 
 * Provides intelligent tag suggestions based on:
 * - Project context (inherit project tags)
 * - Content analysis (extract from text)
 * - User history (frequently used tags)
 * - Similar entities (collaborative filtering)
 * 
 * Phase 6: Advanced Features
 */

import { ref, computed, type Ref } from 'vue'
import {
    parseByteaHex,
    byteArrayToBits,
    bitsToByteArray,
    hasBit
} from './useSysregTags'
import { useSysregOptions } from './useSysregOptions'

export interface SuggestionSource {
    type: 'project' | 'content' | 'history' | 'similar'
    confidence: number  // 0-1
    reason: string
}

export interface TagSuggestion {
    tagfamily: 'ttags' | 'dtags' | 'rtags'
    bit: number
    value: string  // BYTEA hex for single bit
    label: string
    source: SuggestionSource
}

export interface CtagsSuggestion {
    bitGroup: 'age_group' | 'subject_type' | 'access_level' | 'quality'
    value: number  // 0-3
    label: string
    source: SuggestionSource
}

export function useSysregSuggestions() {
    const { getTagLabel, ctagsBitGroupOptions } = useSysregOptions()

    // Suggestion history (localStorage)
    const suggestionHistory = ref<Record<string, number>>({})

    // Load history from localStorage
    function loadHistory() {
        const stored = localStorage.getItem('sysreg-suggestion-history')
        if (stored) {
            try {
                suggestionHistory.value = JSON.parse(stored)
            } catch (error) {
                console.error('Failed to load suggestion history:', error)
            }
        }
    }

    // Save history to localStorage
    function saveHistory() {
        localStorage.setItem(
            'sysreg-suggestion-history',
            JSON.stringify(suggestionHistory.value)
        )
    }

    // Record tag usage
    function recordTagUsage(tagfamily: string, bit: number) {
        const key = `${tagfamily}-${bit}`
        suggestionHistory.value[key] = (suggestionHistory.value[key] || 0) + 1
        saveHistory()
    }

    // Get frequently used tags
    function getFrequentTags(
        tagfamily: 'ttags' | 'dtags' | 'rtags',
        limit = 5
    ): TagSuggestion[] {
        const prefix = `${tagfamily}-`
        const relevant = Object.entries(suggestionHistory.value)
            .filter(([key]) => key.startsWith(prefix))
            .map(([key, count]) => {
                const bit = parseInt(key.split('-')[1])
                const value = bitsToByteArray([bit])
                return {
                    tagfamily,
                    bit,
                    value,
                    label: getTagLabel(tagfamily, value),
                    count,
                    source: {
                        type: 'history' as const,
                        confidence: Math.min(count / 10, 1), // Cap at 10 uses
                        reason: `Used ${count} times before`
                    }
                }
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)

        return relevant.map(({ tagfamily, bit, value, label, source }) => ({
            tagfamily,
            bit,
            value,
            label,
            source
        }))
    }

    // Suggest tags from project context
    function suggestFromProject(
        project: { ttags_val?: string; dtags_val?: string },
        includeTagfamilies: ('ttags' | 'dtags')[] = ['ttags', 'dtags']
    ): TagSuggestion[] {
        const suggestions: TagSuggestion[] = []

        if (includeTagfamilies.includes('ttags') && project.ttags_val) {
            const bits = byteArrayToBits(project.ttags_val)
            bits.forEach(bit => {
                const value = bitsToByteArray([bit])
                suggestions.push({
                    tagfamily: 'ttags',
                    bit,
                    value,
                    label: getTagLabel('ttags', value),
                    source: {
                        type: 'project',
                        confidence: 0.9,
                        reason: 'From project tags'
                    }
                })
            })
        }

        if (includeTagfamilies.includes('dtags') && project.dtags_val) {
            const bits = byteArrayToBits(project.dtags_val)
            bits.forEach(bit => {
                const value = bitsToByteArray([bit])
                suggestions.push({
                    tagfamily: 'dtags',
                    bit,
                    value,
                    label: getTagLabel('dtags', value),
                    source: {
                        type: 'project',
                        confidence: 0.9,
                        reason: 'From project tags'
                    }
                })
            })
        }

        return suggestions
    }

    // Suggest tags from content analysis
    function suggestFromContent(
        text: string,
        entity: string = 'generic'
    ): TagSuggestion[] {
        const suggestions: TagSuggestion[] = []
        const lowerText = text.toLowerCase()

        // Define keyword mappings (expand as needed)
        const keywordMap: Record<string, { tagfamily: 'ttags' | 'dtags'; bit: number }> = {
            // TTags (topics)
            'democracy': { tagfamily: 'ttags', bit: 0 },
            'demokratie': { tagfamily: 'ttags', bit: 0 },
            'environment': { tagfamily: 'ttags', bit: 1 },
            'umwelt': { tagfamily: 'ttags', bit: 1 },
            'diversity': { tagfamily: 'ttags', bit: 2 },
            'vielfalt': { tagfamily: 'ttags', bit: 2 },
            'education': { tagfamily: 'ttags', bit: 3 },
            'bildung': { tagfamily: 'ttags', bit: 3 },

            // DTags (domains)
            'workshop': { tagfamily: 'dtags', bit: 0 },
            'game': { tagfamily: 'dtags', bit: 1 },
            'spiel': { tagfamily: 'dtags', bit: 1 },
            'performance': { tagfamily: 'dtags', bit: 2 },
            'discussion': { tagfamily: 'dtags', bit: 3 },
            'diskussion': { tagfamily: 'dtags', bit: 3 }
        }

        Object.entries(keywordMap).forEach(([keyword, { tagfamily, bit }]) => {
            if (lowerText.includes(keyword)) {
                const value = bitsToByteArray([bit])
                const count = (lowerText.match(new RegExp(keyword, 'g')) || []).length

                suggestions.push({
                    tagfamily,
                    bit,
                    value,
                    label: getTagLabel(tagfamily, value),
                    source: {
                        type: 'content',
                        confidence: Math.min(count * 0.3, 0.8), // Cap at 0.8
                        reason: `Found "${keyword}" ${count} time${count > 1 ? 's' : ''}`
                    }
                })
            }
        })

        return suggestions
    }

    // Suggest CTags based on content analysis
    function suggestCtagsFromContent(
        text: string,
        entity: string = 'generic'
    ): CtagsSuggestion[] {
        const suggestions: CtagsSuggestion[] = []
        const lowerText = text.toLowerCase()

        // Age group detection
        const ageKeywords = {
            child: ['kind', 'kinder', 'child', 'children', 'grundschule'],
            teen: ['jugend', 'teen', 'teenager', 'adolescent', 'schüler'],
            adult: ['erwachsen', 'adult', 'university', 'universität']
        }

        if (ageKeywords.child.some(kw => lowerText.includes(kw))) {
            suggestions.push({
                bitGroup: 'age_group',
                value: 1,
                label: ctagsBitGroupOptions.age_group.find(o => o.value === 1)?.label || 'Kind',
                source: {
                    type: 'content',
                    confidence: 0.7,
                    reason: 'Detected child-related keywords'
                }
            })
        }

        if (ageKeywords.teen.some(kw => lowerText.includes(kw))) {
            suggestions.push({
                bitGroup: 'age_group',
                value: 2,
                label: ctagsBitGroupOptions.age_group.find(o => o.value === 2)?.label || 'Jugendliche',
                source: {
                    type: 'content',
                    confidence: 0.7,
                    reason: 'Detected teen-related keywords'
                }
            })
        }

        if (ageKeywords.adult.some(kw => lowerText.includes(kw))) {
            suggestions.push({
                bitGroup: 'age_group',
                value: 3,
                label: ctagsBitGroupOptions.age_group.find(o => o.value === 3)?.label || 'Erwachsene',
                source: {
                    type: 'content',
                    confidence: 0.7,
                    reason: 'Detected adult-related keywords'
                }
            })
        }

        // Subject type detection
        const subjectKeywords = {
            group: ['gruppe', 'group', 'team', 'klasse', 'class'],
            person: ['person', 'individual', 'einzeln'],
            portrait: ['portrait', 'porträt', 'headshot', 'gesicht']
        }

        if (subjectKeywords.group.some(kw => lowerText.includes(kw))) {
            suggestions.push({
                bitGroup: 'subject_type',
                value: 1,
                label: ctagsBitGroupOptions.subject_type.find(o => o.value === 1)?.label || 'Gruppe',
                source: {
                    type: 'content',
                    confidence: 0.6,
                    reason: 'Detected group-related keywords'
                }
            })
        }

        return suggestions
    }

    // Suggest tags from similar entities
    async function suggestFromSimilar(
        entity: string,
        currentTags: {
            ttags_val?: string
            dtags_val?: string
            ctags_val?: string
        },
        limit = 5
    ): Promise<TagSuggestion[]> {
        try {
            // Fetch similar entities based on current tags
            const params = new URLSearchParams()

            if (currentTags.ttags_val) {
                params.set('ttags_any', currentTags.ttags_val)
            }

            if (currentTags.dtags_val) {
                params.set('dtags_any', currentTags.dtags_val)
            }

            params.set('limit', '10')

            const response = await fetch(`/api/${entity}?${params.toString()}`)

            if (!response.ok) {
                throw new Error('Failed to fetch similar entities')
            }

            const similar = await response.json()

            // Count tag frequencies in similar entities
            const ttagCounts: Record<number, number> = {}
            const dtagCounts: Record<number, number> = {}

            similar.forEach((item: any) => {
                if (item.ttags_val) {
                    const bits = byteArrayToBits(item.ttags_val)
                    bits.forEach(bit => {
                        ttagCounts[bit] = (ttagCounts[bit] || 0) + 1
                    })
                }

                if (item.dtags_val) {
                    const bits = byteArrayToBits(item.dtags_val)
                    bits.forEach(bit => {
                        dtagCounts[bit] = (dtagCounts[bit] || 0) + 1
                    })
                }
            })

            // Convert to suggestions
            const suggestions: TagSuggestion[] = []

            // TTags suggestions
            Object.entries(ttagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .forEach(([bitStr, count]) => {
                    const bit = parseInt(bitStr)
                    const value = bitsToByteArray([bit])

                    // Skip if already in current tags
                    if (currentTags.ttags_val && hasBit(currentTags.ttags_val, bit)) {
                        return
                    }

                    suggestions.push({
                        tagfamily: 'ttags',
                        bit,
                        value,
                        label: getTagLabel('ttags', value),
                        source: {
                            type: 'similar',
                            confidence: count / similar.length,
                            reason: `Used by ${count}/${similar.length} similar items`
                        }
                    })
                })

            // DTags suggestions
            Object.entries(dtagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .forEach(([bitStr, count]) => {
                    const bit = parseInt(bitStr)
                    const value = bitsToByteArray([bit])

                    // Skip if already in current tags
                    if (currentTags.dtags_val && hasBit(currentTags.dtags_val, bit)) {
                        return
                    }

                    suggestions.push({
                        tagfamily: 'dtags',
                        bit,
                        value,
                        label: getTagLabel('dtags', value),
                        source: {
                            type: 'similar',
                            confidence: count / similar.length,
                            reason: `Used by ${count}/${similar.length} similar items`
                        }
                    })
                })

            return suggestions

        } catch (error) {
            console.error('Error fetching similar entities:', error)
            return []
        }
    }

    // Combined suggestions with deduplication and sorting
    function getCombinedSuggestions(
        sources: TagSuggestion[][],
        maxSuggestions = 10
    ): TagSuggestion[] {
        const combined: Map<string, TagSuggestion> = new Map()

        sources.flat().forEach(suggestion => {
            const key = `${suggestion.tagfamily}-${suggestion.bit}`

            if (combined.has(key)) {
                // Merge: take highest confidence
                const existing = combined.get(key)!
                if (suggestion.source.confidence > existing.source.confidence) {
                    combined.set(key, suggestion)
                }
            } else {
                combined.set(key, suggestion)
            }
        })

        return Array.from(combined.values())
            .sort((a, b) => b.source.confidence - a.source.confidence)
            .slice(0, maxSuggestions)
    }

    // Initialize
    loadHistory()

    return {
        // History management
        suggestionHistory,
        recordTagUsage,
        getFrequentTags,

        // Suggestion sources
        suggestFromProject,
        suggestFromContent,
        suggestCtagsFromContent,
        suggestFromSimilar,

        // Combined suggestions
        getCombinedSuggestions
    }
}
