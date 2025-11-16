/**
 * Generate TypeScript type definitions from schema definition JSON
 * 
 * Usage:
 *   npx tsx server/database/generate-types-from-schema.ts [version]
 *   npx tsx server/database/generate-types-from-schema.ts 0.0.2
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Type mapping from PostgreSQL types to TypeScript types
const TYPE_MAP: Record<string, string> = {
    'INTEGER': 'number',
    'TEXT': 'string',
    'BOOLEAN': 'boolean',
    'JSONB': 'Record<string, any>',
    'JSON': 'Record<string, any>',
    'TIMESTAMP WITHOUT TIME ZONE': 'string',
    'TIMESTAMP': 'string',
    'DATE': 'string',
    'TIME': 'string',
    'REAL': 'number',
    'DOUBLE PRECISION': 'number',
    'NUMERIC': 'number',
    'SERIAL': 'number',
    'BIGINT': 'number',
    'SMALLINT': 'number',
}

interface ColumnDefinition {
    type: string
    nullable: boolean
    primaryKey?: boolean
    default?: string
}

interface TableDefinition {
    description: string
    columns: Record<string, ColumnDefinition>
}

interface SchemaDefinition {
    version: string
    schemaVersion: number
    generatedAt: string
    description: string
    tables: Record<string, TableDefinition>
    databaseDifferences?: any
}

function mapPostgreSQLTypeToTS(pgType: string): string {
    // Handle array types
    if (pgType.endsWith('[]')) {
        const baseType = pgType.slice(0, -2)
        return `${TYPE_MAP[baseType] || 'any'}[]`
    }

    return TYPE_MAP[pgType] || 'any'
}

function generateInterfaceName(tableName: string): string {
    // Convert table name to PascalCase interface name
    // e.g., "event_instructors" -> "EventInstructorsTableFields"
    const parts = tableName.split('_')
    const pascalCase = parts.map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
    ).join('')
    return `${pascalCase}TableFields`
}

function generateInterface(tableName: string, table: TableDefinition): string {
    const interfaceName = generateInterfaceName(tableName)
    const lines: string[] = []

    lines.push(`/**`)
    lines.push(` * ${table.description}`)
    lines.push(` * Table: ${tableName}`)
    lines.push(` */`)
    lines.push(`export interface ${interfaceName} {`)

    // Sort columns: primary key first, then alphabetically
    const entries = Object.entries(table.columns)
    const pkEntries = entries.filter(([_, col]) => col.primaryKey)
    const otherEntries = entries.filter(([_, col]) => !col.primaryKey).sort((a, b) => a[0].localeCompare(b[0]))
    const sortedEntries = [...pkEntries, ...otherEntries]

    for (const [columnName, column] of sortedEntries) {
        const tsType = mapPostgreSQLTypeToTS(column.type)
        const optional = column.nullable ? '?' : ''
        const nullableType = column.nullable ? ` | null` : ''

        // Add comment with database type info
        const comments: string[] = []
        if (column.primaryKey) comments.push('PRIMARY KEY')
        if (column.default) comments.push(`default: ${column.default}`)
        if (columnName.endsWith('_display')) comments.push('GENERATED COLUMN (read-only)')

        const comment = comments.length > 0 ? ` // ${comments.join(', ')}` : ''

        lines.push(`    ${columnName}${optional}: ${tsType}${nullableType}${comment}`)
    }

    lines.push(`}`)
    lines.push(``)

    return lines.join('\n')
}

function generateTypes(schema: SchemaDefinition): string {
    const lines: string[] = []

    // Header
    lines.push(`/**`)
    lines.push(` * Database Table Field Types`)
    lines.push(` * `)
    lines.push(` * AUTO-GENERATED from schema definition v${schema.version}`)
    lines.push(` * Generated at: ${new Date().toISOString()}`)
    lines.push(` * `)
    lines.push(` * SCHEMA_REGISTRY: server/database/schema-definitions/v${schema.version}.json`)
    lines.push(` * `)
    lines.push(` * DO NOT EDIT MANUALLY - regenerate using:`)
    lines.push(` * npx tsx server/database/generate-types-from-schema.ts ${schema.version}`)
    lines.push(` * `)
    lines.push(` * These types represent the actual columns in the database tables.`)
    lines.push(` * Keep these in sync with the database schema by regenerating after migrations.`)
    lines.push(` * `)
    lines.push(` * Usage:`)
    lines.push(` * - Use these types when preparing data for INSERT/UPDATE operations`)
    lines.push(` * - Ensures type safety and prevents referencing non-existent columns`)
    lines.push(` */`)
    lines.push(``)

    // Generate interfaces for all tables
    const tableNames = Object.keys(schema.tables).sort()
    for (const tableName of tableNames) {
        const table = schema.tables[tableName]
        lines.push(generateInterface(tableName, table))
    }

    // Generate type guard functions
    lines.push(`// Type guard functions`)
    lines.push(``)

    for (const tableName of tableNames) {
        const interfaceName = generateInterfaceName(tableName)
        const columns = Object.keys(schema.tables[tableName].columns)

        lines.push(`export function isValid${interfaceName.replace('TableFields', '')}Field(key: string): key is keyof ${interfaceName} {`)
        lines.push(`    const validFields: (keyof ${interfaceName})[] = [`)
        lines.push(`        ${columns.map(col => `'${col}'`).join(', ')}`)
        lines.push(`    ]`)
        lines.push(`    return validFields.includes(key as keyof ${interfaceName})`)
        lines.push(`}`)
        lines.push(``)
    }

    // Generate helper function
    lines.push(`/**`)
    lines.push(` * Filter an object to only include fields that exist in the table`)
    lines.push(` * Useful for preparing data for INSERT/UPDATE operations`)
    lines.push(` */`)
    lines.push(`export function filterToTableFields<T extends Record<string, any>>(`)
    lines.push(`    data: T,`)
    lines.push(`    validFields: string[]`)
    lines.push(`): Partial<T> {`)
    lines.push(`    const filtered: Record<string, any> = {}`)
    lines.push(`    for (const key of validFields) {`)
    lines.push(`        if (key in data) {`)
    lines.push(`            filtered[key] = data[key]`)
    lines.push(`        }`)
    lines.push(`    }`)
    lines.push(`    return filtered as Partial<T>`)
    lines.push(`}`)
    lines.push(``)

    return lines.join('\n')
}

function main() {
    const version = process.argv[2] || '0.0.2'

    console.log(`📝 Generating TypeScript types from schema v${version}...`)

    // Read schema definition
    const schemaPath = join(__dirname, 'schema-definitions', `v${version}.json`)
    let schema: SchemaDefinition

    try {
        const schemaContent = readFileSync(schemaPath, 'utf-8')
        schema = JSON.parse(schemaContent)
    } catch (error) {
        console.error(`❌ Error reading schema file: ${schemaPath}`)
        console.error(error)
        process.exit(1)
    }

    console.log(`📋 Processing ${Object.keys(schema.tables).length} tables...`)

    // Generate TypeScript types
    const typesContent = generateTypes(schema)

    // Write to file
    const outputPath = join(__dirname, '../types', 'database.ts')
    writeFileSync(outputPath, typesContent, 'utf-8')

    console.log(`✅ TypeScript types generated: ${outputPath}`)
    console.log(`📊 Tables: ${Object.keys(schema.tables).length}`)
    console.log(`📊 Total columns: ${Object.values(schema.tables).reduce((sum, t) => sum + Object.keys(t.columns).length, 0)}`)
}

main()
