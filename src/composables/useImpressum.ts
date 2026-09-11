/**
 * useImpressum — the per-project legal identity (Impressum + Datenschutz fields).
 *
 * SPEC + KEY REGISTRY: `hcv/threads/2026-08-impressum.md` (template with
 * fallback arrows + B's analysis, 2026-08-07). Read it before extending.
 *
 * WHY PER-PROJECT (HD's ruling): the imprint must name the actual
 * Diensteanbieter — Theaterpedia is not responsible for e.g. uia's content,
 * Rosa is. So `/impressum` on the root site and `/sites/:xyz/impressum` render
 * the SAME component over DIFFERENT identities.
 *
 * THE MINIMUM SET — 4 base keys, everything else falls back (deviation-only):
 *   impressum_company   → „Für:", Diensteanbieter, © line, Datenschutz-block
 *   impressum_name      → Ansprechperson · §-responsible · copyright (fallbacks)
 *   impressum_address   → Anschrift (multiline; render white-space: pre-line)
 *   impressum_email     → elektronische Post · Datenschutz-Auskunft (fallback)
 * Deviation keys: impressum_phone (absent = the line HIDES) ·
 *   impressum_datenschutz_email (tp: datenschutz@ ≠ info@) ·
 *   impressum_responsible_content (→ name + address) ·
 *   impressum_copyright (→ name).
 * Derived, never keys: homeUrl = location.origin (the page is always served
 *   under the responsible domain) · year = computed.
 *
 * CARRIER: the project's LANDING pages-row `page_options` (flat keys, written
 * only on deviation — the §9 key-registry discipline; 'landing' is a legal
 * page_type since migration 013, lazy-created like 5C's start-row).
 *
 * The Datenschutz page holds ZERO own keys — it cross-reads this set (HD's
 * ruling: „only configure the impressum and have the datenschutz cross-use").
 *
 * TP DEFAULTS: the root site's published imprint lives here as code-defaults so
 * both pages work with an unseeded DB; the moment the tp landing-row carries
 * keys, the keys win. For a NON-tp project without keys `missing` flips true —
 * the page must render an honest „noch nicht hinterlegt" note, NEVER the
 * Theaterpedia identity (that would be a wrong Diensteanbieter, the exact thing
 * the split exists to prevent).
 *
 * NEXT (breadcrumbs): the editor-fieldset for these keys is sister B's
 * batch-2 (landing-row guard-editor, uia thread §21·3); the tp/uia seed is
 * either one POST or set through that editor once it exists.
 */

import { computed, ref } from 'vue'

export interface ImpressumFields {
    company: string
    name: string
    /** Multiline — render with `white-space: pre-line`. */
    address: string
    email: string
    /** null → the whole phone line hides (template rule). */
    phone: string | null
    datenschutzEmail: string
    /** Journalistisch-redaktionelle Verantwortung — name + address by default. */
    responsibleContent: string
    copyright: string
    homeUrl: string
    year: number
}

/** The root site's published imprint — replaced by keys the moment they exist. */
const TP_DEFAULTS = {
    impressum_company: 'Theaterpedia - Netzwerk für Theaterpädagogik',
    impressum_name: 'Hans Dönitz',
    impressum_address: 'Fürtherstr. 174\n90429 Nürnberg',
    impressum_email: 'info @ theaterpedia .org',
    impressum_phone: '0911/7808476',
    impressum_datenschutz_email: 'datenschutz @ theaterpedia .org',
} as const

export const IMPRESSUM_ROOT_DOMAINCODE = 'tp'

export function useImpressum(domaincode: string) {
    const keys = ref<Record<string, unknown>>({})
    const loaded = ref(false)

    async function load() {
        try {
            const response = await fetch(`/api/pages/by-project?project_id=${encodeURIComponent(domaincode)}`)
            if (response.ok) {
                const data = await response.json()
                const rows: Array<{ page_type?: string; page_options?: Record<string, unknown> }> = data?.pages ?? []
                const landing = rows.find((row) => row.page_type === 'landing')
                keys.value = landing?.page_options ?? {}
            }
        } catch { /* keys stay empty — fallbacks decide */ }
        loaded.value = true
    }

    function str(key: string): string | null {
        const value = keys.value[key]
        if (typeof value === 'string' && value.trim()) return value.trim()
        // The root site falls back to its published code-defaults.
        if (domaincode === IMPRESSUM_ROOT_DOMAINCODE) {
            return (TP_DEFAULTS as Record<string, string>)[key] ?? null
        }
        return null
    }

    const fields = computed<ImpressumFields>(() => {
        const name = str('impressum_name') ?? ''
        const address = str('impressum_address') ?? ''
        const email = str('impressum_email') ?? ''
        return {
            company: str('impressum_company') ?? '',
            name,
            address,
            email,
            phone: str('impressum_phone'),
            datenschutzEmail: str('impressum_datenschutz_email') ?? email,
            responsibleContent: str('impressum_responsible_content')
                ?? [name, address.replace(/\n/g, ', ')].filter(Boolean).join(', '),
            copyright: str('impressum_copyright') ?? name,
            homeUrl: typeof window !== 'undefined' ? window.location.origin : '',
            year: new Date().getFullYear(),
        }
    })

    /** True for a non-root project without the base keys — render the honest note. */
    const missing = computed(() =>
        loaded.value && !(fields.value.company && fields.value.name && fields.value.email))

    return { fields, missing, loaded, load }
}
