/**
 * Composable: useSysregAnalytics
 * 
 * Provides analytics and insights for sysreg usage:
 * - Tag usage statistics
 * - Status distribution
 * - Trending tags
 * - Popular filters
 * - Entity type breakdown
 * 
 * Phase 6: Advanced Features
 */

import { ref, computed, onMounted } from 'vue'
import {
    parseByteaHex,
    byteArrayToBits
} from './useSysregTags'
import { useSysregOptions } from './useSysregOptions'

export interface TagUsageStats {
    tagfamily: string
    bit: number
    value: string
    label: string
    count: number
    percentage: number
}

export interface StatusDistribution {
    value: string
    label: string
    count: number
    percentage: number
}

export interface EntityBreakdown {
    entity: string
    total: number
    byStatus: Record<string, number>
    byTag: Record<string, number>
}

export interface TrendingTag {
    tagfamily: string
    bit: number
    value: string
    label: string
    recentUse: number
    growthRate: number  // Percentage increase
}

export function useSysregAnalytics(entity: string = 'images') {
    const { getOptions } = useSysregOptions()

    const loading = ref(false)
    const error = ref<string | null>(null)

    // Analytics data
    const statusDistribution = ref<StatusDistribution[]>([])
    const ttagsUsage = ref<TagUsageStats[]>([])
    const dtagsUsage = ref<TagUsageStats[]>([])
    const rtagsUsage = ref<TagUsageStats[]>([])
    const entityStats = ref<EntityBreakdown | null>(null)
    const trendingTags = ref<TrendingTag[]>([])

    // Total entity count
    const totalCount = computed(() => {
        return statusDistribution.value.reduce((sum, s) => sum + s.count, 0)
    })

    // Most used status
    const mostUsedStatus = computed(() => {
        if (statusDistribution.value.length === 0) return null
        return statusDistribution.value.reduce((prev, current) =>
            current.count > prev.count ? current : prev
        )
    })

    // Most used tags
    const mostUsedTtag = computed(() => {
        if (ttagsUsage.value.length === 0) return null
        return ttagsUsage.value[0]
    })

    const mostUsedDtag = computed(() => {
        if (dtagsUsage.value.length === 0) return null
        return dtagsUsage.value[0]
    })

    // Fetch analytics data
    async function fetchAnalytics(forceRefresh = false) {
        if (loading.value && !forceRefresh) return

        loading.value = true
        error.value = null

        try {
            // Fetch all entities
            const response = await fetch(`/api/${entity}?expand=all`)

            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.statusText}`)
            }

            const data = await response.json()
            const entities = Array.isArray(data) ? data : data[entity] || []

            // Calculate status distribution
            const statusCounts: Record<string, number> = {}
            entities.forEach((e: any) => {
                const status = e.status || '\x00'
                statusCounts[status] = (statusCounts[status] || 0) + 1
            })

            statusDistribution.value = Object.entries(statusCounts)
                .map(([value, count]) => {
                    const option = getOptionByValue('status', value)
                    return {
                        value,
                        label: option?.label || 'Unknown',
                        count,
                        percentage: (count / entities.length) * 100
                    }
                })
                .sort((a, b) => b.count - a.count)

            // Calculate TTags usage
            const ttagCounts: Record<number, number> = {}
            entities.forEach((e: any) => {
                if (e.ttags) {
                    const bits = byteArrayToBits(e.ttags)
                    bits.forEach(bit => {
                        ttagCounts[bit] = (ttagCounts[bit] || 0) + 1
                    })
                }
            })

            const ttagOptions = getOptions('ttags').value
            ttagsUsage.value = Object.entries(ttagCounts)
                .map(([bitStr, count]) => {
                    const bit = parseInt(bitStr)
                    const value = `\\x${(1 << bit).toString(16).padStart(2, '0')}`
                    const option = ttagOptions.find(opt => opt.bit === bit)
                    return {
                        tagfamily: 'ttags',
                        bit,
                        value,
                        label: option?.label || `Bit ${bit}`,
                        count,
                        percentage: (count / entities.length) * 100
                    }
                })
                .sort((a, b) => b.count - a.count)

            // Calculate DTags usage
            const dtagCounts: Record<number, number> = {}
            entities.forEach((e: any) => {
                if (e.dtags) {
                    const bits = byteArrayToBits(e.dtags)
                    bits.forEach(bit => {
                        dtagCounts[bit] = (dtagCounts[bit] || 0) + 1
                    })
                }
            })

            const dtagOptions = getOptions('dtags').value
            dtagsUsage.value = Object.entries(dtagCounts)
                .map(([bitStr, count]) => {
                    const bit = parseInt(bitStr)
                    const value = `\\x${(1 << bit).toString(16).padStart(2, '0')}`
                    const option = dtagOptions.find(opt => opt.bit === bit)
                    return {
                        tagfamily: 'dtags',
                        bit,
                        value,
                        label: option?.label || `Bit ${bit}`,
                        count,
                        percentage: (count / entities.length) * 100
                    }
                })
                .sort((a, b) => b.count - a.count)

            // Calculate RTags usage
            const rtagCounts: Record<number, number> = {}
            entities.forEach((e: any) => {
                if (e.rtags) {
                    const bits = byteArrayToBits(e.rtags)
                    bits.forEach(bit => {
                        rtagCounts[bit] = (rtagCounts[bit] || 0) + 1
                    })
                }
            })

            const rtagOptions = getOptions('rtags').value
            rtagsUsage.value = Object.entries(rtagCounts)
                .map(([bitStr, count]) => {
                    const bit = parseInt(bitStr)
                    const value = `\\x${(1 << bit).toString(16).padStart(2, '0')}`
                    const option = rtagOptions.find(opt => opt.bit === bit)
                    return {
                        tagfamily: 'rtags',
                        bit,
                        value,
                        label: option?.label || `Bit ${bit}`,
                        count,
                        percentage: (count / entities.length) * 100
                    }
                })
                .sort((a, b) => b.count - a.count)

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch analytics'
            console.error('Error fetching analytics:', err)
        } finally {
            loading.value = false
        }
    }

    // Calculate trending tags (compare last 30 days vs previous 30 days)
    async function calculateTrending() {
        try {
            const now = new Date()
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

            // Fetch recent entities
            const recentResponse = await fetch(
                `/api/${entity}?created_after=${last30Days.toISOString()}`
            )
            const recentData = await recentResponse.json()
            const recentEntities = Array.isArray(recentData) ? recentData : recentData[entity] || []

            // Fetch previous entities
            const previousResponse = await fetch(
                `/api/${entity}?created_after=${previous30Days.toISOString()}&created_before=${last30Days.toISOString()}`
            )
            const previousData = await previousResponse.json()
            const previousEntities = Array.isArray(previousData) ? previousData : previousData[entity] || []

            // Count tag usage in both periods
            const recentCounts: Record<string, number> = {}
            const previousCounts: Record<string, number> = {}

            recentEntities.forEach((e: any) => {
                if (e.ttags) {
                    const bits = byteArrayToBits(e.ttags)
                    bits.forEach(bit => {
                        const key = `ttags-${bit}`
                        recentCounts[key] = (recentCounts[key] || 0) + 1
                    })
                }
            })

            previousEntities.forEach((e: any) => {
                if (e.ttags) {
                    const bits = byteArrayToBits(e.ttags)
                    bits.forEach(bit => {
                        const key = `ttags-${bit}`
                        previousCounts[key] = (previousCounts[key] || 0) + 1
                    })
                }
            })

            // Calculate growth rates
            const trending: TrendingTag[] = []
            const ttagOpts = getOptions('ttags').value
            const dtagOpts = getOptions('dtags').value
            const rtagOpts = getOptions('rtags').value

            Object.keys(recentCounts).forEach(key => {
                const [tagfamily, bitStr] = key.split('-')
                const bit = parseInt(bitStr)
                const recentUse = recentCounts[key]
                const previousUse = previousCounts[key] || 0

                const growthRate = previousUse === 0
                    ? 100
                    : ((recentUse - previousUse) / previousUse) * 100

                if (growthRate > 0) {
                    const value = `\\x${(1 << bit).toString(16).padStart(2, '0')}`
                    let option
                    if (tagfamily === 'ttags') option = ttagOpts.find(opt => opt.bit === bit)
                    else if (tagfamily === 'dtags') option = dtagOpts.find(opt => opt.bit === bit)
                    else if (tagfamily === 'rtags') option = rtagOpts.find(opt => opt.bit === bit)

                    trending.push({
                        tagfamily,
                        bit,
                        value,
                        label: option?.label || `Bit ${bit}`,
                        recentUse,
                        growthRate
                    })
                }
            })

            trendingTags.value = trending
                .sort((a, b) => b.growthRate - a.growthRate)
                .slice(0, 10)

        } catch (err) {
            console.error('Error calculating trending tags:', err)
        }
    }

    // Export analytics data as CSV
    function exportToCsv(type: 'status' | 'ttags' | 'dtags' | 'rtags'): string {
        let data: any[] = []
        let headers = ['Label', 'Value', 'Count', 'Percentage']

        switch (type) {
            case 'status':
                data = statusDistribution.value
                break
            case 'ttags':
                data = ttagsUsage.value
                headers = ['Label', 'Value', 'Bit', 'Count', 'Percentage']
                break
            case 'dtags':
                data = dtagsUsage.value
                headers = ['Label', 'Value', 'Bit', 'Count', 'Percentage']
                break
            case 'rtags':
                data = rtagsUsage.value
                headers = ['Label', 'Value', 'Bit', 'Count', 'Percentage']
                break
        }

        const csv = [
            headers.join(','),
            ...data.map(row => {
                if (type === 'status') {
                    return [row.label, row.value, row.count, row.percentage.toFixed(2)].join(',')
                } else {
                    return [row.label, row.value, row.bit, row.count, row.percentage.toFixed(2)].join(',')
                }
            })
        ].join('\n')

        return csv
    }

    // Download CSV
    function downloadCsv(type: 'status' | 'ttags' | 'dtags' | 'rtags') {
        const csv = exportToCsv(type)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${entity}-${type}-analytics.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Auto-fetch on mount
    onMounted(() => {
        fetchAnalytics()
    })

    return {
        // State
        loading,
        error,
        statusDistribution,
        ttagsUsage,
        dtagsUsage,
        rtagsUsage,
        entityStats,
        trendingTags,

        // Computed
        totalCount,
        mostUsedStatus,
        mostUsedTtag,
        mostUsedDtag,

        // Actions
        fetchAnalytics,
        calculateTrending,
        exportToCsv,
        downloadCsv
    }
}
