/**
 * Reference-data seeder — PROOF OF CONCEPT (CV@wsl, 2026-07-10)
 * =============================================================
 *
 * Mints DETERMINISTIC "reference-websites" so the sysreg-driven dashboard can be
 * shown/tested in every {status × scope × role} scenario, and reset reproducibly.
 * This is the db-side foundation for the TDD + spec-by-example strategy: each
 * ReferenceSite below is an executable *example* that both documents and (via the
 * dashboard tests to come) specifies intended behaviour.
 *
 * WHY this exists: after a fresh `db:rebuild` the DB has full schema + sysreg/config,
 * but ZERO content entities (server/data CSVs were deleted). `reset-test-data.ts` only
 * *updates* rows that already exist — this seeder *creates* them (idempotent upserts).
 *
 * DESIGN (extension seams — will grow alongside the real sfr / uia projects):
 *  - The status/scope taxonomy is read from the `sysreg` table at runtime, so the
 *    seeder can never drift from the DB's own definition.
 *  - A ReferenceSite is pure data. Add the real projects by adding site specs (tomorrow:
 *    sfr = freundes-kreis-de, uia = utopia-in-action.de).
 *  - Theaterpädagogik has a RICHER role spectrum than customer/seller (NGO "middle"
 *    roles: Kontaktlehrer, Konrektor, Theaterpädagoge, Schüler:in). The RoleDef catalogue
 *    maps each DOMAIN role onto the sysreg relation model (configrole), so that variety
 *    is first-class, not flattened.
 *  - `ContentOptions` is the seam for future configurability (which statuses/scopes, how
 *    many entities, subcategories, per-role authorship, ...).
 *
 * SAFETY: dev-only (blocks on NODE_ENV=production or a prod-looking DB name).
 * Idempotent: re-running upserts the same natural keys (sysmail / domaincode / xmlid).
 *
 * Run:  SKIP_MIGRATIONS=true npx tsx server/database/seed-reference.ts
 *       SKIP_MIGRATIONS=true npx tsx server/database/seed-reference.ts --passwords
 */

import { db } from './init'
import bcrypt from 'bcryptjs'

// ---------------------------------------------------------------------------
// Scope visibility bits (17–21) — mirror sysreg `scope_*` toggles.
// ---------------------------------------------------------------------------
const SCOPE = {
    team: 1 << 17,
    login: 1 << 18,
    project: 1 << 19,
    regio: 1 << 20,
    public: 1 << 21,
} as const

// configrole values stored on project_members (owner is tracked via projects.owner_id)
const CONFIGROLE = { partner: 2, participant: 4, member: 8, creator: 16 } as const

type Relation = 'anonym' | 'partner' | 'participant' | 'member' | 'creator'

/** Maps a Theaterpädagogik DOMAIN role onto the sysreg relation model. */
interface RoleDef {
    key: string
    domainLabel: string      // what the project actually calls this role
    relation: Relation       // sysreg relation it resolves to
    configrole: number | null // project_members.configrole; null = owner (via owner_id)
}

interface UserDef {
    key: string
    username: string
    sysmail: string
    roleKey: string          // -> RoleDef.key
    password?: string        // default derived if omitted
}

/** A reference-website = one executable example. */
interface ReferenceSite {
    domaincode: string
    type: 'topic' | 'project' | 'regio' | 'special'
    heading: string
    name: string
    ownerKey: string         // -> UserDef.key
    projectStatus: number
    roles: RoleDef[]
    users: UserDef[]
    content?: ContentOptions
}

/** Configurability seam (kept minimal for the PoC). */
interface ContentOptions {
    /** Which status categories to generate posts for; default = all categories from sysreg. */
    statuses?: string[]
    /** Scope combo per status name (bit-OR of SCOPE.*); default assigned below. */
    scopeByStatus?: Record<string, number>
    /** Which user keys author the generated posts, round-robined. */
    authorKeys?: string[]
}

