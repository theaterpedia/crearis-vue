/**
 * XMLID Utilities - Odoo-Aligned Format
 * 
 * Format: {domaincode}.{entity}__{slug}
 *         {domaincode}.{entity}-{template}__{slug}
 * 
 * Rules:
 * - domaincode: lowercase, may start with '_' (special projects), no '_' elsewhere, no '-'
 * - entity: lowercase, no '-', no '_', no special chars
 * - template: lowercase, no '-', no '_', no special chars (OPTIONAL)
 * - '-' ONLY allowed between entity and template
 * - '__' (double underscore) separates entity(-template) from slug
 * - slug: lowercase, no '-', no '__', single '_' allowed
 */

// Valid entities
export const VALID_ENTITIES = ['post', 'event', 'image', 'partner'] as const
export type EntityType = typeof VALID_ENTITIES[number]

// Common templates per entity
export const ENTITY_TEMPLATES: Record<EntityType, string[]> = {
    post: ['demo', 'featured', 'news', 'blog'],
    event: ['conference', 'workshop', 'online', 'kurs', 'projekt', 'hybrid'],
    image: ['adult', 'child', 'event', 'instructor', 'scene', 'location'],
    partner: ['user', 'instructor', 'location', 'organisation']
}

export interface XmlidComponents {
    domaincode: string
    entity: EntityType
    template?: string
    slug: string
}

export interface ParsedRouteIdentifier {
    type: 'xmlid' | 'id'
    xmlid?: string
    id?: number
    template?: string
    slug?: string
}

/**
 * Check if a string is a valid domaincode
 * - lowercase alphanumeric only
 * - may start with '_' (special projects like _demo, _start)
 * - no '_' in middle or end
 * - no '-'
 */
export function isValidDomaincode(domaincode: string): boolean {
    if (!domaincode || domaincode.length === 0) return false

    // Check for leading underscore (allowed for special projects)
    const hasLeadingUnderscore = domaincode.startsWith('_')
    const coreCode = hasLeadingUnderscore ? domaincode.slice(1) : domaincode

    // Core must be lowercase alphanumeric only
    if (!/^[a-z0-9]+$/.test(coreCode)) return false

    return true
}

/**
 * Check if a string is a valid entity or template name
 * - lowercase alphanumeric only
 * - no '-', no '_', no special chars
 */
export function isValidEntityOrTemplate(part: string): boolean {
    if (!part || part.length === 0) return false
    return /^[a-z0-9]+$/.test(part)
}

/**
 * Check if a string is a valid slug
 * - lowercase alphanumeric and single underscores
 * - no '-' (use '_' instead)
 * - no '__' (reserved as separator)
 * - no leading/trailing '_'
 */
export function isValidSlug(slug: string): boolean {
    if (!slug || slug.length === 0) return false

    // No hyphens allowed
    if (slug.includes('-')) return false

    // No double underscores (reserved separator)
    if (slug.includes('__')) return false

    // Must be lowercase alphanumeric with single underscores
    if (!/^[a-z0-9_]+$/.test(slug)) return false

    // No leading/trailing underscores
    if (slug.startsWith('_') || slug.endsWith('_')) return false

    return true
}

/**
 * Generate an Odoo-compliant slug from a title
 * - Converts to lowercase
 * - Replaces German umlauts
 * - Replaces spaces/hyphens with single underscores
 * - Removes special characters
 * - Collapses multiple underscores to single
 * - Trims underscores from start/end
 */
export function generateSlug(title: string, maxLength: number = 50): string {
    return title
        .toLowerCase()
        .trim()
        // German umlauts
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        // Spaces and hyphens to underscores
        .replace(/[\s\-]+/g, '_')
        // Remove non-alphanumeric except underscores
        .replace(/[^a-z0-9_]/g, '')
        // Collapse multiple underscores to single
        .replace(/_+/g, '_')
        // Trim underscores from start/end
        .replace(/^_|_$/g, '')
        // Max length
        .substring(0, maxLength)
}

/**
 * Parse an xmlid into its components
 * 
 * Format: {domaincode}.{entity}__{slug}
 *         {domaincode}.{entity}-{template}__{slug}
 */
export function parseXmlid(xmlid: string): XmlidComponents | null {
    if (!xmlid) return null

    // Split by '.' to get domaincode and rest
    const dotIndex = xmlid.indexOf('.')
    if (dotIndex === -1) return null

    const domaincode = xmlid.substring(0, dotIndex)
    const rest = xmlid.substring(dotIndex + 1)

    // Split rest by '__' to get entity(-template) and slug
    const doubleUnderscoreIndex = rest.indexOf('__')
    if (doubleUnderscoreIndex === -1) {
        // Legacy format with single dot separator - try to parse
        return parseLegacyXmlid(xmlid)
    }

    const entityPart = rest.substring(0, doubleUnderscoreIndex)
    const slug = rest.substring(doubleUnderscoreIndex + 2)

    // Check if entityPart has a template (separated by '-')
    const hyphenIndex = entityPart.indexOf('-')
    let entity: string
    let template: string | undefined

    if (hyphenIndex !== -1) {
        entity = entityPart.substring(0, hyphenIndex)
        template = entityPart.substring(hyphenIndex + 1)
    } else {
        entity = entityPart
        template = undefined
    }

    // Validate entity
    if (!VALID_ENTITIES.includes(entity as EntityType)) {
        return null
    }

    return {
        domaincode,
        entity: entity as EntityType,
        template,
        slug
    }
}

/**
 * Parse legacy xmlid format (for migration support)
 * 
 * Legacy: {domaincode}.{entity}_{template}.{slug}
 *         {domaincode}.{entity}.{slug}
 */
