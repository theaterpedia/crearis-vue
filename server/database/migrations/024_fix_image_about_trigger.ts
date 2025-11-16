/**
 * Migration 024: Fix image about field trigger
 * 
 * Updates the update_image_computed_fields trigger to use author.info (user name)
 * instead of author.account_id (user ID) when constructing the about field.
 * 
 * Before: (c) VgawcLLZ9g4 via unsplash
 * After: (c) mostafa meraji via unsplash
 * 
 * Note: Adapters should provide pre-formatted about fields, but this serves
 * as a fallback when about is NULL or empty.
 */

import { db } from '../init'

export async function up() {
    console.log('Running migration 024: Fix image about field trigger')

    try {
        // Update the trigger function to use author.info instead of author.account_id
        await db.exec(`
            CREATE OR REPLACE FUNCTION update_image_computed_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute about field only if not already set
                -- (Allow adapters to provide pre-formatted about field)
                IF NEW.about IS NULL OR NEW.about = '' THEN
                    IF (NEW.author).info IS NOT NULL AND (NEW.author).info != '' THEN
                        -- Use author.info (user's name) if available
                        NEW.about := '(c) ' || (NEW.author).info || ' via ' || (NEW.author).adapter::text;
                    ELSIF (NEW.author).account_id IS NOT NULL THEN
                        -- Fallback to account_id if info not available
                        NEW.about := '(c) ' || (NEW.author).account_id || ' via ' || (NEW.author).adapter::text;
                    ELSIF NEW.owner_id IS NOT NULL THEN
                        NEW.about := '(c) owner_id:' || NEW.owner_id::text;
                    ELSE
                        NEW.about := NULL;
                    END IF;
                END IF;
                
                -- Compute use_player
                NEW.use_player := NEW.publisher IS NOT NULL AND 
                                 ((NEW.publisher).adapter = 'vimeo' OR (NEW.publisher).adapter = 'youtube');
                
                -- Compute is_public, is_private, is_internal from bits 4+5 of ctags
                NEW.is_public := (get_byte(NEW.ctags, 0) & 48) = 16;
                NEW.is_private := (get_byte(NEW.ctags, 0) & 48) = 32;
                NEW.is_internal := (get_byte(NEW.ctags, 0) & 48) = 48;
                
                -- Compute is_deprecated, has_issues from bits 6+7 of ctags
                NEW.is_deprecated := (get_byte(NEW.ctags, 0) & 192) = 64;
                NEW.has_issues := (get_byte(NEW.ctags, 0) & 192) IN (128, 192);
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('  ✓ Updated trigger function to use author.info for about field')

        // Update existing images that have wrong about field format
        await db.exec(`
            UPDATE images
            SET about = '(c) ' || (author).info || ' via ' || (author).adapter::text
            WHERE (author).info IS NOT NULL 
              AND (author).info != ''
              AND about LIKE '(c) % via %'
              AND about NOT LIKE '%|%'  -- Don't update properly formatted ones
        `)
        console.log('  ✓ Updated existing images with author.info in about field')

        console.log('✓ Migration 024 completed')
    } catch (error) {
        console.error('✗ Migration 024 failed:', error)
        throw error
    }
}

export async function down() {
    console.log('Rolling back migration 024: Restore original trigger')

    try {
        // Restore original trigger (using account_id)
        await db.exec(`
            CREATE OR REPLACE FUNCTION update_image_computed_fields()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Compute about field only if not already set
                IF NEW.about IS NULL OR NEW.about = '' THEN
                    IF (NEW.author).account_id IS NOT NULL THEN
                        NEW.about := '(c) ' || (NEW.author).account_id || ' via ' || (NEW.author).adapter::text;
                    ELSIF NEW.owner_id IS NOT NULL THEN
                        NEW.about := '(c) owner_id:' || NEW.owner_id::text;
                    ELSE
                        NEW.about := NULL;
                    END IF;
                END IF;
                
                -- Compute use_player
                NEW.use_player := NEW.publisher IS NOT NULL AND 
                                 ((NEW.publisher).adapter = 'vimeo' OR (NEW.publisher).adapter = 'youtube');
                
                -- Compute is_public, is_private, is_internal from bits 4+5 of ctags
                NEW.is_public := (get_byte(NEW.ctags, 0) & 48) = 16;
                NEW.is_private := (get_byte(NEW.ctags, 0) & 48) = 32;
                NEW.is_internal := (get_byte(NEW.ctags, 0) & 48) = 48;
                
                -- Compute is_deprecated, has_issues from bits 6+7 of ctags
                NEW.is_deprecated := (get_byte(NEW.ctags, 0) & 192) = 64;
                NEW.has_issues := (get_byte(NEW.ctags, 0) & 192) IN (128, 192);
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `)
        console.log('✓ Rollback 024 completed')
    } catch (error) {
        console.error('✗ Rollback 024 failed:', error)
        throw error
    }
}
