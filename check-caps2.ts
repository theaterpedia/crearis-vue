import { db } from './server/database/init'

// From Migration 044 - exact bit positions
const BITS = {
    // Project type (bits 0-2)
    PROJECT_ALL: 0b000,
    
    // Entity (bits 3-7)
    ENTITY_ALL: 0b00000 << 3,      // 0
    ENTITY_PROJECT: 0b00001 << 3,  // 8
    ENTITY_USER: 0b00010 << 3,     // 16
    ENTITY_PAGE: 0b00011 << 3,     // 24
    ENTITY_POST: 0b00100 << 3,     // 32
    ENTITY_EVENT: 0b00101 << 3,    // 40
    ENTITY_IMAGE: 0b00110 << 3,    // 48
    
    // State (bits 8-10)
    STATE_ALL: 0b000 << 8,         // 0
    STATE_NEW: 0b001 << 8,         // 256
    STATE_DEMO: 0b010 << 8,        // 512
    STATE_DRAFT: 0b011 << 8,       // 768
    STATE_REVIEW: 0b100 << 8,      // 1024
    STATE_RELEASED: 0b101 << 8,    // 1280
    
    // Capabilities (bits 11-24)
    CAP_READ: 0b001 << 11,         // 2048
    CAP_UPDATE: 0b001 << 14,       // 16384
    CAP_CREATE: 0b001 << 17,       // 131072
    CAP_MANAGE: 0b001 << 20,       // 1048576
    CAP_LIST: 1 << 23,             // 8388608
    CAP_SHARE: 1 << 24,            // 16777216
    
    // Roles (bits 25-29)
    ROLE_ANONYM: 1 << 25,          // 33554432
    ROLE_PARTNER: 1 << 26,         // 67108864
    ROLE_PARTICIPANT: 1 << 27,     // 134217728
    ROLE_MEMBER: 1 << 28,          // 268435456
    ROLE_OWNER: 1 << 29,           // 536870912
}

const ENTITY_NAMES: Record<number, string> = {
    0: 'all', 8: 'project', 16: 'user', 24: 'page', 32: 'post', 40: 'event', 48: 'image', 56: 'location'
}

const STATE_NAMES: Record<number, string> = {
    0: 'all', 256: 'new', 512: 'demo', 768: 'draft', 1024: 'review', 1280: 'released'
}

function decodeCapability(value: number) {
    const project = value & 0b111
    const entity = value & (0b11111 << 3)
    const state = value & (0b111 << 8)
    
    const roles: string[] = []
    if (value & BITS.ROLE_OWNER) roles.push('owner')
    if (value & BITS.ROLE_MEMBER) roles.push('member')
    if (value & BITS.ROLE_PARTICIPANT) roles.push('participant')
    if (value & BITS.ROLE_PARTNER) roles.push('partner')
    if (value & BITS.ROLE_ANONYM) roles.push('anonym')
    
    const caps: string[] = []
    if (value & BITS.CAP_READ) caps.push('read')
    if (value & BITS.CAP_UPDATE) caps.push('update')
    if (value & BITS.CAP_CREATE) caps.push('create')
    if (value & BITS.CAP_MANAGE) caps.push('manage')
    if (value & BITS.CAP_LIST) caps.push('list')
    if (value & BITS.CAP_SHARE) caps.push('share')
    
    return {
        project: project === 0 ? 'all' : project,
        entity: ENTITY_NAMES[entity] || `?${entity}`,
        state: STATE_NAMES[state] || `?${state}`,
        roles: roles.join(', '),
        caps: caps.join(', ')
    }
}

async function check() {
    await new Promise(r => setTimeout(r, 1000))
    
    console.log('=== Capabilities Matrix - Post & Project Rules ===\n')
    
    const configs = await db.all(`
        SELECT name, description, value 
        FROM sysreg_config 
        WHERE name LIKE 'post%' OR name LIKE 'project%'
        ORDER BY name
    `)
    
    for (const config of configs) {
        const d = decodeCapability(config.value)
        console.log(`${config.name}`)
        console.log(`  "${config.description}"`)
        console.log(`  Entity: ${d.entity} | State: ${d.state} | Project: ${d.project}`)
        console.log(`  Roles: [${d.roles}]`)
        console.log(`  Caps:  [${d.caps}]`)
        console.log('')
    }
    
    // Now the key question: What about project status affecting post visibility?
    console.log('=== KEY INSIGHT ===')
    console.log('The capabilities matrix defines rules per ENTITY STATE, not project state.')
    console.log('For project-level visibility, we need to check the PROJECT entity rules.\n')
    
    process.exit(0)
}
check()