export function parseLegacyXmlid(xmlid: string): XmlidComponents | null {
    if (!xmlid) return null

    const parts = xmlid.split('.')
    if (parts.length < 2) return null

    const domaincode = parts[0]
    if (!domaincode) return null

    if (parts.length === 2) {
        // Format: {domaincode}.{slug} - minimal legacy format
        const slug = parts[1]
        if (!slug) return null
        return {
            domaincode,
            entity: 'post', // default
            slug
        }
    }

    // Format: {domaincode}.{entity}_{template}.{slug} or {domaincode}.{entity}.{slug}
    const entityPart = parts[1]
    if (!entityPart) return null

    const slug = parts.slice(2).join('.')

    // Check if entityPart has underscore (legacy template separator)
    const underscoreIndex = entityPart.indexOf('_')
    let entity: string
    let template: string | undefined

    if (underscoreIndex !== -1) {
        entity = entityPart.substring(0, underscoreIndex)
        template = entityPart.substring(underscoreIndex + 1)
    } else {
        entity = entityPart
        template = undefined
    }

    // Validate entity - be lenient for legacy
    if (!VALID_ENTITIES.includes(entity as EntityType)) {
        // Try to extract entity from compound
        for (const validEntity of VALID_ENTITIES) {
            if (entity.startsWith(validEntity)) {
                template = entity.substring(validEntity.length + 1) || template
                entity = validEntity
                break
            }
        }
    }

    if (!VALID_ENTITIES.includes(entity as EntityType)) {
        return null
    }

    return {
        domaincode,
        entity: entity as EntityType,
        template,
        slug
    }
}

/**
 * Build an xmlid from components
 * 
 * Output: {domaincode}.{entity}__{slug}
 *         {domaincode}.{entity}-{template}__{slug}
 */
export function buildXmlid(opts: {
    domaincode: string
    entity: EntityType
    template?: string
    slug: string
}): string {
    const { domaincode, entity, template, slug } = opts

    if (template) {
        return `${domaincode}.${entity}-${template}__${slug}`
    }
    return `${domaincode}.${entity}__${slug}`
}

/**
 * Convert a legacy xmlid to the new format
 */
export function convertLegacyXmlid(legacyXmlid: string): string | null {
    const parsed = parseLegacyXmlid(legacyXmlid)
    if (!parsed) return null

    // Clean up slug (remove hyphens, etc.)
    const cleanSlug = generateSlug(parsed.slug)

    return buildXmlid({
        domaincode: parsed.domaincode,
        entity: parsed.entity,
        template: parsed.template,
        slug: cleanSlug
    })
}

/**
 * Parse a route identifier (from URL params)
 * 
 * Formats:
 * - {slug}                    → xmlid: {domaincode}.{entity}__{slug}
 * - {template}__{slug}        → xmlid: {domaincode}.{entity}-{template}__{slug}
 * - {numeric_id}              → direct DB lookup
 */
export function parseRouteIdentifier(
    identifier: string,
    domaincode: string,
    entity: EntityType
): ParsedRouteIdentifier {
    if (!identifier) {
        return { type: 'id', id: undefined }
    }

    // Check if numeric ID
    const numericId = parseInt(identifier, 10)
    if (!isNaN(numericId) && String(numericId) === identifier) {
        return { type: 'id', id: numericId }
    }

    // Check if has template (contains __)
    const doubleUnderscoreIndex = identifier.indexOf('__')

    if (doubleUnderscoreIndex !== -1) {
        // Format: {template}__{slug}
        const template = identifier.substring(0, doubleUnderscoreIndex)
        const slug = identifier.substring(doubleUnderscoreIndex + 2)
        const xmlid = buildXmlid({ domaincode, entity, template, slug })
        return { type: 'xmlid', xmlid, template, slug }
    }

    // Format: {slug} only
    const xmlid = buildXmlid({ domaincode, entity, slug: identifier })
    return { type: 'xmlid', xmlid, slug: identifier }
}

/**
 * Extract the display slug from an xmlid (for URLs)
 * Returns either {slug} or {template}__{slug}
 */
export function extractRouteSlug(xmlid: string): string | null {
    const parsed = parseXmlid(xmlid)
    if (!parsed) return null

    if (parsed.template) {
        return `${parsed.template}__${parsed.slug}`
    }
    return parsed.slug
}

/**
 * Validate a complete xmlid
 */
export function isValidXmlid(xmlid: string): boolean {
    const parsed = parseXmlid(xmlid)
    if (!parsed) return false

    if (!isValidDomaincode(parsed.domaincode)) return false
    if (!isValidEntityOrTemplate(parsed.entity)) return false
    if (parsed.template && !isValidEntityOrTemplate(parsed.template)) return false
    if (!isValidSlug(parsed.slug)) return false

    return true
}

/**
 * Get entity type from page_type string (for page options)
 * 
 * page_type: 'post', 'post-demo', 'event', 'event-conference', etc.
 */
export function parsePageType(pageType: string): { entity: EntityType; template?: string } {
    if (!pageType) return { entity: 'post' }

    const hyphenIndex = pageType.indexOf('-')
    if (hyphenIndex !== -1) {
        const entity = pageType.substring(0, hyphenIndex)
        const template = pageType.substring(hyphenIndex + 1)
        if (VALID_ENTITIES.includes(entity as EntityType)) {
            return { entity: entity as EntityType, template }
        }
    }

    if (VALID_ENTITIES.includes(pageType as EntityType)) {
        return { entity: pageType as EntityType }
    }

    return { entity: 'post' }
}

/**
 * Build page_type from entity and template
 */
export function buildPageType(entity: EntityType, template?: string): string {
    if (template) {
        return `${entity}-${template}`
    }
    return entity
}
