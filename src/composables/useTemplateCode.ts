/**
 * useTemplateCode — gate for shortcode-rendering on agenda-lines (and similar).
 *
 * SFR-76 / CV-BRIEF §2.4. Scaffolds the per-project flag without a DB migration:
 *   project.config.useTemplateCode: boolean (default false)
 *
 * project.config is JSONB on the projects table (per migration-015), so no
 * schema-migration is needed — the key is read defensively with a false-default.
 *
 * When `true`, agenda-line + similar surfaces render shortcodes like `A1:` next
 * to headlines. When `false`, an avatar or nothing renders instead. The toggle
 * is per-domaincode in Odoo; CV reads the flag from project.config (which acts
 * as the local jsonb cache of the Odoo domain-config).
 */

import { computed, type Ref } from 'vue'

export interface ProjectConfigWithTemplateCode {
    useTemplateCode?: boolean
    [key: string]: unknown
}

export interface ProjectLikeWithConfig {
    config?: ProjectConfigWithTemplateCode | null
    [key: string]: unknown
}

/**
 * Default value when the flag is absent on a project's config.
 * False = no shortcode (avatar or nothing). Matches CV-BRIEF §2.4 default.
 */
export const TEMPLATE_CODE_DEFAULT = false

/**
 * Read the useTemplateCode flag from a project ref. Returns a computed boolean.
 * Reactive — recomputes when project or its config changes.
 */
export function useTemplateCode(
    project: Ref<ProjectLikeWithConfig | null | undefined>,
): { useTemplateCode: Ref<boolean> } {
    const useTemplateCode = computed<boolean>(() => {
        const value = project.value?.config?.useTemplateCode
        return typeof value === 'boolean' ? value : TEMPLATE_CODE_DEFAULT
    })

    return { useTemplateCode }
}

/**
 * Pure read — useful for non-component contexts (server handlers, tests).
 */
export function readTemplateCode(
    project: ProjectLikeWithConfig | null | undefined,
): boolean {
    const value = project?.config?.useTemplateCode
    return typeof value === 'boolean' ? value : TEMPLATE_CODE_DEFAULT
}
