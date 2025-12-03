import { db } from './server/database/init'

// Bit layout from Migration 044:
// project(0-2), entity(3-7), state(8-10), caps(11-24), roles(25-29)

// Entity codes
const ENTITIES: Record<number, string> = {
    0: 'post', 1: 'event', 2: 'image', 3: 'project', 4: 'user', 5: 'page', 6: 'location'
}

// Status codes (state bits)
const STATES: Record<number, string> = {
    0: 'new(1)', 1: 'demo(8)', 2: 'draft(64)', 3: 'confirmed(512)', 4: 'released(4096)'
}

// Role bits (25-29)
const ROLES: Record<number, string> = {
    0: 'owner',      // bit 25
    1: 'member',     // bit 26
    2: 'partner',    // bit 27
    3: 'participant', // bit 28
    4: 'anonym'      // bit 29
}

// Capability bits (11-24)
const CAPS: Record<number, string> = {
    0: 'read',       // bit 11
    1: 'create',     // bit 12
    2: 'update',     // bit 13
    3: 'delete',     // bit 14
    4: 'status',     // bit 15
    5: 'share',      // bit 16
    6: 'full'        // bit 17
}

function decodeCapability(value: number) {
    const project = value & 0x7
    const entity = (value >> 3) & 0x1F
    const state = (value >> 8) & 0x7
    const caps = (value >> 11) & 0x3FFF
    const roles = (value >> 25) & 0x1F
    
    // Decode which roles are enabled
    const enabledRoles: string[] = []
    for (let i = 0; i < 5; i++) {
        if (roles & (1 << i)) {
            enabledRoles.push(ROLES[i] || `bit${i}`)
        }
    }
    
    // Decode which capabilities are enabled
    const enabledCaps: string[] = []
    for (let i = 0; i < 7; i++) {
        if (caps & (1 << i)) {
            enabledCaps.push(CAPS[i] || `cap${i}`)
        }
    }
    
    return {
        project,
        entity: ENTITIES[entity] || entity,
        state: STATES[state] || state,
        caps: enabledCaps.join(', '),
        roles: enabledRoles.join(', '),
        raw: value
    }
}

async function check() {
    await new Promise(r => setTimeout(r, 1000))
    
    console.log('=== Capabilities Matrix (posts & projects) ===\n')
    
    const configs = await db.all(`
        SELECT name, description, value 
        FROM sysreg_config 
        WHERE name LIKE 'post%' OR name LIKE 'project%'
        ORDER BY name
    `)
    
    for (const config of configs) {
        const decoded = decodeCapability(config.value)
        console.log(`${config.name}`)
        console.log(`  Description: ${config.description}`)
        console.log(`  Entity: ${decoded.entity}, State: ${decoded.state}`)
        console.log(`  Roles: [${decoded.roles}]`)
        console.log(`  Capabilities: [${decoded.caps}]`)
        console.log('')
    }
    
    process.exit(0)
}
check()
