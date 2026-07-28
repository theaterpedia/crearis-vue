/**
 * Odoo ↔ CV event sync · the decision core, plus the per-event lock.
 *
 * Per HD 2026-07-28, the four shape-decisions:
 *   · **per-event** locking, not per-table
 *   · **`odoo_xmlid` is the identity** — unique, never changes
 *   · **Odoo always wins** a genuine conflict
 *   · the **confirmed-rubicon still holds** — below `confirmed`, an event is
 *     local-only and never reaches Odoo
 * Sync is triggered on write. Events move slowly; this is nothing like live-sync.
 *
 * ── Why this file is pure ────────────────────────────────────────────────────
 * No db, no http, no clock of its own. `decideSync` is a function from (cv, odoo)
 * to an action, so the whole matrix — including the cases nobody wants to
 * reproduce by hand, like "both sides edited and one is archived" — is testable
 * without a database or an Odoo. The IO lives in the caller.
 *
 * ── The rubicon predicate, and why it is stated rather than assumed ──────────
 * `hasStatus()` in `status-helpers.ts` is **exact equality**, so there is no
 * sanctioned "at or past confirmed" helper. But there IS an established
 * convention: `posts-permissions.ts` compares ordinally against the same `STATUS`
 * constants (`status >= STATUS.CONFIRMED` etc.), so that is reused here rather
 * than inventing a second scheme.
 *
 * With one deliberate difference. A bare `status >= STATUS.CONFIRMED` also admits
 * **ARCHIVED (32768) and TRASH (65536)**, because they sort above CONFIRMED (512).
 * Syncing a trashed event into Odoo — through a one-way door that cannot be
 * reversed — is exactly the kind of quiet damage this rubicon exists to prevent,
 * so they are excluded explicitly.
 *
 * ⚠ FLAG (Foundation · sysreg bit-semantics, per CLAUDE.md — diagnose, don't
 * decide): `posts-permissions.ts:116` gates PUBLIC visibility on
 * `status >= STATUS.RELEASED`, which by the same arithmetic makes ARCHIVED and
 * TRASH posts publicly visible. Either that is a latent leak or archived/trash are
 * filtered somewhere I have not found. Not touched here; raised for CV-Schema.
 *
 * The predicate is injectable (`opts.isSyncable`) so CV-Schema can replace it with
 * the authoritative one without this module changing.
 */

import { STATUS } from './posts-permissions'

/** A CV `events` row, in the fields the sync cares about. */
export interface CvSyncRow {
    id: number
    status: number | null
    /** The stable cross-system identity (migration 060). Null = never synced. */
    odoo_xmlid: string | null
    /** Set when the event crossed the rubicon. One-way door (migration 060). */
    confirmed_at: string | null
    name: string
    teaser?: string | null
    date_begin?: string | null
    date_end?: string | null
    /** Free-form in CV and NOT auto-maintained — see `changedAt` below. */
    updated_at?: string | null
}

/** The Odoo side, keyed by the same `odoo_xmlid`. */
export interface OdooSyncRow {
    odoo_xmlid: string
    name: string
    teaser?: string | null
    date_begin?: string | null
    date_end?: string | null
    /** Odoo maintains this reliably; CV's `updated_at` does not. */
    write_date: string
}

export type SyncAction =
    /** Below the rubicon: local-only, by design. */
    | 'skip-below-rubicon'
    /** Archived or trashed: never push through the one-way door. */
    | 'skip-archived'
    /** Past the rubicon with no `odoo_xmlid` yet → create it in Odoo. */
    | 'create-in-odoo'
    /** Only Odoo moved → pull. Also the conflict outcome, since Odoo always wins. */
    | 'pull-from-odoo'
    /** Only CV moved → push. */
    | 'push-to-odoo'
    /** Nothing to do. */
    | 'noop'

export interface SyncDecision {
    action: SyncAction
    /** Plain-language reason — ends up in the sync log, so it has to read well. */
    reason: string
    /** True when both sides moved and Odoo's version was taken. */
    conflict: boolean
}

/**
 * Does this event belong on the Odoo side at all?
 *
 * Default per the reasoning in the file header. Replaceable via `opts.isSyncable`.
 */
export function isSyncable(row: Pick<CvSyncRow, 'status'>): boolean {
    const status = row.status ?? 0
    if (status >= STATUS.ARCHIVED) return false // ARCHIVED · TRASH — never
    return status >= STATUS.CONFIRMED
}

