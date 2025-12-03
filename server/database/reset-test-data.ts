/**
 * Reset Test Data for Development
 * 
 * Resets the opus1, opus2, opus3 test projects and their entities to a known state
 * for reproducible testing of capabilities and workflows.
 * 
 * Test Projects:
 * - opus1 (id=9): type=topic, owner=Hans Opus (id=8)
 * - opus2 (id=17): type=project, owner=Rosa Königer (id=18)
 * - opus3 (id=5): type=regio, owner=Kathrin Jung (id=9)
 * 
 * Test Users for opus1:
 * - Hans Opus (id=8, hans.opus@theaterpedia.org) - owner
 * - Nina Opus (id=17, nina.opus@theaterpedia.org) - member (configrole=8)
 * - Rosa Opus (id=7, rosa.opus@theaterpedia.org) - participant (configrole=4)
 * - Marc Opus (id=103, marc.opus@theaterpedia.org) - partner (configrole=2)
 * 
 * Run: npx tsx server/database/reset-test-data.ts
 * Options:
 *   --passwords  Also reset test user passwords (requires env vars)
 *   --status=<value>  Set opus1 project status (new|demo|draft|confirmed|released)
 */

import { db } from './init'
import bcrypt from 'bcryptjs'

// Status values from Migration 040
const STATUS = {
  new: 1,
  demo: 8,
  draft: 64,
  confirmed: 512,
  released: 4096
} as const

// Configrole values
const CONFIGROLE = {
  owner: 0,     // owner is tracked via owner_id, not configrole
  member: 8,
  participant: 4,
  partner: 2
} as const

// Test project definitions
const TEST_PROJECTS = [
  {
    id: 9,
    domaincode: 'opus1',
    type: 'topic',
    owner_id: 8,
    defaultStatus: STATUS.new,
    heading: '**Opus Testprojekt** Theaterpädagogik und Demokratie'
  },
  {
    id: 17,
    domaincode: 'opus2',
    type: 'project',
    owner_id: 18,
    defaultStatus: STATUS.released,
    heading: '**Opus 2: Utopia** Theater der Unterdrückten Augsburg'
  },
  {
    id: 5,
    domaincode: 'opus3',
    type: 'regio',
    owner_id: 9,
    defaultStatus: STATUS.draft,
    heading: '**Opus Augsburg**'
  }
]

// Test user definitions for opus1
const TEST_USERS = [
  {
    id: 8,
    username: 'Hans Opus',
    sysmail: 'hans.opus@theaterpedia.org',
    envKey: 'TEST_USER_HANS_PASSWORD',
    project_id: 9,
    configrole: null,  // owner - determined by owner_id
    role: 'owner'
  },
  {
    id: 17,
    username: 'Nina Opus',
    sysmail: 'nina.opus@theaterpedia.org',
    envKey: 'TEST_USER_NINA_PASSWORD',
    project_id: 9,
    configrole: CONFIGROLE.member,
    role: 'member'
  },
  {
    id: 7,
    username: 'Rosa Opus',
    sysmail: 'rosa.opus@theaterpedia.org',
    envKey: 'TEST_USER_ROSA_PASSWORD',
    project_id: 9,
    configrole: CONFIGROLE.participant,
    role: 'participant'
  },
  {
    id: 103,
    username: 'Marc Opus',
    sysmail: 'marc.opus@theaterpedia.org',
    envKey: 'TEST_USER_MARC_PASSWORD',
    project_id: 9,
    configrole: CONFIGROLE.partner,
    role: 'partner'
  }
]

// Parse command line arguments
const args = process.argv.slice(2)
const resetPasswords = args.includes('--passwords')
const statusArg = args.find(a => a.startsWith('--status='))
const requestedStatus = statusArg ? statusArg.split('=')[1] : null

