/**
 * GET /api/dev/sync — DEV-ONLY. Drive and inspect the mocked Odoo↔CV sync.
 *
 * Without this, half of a 2-way sync is undemonstrable on a box with no Odoo:
 * you can watch CV push, but never watch Odoo win. Simulating the Odoo-side edit
 * is the only way to exercise the conflict rule end-to-end.
 *
 * Same three guards as `/api/dev/login-as` (see `server/utils/dev-login-guard.ts`):
 * not-production · `DEV_LOGIN` token ≥16 chars · `?key=` must match. Any failure
 * returns a bare 404.
 *
 * Actions:
 *   ?key=…                                  → dump what "Odoo" holds
 *   ?key=…&action=sync&table=events&id=3    → reconcile one row, return the decision
 *   ?key=…&action=odoo-edit&table=events&id=3&name=Changed%20in%20Odoo
 *                                           → simulate an Odoo-side edit
 *
 * Read-oriented (GET) so it is one paste in a browser. Acceptable because it is
 * dev-only, token-gated, and touches nothing but the in-memory mock plus the row
 * the sync would have touched anyway.
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../database/init'
import { denyReason } from '../../utils/dev-login-guard'
import { EVENT_SYNC, POST_SYNC, isSyncMockEnabled, syncRow } from '../../utils/odooSyncRunner'
import { odooDump, odooSimulateEdit, type SyncEntitySpec } from '../../utils/odooSyncStore'

function specFor(table: string): SyncEntitySpec {
    if (table === 'posts') return POST_SYNC
    return EVENT_SYNC
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    const denied = denyReason({
        nodeEnv: process.env.NODE_ENV,
        devLogin: process.env.DEV_LOGIN,
        key: query.key ? String(query.key) : undefined,
    })
    if (denied) {
        console.warn(`[dev/sync] denied · reason=${denied}`)
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }

    if (!isSyncMockEnabled()) {
        return {
            success: false,
            message: 'ODOO_SYNC_MOCK is not set to 1 — the mocked sync is switched off, '
                + 'so writes are not being reconciled. Start the backend with ODOO_SYNC_MOCK=1.',
        }
    }

    const table = String(query.table ?? 'events')
    const spec = specFor(table)
    const action = String(query.action ?? 'dump')

    if (action === 'dump') {
        return {
            success: true,
            odoo: {
                events: odooDump(EVENT_SYNC),
                posts: odooDump(POST_SYNC),
            },
        }
    }

    const id = Number(query.id)
    if (!id) throw createError({ statusCode: 400, message: 'id is required for this action' })

    if (action === 'sync') {
        const outcome = await syncRow(spec, id)
        if (!outcome) throw createError({ statusCode: 404, message: `${table}#${id} not found` })
        return { success: true, outcome }
    }

    if (action === 'odoo-edit') {
        const row = await db.get<Record<string, unknown>>(
            `SELECT ${spec.identityColumn} AS identity FROM ${table} WHERE id = ?`, [id],
        )
        const identity = row?.identity as string | null
        if (!identity) {
            throw createError({
                statusCode: 400,
                message: `${table}#${id} has no ${spec.identityColumn} yet — it has never synced, `
                    + 'so there is nothing on the Odoo side to edit. Sync it first.',
            })
        }
        // Only the fields this entity actually syncs; anything else would be a
        // change the sync could never carry back, i.e. a misleading demo.
        const changes: Record<string, unknown> = {}
        for (const field of spec.syncFields) {
            if (query[field] !== undefined) changes[field] = String(query[field])
        }
        if (Object.keys(changes).length === 0) {
            throw createError({
                statusCode: 400,
                message: `pass at least one syncable field to change: ${spec.syncFields.join(', ')}`,
            })
        }
        const updated = odooSimulateEdit(spec, identity, changes, new Date().toISOString())
        return { success: true, message: `simulated an Odoo-side edit on ${identity}`, odoo: updated }
    }

    throw createError({ statusCode: 400, message: `unknown action '${action}' — use dump | sync | odoo-edit` })
})
