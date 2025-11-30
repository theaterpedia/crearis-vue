/**
 * Versioned Test Infrastructure
 * 
 * Provides version-aware test wrappers for the Projectlogin Workflow sprint.
 * Supports version filtering, deprecated/draft markers, and health reporting.
 * 
 * @example
 * // Basic versioned test
 * v({ version: '0.2' })('handles status transitions', () => { ... })
 * 
 * // Deprecated test (skipped, logged in health report)
 * v({ deprecated: true, reason: 'Replaced by new API' })('old test', () => { ... })
 * 
 * // Draft test (skipped, logged in health report)  
 * v({ draft: true })('future feature', () => { ... })
 * 
 * @see /docs/tasks/2025-11-30-TDD-IMPLEMENTATION-PLAN.md
 */

import { test as baseTest, describe as baseDescribe, vi, afterAll } from 'vitest'

// ============================================================================
// Version Comparison Utilities
// ============================================================================

/**
 * Normalize version string to semver format (e.g., '0.2' -> '0.2.0')
 */
function normalizeVersion(v: string): string {
    const parts = v.split('.').map(p => parseInt(p, 10) || 0)
    while (parts.length < 3) parts.push(0)
    return parts.join('.')
}

/**
 * Compare two version strings
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
    const aParts = normalizeVersion(a).split('.').map(Number)
    const bParts = normalizeVersion(b).split('.').map(Number)
    
    for (let i = 0; i < 3; i++) {
        if (aParts[i] < bParts[i]) return -1
        if (aParts[i] > bParts[i]) return 1
    }
    return 0
}

// ============================================================================
// Environment Configuration
// ============================================================================

/** Maximum version to run tests for (e.g., TEST_MAXV=0.2) */
const MAX_VERSION = process.env.TEST_MAXV || null

/** Minimum version to run tests for (e.g., TEST_MINV=0.3) */
const MIN_VERSION = process.env.TEST_MINV || null

/** Module filter (e.g., TEST_MODULE=status) */
const MODULE_FILTER = process.env.TEST_MODULE || null

// ============================================================================
// Health Report
// ============================================================================

interface HealthReportEntry {
    name: string
    file: string
    reason?: string
    version?: string
}

interface HealthReport {
    deprecated: HealthReportEntry[]
    draft: HealthReportEntry[]
    skippedByVersion: HealthReportEntry[]
    summary: {
        total: number
        deprecated: number
        draft: number
        skippedByVersion: number
    }
}

const healthReport: HealthReport = {
    deprecated: [],
    draft: [],
    skippedByVersion: [],
    summary: {
        total: 0,
        deprecated: 0,
        draft: 0,
        skippedByVersion: 0
    }
}

/**
 * Get the current health report
 */
export function getHealthReport(): HealthReport {
    healthReport.summary = {
        total: healthReport.deprecated.length + healthReport.draft.length + healthReport.skippedByVersion.length,
        deprecated: healthReport.deprecated.length,
        draft: healthReport.draft.length,
        skippedByVersion: healthReport.skippedByVersion.length
    }
    return healthReport
}

/**
 * Write health report to file (call in global teardown or manually)
 */
export async function writeHealthReport(): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')
    const reportPath = path.resolve(process.cwd(), 'test-results/test-health.json')
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(getHealthReport(), null, 2))
    
    // Log summary to console
    const report = getHealthReport()
    if (report.summary.total > 0) {
        console.log('\n📊 Test Health Report:')
        if (report.summary.deprecated > 0) {
            console.log(`   ⚠️  ${report.summary.deprecated} deprecated tests`)
        }
        if (report.summary.draft > 0) {
            console.log(`   📝 ${report.summary.draft} draft tests`)
        }
        if (report.summary.skippedByVersion > 0) {
            console.log(`   ⏭️  ${report.summary.skippedByVersion} skipped by version filter`)
        }
        console.log(`   📁 Full report: test-results/test-health.json\n`)
    }
}

// ============================================================================
// Version Check Logic
// ============================================================================

interface VersionCheckResult {
    run: boolean
    reason?: string
}

/**
 * Check if a test should run based on version filters
 */
function shouldRunVersion(testVersion?: string): VersionCheckResult {
    if (!testVersion) return { run: true }
    
    if (MAX_VERSION) {
        if (compareVersions(testVersion, MAX_VERSION) > 0) {
            return { 
                run: false, 
                reason: `version ${testVersion} > maxv ${MAX_VERSION}` 
            }
        }
    }
    
    if (MIN_VERSION) {
        if (compareVersions(testVersion, MIN_VERSION) < 0) {
            return { 
                run: false, 
                reason: `version ${testVersion} < minv ${MIN_VERSION}` 
            }
        }
    }
    
    return { run: true }
}

