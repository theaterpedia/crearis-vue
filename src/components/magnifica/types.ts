/**
 * Magnifica · shared types + small parse-helpers extracted from the SFCs.
 *
 * Vue 3.5 `<script setup>` does not allow `export function`/`export const`
 * top-level (ES-module-export grammar conflicts with the compile-time
 * variable-hoist). Pure helpers + shared types live here instead.
 *
 * Per CV@wsl dispatch #4 (TO (website) 2026-06-02 DI).
 */

import type { PostitColor } from '@/fpostit/types'

export type PostItThemeColorNew = 'yellow' | 'green' | 'pink' | 'dim'
export type PostItThemeColor2022 = 'primary' | 'secondary' | 'accent' | 'warn'
export type PostItThemeColor = PostItThemeColorNew | PostItThemeColor2022

/** 2022→new theme-color aliases per howto §7 port-map. */
export const THEME_ALIAS: Record<PostItThemeColor2022, PostItThemeColorNew> = {
    primary: 'yellow',
    secondary: 'green',
    accent: 'pink',
    warn: 'dim',
}

/** Normalize `themeColor` (new or 2022-alias) to the new naming. */
export function normalizeTheme(c: PostItThemeColor): PostItThemeColorNew {
    if (c === 'primary' || c === 'secondary' || c === 'accent' || c === 'warn') {
        return THEME_ALIAS[c]
    }
    return c
}

/**
 * Map a magnifica theme-color (new or 2022-alias) to an fpostit OKLCH `PostitColor`,
 * so magnifica content renders through the shared fpostit theme tokens instead of
 * hardcoded hex. yellow→primary · green→positive · pink→negative · dim→dimmed.
 */
export function magnificaToFpostitColor(c: PostItThemeColor = 'yellow'): PostitColor {
    switch (normalizeTheme(c)) {
        case 'green': return 'positive'
        case 'pink': return 'negative'
        case 'dim': return 'dimmed'
        case 'yellow':
        default: return 'primary'
    }
}

/**
 * Parse 2022 Tailwind margin-token `mt-X` to `(X * 0.25)rem` per howto §7
 * port-map. Returns undefined if not a recognized `mt-N` token.
 */
export function parseClassesMarginTop(token: string | undefined): string | undefined {
    if (!token) return undefined
    const match = /^mt-(\d+)$/.exec(token.trim())
    if (!match) return undefined
    const n = Number(match[1])
    if (!Number.isFinite(n)) return undefined
    return `${n * 0.25}rem`
}

/**
 * Normalize rotate input to a numeric degrees value. Accepts:
 *   - 2022-style sign-prefixed strings (`'+2'`, `'-3'`)
 *   - plain numeric strings (`'2'`)
 *   - JS numbers (`2`, `-3`)
 *   - undefined → 0
 *   - non-numeric → 0 (safe-default · won't surface confusing CSS values)
 */
export function parseRotateDeg(input: number | string | undefined): number {
    if (input === undefined || input === null) return 0
    if (typeof input === 'number') return input
    const trimmed = input.trim()
    const num = Number(trimmed)
    return Number.isFinite(num) ? num : 0
}

/** Focal vocab · Hero's aspect-engine, verbatim (one vocabulary across the family). */
export type BackSlideAlignX = 'left' | 'right' | 'center' | 'stretch' | 'cover'
export type BackSlideAlignY = 'top' | 'bottom' | 'center' | 'stretch' | 'cover'
/** Panel shape · backslide-thread §3. */
export type BackSlidePanelMode = 'panel' | 'none' | 'handle' | 'lane'

/**
 * One slide in a BackSlideStack · the cutter's per-beat output (backslide-thread §5).
 * `image` + focal are per-instance (HP: image-control right away); the rest may be left
 * to the stack-default. Mirrors BackSlide's own props (assembler binds these through).
 */
export interface BackSlideSpec {
    /** Image URL · always per-instance. */
    image: string
    /** Image alt-text · a11y. */
    imageAlt?: string
    /** Horizontal focal · falls back to the stack default, then BackSlide's 'cover'. */
    imgTmpAlignX?: BackSlideAlignX
    /** Vertical focal · falls back to the stack default, then BackSlide's 'bottom'. */
    imgTmpAlignY?: BackSlideAlignY
    /** Panel md ("overline **headline** subline") → HeadingParser→Heading. */
    panel?: string
    /** Panel shape · falls back to the stack default, then 'panel'. */
    panelMode?: BackSlidePanelMode
    /** Side-flip · image-right / panel-left. Falls back to the stack default. */
    imageRight?: boolean
    /** Panel color · falls back to the stack default, then 'yellow'. */
    theme?: PostItThemeColor
}

/**
 * Shape of an item in CardsCanvas's `items` array · mirrors the 2022
 * JSON-items pattern but type-checked here.
 */
export interface CardsCanvasItem {
    /** Component-name string for parity with the 2022 contract. Defaults to PostIt; ignored at render-time (we always render PostIt for v1 of the port). */
    component?: string
    /** Props forwarded to the resolved component. */
    props: {
        overline?: string
        headline?: string
        bodyText?: string
        image?: string
        imageAlt?: string
        themeColor?: PostItThemeColor
        top?: string
        left?: string
        rotate?: number | string
        classes?: string
        [k: string]: unknown
    }
    /** Optional v-for key override. Default uses the array index. */
    key?: string | number
}
