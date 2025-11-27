/**
 * BYTEA Testing Utilities for Sysreg System
 * 
 * Specialized helpers for testing BYTEA bit manipulation operations.
 * Provides assertion helpers and comparison utilities.
 */

import { expect } from 'vitest'
import { parseByteaHex, byteArrayToBits, bitsToByteArray } from '@/composables/useSysregTags'

/**
 * Compare two integer values for equality (backward compatible with hex strings)
 * Normalizes format before comparison
 */
export function byteaEqual(a: number | string, b: number | string): boolean {
    const normalize = (val: number | string): number => {
        if (typeof val === 'number') return val
        // Parse hex string if provided (backward compatibility)
        if (typeof val === 'string' && val.startsWith('\\x')) {
            return parseInt(val.replace('\\x', ''), 16)
        }
        return parseInt(val) || 0
    }
    return normalize(a) === normalize(b)
}

/**
 * Assert integer value has specific bit set
 * Throws if bit is not set
 */
export function expectBitSet(bytea: number | string, bit: number): void {
    const value = typeof bytea === 'number' ? bytea : parseInt(bytea.replace('\\x', ''), 16)
    const bits = byteArrayToBits(value)
    expect(bits).toContain(bit)
}

/**
 * Assert integer value does NOT have specific bit set
 * Throws if bit is set
 */
export function expectBitClear(bytea: number | string, bit: number): void {
    const value = typeof bytea === 'number' ? bytea : parseInt(bytea.replace('\\x', ''), 16)
    const bits = byteArrayToBits(value)
    expect(bits).not.toContain(bit)
}

/**
 * Assert multiple bits are set
 */
export function expectBitsSet(bytea: number | string, bits: number[]): void {
    const value = typeof bytea === 'number' ? bytea : parseInt(bytea.replace('\\x', ''), 16)
    const setBits = byteArrayToBits(parseByteaHex(`\\x${value.toString(16).padStart(2, '0')}`))
    bits.forEach(bit => {
        expect(setBits).toContain(bit)
    })
}

/**
 * Assert multiple bits are clear
 */
export function expectBitsClear(bytea: number | string, bits: number[]): void {
    const value = typeof bytea === 'number' ? bytea : parseInt(bytea.replace('\\x', ''), 16)
    const setBits = byteArrayToBits(parseByteaHex(`\\x${value.toString(16).padStart(2, '0')}`))
    bits.forEach(bit => {
        expect(setBits).not.toContain(bit)
    })
}

/**
 * Create integer value from bit array
 */
export function bitsToHex(bits: number[]): number {
    if (bits.length === 0) return 0

    let value = 0
    bits.forEach(bit => {
        value |= (1 << bit)
    })

    return value
}

/**
 * Get all bits from integer value (or hex string for backward compatibility)
 */
export function hexToBits(hex: number | string): number[] {
    const value = typeof hex === 'number' ? hex : parseInt(hex.replace('\\x', ''), 16)
    return byteArrayToBits(value)
}

/**
 * Assert exact bit set matches expected
 */
export function expectExactBits(bytea: number | string, expectedBits: number[]): void {
    const actualBits = hexToBits(bytea).sort((a, b) => a - b)
    const expected = [...expectedBits].sort((a, b) => a - b)
    expect(actualBits).toEqual(expected)
}

/**
 * Get bit count from integer value
 */
export function getBitCount(bytea: number | string): number {
    return hexToBits(bytea).length
}

/**
 * Assert bit count equals expected
 */
export function expectBitCount(bytea: number | string, count: number): void {
    expect(getBitCount(bytea)).toBe(count)
}

/**
 * Check if value represents empty/zero value
 */
export function isEmpty(bytea: number | string): boolean {
    return byteaEqual(bytea, 0)
}

/**
 * Assert value is empty (all bits clear)
 */
export function expectEmpty(bytea: number | string): void {
    expect(isEmpty(bytea)).toBe(true)
}

/**
 * Assert value is not empty (at least one bit set)
 */
export function expectNotEmpty(bytea: number | string): void {
    expect(isEmpty(bytea)).toBe(false)
}

/**
 * Get highest set bit position
 */
export function getHighestBit(bytea: number | string): number | null {
    const bits = hexToBits(bytea)
    if (bits.length === 0) return null
    return Math.max(...bits)
}

/**
 * Get lowest set bit position
 */
export function getLowestBit(bytea: number | string): number | null {
    const bits = hexToBits(bytea)
    if (bits.length === 0) return null
    return Math.min(...bits)
}

/**
 * Check if two values have any common bits
 */
export function hasCommonBits(a: number | string, b: number | string): boolean {
    const bitsA = hexToBits(a)
    const bitsB = hexToBits(b)
    return bitsA.some(bit => bitsB.includes(bit))
}

/**
 * Assert two values have no common bits
 */
export function expectDisjoint(a: number | string, b: number | string): void {
    expect(hasCommonBits(a, b)).toBe(false)
}

/**
 * Assert two values have common bits
 */
export function expectOverlap(a: number | string, b: number | string): void {
    expect(hasCommonBits(a, b)).toBe(true)
}

/**
 * Combine multiple values using OR operation
 */
export function combineOr(...byteaValues: (number | string)[]): number {
    const allBits = new Set<number>()
    byteaValues.forEach(bytea => {
        hexToBits(bytea).forEach(bit => allBits.add(bit))
    })
    return bitsToHex([...allBits])
}

/**
 * Get intersection of values using AND operation
 */
export function combineAnd(...byteaValues: (number | string)[]): number {
    if (byteaValues.length === 0) return 0
    if (byteaValues.length === 1) {
        return typeof byteaValues[0] === 'number' ? byteaValues[0] : parseInt(byteaValues[0].replace('\\x', ''), 16)
    }

    const bitArrays = byteaValues.map(hexToBits)
    const firstBits = bitArrays[0]

    const commonBits = firstBits.filter(bit =>
        bitArrays.every(bits => bits.includes(bit))
    )

    return bitsToHex(commonBits)
}

/**
 * Pretty print integer value for debugging
 */
export function prettyPrintBytea(bytea: number | string, label?: string): void {
    const value = typeof bytea === 'number' ? bytea : parseInt(bytea.replace('\\x', ''), 16)
    const bits = hexToBits(bytea)
    const prefix = label ? `${label}: ` : ''
    console.log(`${prefix}${value} (0x${value.toString(16)}) → bits [${bits.join(', ')}] (${bits.length} set)`)
}

/**
 * Create human-readable description of integer value
 */
export function describeBytea(bytea: number | string): string {
    const value = typeof bytea === 'number' ? bytea : parseInt(bytea.replace('\\x', ''), 16)
    const bits = hexToBits(bytea)
    if (bits.length === 0) return `${value} (empty)`
    return `${value} (0x${value.toString(16)}) (bits: ${bits.join(', ')})`
}

/**
 * Validate value format (integer or hex string)
 */
export function isValidByteaHex(value: number | string): boolean {
    if (typeof value === 'number') return value >= 0 && value <= 255
    return /^\\x[0-9a-fA-F]+$/.test(value)
}

/**
 * Assert valid value format
 */
export function expectValidByteaHex(value: number | string): void {
    expect(isValidByteaHex(value)).toBe(true)
}
