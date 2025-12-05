/**
 * Migration 051: Update sysreg_config entries for new bit layout
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * Sunrise Talk Dec 5, 2025 Changes:
 * - Bits 17-19: to_status (was: create capability)
 * - Bit 29: creator (was: owner)
 * - Roles → Relations naming
 * 
 * This migration:
 * 1. Clears old config entries
 * 2. Seeds new capability entries (read, update, manage)
 * 3. Seeds transition entries (using bits 17-19 for to_status)
 * 
 * Based on 15 rules from posts-permissions.ts:
 * 1. POST_ALLROLE_READ_RELEASED
 * 2. POST_CREATOR_FULL
 * 3. POST_READ_P_OWNER
 * 4. POST_READ_P_MEMBER_DRAFT
 * 5. POST_READ_P_PARTICIPANT_REVIEW
 * 6. POST_READ_P_PARTNER_CONFIRMED
 * 7. POST_READ_DEPTH_BY_PROJECT (computed, not in config)
 * 8. POST_WRITE_OWN
 * 9. POST_WRITE_P_OWNER
 * 10. POST_WRITE_P_MEMBER_EDITOR
 * 11. POST_CREATE_P_MEMBER (project-level, separate handling)
 * 12-15. Transitions (use to_status bits)
 * 
 * Package: E (050-059) - Creator/Relations refactoring
 */

import type { DatabaseAdapter } from '../adapter'

// Updated bit positions (Dec 5, 2025)
const BITS = {
    // Project type (bits 0-2)
    PROJECT_ALL: 0b000,

    // Entity (bits 3-7, 5 bits)
    ENTITY_ALL: 0b00000 << 3,
    ENTITY_PROJECT: 0b00001 << 3,
    ENTITY_USER: 0b00010 << 3,
    ENTITY_PAGE: 0b00011 << 3,
    ENTITY_POST: 0b00100 << 3,
    ENTITY_EVENT: 0b00101 << 3,
    ENTITY_IMAGE: 0b00110 << 3,
    ENTITY_LOCATION: 0b00111 << 3,

    // From-state (bits 8-10)
    STATE_ALL: 0b000 << 8,
    STATE_NEW: 0b001 << 8,
    STATE_DEMO: 0b010 << 8,
    STATE_DRAFT: 0b011 << 8,
    STATE_REVIEW: 0b100 << 8,
    STATE_RELEASED: 0b101 << 8,
    STATE_ARCHIVED: 0b110 << 8,
    STATE_TRASH: 0b111 << 8,

    // Read capability (bits 11-13)
    CAP_READ: 0b001 << 11,
    CAP_READ_PREVIEW: 0b010 << 11,
    CAP_READ_METADATA: 0b011 << 11,

    // Update capability (bits 14-16)
    CAP_UPDATE: 0b001 << 14,
    CAP_UPDATE_COMMENT: 0b010 << 14,
    CAP_UPDATE_APPEND: 0b011 << 14,

    // To-state for transitions (bits 17-19) - REPURPOSED from create
    TO_STATE_NONE: 0b000 << 17,  // Not a transition
    TO_STATE_NEW: 0b001 << 17,
    TO_STATE_DEMO: 0b010 << 17,
    TO_STATE_DRAFT: 0b011 << 17,
    TO_STATE_REVIEW: 0b100 << 17,
    TO_STATE_RELEASED: 0b101 << 17,
    TO_STATE_ARCHIVED: 0b110 << 17,
    TO_STATE_TRASH: 0b111 << 17,

    // Manage capability (bits 20-22)
    CAP_MANAGE: 0b001 << 20,
    CAP_MANAGE_STATUS: 0b010 << 20,
    CAP_MANAGE_CONFIG: 0b011 << 20,
    CAP_MANAGE_DELETE: 0b100 << 20,
    CAP_MANAGE_ARCHIVE: 0b101 << 20,

    // Simple capabilities (bits 23-24)
    CAP_LIST: 1 << 23,
    CAP_SHARE: 1 << 24,

    // Relations (bits 25-29) - renamed from roles
    REL_ANONYM: 1 << 25,
    REL_PARTNER: 1 << 26,
    REL_PARTICIPANT: 1 << 27,
    REL_MEMBER: 1 << 28,
    REL_CREATOR: 1 << 29,  // Renamed from ROLE_OWNER
}

// Helper combinations
const REL_ALL = BITS.REL_ANONYM | BITS.REL_PARTNER | BITS.REL_PARTICIPANT | BITS.REL_MEMBER | BITS.REL_CREATOR
const REL_AUTHENTICATED = BITS.REL_PARTNER | BITS.REL_PARTICIPANT | BITS.REL_MEMBER | BITS.REL_CREATOR
const REL_ACTIVE = BITS.REL_PARTICIPANT | BITS.REL_MEMBER | BITS.REL_CREATOR

