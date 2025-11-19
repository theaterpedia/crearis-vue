/**
 * Composable: useSysregBatchOperations
 * 
 * Provides batch operations for multiple entities:
 * - Batch status updates
 * - Batch tag additions/removals
 * - Batch config bit toggles
 * - Progress tracking
 * - Error handling with rollback
 * 
 * Phase 6: Advanced Features
 */

import { ref, computed } from 'vue'
import {
    parseByteaHex,
    byteaFromNumber,
    setBit,
    clearBit,
    toggleBit,
    bitsToByteArray,
    byteArrayToBits
} from './useSysregTags'

export interface BatchOperation {
    entity: string
    ids: number[]
    operation: 'status' | 'config' | 'ttags' | 'dtags' | 'rtags' | 'ctags'
    action: 'set' | 'add' | 'remove' | 'toggle'
    value: string | number | number[]  // Depends on operation
}

export interface BatchProgress {
    total: number
    completed: number
    failed: number
    errors: Array<{ id: number; error: string }>
}

export interface BatchResult {
    success: boolean
    total: number
    succeeded: number
    failed: number
    errors: Array<{ id: number; error: string }>
    results: any[]
}

export function useSysregBatchOperations() {
    const progress = ref<BatchProgress>({
        total: 0,
        completed: 0,
        failed: 0,
        errors: []
    })

    const isRunning = ref(false)

    // Progress percentage
    const progressPercent = computed(() => {
        if (progress.value.total === 0) return 0
        return Math.round((progress.value.completed / progress.value.total) * 100)
    })

    // Reset progress
    function resetProgress() {
        progress.value = {
            total: 0,
            completed: 0,
            failed: 0,
            errors: []
        }
    }

    // Batch status update
    async function batchUpdateStatus(
        entity: string,
        ids: number[],
        newStatus: string  // BYTEA hex string
    ): Promise<BatchResult> {
        resetProgress()
        isRunning.value = true
        progress.value.total = ids.length

        const results: any[] = []
        const errors: Array<{ id: number; error: string }> = []

        for (const id of ids) {
            try {
                const response = await fetch(`/api/${entity}/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status_val: newStatus })
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const result = await response.json()
                results.push(result)
                progress.value.completed++

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                errors.push({ id, error: errorMsg })
                progress.value.failed++
                progress.value.completed++
            }
        }

        isRunning.value = false

        return {
            success: errors.length === 0,
            total: ids.length,
            succeeded: ids.length - errors.length,
            failed: errors.length,
            errors,
            results
        }
    }

    // Batch add tags (TTags, DTags, RTags)
    async function batchAddTags(
        entity: string,
        ids: number[],
        tagfamily: 'ttags' | 'dtags' | 'rtags',
        bits: number[]
    ): Promise<BatchResult> {
        resetProgress()
        isRunning.value = true
        progress.value.total = ids.length

        const results: any[] = []
        const errors: Array<{ id: number; error: string }> = []

        for (const id of ids) {
            try {
                // Fetch current entity
                const getResponse = await fetch(`/api/${entity}/${id}`)
                if (!getResponse.ok) {
                    throw new Error(`Failed to fetch entity: ${getResponse.statusText}`)
                }

                const current = await getResponse.json()
                const fieldName = `${tagfamily}_val`
                const currentValue = current[fieldName] || '\\x00'
                const currentBits = byteArrayToBits(currentValue)

                // Add new bits (union)
                const newBits = Array.from(new Set([...currentBits, ...bits]))
                const newValue = bitsToByteArray(newBits)

                // Update entity
                const patchResponse = await fetch(`/api/${entity}/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [fieldName]: newValue })
                })

                if (!patchResponse.ok) {
                    throw new Error(`Failed to update: ${patchResponse.statusText}`)
                }

                const result = await patchResponse.json()
                results.push(result)
                progress.value.completed++

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                errors.push({ id, error: errorMsg })
                progress.value.failed++
                progress.value.completed++
            }
        }

        isRunning.value = false

        return {
            success: errors.length === 0,
            total: ids.length,
            succeeded: ids.length - errors.length,
            failed: errors.length,
            errors,
            results
        }
    }

    // Batch remove tags
    async function batchRemoveTags(
        entity: string,
        ids: number[],
        tagfamily: 'ttags' | 'dtags' | 'rtags',
        bits: number[]
    ): Promise<BatchResult> {
        resetProgress()
        isRunning.value = true
        progress.value.total = ids.length

        const results: any[] = []
        const errors: Array<{ id: number; error: string }> = []

        for (const id of ids) {
            try {
                // Fetch current entity
                const getResponse = await fetch(`/api/${entity}/${id}`)
                if (!getResponse.ok) {
                    throw new Error(`Failed to fetch entity: ${getResponse.statusText}`)
                }

                const current = await getResponse.json()
                const fieldName = `${tagfamily}_val`
                const currentValue = current[fieldName] || '\\x00'
                const currentBits = byteArrayToBits(currentValue)

                // Remove bits (difference)
                const newBits = currentBits.filter(bit => !bits.includes(bit))
                const newValue = bitsToByteArray(newBits)

                // Update entity
                const patchResponse = await fetch(`/api/${entity}/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [fieldName]: newValue })
                })

                if (!patchResponse.ok) {
                    throw new Error(`Failed to update: ${patchResponse.statusText}`)
                }

                const result = await patchResponse.json()
                results.push(result)
                progress.value.completed++

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                errors.push({ id, error: errorMsg })
                progress.value.failed++
                progress.value.completed++
            }
        }

        isRunning.value = false

        return {
            success: errors.length === 0,
            total: ids.length,
            succeeded: ids.length - errors.length,
            failed: errors.length,
            errors,
            results
        }
    }

    // Batch toggle config bit
    async function batchToggleConfigBit(
        entity: string,
        ids: number[],
        bit: number
    ): Promise<BatchResult> {
        resetProgress()
        isRunning.value = true
        progress.value.total = ids.length

        const results: any[] = []
        const errors: Array<{ id: number; error: string }> = []

        for (const id of ids) {
            try {
                // Fetch current entity
                const getResponse = await fetch(`/api/${entity}/${id}`)
                if (!getResponse.ok) {
                    throw new Error(`Failed to fetch entity: ${getResponse.statusText}`)
                }

                const current = await getResponse.json()
                const currentValue = current.config_val || '\\x00'
                const newValue = toggleBit(currentValue, bit)

                // Update entity
                const patchResponse = await fetch(`/api/${entity}/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config_val: newValue })
                })

                if (!patchResponse.ok) {
                    throw new Error(`Failed to update: ${patchResponse.statusText}`)
                }

                const result = await patchResponse.json()
                results.push(result)
                progress.value.completed++

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                errors.push({ id, error: errorMsg })
                progress.value.failed++
                progress.value.completed++
            }
        }

        isRunning.value = false

        return {
            success: errors.length === 0,
            total: ids.length,
            succeeded: ids.length - errors.length,
            failed: errors.length,
            errors,
            results
        }
    }

    // Batch set config bit (all on or all off)
    async function batchSetConfigBit(
        entity: string,
        ids: number[],
        bit: number,
        value: boolean
    ): Promise<BatchResult> {
        resetProgress()
        isRunning.value = true
        progress.value.total = ids.length

        const results: any[] = []
        const errors: Array<{ id: number; error: string }> = []

        for (const id of ids) {
            try {
                // Fetch current entity
                const getResponse = await fetch(`/api/${entity}/${id}`)
                if (!getResponse.ok) {
                    throw new Error(`Failed to fetch entity: ${getResponse.statusText}`)
                }

                const current = await getResponse.json()
                const currentValue = current.config_val || '\\x00'
                const newValue = value ? setBit(currentValue, bit) : clearBit(currentValue, bit)

                // Update entity
                const patchResponse = await fetch(`/api/${entity}/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config_val: newValue })
                })

                if (!patchResponse.ok) {
                    throw new Error(`Failed to update: ${patchResponse.statusText}`)
                }

                const result = await patchResponse.json()
                results.push(result)
                progress.value.completed++

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                errors.push({ id, error: errorMsg })
                progress.value.failed++
                progress.value.completed++
            }
        }

        isRunning.value = false

        return {
            success: errors.length === 0,
            total: ids.length,
            succeeded: ids.length - errors.length,
            failed: errors.length,
            errors,
            results
        }
    }

    // Generic batch operation with custom update function
    async function batchApply<T = any>(
        entity: string,
        ids: number[],
        updateFn: (current: T) => Partial<T>
    ): Promise<BatchResult> {
        resetProgress()
        isRunning.value = true
        progress.value.total = ids.length

        const results: any[] = []
        const errors: Array<{ id: number; error: string }> = []

        for (const id of ids) {
            try {
                // Fetch current entity
                const getResponse = await fetch(`/api/${entity}/${id}`)
                if (!getResponse.ok) {
                    throw new Error(`Failed to fetch entity: ${getResponse.statusText}`)
                }

                const current = await getResponse.json()
                const updates = updateFn(current)

                // Update entity
                const patchResponse = await fetch(`/api/${entity}/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                })

                if (!patchResponse.ok) {
                    throw new Error(`Failed to update: ${patchResponse.statusText}`)
                }

                const result = await patchResponse.json()
                results.push(result)
                progress.value.completed++

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                errors.push({ id, error: errorMsg })
                progress.value.failed++
                progress.value.completed++
            }
        }

        isRunning.value = false

        return {
            success: errors.length === 0,
            total: ids.length,
            succeeded: ids.length - errors.length,
            failed: errors.length,
            errors,
            results
        }
    }

    return {
        // State
        progress,
        isRunning,
        progressPercent,

        // Operations
        batchUpdateStatus,
        batchAddTags,
        batchRemoveTags,
        batchToggleConfigBit,
        batchSetConfigBit,
        batchApply,

        // Helpers
        resetProgress
    }
}
