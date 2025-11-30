# Test-Driven Development Implementation Plan

**Created:** November 30, 2025  
**Purpose:** Temporary planning document for implementing versioned test infrastructure  
**Status:** PLANNING - To be integrated into sprint docs after review

---

## 1. Architecture Overview

### Test File Organization
```
tests/
├── unit/
│   ├── common.*.spec.ts          # Tests without specific group
│   ├── status.common.spec.ts     # Status tests without specific target
│   ├── status.events.spec.ts     # Status tests for events entity
│   ├── status.projects.spec.ts   # Status tests for projects entity
│   └── workflow.events.spec.ts   # Workflow tests for events
├── helpers/
│   └── versioned-test.ts         # Custom test.extend() with version support
├── setup/
│   ├── global-setup.ts           # Existing
│   └── test-setup.ts             # Existing
└── reports/
    └── test-health.json          # Generated health report
```

### Naming Convention
- Pattern: `{group}.{target}.spec.ts`
- Group examples: `status`, `workflow`, `kanban`, `auth`, `common`
- Target examples: `events`, `posts`, `projects`, `users`, `images`, `common`
- `common` used when no specific group/target applies

---

## 2. Versioned Test Implementation

### Core Module: `tests/helpers/versioned-test.ts`

```typescript
import { test as baseTest, describe as baseDescribe, vi } from 'vitest'
import { compare } from 'semver'

// Version filtering from environment
const MAX_VERSION = process.env.TEST_MAXV || null
const MIN_VERSION = process.env.TEST_MINV || null
const MODULE_FILTER = process.env.TEST_MODULE || null

// Health report collector
const healthReport: {
  deprecated: Array<{ name: string; file: string; reason?: string }>
  draft: Array<{ name: string; file: string; reason?: string }>
  skippedByVersion: Array<{ name: string; version: string; reason: string }>
} = {
  deprecated: [],
  draft: [],
  skippedByVersion: []
}

// Normalize version string (e.g., '0.2' -> '0.2.0')
function normalizeVersion(v: string): string {
  const parts = v.split('.')
  while (parts.length < 3) parts.push('0')
  return parts.join('.')
}

// Check if version passes filter
function shouldRunVersion(testVersion?: string): { run: boolean; reason?: string } {
  if (!testVersion) return { run: true }
  
  const normalized = normalizeVersion(testVersion)
  
  if (MAX_VERSION) {
    const maxNorm = normalizeVersion(MAX_VERSION)
    if (compare(normalized, maxNorm) > 0) {
      return { run: false, reason: `version ${testVersion} > maxv ${MAX_VERSION}` }
    }
  }
  
  if (MIN_VERSION) {
    const minNorm = normalizeVersion(MIN_VERSION)
    if (compare(normalized, minNorm) < 0) {
      return { run: false, reason: `version ${testVersion} < minv ${MIN_VERSION}` }
    }
  }
  
  return { run: true }
}

// Extended test interface
interface VersionedTestOptions {
  version?: string        // Semantic version: '0.2', '0.3.1'
  deprecated?: boolean    // Mark as deprecated (will not run)
  draft?: boolean         // Mark as draft (will not run)
  reason?: string         // Reason for deprecated/draft
}

// Create versioned test
export const vtest = baseTest.extend<{
  testMeta: VersionedTestOptions
}>({
  testMeta: async ({ task }, use) => {
    await use({})
  }
})

// Versioned test wrapper
export function v(options: VersionedTestOptions) {
  return function(name: string, fn: () => void | Promise<void>, timeout?: number) {
    const { deprecated, draft, version, reason } = options
    const file = new Error().stack?.split('\n')[2] || 'unknown'
    
    // Handle deprecated tests
    if (deprecated) {
      healthReport.deprecated.push({ name, file, reason })
      return vtest.skip(`[DEPRECATED] ${name}`, fn, timeout)
    }
    
    // Handle draft tests
    if (draft) {
      healthReport.draft.push({ name, file, reason })
      return vtest.skip(`[DRAFT] ${name}`, fn, timeout)
    }
    
    // Handle version filtering
    const versionCheck = shouldRunVersion(version)
    if (!versionCheck.run) {
      healthReport.skippedByVersion.push({ 
        name, 
        version: version!, 
        reason: versionCheck.reason! 
      })
      return vtest.skip(`[v${version}] ${name}`, fn, timeout)
    }
    
    // Run the test with version prefix if specified
    const testName = version ? `[v${version}] ${name}` : name
    return vtest(testName, fn, timeout)
  }
}

// Export health report for afterAll hook
export function getHealthReport() {
  return healthReport
}

// Write health report (call in globalTeardown or afterAll)
export async function writeHealthReport() {
  const fs = await import('fs/promises')
  const path = await import('path')
  const reportPath = path.resolve(process.cwd(), 'test-results/test-health.json')
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, JSON.stringify(healthReport, null, 2))
}
```

