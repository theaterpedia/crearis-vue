/**
 * XML ID Helper Functions
 * These functions help parse and manipulate XML IDs in the format: project.entity.unique
 * Example: "tp.event.ws2025" where tp=project, event=entity, ws2025=unique identifier
 */

/**
 * Extract prefix fragments from XML ID
 * @param xmlId - Full XML ID (e.g., "tp.event.ws2025")
 * @param count - Number of fragments to extract (default: 2)
 * @returns Prefix string (e.g., "tp.event")
 */
export function getXmlIdPrefix(xmlId: string, count: number = 2): string {
    const parts = xmlId.split('.')
    return parts.slice(0, count).join('.')
}

/**
 * Extract specific fragment from XML ID
 * @param xmlId - Full XML ID (e.g., "tp.event.ws2025")
 * @param index - Fragment index (0=project, 1=entity, 2+=unique)
 * @returns Fragment string or undefined
 */
export function getXmlIdFragment(xmlId: string, index: number): string | undefined {
    const parts = xmlId.split('.')
    return parts[index]
}

/**
 * Check if XML ID matches any of the given prefixes
 * @param xmlId - Full XML ID
 * @param prefixes - Array of prefix strings
 * @returns True if matches any prefix
 */
export function matchesXmlIdPrefix(xmlId: string, prefixes: string[]): boolean {
    return prefixes.some(prefix => xmlId.startsWith(prefix))
}