export interface DecideSyncOptions {
    /** When each side last changed. Both optional; absent = "unknown, assume not moved". */
    cvChangedAt?: string | null
    /** The last time these two were reconciled. Absent = never. */
    lastSyncedAt?: string | null
    /** Override the rubicon predicate (Foundation seam). */
    isSyncable?: (row: Pick<CvSyncRow, 'status'>) => boolean
}

/**
 * Decide what should happen to one event.
 *
 * Reads as a ladder on purpose: the rubicon and the archive-guard come FIRST, so
 * no later branch can accidentally push something that should never leave CV.
 */
export function decideSync(
    cv: CvSyncRow,
    odoo: OdooSyncRow | null,
    opts: DecideSyncOptions = {},
): SyncDecision {
    const syncable = (opts.isSyncable ?? isSyncable)(cv)

    // ── the one-way door, guarded before anything else ──────────────────────
    if ((cv.status ?? 0) >= STATUS.ARCHIVED) {
        return {
            action: 'skip-archived',
            reason: `status ${cv.status} is archived/trashed — never pushed through the one-way door`,
            conflict: false,
        }
    }
    if (!syncable) {
        return {
            action: 'skip-below-rubicon',
            reason: `status ${cv.status ?? 0} is below confirmed (${STATUS.CONFIRMED}) — local-only by design`,
            conflict: false,
        }
    }

    // ── past the rubicon, not yet in Odoo ───────────────────────────────────
    if (!cv.odoo_xmlid || !odoo) {
        return {
            action: 'create-in-odoo',
            reason: cv.odoo_xmlid
                ? `odoo_xmlid ${cv.odoo_xmlid} is set but Odoo has no such event — recreating`
                : 'past the rubicon with no odoo_xmlid — creating in Odoo',
            conflict: false,
        }
    }

    // ── both sides exist · who moved since the last reconcile? ──────────────
    const since = opts.lastSyncedAt ?? null
    const odooMoved = since ? odoo.write_date > since : true
    const cvMoved = since ? !!opts.cvChangedAt && opts.cvChangedAt > since : !!opts.cvChangedAt

    if (odooMoved && cvMoved) {
        // HD: Odoo always wins. The CV-side edit is discarded, so this is the one
        // outcome that loses work — it is flagged rather than silently applied.
        return {
            action: 'pull-from-odoo',
            reason: 'both sides changed since the last sync — Odoo wins, the CV edit is discarded',
            conflict: true,
        }
    }
    if (odooMoved) {
        return { action: 'pull-from-odoo', reason: 'only Odoo changed', conflict: false }
    }
    if (cvMoved) {
        return { action: 'push-to-odoo', reason: 'only CV changed', conflict: false }
    }
    return { action: 'noop', reason: 'neither side changed since the last sync', conflict: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-event lock
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-event locks, keyed by `odoo_xmlid` — the identity HD named as the basis,
 * and the only key that is stable across both systems (CV's `id` means nothing to
 * Odoo). Events with no xmlid yet are keyed by `cv:<id>` until they get one.
 *
 * In-memory, because with at most two instances there is nothing to coordinate
 * across processes. A real deployment that grew a third would need this in the DB
 * — stated here so that assumption is visible rather than buried.
 */
const locks = new Map<string, Promise<unknown>>()

export function lockKey(row: Pick<CvSyncRow, 'id' | 'odoo_xmlid'>): string {
    return row.odoo_xmlid ? `odoo:${row.odoo_xmlid}` : `cv:${row.id}`
}

/**
 * Run `task` with this event's lock held. Concurrent calls for the same event
 * queue; different events run in parallel.
 *
 * Chains onto whatever is already queued for the key rather than rejecting, so a
 * double-save cannot drop the second write — it just waits its turn.
 */
export async function withEventLock<T>(
    row: Pick<CvSyncRow, 'id' | 'odoo_xmlid'>,
    task: () => Promise<T>,
): Promise<T> {
    const key = lockKey(row)
    const previous = locks.get(key) ?? Promise.resolve()
    // Swallow the predecessor's rejection: one failed sync must not poison the
    // queue for every later sync of the same event.
    const run = previous.catch(() => undefined).then(task)
    locks.set(key, run)
    try {
        return await run
    } finally {
        // Only clear if nothing else queued behind us in the meantime.
        if (locks.get(key) === run) locks.delete(key)
    }
}

/** Test/diagnostic hook: how many events currently hold a lock. */
export function activeLockCount(): number {
    return locks.size
}
