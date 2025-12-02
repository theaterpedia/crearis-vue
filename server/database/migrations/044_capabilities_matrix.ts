/**
 * Migration 044: Capabilities Matrix for Auth System
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Clears old config entries and seeds the new capabilities matrix entries
 * for the v0.2-v0.4 auth system.
 * 
 * Bit Layout (31 bits total):
 * - Bits 0-2: Project type (default/special + type)
 * - Bits 3-7: Entity (5 bits = 32 entity types)
 * - Bits 8-10: Record state
 * - Bits 11-13: Read capability
 * - Bits 14-16: Update capability
 * - Bits 17-19: Create capability
 * - Bits 20-22: Manage capability
 * - Bits 23-24: Simple capabilities (list, share)
 * - Bits 25-29: Roles (anonym, partner, participant, member, owner)
 * - Bit 30: Reserved
 * - Bit 31: Admin (sign bit, v0.5)
 * 
 * Package: D (040-049) - Auth system refactoring
 */

import type { DatabaseAdapter } from '../adapter'

// Bit positions
const BITS = {
    // Project type (bits 0-2)
    PROJECT_ALL: 0b000,
    PROJECT_CORE: 0b001,
    PROJECT_DEV: 0b010,
    PROJECT_TP: 0b011,
    PROJECT_TOPIC: 0b100,
    PROJECT_PROJECT: 0b101,
    PROJECT_REGIO: 0b110,

    // Entity (bits 3-7, 5 bits = 32 values)
    ENTITY_ALL: 0b00000 << 3,
    ENTITY_PROJECT: 0b00001 << 3,
    ENTITY_USER: 0b00010 << 3,
    ENTITY_PAGE: 0b00011 << 3,
    ENTITY_POST: 0b00100 << 3,
    ENTITY_EVENT: 0b00101 << 3,
    ENTITY_IMAGE: 0b00110 << 3,
    ENTITY_LOCATION: 0b00111 << 3,

    // State (bits 8-10)
    STATE_ALL: 0b000 << 8,
    STATE_NEW: 0b001 << 8,
    STATE_DEMO: 0b010 << 8,
    STATE_DRAFT: 0b011 << 8,
    STATE_REVIEW: 0b100 << 8,
    STATE_RELEASED: 0b101 << 8,
    STATE_ARCHIVED: 0b110 << 8,
    STATE_TRASH: 0b111 << 8,

    // Capabilities (bits 11-22)
    // Read (bits 11-13)
    CAP_READ: 0b001 << 11,
    CAP_READ_PREVIEW: 0b010 << 11,
    CAP_READ_METADATA: 0b011 << 11,

    // Update (bits 14-16)
    CAP_UPDATE: 0b001 << 14,
    CAP_UPDATE_COMMENT: 0b010 << 14,
    CAP_UPDATE_APPEND: 0b011 << 14,
    CAP_UPDATE_REPLACE: 0b100 << 14,
    CAP_UPDATE_SHIFT: 0b101 << 14,

    // Create (bits 17-19)
    CAP_CREATE: 0b001 << 17,
    CAP_CREATE_DRAFT: 0b010 << 17,
    CAP_CREATE_TEMPLATE: 0b011 << 17,

    // Manage (bits 20-22)
    CAP_MANAGE: 0b001 << 20,
    CAP_MANAGE_STATUS: 0b010 << 20,
    CAP_MANAGE_CONFIG: 0b011 << 20,
    CAP_MANAGE_DELETE: 0b100 << 20,
    CAP_MANAGE_ARCHIVE: 0b101 << 20,

    // Simple capabilities (bits 23-24)
    CAP_LIST: 1 << 23,
    CAP_SHARE: 1 << 24,

    // Roles (bits 25-29)
    ROLE_ANONYM: 1 << 25,
    ROLE_PARTNER: 1 << 26,
    ROLE_PARTICIPANT: 1 << 27,
    ROLE_MEMBER: 1 << 28,
    ROLE_OWNER: 1 << 29,  // Record owner
}

// Helper to combine role bits
const ROLE_ALL = BITS.ROLE_ANONYM | BITS.ROLE_PARTNER | BITS.ROLE_PARTICIPANT | BITS.ROLE_MEMBER | BITS.ROLE_OWNER
const ROLE_AUTHENTICATED = BITS.ROLE_PARTNER | BITS.ROLE_PARTICIPANT | BITS.ROLE_MEMBER | BITS.ROLE_OWNER
const ROLE_ACTIVE = BITS.ROLE_PARTICIPANT | BITS.ROLE_MEMBER | BITS.ROLE_OWNER

interface ConfigEntry {
    value: number
    name: string
    description: string
}

