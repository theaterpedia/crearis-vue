/**
 * Applies a sync decision to one CV row. The IO half of the sync.
 *
 * `odooSync.ts` decides *what* should happen; this does it. Split that way because
 * the decision is where the design consequences live and it deserves to be pure
 * and exhaustively tested; this file is the boring part that touches the db.
 *
 * ── Scope · deliberately the simple version ─────────────────────────────────
 * HD 2026-07-28: a longer conceptualization of the sync exists and parts of it are
 * still open. This is not that. It is "the one simple possibility that does some
 * lifting on the CV side" — enough to run, enough to demonstrate, and explicit
 * about every place it ran ahead of a decision.
 *
 * Ahead-decisions are collected in `hcv/refs/2026-07_events_and-posts_devboxdoc.md`
 * and marked `⚠ AHEAD` here.
 *
 * ⚠ AHEAD: mocked Odoo only. Enabled by `ODOO_SYNC_MOCK=1` and a no-op otherwise,
 * so nothing changes for prod until a real Odoo client is wired behind the same
 * interface. A sync that silently did nothing in production would be worse than
 * one that is plainly switched off.
 */

import { db } from '../database/init'
import { decideSync, withEventLock, type CvSyncRow, type SyncDecision } from './odooSync'
import {
    EVENT_SYNC,
    POST_SYNC,
    cvChangedSinceSync,
    fingerprint,
    ledgerGet,
    ledgerRecord,
    mintIdentity,
    odooGet,
    odooPut,
    type SyncEntitySpec,
} from './odooSyncStore'

export { EVENT_SYNC, POST_SYNC }

export interface SyncOutcome {
    table: string
    id: number
    identity: string | null
    decision: SyncDecision
    /** What actually changed as a result — for the log and for tests. */
    applied: 'created-in-odoo' | 'pulled-into-cv' | 'pushed-to-odoo' | 'nothing'
}

/** Is the mocked sync switched on? */
export function isSyncMockEnabled(): boolean {
    return process.env.ODOO_SYNC_MOCK === '1'
}

/**
 * Reconcile one row.
 *
 * Wrapped in the per-event lock, so two concurrent writes to the same row queue
 * instead of racing — which is the whole point of HD's per-event locking choice.
 */
