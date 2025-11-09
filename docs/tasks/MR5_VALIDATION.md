# MR5: Validation & Data Integrity

**Status**: 🔴 Not Started  
**Estimated Time**: 2-3 hours  
**Prerequisites**: [MR4: Import System & Data Packages](./MR4_IMPORT_SYSTEM.md)  
**Next Step**: [MRT: Testing & Integration](./MRT_TESTING.md)

---

## 🎯 Objective

Implement comprehensive data validation suite (datH_validation) with ~40 tests covering table existence, record counts, foreign key integrity, xmlid uniqueness, and data consistency.

---

## 📋 Implementation

### datH_validation Test Suite

**File**: `server/database/data-packages/datH_validation.ts`

```typescript
/**
 * datH_validation: Validation Tests
 * 
 * Comprehensive test suite (~40 tests) to verify:
 * - Table existence
 * - Record counts
 * - Foreign key integrity
 * - xmlid uniqueness
 * - Data consistency
 * - Schema constraints
 */

import type { DatabaseAdapter } from '../adapter'
import { db } from '../db-new'

interface TestResult {
  name: string
  passed: boolean
  message: string
  expected?: any
  actual?: any
}

const tests: TestResult[] = []

async function test(
  name: string,
  fn: () => Promise<boolean>,
  message: string
) {
  try {
    const passed = await fn()
    tests.push({ name, passed, message })
    
    if (passed) {
      console.log(`  ✓ ${name}`)
    } else {
      console.log(`  ✗ ${name}: ${message}`)
    }
  } catch (error: any) {
    tests.push({ name, passed: false, message: error.message })
    console.log(`  ✗ ${name}: ${error.message}`)
  }
}

async function runTests() {
  console.log('\n🧪 Running validation tests...\n')
  
  // ===== SECTION 1: Table Existence (5 tests) =====
  console.log('📋 Section 1: Table Existence')
  
  await test('events table exists', async () => {
    const result = await db.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'events'
      ) as exists
    `, [])
    return (result as any).exists
  }, 'events table not found')
  
  await test('posts table exists', async () => {
    const result = await db.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'posts'
      ) as exists
    `, [])
    return (result as any).exists
  }, 'posts table not found')
  
  await test('users table exists', async () => {
    const result = await db.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as exists
    `, [])
    return (result as any).exists
  }, 'users table not found')
  
  await test('projects table exists', async () => {
    const result = await db.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      ) as exists
    `, [])
    return (result as any).exists
  }, 'projects table not found')
  
  await test('status table exists', async () => {
    const result = await db.get(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'status'
      ) as exists
    `, [])
    return (result as any).exists
  }, 'status table not found')
  
  // ===== SECTION 2: Record Counts (10 tests) =====
  console.log('\n📊 Section 2: Record Counts')
  
  await test('events has records', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM events`, [])
    return (result as any).count > 0
  }, 'No events found')
  
  await test('users has records', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM users`, [])
    return (result as any).count > 0
  }, 'No users found')
  
  await test('projects has records', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM projects`, [])
    return (result as any).count > 0
  }, 'No projects found')
  
  await test('status has records', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM status`, [])
    return (result as any).count > 0
  }, 'No status records found')
  
  await test('tags has records', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM tags`, [])
    return (result as any).count > 0
  }, 'No tags found')
  
  await test('no setup dummy in events', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count FROM events WHERE xmlid = 'setup'
    `, [])
    return (result as any).count === 0
  }, 'Setup dummy records still exist (late-seeding not complete)')
  
  await test('no null xmlids in events', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count FROM events WHERE xmlid IS NULL
    `, [])
    return (result as any).count === 0
  }, 'Null xmlid values found')
  
  await test('no null xmlids in posts', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count FROM posts WHERE xmlid IS NULL
    `, [])
    return (result as any).count === 0
  }, 'Null xmlid values found')
  
  await test('crearis_config exists', async () => {
    const result = await db.get(`SELECT COUNT(*) as count FROM crearis_config`, [])
    return (result as any).count === 1
  }, 'crearis_config not initialized')
  
  await test('migrations_run is populated', async () => {
    const result = await db.get(`
      SELECT array_length(migrations_run, 1) as length FROM crearis_config
    `, [])
    return (result as any).length > 0
  }, 'No migrations recorded')
  
  // ===== SECTION 3: Foreign Key Integrity (10 tests) =====
  console.log('\n🔗 Section 3: Foreign Key Integrity')
  
  await test('events.status_id references valid status', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE status_id IS NOT NULL
        AND status_id NOT IN (SELECT id FROM status)
    `, [])
    return (result as any).count === 0
  }, 'Invalid status_id references found')
  
  await test('posts.event_xmlid references valid events', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE event_xmlid IS NOT NULL
        AND event_xmlid NOT IN (SELECT xmlid FROM events)
        AND event_xmlid != 'setup'
    `, [])
    return (result as any).count === 0
  }, 'Invalid event_xmlid references found')
  
  await test('participants.event_xmlid references valid events', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM participants
      WHERE event_xmlid IS NOT NULL
        AND event_xmlid NOT IN (SELECT xmlid FROM events)
        AND event_xmlid != 'setup'
    `, [])
    return (result as any).count === 0
  }, 'Invalid event_xmlid references found')
  
  await test('events.project_id references valid projects', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE project_id IS NOT NULL
        AND project_id NOT IN (SELECT id FROM projects)
    `, [])
    return (result as any).count === 0
  }, 'Invalid project_id references found')
  
  await test('events.user_id references valid users', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT id FROM users)
    `, [])
    return (result as any).count === 0
  }, 'Invalid user_id references found')
  
  await test('pages.project_id references valid projects', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE project_id IS NOT NULL
        AND project_id NOT IN (SELECT id FROM projects)
    `, [])
    return (result as any).count === 0
  }, 'Invalid project_id references found')
  
  await test('project_members.user_id references valid users', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM project_members
      WHERE user_id IS NOT NULL
        AND user_id NOT IN (SELECT id FROM users)
    `, [])
    return (result as any).count === 0
  }, 'Invalid user_id references found')
  
  await test('project_members.project_id references valid projects', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM project_members
      WHERE project_id IS NOT NULL
        AND project_id NOT IN (SELECT id FROM projects)
    `, [])
    return (result as any).count === 0
  }, 'Invalid project_id references found')
  
  await test('posts.status_id references valid status', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE status_id IS NOT NULL
        AND status_id NOT IN (SELECT id FROM status)
    `, [])
    return (result as any).count === 0
  }, 'Invalid status_id references found')
  
  await test('images.status_id references valid status', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM images
      WHERE status_id IS NOT NULL
        AND status_id NOT IN (SELECT id FROM status)
    `, [])
    return (result as any).count === 0
  }, 'Invalid status_id references found')
  
  // ===== SECTION 4: xmlid Uniqueness (5 tests) =====
  console.log('\n🔑 Section 4: xmlid Uniqueness')
  
  await test('events.xmlid is unique', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM (
        SELECT xmlid
        FROM events
        GROUP BY xmlid
        HAVING COUNT(*) > 1
      ) duplicates
    `, [])
    return (result as any).count === 0
  }, 'Duplicate xmlid values found in events')
  
  await test('posts.xmlid is unique', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM (
        SELECT xmlid
        FROM posts
        GROUP BY xmlid
        HAVING COUNT(*) > 1
      ) duplicates
    `, [])
    return (result as any).count === 0
  }, 'Duplicate xmlid values found in posts')
  
  await test('participants.xmlid is unique', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM (
        SELECT xmlid
        FROM participants
        GROUP BY xmlid
        HAVING COUNT(*) > 1
      ) duplicates
    `, [])
    return (result as any).count === 0
  }, 'Duplicate xmlid values found in participants')
  
  await test('instructors.xmlid is unique', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM (
        SELECT xmlid
        FROM instructors
        GROUP BY xmlid
        HAVING COUNT(*) > 1
      ) duplicates
    `, [])
    return (result as any).count === 0
  }, 'Duplicate xmlid values found in instructors')
  
  await test('locations.xmlid is unique', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM (
        SELECT xmlid
        FROM locations
        GROUP BY xmlid
        HAVING COUNT(*) > 1
      ) duplicates
    `, [])
    return (result as any).count === 0
  }, 'Duplicate xmlid values found in locations')
  
  // ===== SECTION 5: Data Consistency (10 tests) =====
  console.log('\n✅ Section 5: Data Consistency')
  
  await test('all users have valid email format', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM users
      WHERE sysmail !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
        AND sysmail IS NOT NULL
    `, [])
    return (result as any).count === 0
  }, 'Invalid email formats found')
  
  await test('all users have non-empty name', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM users
      WHERE name IS NULL OR TRIM(name) = ''
    `, [])
    return (result as any).count === 0
  }, 'Users with empty names found')
  
  await test('all projects have non-empty name', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM projects
      WHERE name IS NULL OR TRIM(name) = ''
    `, [])
    return (result as any).count === 0
  }, 'Projects with empty names found')
  
  await test('all events have non-empty name', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE name IS NULL OR TRIM(name) = ''
    `, [])
    return (result as any).count === 0
  }, 'Events with empty names found')
  
  await test('all status records have valid table reference', async () => {
    const validTables = ['events', 'posts', 'participants', 'instructors', 'locations', 'images', 'users', 'projects']
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM status
      WHERE "table" NOT IN (${validTables.map((_, i) => `$${i + 1}`).join(',')})
    `, validTables)
    return (result as any).count === 0
  }, 'Invalid table references in status')
  
  await test('created_at timestamps are valid', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE created_at > NOW() + INTERVAL '1 day'
    `, [])
    return (result as any).count === 0
  }, 'Future created_at timestamps found')
  
  await test('updated_at >= created_at', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM events
      WHERE updated_at < created_at
    `, [])
    return (result as any).count === 0
  }, 'updated_at before created_at found')
  
  await test('no orphaned pages', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM pages
      WHERE project_id NOT IN (SELECT id FROM projects)
    `, [])
    return (result as any).count === 0
  }, 'Orphaned pages found')
  
  await test('no orphaned project_members', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM project_members
      WHERE project_id NOT IN (SELECT id FROM projects)
        OR user_id NOT IN (SELECT id FROM users)
    `, [])
    return (result as any).count === 0
  }, 'Orphaned project_members found')
  
  await test('images have valid cimg format', async () => {
    const result = await db.get(`
      SELECT COUNT(*) as count
      FROM images
      WHERE cimg !~ '^[a-z0-9_-]+$'
    `, [])
    return (result as any).count === 0
  }, 'Invalid cimg formats found')
  
  // ===== Summary =====
  const passed = tests.filter(t => t.passed).length
  const failed = tests.filter(t => !t.passed).length
  
  console.log('\n' + '═'.repeat(50))
  console.log(`Tests: ${tests.length} total, ${passed} passed, ${failed} failed`)
  console.log('═'.repeat(50))
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:')
    tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ✗ ${t.name}: ${t.message}`)
    })
    
    throw new Error(`${failed} validation tests failed`)
  }
  
  return tests
}

async function main() {
  console.log('\n✅ datH_validation: Validation Tests')
  
  const testResults = await runTests()
  
  console.log('\n✅ All validation tests passed')
  
  // Optionally save results
  const fs = require('fs')
  const path = require('path')
  const resultsPath = path.join(process.cwd(), 'test-results', 'validation.json')
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true })
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2))
  console.log(`\n📄 Results saved to ${resultsPath}`)
}

main().catch(error => {
  console.error('\n❌ Validation failed:', error)
  process.exit(1)
})
```

---

## 🎯 Success Criteria

- [ ] 40+ validation tests implemented
- [ ] All sections covered (existence, counts, FKs, uniqueness, consistency)
- [ ] Tests pass on clean import
- [ ] Failed tests show clear error messages
- [ ] Results saved to test-results/validation.json
- [ ] Integrated into data-sync.sh workflow

---

## 🔗 Related Files

- [Master Plan](./2025-11-09_MIGRATION_REFACTOR_PLAN.md)
- [Previous: MR4 Import System](./MR4_IMPORT_SYSTEM.md)
- [Next: MRT Testing](./MRT_TESTING.md)

---

**Last Updated**: November 9, 2025  
**Status**: Ready for implementation
