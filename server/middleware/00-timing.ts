/**
 * Request-timing instrumentation — the h3 wrapper (R·4·6, ahead-set).
 *
 * All logic lives in `server/utils/request-timing.ts` so the unit-suite can
 * reach it (h3 does not resolve in the vitest client environment). This file
 * is only: when did the request start, which class is it, record on finish.
 *
 * ── What it is, and what it deliberately is not ──────────────────────────────
 * CM-A6·5 asks for a monitored series rather than a one-shot number, and names
 * *„graphql request-rate and its p95 latency"* as a metric. This produces it as
 * a side-effect of running, so the series starts accumulating the day uia
 * deploys rather than the day someone schedules a measurement.
 *
 * 🔴 It measures the CHEAP HALF only — see the utils docblock.
 *
 * ── Failure discipline ──────────────────────────────────────────────────────
 * A timing wrapper that can break a request is worse than no timing, so every
 * path is guarded and nothing throws into the request. Its OWN failure mode —
 * recording nothing — looks exactly like a quiet system, which is what
 * `GET /api/dev/timing` exists to distinguish (`sampled: 0` = dead instrument).
 *
 * Revert = delete this file, `server/utils/request-timing.ts` and
 * `server/api/dev/timing.get.ts`.
 */

import { defineEventHandler, getRequestURL } from 'h3'
import { classifyPath, record } from '../utils/request-timing'

export default defineEventHandler((event) => {
    try {
        const started = performance.now()
        const pathClass = classifyPath(getRequestURL(event).pathname)
        if (!pathClass) return

        // `finish` fires once the response is fully written — the duration a
        // caller actually experiences, not the handler's own runtime.
        event.node?.res?.once?.('finish', () => {
            try {
                record(pathClass, performance.now() - started)
            } catch { /* a lost sample is not worth a broken response */ }
        })
    } catch { /* ditto — never throw out of the instrument */ }
})