---

## 3. Usage Examples

### Basic Versioned Test
```typescript
import { describe, expect } from 'vitest'
import { v, vtest } from '../helpers/versioned-test'

describe('Status - Events', () => {
  // Regular test (runs always)
  vtest('loads status options', () => {
    expect(true).toBe(true)
  })
  
  // Versioned test (runs only up to v0.2)
  v({ version: '0.2' })('handles status transitions', () => {
    // ...
  })
  
  // Versioned test (runs only from v0.3+)
  v({ version: '0.3' })('supports workflow states', () => {
    // ...
  })
  
  // Deprecated test
  v({ deprecated: true, reason: 'Replaced by new API' })('old status check', () => {
    // Will be skipped, logged in health report
  })
  
  // Draft test
  v({ draft: true, reason: 'Waiting for DB migration' })('future feature', () => {
    // Will be skipped, logged in health report
  })
})
```

### Describe with Version
```typescript
import { v, vtest } from '../helpers/versioned-test'

// All tests in this describe are v0.3
v({ version: '0.3' }).describe('Workflow System', () => {
  vtest('creates workflow instance', () => {})
  vtest('transitions between states', () => {})
})
```

---

## 4. CLI Commands

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:v": "vitest run",
    "test:v02": "TEST_MAXV=0.2 vitest run",
    "test:v03": "TEST_MAXV=0.3 vitest run",
    "test:v04": "TEST_MAXV=0.4 vitest run",
    "test:from02": "TEST_MINV=0.2 vitest run",
    "test:from03": "TEST_MINV=0.3 vitest run",
    "test:module": "TEST_MODULE=$npm_config_module vitest run",
    "test:status": "vitest run --grep 'status\\.'",
    "test:workflow": "vitest run --grep 'workflow\\.'",
    "test:health": "vitest run && cat test-results/test-health.json"
  }
}
```

### CLI Usage
```bash
# Run all tests up to v0.2
pnpm test:v02

# Run tests from v0.3 onwards
pnpm test:from03

# Run status module tests
pnpm test -- tests/unit/status.*.spec.ts

# Run status module tests up to v0.2
TEST_MAXV=0.2 pnpm test -- tests/unit/status.*.spec.ts

# Run specific module with version
TEST_MAXV=0.2 TEST_MODULE=status pnpm test:v

# View health report after run
pnpm test:health
```

---

## 5. Implementation Steps

### Phase 1: Core Infrastructure (Nov 30)
1. [ ] Create `tests/helpers/versioned-test.ts`
2. [ ] Add `semver` package (or implement simple compare)
3. [ ] Update `vitest.config.ts` for report output
4. [ ] Add new test scripts to `package.json`

### Phase 2: Migration of Existing Tests (Dec 1)
1. [ ] Rename existing test files to new convention
2. [ ] Update imports in test files
3. [ ] Add version annotations to relevant tests

### Phase 2b: Integration Tests Reintegration (Dec 4)
1. [ ] Review existing tests/integration tests from mid-November
2. [ ] Update integration tests to use versioned-test infrastructure
3. [ ] Ensure integration tests align with v0.3 milestone

### Phase 3: Health Reporting (Dec 9)
1. [ ] Implement health report generation
2. [ ] Create summary script for deprecated/draft analysis
3. [ ] Document in sprint deferred tasks

---

## 6. Dependencies

### Required Packages
No external dependencies needed! Version comparison implemented inline.

### Files Modified
- `package.json` - Added new test scripts
- `tests/helpers/versioned-test.ts` - Core infrastructure (NEW)
- `tests/unit/common.versioned-test-demo.spec.ts` - Demo/verification (NEW)

---

## 7. Integration with Sprint Docs

This plan will be referenced in:
- `2025-12-01-SPRINT-Projectlogin_Workflow.md` - Conventions section
- `2025-11-30.md` - Today's tasks (implementation)
- `2025-12-10-DEFERRED-from-Projectlogin_Workflow.md` - Health report analysis task