export const migration = {
    id: '044_capabilities_matrix',
    description: 'Seed capabilities matrix entries for v0.2 auth system',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 044 requires PostgreSQL')
        }

        console.log('Running migration 044: Capabilities Matrix...')

        // ===================================================================
        // CHAPTER 1: Clear existing config entries
        // ===================================================================
        console.log('\n📖 Chapter 1: Clear existing config entries')

        await db.exec(`DELETE FROM sysreg_config`)
        console.log('    ✓ Cleared sysreg_config')

        // ===================================================================
        // CHAPTER 2: Seed core capabilities matrix
        // ===================================================================
        console.log('\n📖 Chapter 2: Seed core capabilities matrix')

        const entries: ConfigEntry[] = [
            // ---------------------------------------------------------------
            // POSTS - released state readable by everyone
            // ---------------------------------------------------------------
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | ROLE_ALL,
                name: 'post_released_read_all',
                description: 'Released posts readable by anyone'
            },
            // POSTS - draft state updatable by authenticated users
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_DRAFT |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_LIST | BITS.CAP_SHARE | ROLE_ACTIVE,
                name: 'post_draft_update_active',
                description: 'Draft posts updatable by active roles'
            },
            // POSTS - new state (create) by authenticated
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_NEW |
                    BITS.CAP_CREATE | BITS.CAP_LIST | ROLE_AUTHENTICATED,
                name: 'post_create_auth',
                description: 'Authenticated users can create posts'
            },
            // POSTS - owner can manage (all states)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE | BITS.ROLE_OWNER,
                name: 'post_owner_manage',
                description: 'Record owner can fully manage their posts'
            },

            // ---------------------------------------------------------------
            // EVENTS - similar pattern to posts
            // ---------------------------------------------------------------
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_EVENT | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | ROLE_ALL,
                name: 'event_released_read_all',
                description: 'Released events readable by anyone'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_EVENT | BITS.STATE_DRAFT |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_LIST | BITS.CAP_SHARE | ROLE_ACTIVE,
                name: 'event_draft_update_active',
                description: 'Draft events updatable by active roles'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_EVENT | BITS.STATE_NEW |
                    BITS.CAP_CREATE | BITS.CAP_LIST | ROLE_AUTHENTICATED,
                name: 'event_create_auth',
                description: 'Authenticated users can create events'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_EVENT | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE | BITS.ROLE_OWNER,
                name: 'event_owner_manage',
                description: 'Record owner can fully manage their events'
            },

            // ---------------------------------------------------------------
            // IMAGES - more permissive read, restricted write
            // ---------------------------------------------------------------
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_IMAGE | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | BITS.CAP_SHARE | ROLE_ALL,
                name: 'image_released_read_all',
                description: 'Released images readable and shareable by anyone'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_IMAGE | BITS.STATE_NEW |
                    BITS.CAP_CREATE | BITS.CAP_LIST | ROLE_ACTIVE,
                name: 'image_create_active',
                description: 'Active roles can upload images'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_IMAGE | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE | BITS.ROLE_OWNER,
                name: 'image_owner_manage',
                description: 'Record owner can fully manage their images'
            },

            // ---------------------------------------------------------------
            // PROJECTS - members can manage project settings
            // ---------------------------------------------------------------
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PROJECT | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | ROLE_ALL,
                name: 'project_released_read_all',
                description: 'Released projects readable by anyone'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PROJECT | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_LIST | BITS.CAP_SHARE | BITS.ROLE_MEMBER,
                name: 'project_member_update',
                description: 'Members can update project settings'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PROJECT | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE | BITS.ROLE_OWNER,
                name: 'project_owner_manage',
                description: 'Project owner can fully manage project'
            },

            // ---------------------------------------------------------------
            // USERS - self-management
            // ---------------------------------------------------------------
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_USER | BITS.STATE_RELEASED |
                    BITS.CAP_READ_METADATA | BITS.CAP_LIST | ROLE_AUTHENTICATED,
                name: 'user_list_auth',
                description: 'Authenticated users can see user list'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_USER | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_LIST | BITS.ROLE_OWNER,
                name: 'user_self_update',
                description: 'Users can update their own profile'
            },

            // ---------------------------------------------------------------
            // PAGES - mostly public, managed by members
            // ---------------------------------------------------------------
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PAGE | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | ROLE_ALL,
                name: 'page_released_read_all',
                description: 'Released pages readable by anyone'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PAGE | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_CREATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE | BITS.ROLE_MEMBER,
                name: 'page_member_full',
                description: 'Members have full page management'
            },

            // ---------------------------------------------------------------
            // LOCATIONS - mostly public, managed by members
            // ---------------------------------------------------------------
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_LOCATION | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | ROLE_ALL,
                name: 'location_released_read_all',
                description: 'Released locations readable by anyone'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_LOCATION | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_CREATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE | BITS.ROLE_MEMBER,
                name: 'location_member_full',
                description: 'Members have full location management'
            },
        ]

        let insertCount = 0
        for (const entry of entries) {
            try {
                await db.exec(`
                    INSERT INTO sysreg_config (value, name, description, tagfamily, taglogic, is_default)
                    VALUES (${entry.value}, '${entry.name}', '${entry.description}', 'config', 'toggle', false)
                `)
                insertCount++
            } catch (error) {
                console.warn(`    ⚠️  Failed to insert config entry: ${entry.name}`)
                console.warn(`        Error: ${error}`)
            }
        }

        console.log(`    ✓ Seeded ${insertCount}/${entries.length} capabilities matrix entries`)

        // ===================================================================
        // CHAPTER 3: Summary
        // ===================================================================
        console.log('\n📊 Migration Summary:')
        console.log(`    • Seeded ${insertCount} capabilities matrix entries`)
        console.log('    • Bit layout: project(0-2), entity(3-7), state(8-10), caps(11-24), roles(25-29)')
        console.log('    • Entity bits expanded to 5 (32 entity types)')
        console.log('    • No capability inheritance - explicit flags only')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 044 rollback requires PostgreSQL')
        }

        console.log('Rolling back migration 044: Capabilities Matrix...')

        // Clear the new entries (restore would need the old seed migration)
        await db.exec(`DELETE FROM sysreg_config`)
        console.log('    ✓ Cleared sysreg_config (run migration 026 to restore old entries)')
    }
}