async function resetTestData() {
  console.log('🔄 Resetting test data for opus1, opus2, opus3...\n')

  // 1. Reset project statuses
  console.log('📦 Resetting project statuses...')
  for (const project of TEST_PROJECTS) {
    let targetStatus = project.defaultStatus
    
    // Special handling for opus1 if status flag provided
    if (project.domaincode === 'opus1' && requestedStatus) {
      if (requestedStatus in STATUS) {
        targetStatus = STATUS[requestedStatus as keyof typeof STATUS]
        console.log(`   opus1: using requested status '${requestedStatus}' (${targetStatus})`)
      } else {
        console.log(`   ⚠️  Unknown status '${requestedStatus}', using default`)
      }
    }

    await db.run(
      `UPDATE projects SET status = ? WHERE id = ?`,
      [targetStatus, project.id]
    )
    const statusName = Object.entries(STATUS).find(([_, v]) => v === targetStatus)?.[0] || String(targetStatus)
    console.log(`   ✅ ${project.domaincode}: status → ${statusName} (${targetStatus})`)
  }

  // 2. Verify/reset project_members for opus1
  console.log('\n👥 Verifying project members for opus1...')
  for (const user of TEST_USERS) {
    if (user.configrole === null) {
      // Owner - verify owner_id on project
      const project = await db.get(
        `SELECT owner_id FROM projects WHERE id = ?`,
        [user.project_id]
      ) as { owner_id: number } | undefined
      
      if (project?.owner_id === user.id) {
        console.log(`   ✅ ${user.username}: owner (via owner_id)`)
      } else {
        console.log(`   ⚠️  ${user.username}: expected owner_id=${user.id}, found ${project?.owner_id}`)
      }
      continue
    }

    // Check project_members entry
    const member = await db.get(
      `SELECT configrole FROM project_members WHERE project_id = ? AND user_id = ?`,
      [user.project_id, user.id]
    ) as { configrole: number } | undefined

    if (!member) {
      // Insert missing member
      await db.run(
        `INSERT INTO project_members (project_id, user_id, configrole, role) VALUES (?, ?, ?, ?)`,
        [user.project_id, user.id, user.configrole, user.role]
      )
      console.log(`   ➕ ${user.username}: added as ${user.role}`)
    } else if (member.configrole !== user.configrole) {
      // Update incorrect configrole
      await db.run(
        `UPDATE project_members SET configrole = ?, role = ? WHERE project_id = ? AND user_id = ?`,
        [user.configrole, user.role, user.project_id, user.id]
      )
      console.log(`   🔄 ${user.username}: updated to ${user.role}`)
    } else {
      console.log(`   ✅ ${user.username}: ${user.role} (configrole=${user.configrole})`)
    }
  }

  // 3. Reset passwords if requested
  if (resetPasswords) {
    console.log('\n🔑 Resetting test user passwords...')
    for (const user of TEST_USERS) {
      const password = process.env[user.envKey]
      if (!password) {
        console.log(`   ⚠️  ${user.username}: ${user.envKey} not set`)
        continue
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      await db.run(
        `UPDATE users SET password = ? WHERE id = ?`,
        [hashedPassword, user.id]
      )
      console.log(`   ✅ ${user.username}: password updated`)
    }
  }

  // 4. Verification summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(60))

  console.log('\n📦 Projects:')
  const projects = await db.all(
    `SELECT id, domaincode, type, status, owner_id, heading 
     FROM projects 
     WHERE domaincode IN ('opus1', 'opus2', 'opus3')
     ORDER BY domaincode`,
    []
  ) as Array<{ id: number; domaincode: string; type: string; status: number; owner_id: number; heading: string }>

  for (const p of projects) {
    const statusName = Object.entries(STATUS).find(([_, v]) => v === p.status)?.[0] || String(p.status)
    const owner = await db.get(`SELECT username FROM users WHERE id = ?`, [p.owner_id]) as { username: string } | undefined
    console.log(`   ${p.domaincode}: type=${p.type}, status=${statusName} (${p.status}), owner=${owner?.username || 'unknown'}`)
  }

  console.log('\n👥 opus1 Members:')
  const members = await db.all(
    `SELECT pm.user_id, pm.configrole, u.username, u.sysmail
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = 9
     ORDER BY pm.configrole DESC`,
    []
  ) as Array<{ user_id: number; configrole: number; username: string; sysmail: string }>

  // Add owner
  const opus1 = projects.find(p => p.domaincode === 'opus1')
  if (opus1) {
    const owner = await db.get(`SELECT username, sysmail FROM users WHERE id = ?`, [opus1.owner_id]) as { username: string; sysmail: string } | undefined
    if (owner) {
      console.log(`   👑 ${owner.username} (${owner.sysmail}): owner [user_id=${opus1.owner_id}]`)
    }
  }

  for (const m of members) {
    const roleLabel = m.configrole === 8 ? 'member' : m.configrole === 4 ? 'participant' : m.configrole === 2 ? 'partner' : `configrole=${m.configrole}`
    console.log(`   👤 ${m.username} (${m.sysmail}): ${roleLabel} [user_id=${m.user_id}]`)
  }

  console.log('\n✅ Test data reset complete!')
  console.log('\nUsage tips:')
  console.log('  npx tsx server/database/reset-test-data.ts                 # Reset to defaults')
  console.log('  npx tsx server/database/reset-test-data.ts --status=draft  # Set opus1 to draft')
  console.log('  npx tsx server/database/reset-test-data.ts --passwords     # Also reset passwords')
  
  process.exit(0)
}

resetTestData().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