export async function syncRow(
    spec: SyncEntitySpec,
    id: number,
    opts: { now?: string; assumeBaseline?: boolean } = {},
): Promise<SyncOutcome | null> {
    if (!isSyncMockEnabled()) return null

    const now = opts.now ?? new Date().toISOString()

    const row = await db.get<Record<string, unknown>>(
        `SELECT e.*, p.domaincode AS domaincode
           FROM ${spec.table} e
           LEFT JOIN projects p ON e.project_id = p.id
          WHERE e.id = ?`,
        [id],
    )
    if (!row) return null

    const identity = (row[spec.identityColumn] as string | null) ?? null
    const cv: CvSyncRow = {
        id,
        status: (row.status as number | null) ?? null,
        odoo_xmlid: identity,
        confirmed_at: (row.confirmed_at as string | null) ?? null,
        name: String(row.name ?? ''),
        teaser: (row.teaser as string | null) ?? null,
        date_begin: (row.date_begin as string | null) ?? null,
        date_end: (row.date_end as string | null) ?? null,
    }

    return withEventLock(cv, async () => {
        const odoo = odooGet(spec, identity)
        const entry = ledgerGet(spec, identity)
        const decision = decideSync(cv, odoo, {
            lastSyncedAt: entry?.lastSyncedAt ?? null,
            // Fingerprint comparison, not a timestamp — CV has no trustworthy
            // change-clock (events.updated_at is TEXT and not auto-maintained).
            cvChangedAt: cvChangedSinceSync(spec, identity, row) ? now : null,
            // Same fingerprint function on both sides, so "do they agree?" is one
            // comparison. Lets the no-baseline case self-heal when nothing is at stake
            // instead of refusing every row after a restart.
            sidesAgree: !!odoo && fingerprint(spec, row) === fingerprint(spec, odoo),
            assumeBaseline: opts.assumeBaseline,
        })

        const fields = Object.fromEntries(spec.syncFields.map((f) => [f, row[f] ?? null]))

        switch (decision.action) {
            case 'create-in-odoo': {
                // Refuse to invent an identity in a column the sync does not own.
                // posts.xmlid is CV's routing key — writing a URL slug from here
                // would be a data-integrity bug. Skip loudly instead.
                if (!identity && !spec.ownsIdentityColumn) {
                    const reason = `${spec.table}#${id} has no ${spec.identityColumn} and the sync `
                        + `does not own that column — refusing to mint one. `
                        + `${spec.table} needs its own odoo_xmlid (migration 060 added it to events only).`
                    console.warn(`[odoo-sync] ${reason}`)
                    return {
                        table: spec.table, id, identity: null,
                        decision: { ...decision, action: 'noop', reason },
                        applied: 'nothing' as const,
                    }
                }
                const minted = identity
                    ?? mintIdentity(spec, String(row.domaincode ?? 'unknown'), cv.name, id)
                odooPut(spec, minted, fields, now)
                // Persist the identity back to CV. This is the only column the sync
                // writes on a create — it is the join-key everything later depends on.
                if (!identity) {
                    await db.run(
                        `UPDATE ${spec.table} SET ${spec.identityColumn} = ? WHERE id = ?`,
                        [minted, id],
                    )
                }
                ledgerRecord(spec, minted, row, now)
                logOutcome(spec, id, minted, decision, 'created-in-odoo')
                return { table: spec.table, id, identity: minted, decision, applied: 'created-in-odoo' as const }
            }

            case 'pull-from-odoo': {
                if (!odoo || !identity) break
                // `?` placeholders — the adapter normalises them per DB (the events
                // endpoints do the same; see index.get.ts's note).
                const sets = spec.syncFields.map((f) => `${f} = ?`).join(', ')
                await db.run(
                    `UPDATE ${spec.table} SET ${sets} WHERE id = ?`,
                    [...spec.syncFields.map((f) => odoo[f] ?? null), id],
                )
                // Re-read so the ledger fingerprints what CV now actually holds,
                // not what we believed we wrote. Otherwise the very next sync sees a
                // phantom CV-side change and pulls again forever.
                const after = await db.get<Record<string, unknown>>(
                    `SELECT * FROM ${spec.table} WHERE id = ?`, [id],
                )
                ledgerRecord(spec, identity, after ?? row, now)
                logOutcome(spec, id, identity, decision, 'pulled-into-cv')
                return { table: spec.table, id, identity, decision, applied: 'pulled-into-cv' as const }
            }

            case 'adopt-baseline': {
                // Record the reconcile point, transfer nothing. This is what makes a
                // restart recoverable without any data crossing either way.
                if (!identity) break
                ledgerRecord(spec, identity, row, now)
                logOutcome(spec, id, identity, decision, 'nothing')
                return { table: spec.table, id, identity, decision, applied: 'nothing' as const }
            }

            case 'skip-unreconciled': {
                // Fail-closed. Deliberately louder than the other skips: it needs a
                // human, and silence would look identical to "nothing to do".
                console.warn(`[odoo-sync] ⚠ ${spec.table}#${id} ${identity} NEEDS ATTENTION · ${decision.reason}`)
                return { table: spec.table, id, identity, decision, applied: 'nothing' as const }
            }

            case 'push-to-odoo': {
                if (!identity) break
                odooPut(spec, identity, fields, now)
                ledgerRecord(spec, identity, row, now)
                logOutcome(spec, id, identity, decision, 'pushed-to-odoo')
                return { table: spec.table, id, identity, decision, applied: 'pushed-to-odoo' as const }
            }

            default:
                break
        }

        logOutcome(spec, id, identity, decision, 'nothing')
        return { table: spec.table, id, identity, decision, applied: 'nothing' as const }
    })
}

function logOutcome(
    spec: SyncEntitySpec,
    id: number,
    identity: string | null,
    decision: SyncDecision,
    applied: string,
): void {
    // Conflicts are the one outcome that loses work, so they warn rather than log.
    const line = `[odoo-sync] ${spec.table}#${id} ${identity ?? '(no identity)'} `
        + `→ ${decision.action}/${applied} · ${decision.reason}`
    if (decision.conflict) console.warn(`${line} · ⚠ CONFLICT`)
    else console.log(line)
}

/**
 * Fire-and-forget sync after a write, for use inside a write handler.
 *
 * Never throws and never blocks the response: a failed sync must not fail the save
 * the user just made. The write is the user's intent; the sync is bookkeeping that
 * can be retried on the next write.
 */
export function syncAfterWrite(spec: SyncEntitySpec, id: number): void {
    if (!isSyncMockEnabled()) return
    void syncRow(spec, id).catch((error) => {
        console.error(`[odoo-sync] ${spec.table}#${id} failed:`, error)
    })
}
