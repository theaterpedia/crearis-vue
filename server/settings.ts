/**
 * Server Settings and Configuration
 * 
 * Centralized configuration for server-side settings including:
 * - Fileset definitions and locations
 * - CSV data sources
 * - Server paths and directories
 */

import path from 'path'

/**
 * Fileset Configuration
 * A fileset is a collection of CSV files that define a complete dataset.
 * Different filesets can be used for different environments or data versions.
 */
export interface FilesetConfig {
    /** Unique identifier for the fileset */
    id: string
    /** Human-readable name */
    name: string
    /** Description of what this fileset contains */
    description: string
    /** Absolute path to the directory containing CSV files */
    path: string
    /** List of CSV files in this fileset */
    files: string[]
    /** Whether this is the default fileset */
    isDefault?: boolean
}

/**
 * Get the absolute path to the server data directory
 */
export function getDataPath(): string {
    return path.resolve(process.cwd(), 'server/data')
}

/**
 * Fileset Registry
 * Defines all available filesets
 */
export const filesets: Record<string, FilesetConfig> = {
    base: {
        id: 'base',
        name: 'Base Dataset',
        description: 'Base demo data from Odoo (_demo.* entities)',
        path: path.resolve(process.cwd(), 'server/data/base'),
        files: [
            'events.csv',
            'posts.csv',
            'locations.csv',
            'instructors.csv',
            'children.csv',
            'teens.csv',
            'adults.csv',
            'categories.csv'
        ],
        isDefault: true
    }
    // Additional filesets can be added here, e.g.:
    // production: { ... }
    // staging: { ... }
}

/**
 * Get fileset configuration by ID
 * @param filesetId - ID of the fileset to retrieve (defaults to 'base')
 * @returns FilesetConfig or throws error if not found
 */
export function getFileset(filesetId: string = 'base'): FilesetConfig {
    const fileset = filesets[filesetId]

    if (!fileset) {
        const available = Object.keys(filesets).join(', ')
        throw new Error(
            `Fileset '${filesetId}' not found. Available filesets: ${available}`
        )
    }

    return fileset
}

/**
 * Get the default fileset
 */
export function getDefaultFileset(): FilesetConfig {
    const defaultFileset = Object.values(filesets).find(fs => fs.isDefault)
    return defaultFileset || filesets.base
}

/**
 * Validate if a file is part of a fileset
 * @param filename - Name of the CSV file
 * @param filesetId - ID of the fileset (defaults to 'base')
 * @returns true if file is in the fileset
 * @throws Error if file is not in the fileset
 */
export function validateFileInFileset(filename: string, filesetId: string = 'base'): boolean {
    const fileset = getFileset(filesetId)

    if (!fileset.files.includes(filename)) {
        throw new Error(
            `File '${filename}' is not part of fileset '${filesetId}'. ` +
            `Available files: ${fileset.files.join(', ')}`
        )
    }

    return true
}

/**
 * Get the full path to a CSV file in a fileset
 * @param filename - Name of the CSV file
 * @param filesetId - ID of the fileset (defaults to 'base')
 * @returns Absolute path to the CSV file
 */
export function getFilesetFilePath(filename: string, filesetId: string = 'base'): string {
    validateFileInFileset(filename, filesetId)
    const fileset = getFileset(filesetId)
    return path.join(fileset.path, filename)
}

/**
 * Entity to CSV file mapping
 * Maps database entity names to their corresponding CSV files
 */
export const entityFileMapping: Record<string, string> = {
    events: 'events.csv',
    posts: 'posts.csv',
    locations: 'locations.csv',
    instructors: 'instructors.csv',
    children: 'children.csv',
    teens: 'teens.csv',
    adults: 'adults.csv',
    participants: 'children.csv', // Generic - actual type determined by 'type' field
}

/**
 * Get CSV filename for an entity type
 */
export function getEntityFile(entityType: string): string {
    const filename = entityFileMapping[entityType]
    if (!filename) {
        throw new Error(`No CSV file mapping found for entity type: ${entityType}`)
    }
    return filename
}