// ---------------------------------------------------------------------------
// PoC reference site — placeholder pending the real sfr / uia specs (tomorrow).
// Demonstrates the Theaterpädagogik role variety (school-project NGO cast).
// ---------------------------------------------------------------------------
const POC_SITE: ReferenceSite = {
    domaincode: 'poc1',
    type: 'topic',
    name: 'PoC Reference Site',
    heading: '**PoC Reference Site** — Theaterpädagogik role & status showcase (placeholder pending sfr/uia)',
    ownerKey: 'leitung',
    projectStatus: 64, // draft — renders the full dashboard (>= draft), not the stepper
    roles: [
        { key: 'leitung', domainLabel: 'Projektleitung (Theaterpädagog:in)', relation: 'member', configrole: null }, // owner
        { key: 'paed', domainLabel: 'Theaterpädagog:in', relation: 'member', configrole: CONFIGROLE.member },
        { key: 'kontaktlehrer', domainLabel: 'Kontaktlehrer:in', relation: 'partner', configrole: CONFIGROLE.partner }, // NGO middle-role
        { key: 'konrektor', domainLabel: 'Konrektor:in (Schulleitung)', relation: 'partner', configrole: CONFIGROLE.partner },
        { key: 'schueler', domainLabel: 'Schüler:in', relation: 'participant', configrole: CONFIGROLE.participant },
    ],
    users: [
        { key: 'leitung', username: 'Lea Leitung', sysmail: 'lea.leitung@poc.theaterpedia.local', roleKey: 'leitung' },
        { key: 'paed', username: 'Paul Pädagoge', sysmail: 'paul.paed@poc.theaterpedia.local', roleKey: 'paed' },
        { key: 'kontaktlehrer', username: 'Karin Kontaktlehrer', sysmail: 'karin.kontakt@poc.theaterpedia.local', roleKey: 'kontaktlehrer' },
        { key: 'konrektor', username: 'Konrad Konrektor', sysmail: 'konrad.konrektor@poc.theaterpedia.local', roleKey: 'konrektor' },
        { key: 'schueler', username: 'Sami Schüler', sysmail: 'sami.schueler@poc.theaterpedia.local', roleKey: 'schueler' },
    ],
    content: {
        scopeByStatus: {
            new: 0,
            demo: SCOPE.team,
            draft: SCOPE.team | SCOPE.login,
            confirmed: SCOPE.team | SCOPE.login | SCOPE.project,
            released: SCOPE.project | SCOPE.public,
            archived: 0,
            trash: 0,
        },
        authorKeys: ['leitung', 'paed', 'schueler'],
    },
}

// ---------------------------------------------------------------------------
// Taxonomy read from sysreg (config-driven, cannot drift from the DB seed).
// ---------------------------------------------------------------------------
interface StatusCat { value: number; name: string }

async function loadStatusCategories(): Promise<StatusCat[]> {
    const rows = (await db.all(
        `SELECT DISTINCT value, name FROM sysreg
         WHERE tagfamily = 'status' AND taglogic = 'category' AND value < ?
         ORDER BY value`,
        [SCOPE.team] // exclude scope toggles (>= bit 17)
    )) as Array<{ value: number; name: string }>
    return rows.map(r => ({ value: r.value, name: r.name }))
}

// ---------------------------------------------------------------------------
// Idempotent upsert helpers (upsert on natural key, then read back the id).
// ---------------------------------------------------------------------------
async function upsertUser(u: UserDef, hashedPw: string): Promise<number> {
    await db.run(
        `INSERT INTO users (sysmail, username, password, role, lang, status)
         VALUES (?, ?, ?, 'user', 'de', 4096)
         ON CONFLICT (sysmail) DO UPDATE SET username = EXCLUDED.username`,
        [u.sysmail, u.username, hashedPw]
    )
    const row = (await db.get(`SELECT id FROM users WHERE sysmail = ?`, [u.sysmail])) as { id: number }
    return row.id
}

async function upsertProject(site: ReferenceSite, ownerId: number): Promise<number> {
    await db.run(
        `INSERT INTO projects (domaincode, name, heading, type, owner_id, status, lang)
         VALUES (?, ?, ?, ?, ?, ?, 'de')
         ON CONFLICT (domaincode) DO UPDATE SET
             name = EXCLUDED.name, heading = EXCLUDED.heading, type = EXCLUDED.type,
             owner_id = EXCLUDED.owner_id, status = EXCLUDED.status`,
        [site.domaincode, site.name, site.heading, site.type, ownerId, site.projectStatus]
    )
    const row = (await db.get(`SELECT id FROM projects WHERE domaincode = ?`, [site.domaincode])) as { id: number }
    return row.id
}

async function upsertMember(projectId: number, userId: number, configrole: number, roleLabel: string): Promise<void> {
    await db.run(
        `INSERT INTO project_members (project_id, user_id, configrole, role)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (project_id, user_id) DO UPDATE SET
             configrole = EXCLUDED.configrole, role = EXCLUDED.role`,
        [projectId, userId, configrole, roleLabel]
    )
}

async function upsertPost(xmlid: string, name: string, projectId: number, creatorId: number, status: number): Promise<void> {
    // r_anonym/r_partner/... are computed by trigger_posts_role_visibility from status + sysreg_config.
    await db.run(
        `INSERT INTO posts (xmlid, name, project_id, creator_id, status, lang)
         VALUES (?, ?, ?, ?, ?, 'de')
         ON CONFLICT (xmlid) DO UPDATE SET
             name = EXCLUDED.name, project_id = EXCLUDED.project_id,
             creator_id = EXCLUDED.creator_id, status = EXCLUDED.status`,
        [xmlid, name, projectId, creatorId, status]
    )
}

