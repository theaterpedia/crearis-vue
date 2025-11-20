/**
 * BYTEA Testing Utilities for Sysreg System
 * 
 * Specialized helpers for testing BYTEA bit manipulation operations.
 * Provides assertion helpers and comparison utilities.
 */

import { expect } from 'vitest'
import { parseByteaHex, byteArrayToBits, bitsToByteArray } from '@/composables/useSysregTags'

/**
 * Compare two BYTEA hex strings for equality
 * Normalizes hex format before comparison
 */
export function byteaEqual(a: string, b: string): boolean {
    const normalizeHex = (hex: string): string => {
        return hex.replace(/\\x/g, '').toLowerCase().padStart(2, '0')
    }
    return normalizeHex(a) === normalizeHex(b)
}

/**
 * Assert BYTEA value has specific bit set
 * Throws if bit is not set
 */
export function expectBitSet(bytea: string, bit: number): void {
    const bits = byteArrayToBits(parseByteaHex(bytea))
    expect(bits).toContain(bit)
}

/**
 * Assert BYTEA value does NOT have specific bit set
 * Throws if bit is set
 */
export function expectBitClear(bytea: string, bit: number): void {
    const bits = byteArrayToBits(parseByteaHex(bytea))
    expect(bits).not.toContain(bit)
}

/**
 * Assert multiple bits are set
 */
export function expectBitsSet(bytea: string, bits: number[]): void {
    const setBits = byteArrayToBits(parseByteaHex(bytea))
    bits.forEach(bit => {
        expect(setBits).toContain(bit)
    })
}

/**
 * Assert multiple bits are clear
 */
export function expectBitsClear(bytea: string, bits: number[]): void {
    const setBits = byteArrayToBits(parseByteaHex(bytea))
    bits.forEach(bit => {
        expect(setBits).not.toContain(bit)
    })
}

/**
 * Create BYTEA value from bit array
 */
export function bitsToHex(bits: number[]): string {
    if (bits.length === 0) return '\\x00'

    let value = 0
    bits.forEach(bit => {
        value |= (1 << bit)
    })

    return `\\x${value.toString(16).padStart(2, '0')}`
}

/**
 * Get all bits from BYTEA hex string
 */
export function hexToBits(hex: string): number[] {
    return byteArrayToBits(parseByteaHex(hex))
}

/**
 * Assert exact bit set matches expected
 */
export function expectExactBits(bytea: string, expectedBits: number[]): void {
    const actualBits = hexToBits(bytea).sort((a, b) => a - b)
    const expected = [...expectedBits].sort((a, b) => a - b)
    expect(actualBits).toEqual(expected)
}

/**
 * Get bit count from BYTEA value
 */
export function getBitCount(bytea: string): number {
    return hexToBits(bytea).length
}

/**
 * Assert bit count equals expected
 */
export function expectBitCount(bytea: string, count: number): void {
    expect(getBitCount(bytea)).toBe(count)
}

/**
 * Check if BYTEA represents empty/zero value
 */
export function isEmpty(bytea: string): boolean {
    return byteaEqual(bytea, '\\x00')
}

/**
 * Assert BYTEA is empty (all bits clear)
 */
export function expectEmpty(bytea: string): void {
    expect(isEmpty(bytea)).toBe(true)
}

/**
 * Assert BYTEA is not empty (at least one bit set)
 */
export function expectNotEmpty(bytea: string): void {
    expect(isEmpty(bytea)).toBe(false)
}

/**
 * Get highest set bit position
 */
export function getHighestBit(bytea: string): number | null {
    const bits = hexToBits(bytea)
    if (bits.length === 0) return null
    return Math.max(...bits)
}

/**
 * Get lowest set bit position
 */
export function getLowestBit(bytea: string): number | null {
    const bits = hexToBits(bytea)
    if (bits.length === 0) return null
    return Math.min(...bits)
}

/**
 * Check if two BYTEA values have any common bits
 */
export function hasCommonBits(a: string, b: string): boolean {
    const bitsA = hexToBits(a)
    const bitsB = hexToBits(b)
    return bitsA.some(bit => bitsB.includes(bit))
}

/**
 * Assert two BYTEA values have no common bits
 */
export function expectDisjoint(a: string, b: string): void {
    expect(hasCommonBits(a, b)).toBe(false)
}

/**
 * Assert two BYTEA values have common bits
 */
export function expectOverlap(a: string, b: string): void {
    expect(hasCommonBits(a, b)).toBe(true)
}

/**
 * Combine multiple BYTEA values using OR operation
 */
export function combineOr(...byteaValues: string[]): string {
    const allBits = new Set<number>()
    byteaValues.forEach(bytea => {
        hexToBits(bytea).forEach(bit => allBits.add(bit))
    })
    return bitsToHex([...allBits])
}

/**
 * Get intersection of BYTEA values using AND operation
 */
export function combineAnd(...byteaValues: string[]): string {
    if (byteaValues.length === 0) return '\\x00'
    if (byteaValues.length === 1) return byteaValues[0]

    const bitArrays = byteaValues.map(hexToBits)
    const firstBits = bitArrays[0]

    const commonBits = firstBits.filter(bit =>
        bitArrays.every(bits => bits.includes(bit))
    )

    return bitsToHex(commonBits)
}

/**
 * Pretty print BYTEA value for debugging
 */
export function prettyPrintBytea(bytea: string, label?: string): void {
    const bits = hexToBits(bytea)
    const prefix = label ? `${label}: ` : ''
    console.log(`${prefix}${bytea} → bits [${bits.join(', ')}] (${bits.length} set)`)
}

/**
 * Create human-readable description of BYTEA value
 */
export function describeBytea(bytea: string): string {
    const bits = hexToBits(bytea)
    if (bits.length === 0) return `${bytea} (empty)`
    return `${bytea} (bits: ${bits.join(', ')})`
}

/**
 * Validate BYTEA hex string format
 */
export function isValidByteaHex(value: string): boolean {
    return /^\\x[0-9a-fA-F]+$/.test(value)
}

/**
 * Assert valid BYTEA hex format
 */
export function expectValidByteaHex(value: string): void {
    expect(isValidByteaHex(value)).toBe(true)
}
