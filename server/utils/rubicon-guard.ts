/**
 * The Rubicon write-guard — CV's half of the ownership line.
 *
 * Implements **D4** of the cv↔odoo decision thread
 * (`hcv/threads/2026-08_graphql-and-sync-mock.md` §1):
 *
 *   > Below sysreg 512: **CV owns** it (local drafting, editable even with Odoo
 *   > down). At/above 512: **CV caches** it.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 * D4 was decided but **not enforced**. Verified 2026-07-30: `events/[id].patch.ts`
 * and `posts/[id].patch.ts` guard **authorship only** (creator ∥ project-owner ∥
 * `configrole === 8`) — no status check anywhere. So any authorised member could
 * write an at/above-512 row in CV.
 *
 * That write is silent *precisely because* D7 removed conflict detection: D6's
 * invalidation later re-queries Odoo and overwrites it, with no signal that
 * anything was lost. §5.4's lesson is about echo loops; this is the other failure
 * mode of the same seam — **a lossy overwrite with nobody watching.**
 *
 * This is the CV-side twin of the thread's §4.1 (*Odoo's write path does not
 * enforce the user's rights*). Both say the same thing: **the delegation has to be
 * real.**
 *
 * ── The rule keys on the row's CURRENT status, never the incoming one ────────
 * This is the whole design, and it is what makes the guard one line of policy:
 *
 *   · current < 512  → **allow.** CV owns it. This deliberately includes the write
 *     that *raises* status across 512 — the crossing itself originates in CV.
 *     `qmd://sfr/freundeskreis-dashboard-walkthrough.md:134`: *"HM clicks 'Announce
 *     project' OR 'Cross Rubicon' → sysreg crosses 512 → propagated-to-Odoo"*. The
 *     crossing is the handoff, and it is exactly what makes `odooSync` decide
 *     `create-in-odoo` and mint the identity. Refusing it would break the mechanism
 *     D4 depends on.
 *   · current >= 512 → **refuse.** Odoo owns it; CV holds a read copy. This covers
 *     content edits, status changes (including trying to pull a row back below the
 *     line — the door is one-way), and deletes.
 *
 * Creation is the one case with no current row, so it keys on the incoming status:
 * creating *directly* at/above 512 would have CV mint an entity Odoo should own
 * from birth, skipping the below-Rubicon phase entirely.
 *
 * ── Modes · implemented ahead, flagged down locally ──────────────────────────
 * `enforce` is the **default**, because it is the assumed prod behaviour and a
 * fresh deployment should fail safe. The devbox sets `CV_RUBICON_GUARD=warn` so the
 * existing TempDashboard testdrive — which is how the mocked sync is driven, and
 * how the live 512 row was made — keeps working while C4 lands the UI half.
 *
 * `warn` is not merely "off": an above-Rubicon CV write is a **violation of the
 * invariant D3 asserts**, so it is logged loudly and is real evidence for 1.0.
 * That is also the job `odooSync`'s `skip-unreconciled` branch now does — under
 * ParadigmB its decision core is no longer conflict *resolution* but **drift
 * detection on this same invariant**.
 */

import { isAtOrAboveRubicon, lifecycleStatus, RUBICON } from '../../src/utils/status-constants'

export type RubiconGuardMode = 'enforce' | 'warn' | 'off'

export type RubiconWriteKind = 'update' | 'delete' | 'create'

export interface RubiconVerdict {
    /** Whether the write may proceed. In `warn`/`off` this is true even when violating. */
    allowed: boolean
    /** True when the write crosses the ownership line, regardless of mode. */
    violates: boolean
    /** Human-readable, safe to put in a 403 body or a log line. */
    reason: string
}

/**
 * Resolve the mode from the environment.
 *
 * Unset ⇒ `enforce`. Fail-safe on purpose: a deployment that forgets the flag gets
 * the strict behaviour, not the permissive one. An unrecognised value is treated as
 * `enforce` for the same reason.
 */