// ---------------------------------------------------------------------------
// Seed one reference site: users -> project -> memberships -> content matrix.
// ---------------------------------------------------------------------------
async function seedReferenceSite(site: ReferenceSite, categories: StatusCat[], resetPasswords: boolean): Promise<void> {
    console.log(`\n🌱 Seeding reference site '${site.domaincode}' (${site.type})`)
    const roleOf = (roleKey: string) => site.roles.find(r => r.key === roleKey)!
    const userIds = new Map<string, number>()

    // 1) users (password is NOT NULL, so always set on create; --passwords is a no-op today,
    //    kept as the seam for a future "rotate existing passwords" mode)
    void resetPasswords
    for (const u of site.users) {
        const pw = u.password ?? `poc-${u.key}`
        const hashed = await bcrypt.hash(pw, 10)
        const id = await upsertUser(u, hashed)
        userIds.set(u.key, id)
        console.log(`   👤 ${u.username} <${u.sysmail}> → id=${id} [${roleOf(u.roleKey).domainLabel}]`)
    }

    // 2) project (owner via owner_id)
    const ownerId = userIds.get(site.ownerKey)!
    const projectId = await upsertProject(site, ownerId)
    console.log(`   📦 project '${site.domaincode}' → id=${projectId}, owner=${site.ownerKey} (id=${ownerId})`)

    // 3) memberships (skip owner — tracked via owner_id)
    for (const u of site.users) {
        const role = roleOf(u.roleKey)
        if (role.configrole === null) continue
        await upsertMember(projectId, userIds.get(u.key)!, role.configrole, role.relation)
        console.log(`   👥 ${u.username}: ${role.relation} (configrole=${role.configrole}) [${role.domainLabel}]`)
    }

    // 4) content matrix: one post per status category, scope + author varied
    const opts = site.content ?? {}
    const authorKeys = opts.authorKeys ?? [site.ownerKey]
    const wanted = opts.statuses
    let i = 0
    for (const cat of categories) {
        if (wanted && !wanted.includes(cat.name)) continue
        const scope = opts.scopeByStatus?.[cat.name] ?? 0
        const authorKey = authorKeys[i % authorKeys.length]
        const creatorId = userIds.get(authorKey)!
        const fullStatus = cat.value | scope
        const xmlid = `${site.domaincode}.post_${cat.name}`
        await upsertPost(xmlid, `[${cat.name}] Beispiel-Beitrag`, projectId, creatorId, fullStatus)
        console.log(`   📝 ${xmlid}: status=${cat.name}(${cat.value})${scope ? ` | scope=0x${scope.toString(16)}` : ''}, creator=${authorKey}`)
        i++
    }
}

// ---------------------------------------------------------------------------
async function main() {
    const nodeEnv = process.env.NODE_ENV
    const dbName = process.env.DB_NAME ?? ''
    if (nodeEnv === 'production' || /prod|production/.test(dbName)) {
        console.error(`❌ BLOCKED: refusing to seed reference data (NODE_ENV=${nodeEnv}, DB_NAME=${dbName})`)
        process.exit(1)
    }
    const resetPasswords = process.argv.includes('--passwords')

    console.log('🌱 Reference-data seeder (PoC)')
    const categories = await loadStatusCategories()
    console.log(`   taxonomy from sysreg: ${categories.map(c => `${c.name}(${c.value})`).join(', ')}`)

    await seedReferenceSite(POC_SITE, categories, resetPasswords)

    // Verification: show the trigger-computed visibility flags — proves config-driven r_*.
    console.log('\n📊 Post visibility (r_* computed by trigger from status + sysreg_config):')
    const rows = (await db.all(
        `SELECT xmlid, status, r_anonym, r_partner, r_participant, r_member, r_creator
         FROM posts WHERE project_id = (SELECT id FROM projects WHERE domaincode = ?)
         ORDER BY status`,
        [POC_SITE.domaincode]
    )) as Array<Record<string, any>>
    for (const r of rows) {
        const flags = ['anonym', 'partner', 'participant', 'member', 'creator']
            .filter(f => r[`r_${f}`]).join(',') || '(none)'
        console.log(`   ${r.xmlid.padEnd(24)} status=${String(r.status).padStart(7)}  visible→ ${flags}`)
    }

    console.log('\n✅ Reference seed complete.')
    process.exit(0)
}

main().catch(err => {
    console.error('❌ Reference seed failed:', err)
    process.exit(1)
})
