/**
 * Migration 049: Add draft_review substatus, missing scopes, and complete i18n
 * 
 * IMPORTANT: Use pnpm, NOT npm!
 * This project uses pnpm for package management.
 * 
 * This migration:
 * 1. Adds draft_review (256) as subcategory of draft - enables review workflow
 * 2. Adds missing scope toggles (scope_project, scope_regio, scope_public)
 * 3. Completes i18n translations (adds Czech, updates descriptions)
 * 
 * Bit allocation reminder:
 * - Status categories: bits 0-16 (parent_bit logic)
 * - Scope toggles: bits 17-21 (independent toggles)
 * 
 * Status bit ranges (3 bits per category):
 * - new:       bits 0-2  (1, 2, 3...)
 * - demo:      bits 3-5  (8, 16, 24...)
 * - draft:     bits 6-8  (64, 128, 192, 256...) ← draft_review = 256
 * - confirmed: bits 9-11 (512, 1024...)
 * - released:  bits 12-14 (4096, 8192...)
 * - archived:  bit 15    (32768)
 * - trash:     bit 16    (65536)
 * 
 * Scope toggle bits:
 * - scope_team:    bit 17 (131072)
 * - scope_login:   bit 18 (262144)
 * - scope_project: bit 19 (524288) ← NEW
 * - scope_regio:   bit 20 (1048576) ← NEW
 * - scope_public:  bit 21 (2097152) ← NEW
 * 
 * Package: D (040-049) - Auth system refactoring
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
    id: '049_status_review_scopes_i18n',
    description: 'Add draft_review substatus, missing scopes, and complete i18n translations',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 049 requires PostgreSQL')
        }

        console.log('Running migration 049: Status review, scopes, and i18n...')

        // ============================================================
        // STEP 1: Add draft_review (256) as subcategory of draft
        // ============================================================
        console.log('📝 Step 1: Adding draft_review subcategory')

        await db.exec(`
            INSERT INTO sysreg_status (name, description, taglogic, tagfamily, value, parent_bit, name_i18n, desc_i18n)
            VALUES (
                'draft_review',
                'Content submitted for review by owner',
                'subcategory',
                'status',
                256,
                64,
                '{"de": "Zur Prüfung", "en": "Under Review", "cz": "K posouzení"}'::jsonb,
                '{"de": "Inhalt zur Prüfung durch den Owner eingereicht", "en": "Content submitted for review by owner", "cz": "Obsah odeslán ke kontrole vlastníkem"}'::jsonb
            )
            ON CONFLICT DO NOTHING
        `)

        // ============================================================
        // STEP 2: Add missing scope toggles
        // ============================================================
        console.log('🔐 Step 2: Adding missing scope toggles')

        // scope_project (bit 19 = 524288)
        await db.exec(`
            INSERT INTO sysreg_status (name, description, taglogic, tagfamily, value, parent_bit, name_i18n, desc_i18n)
            VALUES (
                'scope_project',
                'Visible within project context',
                'toggle',
                'status',
                524288,
                NULL,
                '{"de": "Projekt", "en": "Project", "cz": "Projekt"}'::jsonb,
                '{"de": "Sichtbar innerhalb des Projekts", "en": "Visible within project context", "cz": "Viditelné v rámci projektu"}'::jsonb
            )
            ON CONFLICT DO NOTHING
        `)

        // scope_regio (bit 20 = 1048576)
        await db.exec(`
            INSERT INTO sysreg_status (name, description, taglogic, tagfamily, value, parent_bit, name_i18n, desc_i18n)
            VALUES (
                'scope_regio',
                'Visible in regional context',
                'toggle',
                'status',
                1048576,
                NULL,
                '{"de": "Region", "en": "Region", "cz": "Region"}'::jsonb,
                '{"de": "Sichtbar in der Region", "en": "Visible in regional context", "cz": "Viditelné v regionálním kontextu"}'::jsonb
            )
            ON CONFLICT DO NOTHING
        `)

        // scope_public (bit 21 = 2097152)
        await db.exec(`
            INSERT INTO sysreg_status (name, description, taglogic, tagfamily, value, parent_bit, name_i18n, desc_i18n)
            VALUES (
                'scope_public',
                'Publicly visible',
                'toggle',
                'status',
                2097152,
                NULL,
                '{"de": "Öffentlich", "en": "Public", "cz": "Veřejné"}'::jsonb,
                '{"de": "Öffentlich sichtbar", "en": "Publicly visible", "cz": "Veřejně viditelné"}'::jsonb
            )
            ON CONFLICT DO NOTHING
        `)

        // ============================================================
        // STEP 3: Update existing entries with Czech + descriptions
        // ============================================================
        console.log('🌍 Step 3: Updating i18n translations (Czech + descriptions)')

        const updates = [
            // Status categories
            { name: 'new', name_i18n: '{"de": "Neu", "en": "New", "cz": "Nový"}', desc_i18n: '{"de": "Gerade erstellt, nur für Ersteller sichtbar", "en": "Just created, only visible to creator", "cz": "Právě vytvořeno, viditelné pouze pro tvůrce"}' },
            { name: 'new_image', name_i18n: '{"de": "Roh", "en": "Raw", "cz": "Surový"}', desc_i18n: '{"de": "Rohbild ohne Bearbeitung", "en": "Raw image without processing", "cz": "Surový obrázek bez zpracování"}' },
            { name: 'new_user', name_i18n: '{"de": "Passiv", "en": "Passive", "cz": "Pasivní"}', desc_i18n: '{"de": "Benutzer ist passiv, nicht aktiv", "en": "User is passive, not active", "cz": "Uživatel je pasivní, neaktivní"}' },
            { name: 'demo', name_i18n: '{"de": "Demo", "en": "Demo", "cz": "Demo"}', desc_i18n: '{"de": "Vorschau-Modus", "en": "Preview mode", "cz": "Režim náhledu"}' },
            { name: 'demo_event', name_i18n: '{"de": "Vorlage", "en": "Template", "cz": "Šablona"}', desc_i18n: '{"de": "Event-Vorlage zur Wiederverwendung", "en": "Event template for reuse", "cz": "Šablona události pro opětovné použití"}' },
            { name: 'demo_project', name_i18n: '{"de": "Vorlage", "en": "Template", "cz": "Šablona"}', desc_i18n: '{"de": "Projekt-Vorlage zur Wiederverwendung", "en": "Project template for reuse", "cz": "Šablona projektu pro opětovné použití"}' },
            { name: 'demo_user', name_i18n: '{"de": "Verifiziert", "en": "Verified", "cz": "Ověřený"}', desc_i18n: '{"de": "Benutzer ist verifiziert", "en": "User is verified", "cz": "Uživatel je ověřen"}' },
            { name: 'draft', name_i18n: '{"de": "Entwurf", "en": "Draft", "cz": "Koncept"}', desc_i18n: '{"de": "In Bearbeitung, für Team sichtbar", "en": "Work in progress, visible to team", "cz": "Rozpracováno, viditelné pro tým"}' },
            { name: 'draft_user', name_i18n: '{"de": "Aktiviert", "en": "Activated", "cz": "Aktivováno"}', desc_i18n: '{"de": "Benutzer ist aktiviert", "en": "User is activated", "cz": "Uživatel je aktivován"}' },
            { name: 'confirmed', name_i18n: '{"de": "Bestätigt", "en": "Confirmed", "cz": "Potvrzeno"}', desc_i18n: '{"de": "Vom Owner freigegeben", "en": "Approved by owner", "cz": "Schváleno vlastníkem"}' },
            { name: 'confirmed_user', name_i18n: '{"de": "Konfiguriert", "en": "Configured", "cz": "Nakonfigurováno"}', desc_i18n: '{"de": "Benutzer vollständig konfiguriert", "en": "User fully configured", "cz": "Uživatel plně nakonfigurován"}' },
            { name: 'released', name_i18n: '{"de": "Veröffentlicht", "en": "Released", "cz": "Vydáno"}', desc_i18n: '{"de": "Öffentlich sichtbar", "en": "Publicly visible", "cz": "Veřejně viditelné"}' },
            { name: 'released_user', name_i18n: '{"de": "Abgeschlossen", "en": "Completed", "cz": "Dokončeno"}', desc_i18n: '{"de": "Benutzer vollständig abgeschlossen", "en": "User fully completed", "cz": "Uživatel plně dokončen"}' },
            { name: 'archived', name_i18n: '{"de": "Archiviert", "en": "Archived", "cz": "Archivováno"}', desc_i18n: '{"de": "Nicht mehr aktiv, aber aufbewahrt", "en": "No longer active, but preserved", "cz": "Již neaktivní, ale zachováno"}' },
            { name: 'trash', name_i18n: '{"de": "Papierkorb", "en": "Trash", "cz": "Koš"}', desc_i18n: '{"de": "Zum Löschen markiert", "en": "Marked for deletion", "cz": "Označeno ke smazání"}' },
            // Scope toggles
            { name: 'scope_team', name_i18n: '{"de": "Team", "en": "Team", "cz": "Tým"}', desc_i18n: '{"de": "Sichtbar für Teammitglieder", "en": "Visible to team members", "cz": "Viditelné pro členy týmu"}' },
            { name: 'scope_login', name_i18n: '{"de": "Angemeldete", "en": "Logged In", "cz": "Přihlášení"}', desc_i18n: '{"de": "Sichtbar für angemeldete Nutzer", "en": "Visible to logged-in users", "cz": "Viditelné pro přihlášené uživatele"}' }
        ]

        for (const entry of updates) {
            await db.exec(`
                UPDATE sysreg_status 
                SET name_i18n = '${entry.name_i18n}'::jsonb, 
                    desc_i18n = '${entry.desc_i18n}'::jsonb, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE name = '${entry.name}'
            `)
        }

        console.log('✅ Migration 049 complete!')
        console.log('   - Added: draft_review (256) as subcategory of draft')
        console.log('   - Added: scope_project (524288), scope_regio (1048576), scope_public (2097152)')
        console.log('   - Updated: All entries with Czech translations and descriptions')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('⏪ Rolling back Migration 049')

        // Remove added entries
        await db.exec(`
            DELETE FROM sysreg_status 
            WHERE name IN ('draft_review', 'scope_project', 'scope_regio', 'scope_public')
        `)

        // Note: We don't rollback i18n updates - they're non-destructive improvements
        console.log('✅ Rollback complete (new entries removed, i18n updates preserved)')
    }
}
