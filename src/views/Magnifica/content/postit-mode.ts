/**
 * Magnifica post-it page-mode · the per-page reading-strategy switch (HM 2026-06-06).
 *
 * A page provides one mode via `provide(MAGNIFICA_POSTIT_MODE, 'scientific' | 'playful')`;
 * every `<CalloutPhrase>` on the page injects it (default 'playful'). The mode steers
 * how the shared `<FloatingPostIt>` popover behaves:
 *
 *   - 'scientific'  → on a viewport wider than SCIENTIFIC_MIN_WIDTH the popover opens to
 *     the RIGHT (fpostit hlogic 'right'), vertically aligned to the trigger, so the prose
 *     (left) and its glosses (right) form a two-lane close-reading surface. No tilt.
 *     Below the breakpoint it falls back to the near-trigger 'element' popover.
 *   - 'playful'     → near-trigger 'element' popover with a subtle, stable random tilt.
 *
 * The strategies are documented for successors in
 * `dev/Act26/06-06_DEVDOC_post-its_master.md` (+ the per-strategy DEVDOCs).
 */

import type { InjectionKey } from 'vue'

export type MagnificaPostitMode = 'scientific' | 'playful'

/** provide/inject key for the page-level post-it mode. */
export const MAGNIFICA_POSTIT_MODE: InjectionKey<MagnificaPostitMode> = Symbol('magnifica-postit-mode')

/**
 * Viewport-width (px) above which 'scientific' mode opens post-its in the right lane.
 * Sits in the 1280–1450 desktop band; adjust to a shared CSS breakpoint if one is
 * later centralized. Below it, scientific falls back to the near-trigger popover.
 */
export const SCIENTIFIC_MIN_WIDTH = 1280
