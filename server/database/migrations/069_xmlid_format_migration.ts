/**
 * Migration 069: Migrate XMLIDs to Odoo-aligned format
 * 
 * Old formats:
 * - Posts: {domaincode}.{entity}.{slug}  (e.g., theaterpedia.post.my_post)
 * - Events: {domaincode}.{entity}.{slug} (e.g., theaterpedia.event_online.my_event)
 * - Images: {domaincode}.image.{subject}-{identifier} (e.g., tp.image.scene-photo_123)
 * - Partners: {domaincode}.{type}_{id} (e.g., theaterpedia.instructor_1)
 * 
 * New Odoo-aligned format:
 * - {domaincode}.{entity}__{slug}          (simple entity)
 * - {domaincode}.{entity}-{template}__{slug} (entity with template)
 * 
 * Examples:
 * - theaterpedia.post__my_post
 * - theaterpedia.post-workshop__my_recap
 * - theaterpedia.event-conference__summer_2024
 * - theaterpedia.image-scene__photo_123
 * - theaterpedia.partner-instructor__john_doe
 * 
 * Rules:
 * - Domaincode: lowercase, may start with _ (e.g., _demo), no hyphens
 * - Entity: lowercase alphanumeric only (post, event, image, partner)
 * - Template: lowercase alphanumeric only (workshop, conference, scene, avatar)
 * - Hyphen (-): ONLY between entity and template
 * - Double underscore (__): separates entity(-template) from slug
 * - Slug: lowercase, underscores for word separation, no hyphens, no __
 * 
 * @see src/utils/xmlid.ts for utilities
 * @see chat/tasks/2025-12-17-XMLID_UNIFICATION.md for specification
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '069_xmlid_format_migration',
    description: 'Migrate XMLIDs to Odoo-aligned format',

    async up(db: DatabaseAdapter) {
        console.log('[Migration 069] Starting XMLID format migration...')

        // =========================================================================
        // 1. Migrate Posts XMLIDs
        // Old: {domaincode}.post.{slug} or {domaincode}.post_{variant}.{slug}
        // New: {domaincode}.post__{slug} or {domaincode}.post-{template}__{slug}
        // =========================================================================
        console.log('[Migration 069] Migrating posts XMLIDs...')

        // Pattern 1: {domaincode}.post.{slug} → {domaincode}.post__{slug}
        await db.run(`
            UPDATE posts 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1), 
                '.post__', 
                REPLACE(SPLIT_PART(xmlid, '.', 3), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.post\\.[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // Pattern 2: {domaincode}.post_{variant}.{slug} → {domaincode}.post-{variant}__{slug}
        await db.run(`
            UPDATE posts 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.post-',
                REPLACE(SUBSTRING(SPLIT_PART(xmlid, '.', 2) FROM 6), '_', ''),
                '__',
                REPLACE(SPLIT_PART(xmlid, '.', 3), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.post_[a-z]+\\.[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // =========================================================================
        // 2. Migrate Events XMLIDs
        // Old: {domaincode}.event.{slug} or {domaincode}.event_{variant}.{slug}
        // New: {domaincode}.event__{slug} or {domaincode}.event-{template}__{slug}
        // =========================================================================
        console.log('[Migration 069] Migrating events XMLIDs...')

        // Pattern 1: {domaincode}.event.{slug} → {domaincode}.event__{slug}
        await db.run(`
            UPDATE events 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1), 
                '.event__', 
                REPLACE(SPLIT_PART(xmlid, '.', 3), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.event\\.[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // Pattern 2: {domaincode}.event_{variant}.{slug} → {domaincode}.event-{variant}__{slug}
        await db.run(`
            UPDATE events 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.event-',
                REPLACE(SUBSTRING(SPLIT_PART(xmlid, '.', 2) FROM 7), '_', ''),
                '__',
                REPLACE(SPLIT_PART(xmlid, '.', 3), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.event_[a-z]+\\.[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // Also handle event-{variant} format (already hyphen-separated)
        await db.run(`
            UPDATE events 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.',
                SPLIT_PART(xmlid, '.', 2),
                '__',
                REPLACE(SPLIT_PART(xmlid, '.', 3), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.event-[a-z]+\\.[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // =========================================================================
        // 3. Migrate Images XMLIDs
        // Old: {domaincode}.image.{subject}-{identifier} or {domaincode}.image_{subject}.{identifier}
        // New: {domaincode}.image__{slug} or {domaincode}.image-{template}__{slug}
        // =========================================================================
        console.log('[Migration 069] Migrating images XMLIDs...')

        // Pattern 1: {domaincode}.image.{subject}-{identifier} → {domaincode}.image-{subject}__{identifier}
        await db.run(`
            UPDATE images 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.image-',
                SPLIT_PART(SPLIT_PART(xmlid, '.', 3), '-', 1),
                '__',
                REPLACE(SUBSTRING(SPLIT_PART(xmlid, '.', 3) FROM POSITION('-' IN SPLIT_PART(xmlid, '.', 3)) + 1), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.image\\.[a-z]+-[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // Pattern 2: {domaincode}.image_{subject}.{identifier} → {domaincode}.image-{subject}__{identifier}
        await db.run(`
            UPDATE images 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.image-',
                REPLACE(SUBSTRING(SPLIT_PART(xmlid, '.', 2) FROM 7), '_', ''),
                '__',
                REPLACE(SPLIT_PART(xmlid, '.', 3), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.image_[a-z]+\\.[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // Pattern 3: Simple {domaincode}.image.{identifier} → {domaincode}.image__{identifier}
        await db.run(`
            UPDATE images 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.image__',
                REPLACE(SPLIT_PART(xmlid, '.', 3), '-', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.image\\.[a-z0-9_-]+$'
            AND xmlid NOT LIKE '%__%'
            AND xmlid !~ '^[a-z_]+\\.image\\.[a-z]+-'
        `, [])

        // =========================================================================
        // 4. Migrate Partners XMLIDs
        // Old: {domaincode}.{type}_{id} (e.g., theaterpedia.instructor_1)
        // New: {domaincode}.partner-{type}__{slug}
        // =========================================================================
        console.log('[Migration 069] Migrating partners XMLIDs...')

        // instructor type
        await db.run(`
            UPDATE partners 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.partner-instructor__',
                REPLACE(LOWER(COALESCE(name, SPLIT_PART(xmlid, '.', 2))), ' ', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.instructor_[0-9]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // location type
        await db.run(`
            UPDATE partners 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.partner-location__',
                REPLACE(LOWER(COALESCE(name, SPLIT_PART(xmlid, '.', 2))), ' ', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.location_[0-9]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        // sponsor type
        await db.run(`
            UPDATE partners 
            SET xmlid = CONCAT(
                SPLIT_PART(xmlid, '.', 1),
                '.partner-sponsor__',
                REPLACE(LOWER(COALESCE(name, SPLIT_PART(xmlid, '.', 2))), ' ', '_')
            )
            WHERE xmlid ~ '^[a-z_]+\\.sponsor_[0-9]+$'
            AND xmlid NOT LIKE '%__%'
        `, [])

        console.log('[Migration 069] XMLID format migration complete!')
    },

    async down(db: DatabaseAdapter) {
        console.log('[Migration 069] Rolling back XMLID format migration...')
        console.log('[Migration 069] WARNING: Rollback not implemented - data transformation is not reversible')
        console.log('[Migration 069] Please restore from backup if needed')
    }
}

export default migration