/**
 * Get the calling file from stack trace
 */
function getCallerFile(): string {
    const stack = new Error().stack || ''
    const lines = stack.split('\n')
    // Find the first line that's not from this file or vitest internals
    for (const line of lines.slice(2)) {
        if (line.includes('.spec.ts') || line.includes('.test.ts')) {
            const match = line.match(/\(([^)]+)\)/) || line.match(/at\s+([^\s]+)/)
            if (match) return match[1]
        }
    }
    return 'unknown'
}

// ============================================================================
// Versioned Test Options
// ============================================================================

export interface VersionedTestOptions {
    /** Semantic version: '0.2', '0.3', '0.3.1' */
    version?: string
    /** Mark as deprecated (will not run, logged in health report) */
    deprecated?: boolean
    /** Mark as draft (will not run, logged in health report) */
    draft?: boolean
    /** Reason for deprecated/draft status */
    reason?: string
}

// ============================================================================
// Versioned Test Function
// ============================================================================

type TestFunction = () => void | Promise<void>

/**
 * Create a versioned test wrapper
 * 
 * @example
 * v({ version: '0.2' })('test name', () => { ... })
 * v({ deprecated: true, reason: 'old api' })('old test', () => { ... })
 * v({ draft: true })('future test', () => { ... })
 */
export function v(options: VersionedTestOptions) {
    return function(name: string, fn: TestFunction, timeout?: number) {
        const { deprecated, draft, version, reason } = options
        const file = getCallerFile()
        
        // Handle deprecated tests
        if (deprecated) {
            healthReport.deprecated.push({ name, file, reason })
            return baseTest.skip(`[DEPRECATED] ${name}`, fn, timeout)
        }
        
        // Handle draft tests
        if (draft) {
            healthReport.draft.push({ name, file, reason })
            return baseTest.skip(`[DRAFT] ${name}`, fn, timeout)
        }
        
        // Handle version filtering
        const versionCheck = shouldRunVersion(version)
        if (!versionCheck.run) {
            healthReport.skippedByVersion.push({ 
                name, 
                file,
                version: version!, 
                reason: versionCheck.reason 
            })
            return baseTest.skip(`[v${version}] ${name}`, fn, timeout)
        }
        
        // Run the test with version prefix if specified
        const testName = version ? `[v${version}] ${name}` : name
        return baseTest(testName, fn, timeout)
    }
}

/**
 * Versioned describe block
 * 
 * @example
 * vDescribe({ version: '0.3' })('Workflow System', () => {
 *   vtest('creates workflow', () => { ... })
 * })
 */
export function vDescribe(options: VersionedTestOptions) {
    return function(name: string, fn: () => void) {
        const { deprecated, draft, version, reason } = options
        const file = getCallerFile()
        
        // Handle deprecated describe
        if (deprecated) {
            healthReport.deprecated.push({ name: `describe: ${name}`, file, reason })
            return baseDescribe.skip(`[DEPRECATED] ${name}`, fn)
        }
        
        // Handle draft describe
        if (draft) {
            healthReport.draft.push({ name: `describe: ${name}`, file, reason })
            return baseDescribe.skip(`[DRAFT] ${name}`, fn)
        }
        
        // Handle version filtering
        const versionCheck = shouldRunVersion(version)
        if (!versionCheck.run) {
            healthReport.skippedByVersion.push({ 
                name: `describe: ${name}`, 
                file,
                version: version!, 
                reason: versionCheck.reason 
            })
            return baseDescribe.skip(`[v${version}] ${name}`, fn)
        }
        
        // Run the describe with version prefix if specified
        const describeName = version ? `[v${version}] ${name}` : name
        return baseDescribe(describeName, fn)
    }
}

// ============================================================================
// Extended Test with Context
// ============================================================================

interface VersionedTestContext {
    version?: string
    isVersionFiltered: boolean
    maxVersion: string | null
    minVersion: string | null
}

/**
 * Extended test with version context available in test body
 */
export const vtest = baseTest.extend<{ vctx: VersionedTestContext }>({
    vctx: async ({}, use) => {
        await use({
            version: undefined,
            isVersionFiltered: !!(MAX_VERSION || MIN_VERSION),
            maxVersion: MAX_VERSION,
            minVersion: MIN_VERSION
        })
    }
})

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { baseTest as test, baseDescribe as describe }
export { expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
