/**
 * Per-domaincode theme overrides.
 *
 * HD 2026-08-06 (uia round): a site keeps its base theme (switchable via the
 * ThemeDropdown — HP compares), but individual design tokens are overwritten
 * per domaincode. First token: the font (uia runs theme 3's colors with
 * Cantarell). The same mechanism later carries other tokens, especially
 * `--color-*` — which is why `vars` is the same CSS-custom-property shape the
 * themes themselves emit, not a font-specific field.
 *
 * The base themes are NOT altered — `server/themes/*.json` stays central and
 * shared. An override rides on top of whatever theme is active on that site:
 * `useTheme` re-applies `vars` after every theme-vars application, so a theme
 * switch cannot silently shed the site's font.
 *
 * `inverted` replaces the *theme's own* inverted default at theme-application
 * time (uia defaults to dark). A user's explicit invert-toggle still wins until
 * the next theme switch — the override sets the default, it does not lock the
 * mode.
 *
 * Note: `useTheme.setTheme` declares a not-yet-implemented `scope: 'site'`
 * (param = domaincode). This registry is a first concrete step toward that
 * seam, deliberately shaped so a later `site` scope can consume it unchanged.
 */

export interface DomainThemeOverride {
    /**
     * CSS custom properties applied AFTER the active theme's vars — same key
     * shape as ThemeVars (`--font`, `--font-headings`, `--color-*`, …).
     */
    vars?: Record<string, string>
    /** Replaces the theme's own inverted default for this site when set. */
    inverted?: boolean
}

export const DOMAIN_THEME_OVERRIDES: Record<string, DomainThemeOverride> = {
    // uia · HD 2026-08-06: theme 3 „Institut" colors as on the uia_demo tag,
    // but Cantarell instead of Roboto, and the site defaults to dark.
    utopiaxaction: {
        vars: { '--font': "'Cantarell', sans-serif" },
        inverted: true,
    },
}

/** Lookup helper — `null` for domains without an override. */
export function getDomainThemeOverride(domaincode: string | null | undefined): DomainThemeOverride | null {
    if (!domaincode) return null
    return DOMAIN_THEME_OVERRIDES[domaincode] ?? null
}
