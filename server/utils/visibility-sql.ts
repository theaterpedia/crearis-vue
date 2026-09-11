/**
 * visibility-sql — the publication predicate, expressed ONCE for SQL callers.
 *
 * WHY THIS FILE EXISTS. `status` is a HYBRID (CV-Schema's audit): ordinal-compare
 * the MASKED low 17 bits, and bound out archived/trash because they sort above
 * RELEASED. `src/utils/status-constants.ts` owns that predicate for JS callers
 * (`isPublished`), and R·4·4 collapsed three disagreeing JS implementations onto
 * it. The two list endpoints then held **hand-written SQL twins** of the same
 * predicate, differing only in a table alias — i.e. exactly the shape R·4·4 had
 * just finished removing, one layer down. This is that lesson applied where it
 * recurred (system-architecture C2b·3·①: *„as one shared SQL predicate helper,
 * not a third inline copy"*).
 *
 * ⚠ BEHAVIOUR-IDENTICAL to what the two endpoints did inline. It is a
 * single-sourcing, not a policy change — deliberately, because the policy
 * question (should the ENTITY carry a floor too?) is HD's and the owners', not
 * this helper's. See `entityVisibility` below: it is the seam that decision
 * lands on, and it is one call, not a third copy.
 */

import { STATUS, WORKFLOW_MASK } from '../../src/utils/status-constants'

/** A SQL fragment plus the params it consumes, in order. */
export interface SqlPredicate {
    sql: string
    params: unknown[]
}

/**
 * „This project is published" — masked, bounded, alias-parameterised.
 *
 * @param alias the table alias the `projects` row carries in the query
 *              (`p.` in the events endpoint, `pr.` in the posts one)
 * @param floor the lowest lifecycle value that counts as visible. RELEASED by
 *              default; the `alpha_preview` escape widens it to DRAFT so an
 *              editor can preview an unpublished project. **The param names are
 *              historical** — see the deprecation note at the call sites.
 */
export function projectVisibility(alias: string, floor: number = STATUS.RELEASED): SqlPredicate {
    return {
        sql: ` AND (${alias}.status & ${WORKFLOW_MASK}) >= ? AND (${alias}.status & ${WORKFLOW_MASK}) < ${STATUS.ARCHIVED}`,
        params: [floor],
    }
}

/**
 * „This ENTITY is published" — the same predicate on the row itself.
 *
 * 🔴 **NOT CALLED YET, and that is a recorded state rather than an omission.**
 * Today both list endpoints gate the PROJECT and never the entity, so every
 * draft row of a released project is publicly readable (measured on uia:
 * 4 events at 512/64/64/64 and 3 posts at 64 all served anonymously —
 * system-architecture C2b·2). Closing that hole **empties a live tenant's public
 * page until its content is published**, which makes it a content decision for
 * HD and the owners, not a predicate an implementer picks (C2b·4).
 *
 * ⇒ this export exists so that decision costs ONE call at each site rather than
 * a third hand-written twin. `entityVisibility('e')` in the events endpoint and
 * `entityVisibility('p')` in the posts one is the whole change.
 */
export function entityVisibility(alias: string, floor: number = STATUS.RELEASED): SqlPredicate {
    return projectVisibility(alias, floor)
}
