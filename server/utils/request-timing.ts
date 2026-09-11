/**
 * Request-timing accumulator — the PURE half (R·4·6, ahead-set).
 *
 * Separated from the middleware on purpose, following this house's own seam
 * convention (`resolveHostMode`, `decideVerifyOutcome`, `hydrateUserProject`):
 * the decision is a plain module the unit-suite can cover without a server,
 * and the middleware is the thin h3 wrapper that feeds it. The split is not
 * cosmetic — `h3` does not resolve in the vitest client environment, so logic
 * living beside the handler is logic no test can reach.
 *
 * 🔴 CHEAP PATH ONLY. The Odoo web session never enters this process (nginx
 * routes `/web/*` straight to Odoo), so these numbers are one half of the
 * cheap/expensive comparison. Deriving a ratio from them alone is the blended
 * figure CM-A6·4 names as a trap. The expensive half belongs to the A6
 * dispatch (CV@prod + CO@prod).
 */

/** Latency buckets in ms — coarse on purpose; p95 from buckets, not a sorted array. */
const BUCKET_BOUNDS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500] as const

export interface PathClassStats {
    /** How many requests were measured in this class. */
    sampled: number
    /** Sum of durations, for the mean. */
    totalMs: number
    /** Longest single request seen. */
    maxMs: number
    /** Counts per bucket; the last entry is „above the highest bound". */
    buckets: number[]
}

/**
 * The classes worth separating. `graphql` is the cheap path the single-box
 * horizon rests on; `api` is CV's own data-plane; `shell` is SPA-document
 * serving (SSR meta-injection lives there, so it is the one that grows).
 */
export type PathClass = 'graphql' | 'api' | 'shell' | 'asset'

/** Pure classifier — exported so the unit-suite covers it without a server. */
export function classifyPath(pathname: string): PathClass | null {
    if (pathname.startsWith('/api/odoo/graphql')) return 'graphql'
    if (pathname.startsWith('/api/')) return 'api'
    if (pathname.startsWith('/assets/') || /\.[a-z0-9]{2,4}$/i.test(pathname)) return 'asset'
    return 'shell'
}

function emptyStats(): PathClassStats {
    return { sampled: 0, totalMs: 0, maxMs: 0, buckets: new Array(BUCKET_BOUNDS.length + 1).fill(0) }
}

const stats: Record<PathClass, PathClassStats> = {
    graphql: emptyStats(),
    api: emptyStats(),
    shell: emptyStats(),
    asset: emptyStats(),
}

const since = new Date().toISOString()

/** Record one observation. Pure-ish; exported for the unit-suite. */
export function record(pathClass: PathClass, durationMs: number): void {
    const s = stats[pathClass]
    if (!s) return
    s.sampled += 1
    s.totalMs += durationMs
    if (durationMs > s.maxMs) s.maxMs = durationMs
    const index = BUCKET_BOUNDS.findIndex((bound) => durationMs <= bound)
    s.buckets[index === -1 ? BUCKET_BOUNDS.length : index] += 1
}

/** p95 read off the buckets — the UPPER bound of the bucket p95 falls into. */
function p95From(s: PathClassStats): number | null {
    if (!s.sampled) return null
    const target = Math.ceil(s.sampled * 0.95)
    let seen = 0
    for (let i = 0; i < s.buckets.length; i++) {
        seen += s.buckets[i] ?? 0
        if (seen >= target) return BUCKET_BOUNDS[i] ?? Infinity
    }
    return Infinity
}

/** The readable snapshot — consumed by `GET /api/dev/timing`. */
export function timingSnapshot() {
    const classes = (Object.keys(stats) as PathClass[]).map((name) => {
        const s = stats[name]
        return {
            class: name,
            sampled: s.sampled,
            meanMs: s.sampled ? Math.round((s.totalMs / s.sampled) * 10) / 10 : null,
            p95Ms: p95From(s),
            maxMs: s.sampled ? Math.round(s.maxMs) : null,
        }
    })
    return {
        since,
        note: 'CHEAP PATH ONLY — the Odoo web session never enters this process (R·4·6).',
        bucketBoundsMs: BUCKET_BOUNDS,
        classes,
    }
}