export function resolveGuardMode(raw: string | undefined): RubiconGuardMode {
    if (raw === 'warn') return 'warn'
    if (raw === 'off') return 'off'
    return 'enforce'
}

/**
 * Decide whether a CV-side write is allowed to touch this row.
 *
 * @param currentStatus the status of the row **as it exists now** (null for `create`)
 * @param incomingStatus the status the write is asking for (only consulted for `create`)
 */
export function decideRubiconWrite(input: {
    kind: RubiconWriteKind
    currentStatus: number | null | undefined
    incomingStatus?: number | null | undefined
    mode: RubiconGuardMode
}): RubiconVerdict {
    const { kind, currentStatus, incomingStatus, mode } = input

    // Creation has no current row, so the incoming status is the only signal.
    const decidingStatus = kind === 'create' ? incomingStatus : currentStatus
    const violates = isAtOrAboveRubicon(decidingStatus)

    if (!violates) {
        return {
            allowed: true,
            violates: false,
            reason: `below the Rubicon (${lifecycleStatus(decidingStatus)} < ${RUBICON}) — CV owns this entity`,
        }
    }

    // Phrased as a STATEMENT ABOUT THE ENTITY, not as an action ("Refusing to…").
    // The same string is used in the enforce-mode 403 body and in the warn-mode log,
    // and in warn the write is *allowed* — a performative "Refusing to update" under
    // an "ALLOWED (mode=warn)" prefix reads as a contradiction, which would make the
    // warn log worthless as the 1.0 evidence it is supposed to be.
    const ordinal = lifecycleStatus(decidingStatus)
    const reason =
        kind === 'create'
            ? `status ${ordinal} is at or above the Rubicon (${RUBICON}): Odoo is the system of record `
              + `there, so CV must not mint the entity — create below ${RUBICON} and let the crossing hand it over.`
            : `status ${ordinal} is at or above the Rubicon (${RUBICON}): Odoo owns the data there and CV `
              + `holds a read copy — edit it in Odoo, or via the Odoo mutation.`

    return { allowed: mode !== 'enforce', violates: true, reason }
}

/**
 * Apply the guard at a write endpoint. Throws a 403 when it must refuse.
 *
 * Kept beside the pure decision so the endpoints stay one line each, and so the
 * *logging* of a violation happens in exactly one place — in `warn` mode the log
 * IS the deliverable, and a message that varies per call-site would be useless as
 * evidence.
 *
 * `createError` is injected rather than imported: this module stays free of `h3`,
 * which is nitro-provided and unresolvable from vitest — the same reason
 * `dev-login-guard.ts` is a pure module. A security boundary that can only be
 * tested by standing up a server is one that rots.
 */
export function assertRubiconWrite(input: {
    kind: RubiconWriteKind
    currentStatus: number | null | undefined
    incomingStatus?: number | null | undefined
    entity: string
    id: string | number
    createError: (opts: { statusCode: number; message: string }) => Error
    mode?: RubiconGuardMode
}): RubiconVerdict {
    const mode = input.mode ?? resolveGuardMode(process.env.CV_RUBICON_GUARD)
    const verdict = decideRubiconWrite({
        kind: input.kind,
        currentStatus: input.currentStatus,
        incomingStatus: input.incomingStatus,
        mode,
    })

    if (verdict.violates) {
        // Loud on purpose. In `warn` this is the entire signal, and it is evidence
        // for 1.0 that an above-Rubicon CV write path is still being exercised.
        console.warn(
            `[rubicon] ${mode === 'enforce' ? 'REFUSED' : 'ALLOWED (mode=' + mode + ')'} `
            + `${input.kind} ${input.entity}#${input.id} — ${verdict.reason}`,
        )
    }

    if (!verdict.allowed) {
        throw input.createError({
            statusCode: 403,
            message: `Cannot ${input.kind} ${input.entity}#${input.id}: ${verdict.reason}`,
        })
    }

    return verdict
}
