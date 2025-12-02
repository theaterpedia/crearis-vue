/**
 * Migration 041: Set entity status values
 * 
 * Migrates status for images, projects, and users to the new
 * bit allocation from Migration 040.
 * 
 * New Status Bit Allocation (from Migration 040):
 * - new:       bits 0-2   (value: 1)
 * - demo:      bits 3-5   (value: 8)
 * - draft:     bits 6-8   (value: 64)
 * - confirmed: bits 9-11  (value: 512)
 * - released:  bits 12-14 (value: 4096)
 * - archived:  bit 15     (value: 32768)
 * - trash:     bit 16     (value: 65536)
 * 
 * Target database: crearis_admin_dev
 */

import type { DatabaseAdapter } from '../adapter'

// Status values from Migration 040
const STATUS = {
    NEW: 1,        // bits 0-2
    DEMO: 8,       // bits 3-5
    DRAFT: 64,     // bits 6-8
    CONFIRMED: 512, // bits 9-11
    CONFIRMED_USER: 1024, // confirmed > user subcategory
    RELEASED: 4096, // bits 12-14
    ARCHIVED: 32768, // bit 15
    TRASH: 65536   // bit 16
}

export const migration = {
    id: '041_entity_statusues',
    description: 'Set entity status values for images, projects, and users',

    async up(db: DatabaseAdapter): Promise<void> {
        const isPostgres = db.type === 'postgresql'

        if (!isPostgres) {
            throw new Error('Migration 041 requires PostgreSQL.')
        }

        console.log('Running migration 041: Set Entity Status Values...')

        // ==================== IMAGES ====================
        console.log('\n📷 Step 1: Update images status')

        // All images get DRAFT status (64)
        const imageUpdates: Array<{ xmlid: string; status: number; comment: string }> = [
            { xmlid: 'aktivkreativ.image_child.kostuem_probe2', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'oberland.image_instructor.johanna_schoenfelder_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_event.comic_theater_4', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_event.comic_theater_3', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'theaterpedia.image.scene-finaltest1763656415', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dasei.image_instructor.episode_5', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'physicaltheatre.image.scene-anne_duerrwang_1763659524673', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'start.image_event.lichtpunkte_ea_rh', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'physicaltheatre.image.scene-der_gemeinsame_nenner_1763659524673', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dasei.image_instructor.episode_2', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.77PTeqlmZpo', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_event.was_tun2', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dev.image_post.design2022_postit_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_instructor.nina_roob_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_instructor.nick_tordalk_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_event.comic_theater_2', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dasei.image_instructor.episode_4', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dev.image_post.devtasks1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'utopiainaction.image_event.training_statuen_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_instructor.rosa_koeniger_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_instructor.kathrin_jung_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.5MRsjiv782c', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'aktivkreativ.image_child.kostuem_probe1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.ZC4zXCMqpdk', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.weihnachtsgruss_2024', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_event.was_tun0', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'utopiainaction.image_event.training_statuen_2', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_event.was_tun1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.qYKVq01DUMA', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.rvPiKnzCEpQ', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.KrpYzvM9yL4', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.vILV_BNUSps', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.A5bsX_heN_8', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_instructor.Cju0_qFRK9c', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_instructor.mathias_straub_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_teen.KWiOd7jd5lk', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_instructor.kristina_kasalova_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.AZ2CeMzSGqE', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.BjHFAs0o03k', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_instructor.iva_freddie_elrodt_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.LLfonYlg4dM', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.luRogQskH5I', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dev.image_instructor.lehrer_lempel_hd', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dev.image_post.167_dasei2022_team_I8A7744_yry0zh', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_event.comic_theater_5', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'utopiainaction.image_event.training_statuen_3', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_instructor.karel_hajek_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'aktivkreativ.image_child.kostuem_probe3', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_instructor.verena_boppel_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.eCgValEiObA', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dasei.image_instructor.episode_3', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_instructor.karin_seilergiehl_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_instructor.li3RT_tp5fIs', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.MvZYItR88rQ', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'dev.image_post.164_dasei2022_team_I8A7740_uzzmne', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.f7deecEKzZg', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.eZFkfogFsuE', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.SdVfStzyuQ8', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_aug.image_event.was_tun3', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_event.comic_theater_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.praesentation_gruendungskonferenz_qjws7i', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_teen.AuZDjh2kK_I', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_instructor.linda_straub_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: 'comictheater.image_instructor.dan_havlicek_1', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_event.Imjn4Q8HHG8', status: STATUS.DRAFT, comment: 'draft' },
            { xmlid: '_tp.image_adult.UAGz1n9BQZg', status: STATUS.DRAFT, comment: 'draft' },
        ]

        for (const img of imageUpdates) {
            await db.run(
                `UPDATE images SET status = $1 WHERE xmlid = $2`,
                [img.status, img.xmlid]
            )
        }
        console.log(`  ✓ Updated ${imageUpdates.length} images to status`)

        // ==================== PROJECTS ====================
        console.log('\n📁 Step 2: Update projects status')

        const projectUpdates: Array<{ domaincode: string; status: number; comment: string }> = [
            { domaincode: 'tp', status: STATUS.RELEASED, comment: 'released - main platform project' },
            { domaincode: 'aug', status: STATUS.DRAFT, comment: 'draft - regio in development' },
            { domaincode: 'aktivkreativ', status: STATUS.RELEASED, comment: 'released - active project' },
            { domaincode: 'hoftheaterschrobenhausen', status: STATUS.DEMO, comment: 'demo - placeholder/template' },
            { domaincode: 'bewaehrungshilfeaugsburg', status: STATUS.DEMO, comment: 'demo - placeholder/template' },
            { domaincode: 'physicaltheatre', status: STATUS.DEMO, comment: 'demo - topic placeholder' },
            { domaincode: 'comictheater', status: STATUS.DEMO, comment: 'demo - topic placeholder' },
            { domaincode: 'einthemaeintag', status: STATUS.DEMO, comment: 'demo - topic placeholder' },
            { domaincode: 'oberland', status: STATUS.DEMO, comment: 'demo - regio placeholder' },
            { domaincode: 'mue', status: STATUS.DEMO, comment: 'demo - regio placeholder' },
            { domaincode: 'nue', status: STATUS.DEMO, comment: 'demo - regio placeholder' },
            { domaincode: 'wahlfische', status: STATUS.DEMO, comment: 'demo - placeholder' },
            { domaincode: 'linklaternuernberg', status: STATUS.DEMO, comment: 'demo - placeholder' },
            { domaincode: 'utopiainaction', status: STATUS.RELEASED, comment: 'released - active project' },
            { domaincode: 'start', status: STATUS.RELEASED, comment: 'released - launch project' },
            { domaincode: 'dev', status: STATUS.DRAFT, comment: 'draft - dev blog (not released)' },
            { domaincode: 'dasei', status: STATUS.DRAFT, comment: 'draft - in development' },
            { domaincode: 'raumlauf', status: STATUS.DRAFT, comment: 'draft - topic in development' },
        ]

        for (const proj of projectUpdates) {
            await db.run(
                `UPDATE projects SET status = $1 WHERE domaincode = $2`,
                [proj.status, proj.domaincode]
            )
        }
        console.log(`  ✓ Updated ${projectUpdates.length} projects to status`)

        // ==================== USERS ====================
        console.log('\n👤 Step 3: Update users status')

        // First: Set all users to default DRAFT status
        const defaultResult = await db.run(
            `UPDATE users SET status = $1`,
            [STATUS.DRAFT]
        )
        console.log(`  ✓ Set all users to DRAFT (${STATUS.DRAFT})`)

        // Then: Set specific users to their statuses
        const specificUsers: Array<{ sysmail: string; status: number; comment: string }> = [
            { sysmail: 'admin@theaterpedia.org', status: STATUS.CONFIRMED_USER, comment: 'confirmed_user - admin' },
            { sysmail: 'base@theaterpedia.org', status: STATUS.CONFIRMED_USER, comment: 'confirmed_user - base' },
            { sysmail: 'project1@theaterpedia.org', status: STATUS.NEW, comment: 'new - system account' },
            { sysmail: 'project2@theaterpedia.org', status: STATUS.NEW, comment: 'new - system account' },
            { sysmail: 'tp@theaterpedia.org', status: STATUS.NEW, comment: 'new - system account' },
            { sysmail: 'regio1@theaterpedia.org', status: STATUS.NEW, comment: 'new - system account' },
            { sysmail: 'rosalin.hertrich@dasei.eu', status: STATUS.CONFIRMED_USER, comment: 'confirmed_user - active user' },
            { sysmail: 'hans.doenitz@theaterpedia.org', status: STATUS.CONFIRMED_USER, comment: 'confirmed_user - active user' },
        ]

        for (const user of specificUsers) {
            await db.run(
                `UPDATE users SET status = $1 WHERE sysmail = $2`,
                [user.status, user.sysmail]
            )
        }
        console.log(`  ✓ Set ${specificUsers.length} specific users to their statuses`)

        // ==================== Summary ====================
        console.log('\n📊 Step 4: Migration Summary')

        const imgCount = await db.get(`SELECT COUNT(*) as count FROM images`)
        const projCount = await db.get(`SELECT COUNT(*) as count FROM projects`)
        const userCount = await db.get(`SELECT COUNT(*) as count FROM users`)

        console.log(`  ✓ Images: ${(imgCount as any).count} total`)
        console.log(`  ✓ Projects: ${(projCount as any).count} total`)
        console.log(`  ✓ Users: ${(userCount as any).count} total`)
        console.log('\n✅ Migration 041 complete!')
    },

    async down(db: DatabaseAdapter): Promise<void> {
        console.log('Rolling back migration 041...')

        // Reset all status to NULL (or previous values if known)
        await db.run(`UPDATE images SET status = NULL`)
        await db.run(`UPDATE projects SET status = NULL`)
        await db.run(`UPDATE users SET status = NULL`)

        console.log('  ✓ Reset all status to NULL')
        console.log('  ⚠️  Note: Original status values not preserved in rollback')
        console.log('✅ Rollback complete')
    }
}