interface ConfigEntry {
    value: number
    name: string
    description: string
    taglogic: 'category' | 'subcategory' | 'toggle'
}

export const migration = {
    id: '051_capabilities_matrix_v2',
    description: 'Update capabilities matrix with creator/relations and transition entries',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 051 requires PostgreSQL')
        }

        console.log('Running migration 051: Capabilities Matrix v2...')

        // ===================================================================
        // CHAPTER 1: Clear existing config entries
        // ===================================================================
        console.log('\n📖 Chapter 1: Clear existing config entries')
        await db.exec(`DELETE FROM sysreg_config`)
        console.log('    ✓ Cleared sysreg_config')

        // ===================================================================
        // CHAPTER 2: Seed POST capability entries
        // ===================================================================
        console.log('\n📖 Chapter 2: Seed POST capabilities')

        const postCapabilities: ConfigEntry[] = [
            // Rule 1: POST_ALLROLE_READ_RELEASED
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | REL_ALL,
                name: 'post_released_read_all',
                description: 'Released posts readable by anyone',
                taglogic: 'category'
            },

            // Rule 2: POST_CREATOR_FULL (record creator has full access)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE |
                    BITS.REL_CREATOR,
                name: 'post_creator_manage',
                description: 'Record creator can fully manage their posts',
                taglogic: 'category'
            },

            // Rule 4: POST_READ_P_MEMBER_DRAFT (members read draft+)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_DRAFT |
                    BITS.CAP_READ | BITS.CAP_LIST | BITS.REL_MEMBER,
                name: 'post_draft_read_member',
                description: 'Members can read draft posts',
                taglogic: 'category'
            },

            // Rule 5: POST_READ_P_PARTICIPANT_REVIEW
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_REVIEW |
                    BITS.CAP_READ | BITS.CAP_LIST | BITS.REL_PARTICIPANT,
                name: 'post_review_read_participant',
                description: 'Participants can read posts in review',
                taglogic: 'category'
            },

            // Rule 6: POST_READ_P_PARTNER_CONFIRMED
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | BITS.REL_PARTNER,
                name: 'post_released_read_partner',
                description: 'Partners can read released posts',
                taglogic: 'category'
            },

            // Rule 10: POST_WRITE_P_MEMBER_EDITOR (member edit in draft+)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_DRAFT |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_LIST | BITS.CAP_SHARE |
                    BITS.REL_MEMBER,
                name: 'post_draft_update_member',
                description: 'Members can update draft posts',
                taglogic: 'category'
            },
        ]

        // ===================================================================
        // CHAPTER 3: Seed POST transition entries
        // ===================================================================
        console.log('\n📖 Chapter 3: Seed POST transitions')

        const postTransitions: ConfigEntry[] = [
            // Rule 12a: Creator new→draft (PRIMARY - happy path)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_NEW |
                    BITS.TO_STATE_DRAFT | BITS.CAP_MANAGE_STATUS | BITS.REL_CREATOR,
                name: 'post_transition_new_draft_creator',
                description: 'Creator can advance post from new to draft',
                taglogic: 'category'  // PRIMARY transition
            },

            // Rule 12b: Creator draft→review (PRIMARY - happy path)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_DRAFT |
                    BITS.TO_STATE_REVIEW | BITS.CAP_MANAGE_STATUS | BITS.REL_CREATOR,
                name: 'post_transition_draft_review_creator',
                description: 'Creator can submit post for review',
                taglogic: 'category'  // PRIMARY transition
            },

            // Rules 13-15: P_OWNER transitions (project owner via FK lookup)
            // Note: These need special handling - P_OWNER prefix indicates runtime FK check
            // For now, we grant to member as proxy (project owner has member relation)

            // Rule 13: review→released (PRIMARY - approval)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_REVIEW |
                    BITS.TO_STATE_RELEASED | BITS.CAP_MANAGE_STATUS | BITS.REL_MEMBER,
                name: 'post_transition_review_released_P_owner',
                description: 'Project owner can approve post (release)',
                taglogic: 'category'  // PRIMARY transition
            },

            // Rule 14: review→draft (ALTERNATIVE - reject/send-back)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_REVIEW |
                    BITS.TO_STATE_DRAFT | BITS.CAP_MANAGE_STATUS | BITS.REL_MEMBER,
                name: 'post_alt_transition_review_draft_P_owner',
                description: 'Project owner can send post back to draft',
                taglogic: 'subcategory'  // ALTERNATIVE transition
            },

            // Trash transitions (ALTERNATIVE - destructive action)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_ALL |
                    BITS.TO_STATE_TRASH | BITS.CAP_MANAGE_DELETE | BITS.REL_CREATOR | BITS.REL_MEMBER,
                name: 'post_alt_transition_any_trash',
                description: 'Creator or project owner can trash posts',
                taglogic: 'subcategory'  // ALTERNATIVE transition
            },

            // Restore from trash (PRIMARY - only action available in trash)
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_POST | BITS.STATE_TRASH |
                    BITS.TO_STATE_DRAFT | BITS.CAP_MANAGE_STATUS | BITS.REL_CREATOR | BITS.REL_MEMBER,
                name: 'post_transition_trash_draft',
                description: 'Creator or project owner can restore from trash',
                taglogic: 'category'  // PRIMARY transition
            },
        ]

        // ===================================================================
        // CHAPTER 4: Seed PROJECT capabilities
        // ===================================================================
        console.log('\n📖 Chapter 4: Seed PROJECT capabilities')

        const projectCapabilities: ConfigEntry[] = [
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PROJECT | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | REL_ALL,
                name: 'project_released_read_all',
                description: 'Released projects readable by anyone',
                taglogic: 'category'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PROJECT | BITS.STATE_DRAFT |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_LIST | BITS.CAP_SHARE |
                    BITS.REL_MEMBER,
                name: 'project_draft_update_member',
                description: 'Members can update draft projects',
                taglogic: 'category'
            },
            // Project owner (via FK) has full manage - marked with P_owner in name
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_PROJECT | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE |
                    BITS.REL_MEMBER,
                name: 'project_all_manage_P_owner',
                description: 'Project owner can fully manage project',
                taglogic: 'category'
            },
        ]

        // ===================================================================
        // CHAPTER 5: Seed IMAGE capabilities
        // ===================================================================
        console.log('\n📖 Chapter 5: Seed IMAGE capabilities')

        const imageCapabilities: ConfigEntry[] = [
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_IMAGE | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | BITS.CAP_SHARE | REL_ALL,
                name: 'image_released_read_all',
                description: 'Released images readable and shareable',
                taglogic: 'category'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_IMAGE | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE |
                    BITS.REL_CREATOR,
                name: 'image_creator_manage',
                description: 'Image creator can fully manage their images',
                taglogic: 'category'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_IMAGE | BITS.STATE_DRAFT |
                    BITS.CAP_READ | BITS.CAP_LIST | BITS.REL_MEMBER,
                name: 'image_draft_read_member',
                description: 'Members can see draft images',
                taglogic: 'category'
            },
        ]

        // ===================================================================
        // CHAPTER 6: Seed EVENT capabilities
        // ===================================================================
        console.log('\n📖 Chapter 6: Seed EVENT capabilities')

        const eventCapabilities: ConfigEntry[] = [
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_EVENT | BITS.STATE_RELEASED |
                    BITS.CAP_READ | BITS.CAP_LIST | REL_ALL,
                name: 'event_released_read_all',
                description: 'Released events readable by anyone',
                taglogic: 'category'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_EVENT | BITS.STATE_ALL |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_MANAGE | BITS.CAP_LIST | BITS.CAP_SHARE |
                    BITS.REL_CREATOR,
                name: 'event_creator_manage',
                description: 'Event creator can fully manage their events',
                taglogic: 'category'
            },
            {
                value: BITS.PROJECT_ALL | BITS.ENTITY_EVENT | BITS.STATE_DRAFT |
                    BITS.CAP_READ | BITS.CAP_UPDATE | BITS.CAP_LIST | BITS.REL_MEMBER,
                name: 'event_draft_update_member',
                description: 'Members can update draft events',
                taglogic: 'category'
            },
        ]

        // ===================================================================
        // CHAPTER 7: Insert all entries
        // ===================================================================
        console.log('\n📖 Chapter 7: Insert all entries')

        const allEntries = [
            ...postCapabilities,
            ...postTransitions,
            ...projectCapabilities,
            ...imageCapabilities,
            ...eventCapabilities,
        ]

        for (const entry of allEntries) {
            await db.exec(`
                INSERT INTO sysreg_config (value, name, tagfamily, taglogic, description, is_default)
                VALUES (${entry.value}, '${entry.name}', 'config', '${entry.taglogic}', '${entry.description}', false)
            `)
            console.log(`    ✓ ${entry.name} (${entry.taglogic})`)
        }

        console.log(`\nMigration 051 complete: ${allEntries.length} config entries seeded`)
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 051...')
        await db.exec(`DELETE FROM sysreg_config`)
        console.log('Migration 051 rollback complete: sysreg_config cleared')
    }
}
