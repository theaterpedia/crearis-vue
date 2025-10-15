/**
 * Database Structure Validation Test
 * 
 * Validates that both PostgreSQL and SQLite databases match the expected schema
 * definition for the current project version.
 * 
 * Usage:
 *   npx tsx server/database/check-structure.ts [version]
 *   
 * Examples:
 *   npx tsx server/database/check-structure.ts        # Uses version from package.json
 *   npx tsx server/database/check-structure.ts 0.0.1  # Tests specific version
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import pkg from 'pg'
const { Client } = pkg

const __dirname = dirname(fileURLToPath(import.meta.url))

interface ColumnInfo {
    type: string
    primaryKey?: boolean
    nullable?: boolean
    unique?: boolean
    default?: string
    check?: string
    foreignKey?: {
        table: string
        column: string
        onDelete?: string
    }
    description?: string
}

interface SchemaDefinition {
    version: string
    schemaVersion: number
    tables: {
        [tableName: string]: {
            description?: string
            columns: {
                [columnName: string]: ColumnInfo
            }
            indexes?: Array<{
                name: string
                columns: string[]
                unique?: boolean
            }>
            notes?: string
        }
    }
    databaseDifferences?: {
        postgresql?: any
        sqlite?: any
    }
}

interface ValidationResult {
    database: 'postgresql' | 'sqlite'
    version: string
    passed: boolean
    errors: string[]
    warnings: string[]
    tableResults: {
        [tableName: string]: {
            exists: boolean
            columnResults: {
                [columnName: string]: {
                    exists: boolean
                    errors: string[]
                }
            }
        }
    }
}

class DatabaseStructureValidator {
    private schemaDefinition: SchemaDefinition
    private version: string

    constructor(version: string) {
        this.version = version
        this.schemaDefinition = this.loadSchemaDefinition(version)
    }

    private loadSchemaDefinition(version: string): SchemaDefinition {
        const schemaPath = join(__dirname, 'schema-definitions', `v${version}.json`)
        try {
            const content = readFileSync(schemaPath, 'utf-8')
            return JSON.parse(content)
        } catch (error) {
            throw new Error(`Schema definition not found for version ${version}: ${schemaPath}`)
        }
    }

    async validatePostgreSQL(): Promise<ValidationResult> {
        console.log('🔍 Validating PostgreSQL database structure...\n')

        const client = new Client({
            user: process.env.DB_USER || 'crearis_admin',
            password: process.env.DB_PASSWORD || '7uqf9nE0umJmMMo',
            database: process.env.DB_NAME || 'crearis_admin_dev',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
        })

        await client.connect()

        const result: ValidationResult = {
            database: 'postgresql',
            version: this.version,
            passed: true,
            errors: [],
            warnings: [],
            tableResults: {}
        }

        try {
            // Get all tables
            const tablesQuery = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            `)
            const existingTables = tablesQuery.rows.map((r: any) => r.table_name)

            // Check each expected table
            for (const [tableName, tableSchema] of Object.entries(this.schemaDefinition.tables)) {
                const tableResult: any = {
                    exists: existingTables.includes(tableName),
                    columnResults: {}
                }

                if (!tableResult.exists) {
                    result.errors.push(`Table '${tableName}' does not exist`)
                    result.passed = false
                } else {
                    // Validate columns
                    const columnsQuery = await client.query(`
                        SELECT 
                            column_name,
                            data_type,
                            is_nullable,
                            column_default
                        FROM information_schema.columns
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                        ORDER BY ordinal_position
                    `, [tableName])

                    const existingColumns = columnsQuery.rows.map((r: any) => r.column_name)

                    // Check for known PostgreSQL-specific differences
                    const pgDifferences = this.schemaDefinition.databaseDifferences?.postgresql?.[tableName]
                    const additionalColumns = pgDifferences?.additionalColumns || []

                    for (const [columnName, columnSchema] of Object.entries(tableSchema.columns)) {
                        const columnResult = {
                            exists: existingColumns.includes(columnName),
                            errors: [] as string[]
                        }

                        if (!columnResult.exists) {
                            // Check if it's a SQLite-only column that shouldn't exist in PostgreSQL
                            const sqliteDifferences = this.schemaDefinition.databaseDifferences?.sqlite?.[tableName]
                            const missingInPostgres = sqliteDifferences?.missingColumns?.includes(columnName)

                            if (!missingInPostgres) {
                                columnResult.errors.push(`Column '${columnName}' does not exist`)
                                result.errors.push(`Table '${tableName}': Column '${columnName}' does not exist`)
                                result.passed = false
                            } else {
                                result.warnings.push(`Table '${tableName}': Column '${columnName}' not present (expected for SQLite-only)`)
                            }
                        }

                        tableResult.columnResults[columnName] = columnResult
                    }

                    // Check for unexpected columns
                    for (const existingColumn of existingColumns) {
                        if (!tableSchema.columns[existingColumn] && !additionalColumns.includes(existingColumn)) {
                            result.warnings.push(`Table '${tableName}': Unexpected column '${existingColumn}'`)
                        }
                    }
                }

                result.tableResults[tableName] = tableResult
            }

            // Check for unexpected tables
            const expectedTables = Object.keys(this.schemaDefinition.tables)
            for (const existingTable of existingTables) {
                if (!expectedTables.includes(existingTable)) {
                    result.warnings.push(`Unexpected table '${existingTable}'`)
                }
            }

        } finally {
            await client.end()
        }

        return result
    }

    async validateSQLite(dbPath: string = './demo-data.db'): Promise<ValidationResult> {
        console.log('🔍 Validating SQLite database structure...\n')

        const db = new Database(dbPath)

        const result: ValidationResult = {
            database: 'sqlite',
            version: this.version,
            passed: true,
            errors: [],
            warnings: [],
            tableResults: {}
        }

        try {
            // Get all tables
            const tablesQuery = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `).all()
            const existingTables = tablesQuery.map((r: any) => r.name)

            // Check each expected table
            for (const [tableName, tableSchema] of Object.entries(this.schemaDefinition.tables)) {
                const tableResult: any = {
                    exists: existingTables.includes(tableName),
                    columnResults: {}
                }

                if (!tableResult.exists) {
                    result.errors.push(`Table '${tableName}' does not exist`)
                    result.passed = false
                } else {
                    // Validate columns
                    const columnsQuery = db.prepare(`PRAGMA table_info(${tableName})`).all()
                    const existingColumns = columnsQuery.map((r: any) => r.name)

                    // Check for known SQLite-specific differences
                    const sqliteDifferences = this.schemaDefinition.databaseDifferences?.sqlite?.[tableName]
                    const missingColumns = sqliteDifferences?.missingColumns || []

                    for (const [columnName, columnSchema] of Object.entries(tableSchema.columns)) {
                        const columnResult = {
                            exists: existingColumns.includes(columnName),
                            errors: [] as string[]
                        }

                        if (!columnResult.exists) {
                            // Check if it's a known missing column in SQLite
                            if (!missingColumns.includes(columnName)) {
                                columnResult.errors.push(`Column '${columnName}' does not exist`)
                                result.errors.push(`Table '${tableName}': Column '${columnName}' does not exist`)
                                result.passed = false
                            } else {
                                result.warnings.push(`Table '${tableName}': Column '${columnName}' not present (expected difference)`)
                            }
                        }

                        tableResult.columnResults[columnName] = columnResult
                    }

                    // Check for unexpected columns
                    const expectedColumns = Object.keys(tableSchema.columns).filter(
                        col => !missingColumns.includes(col)
                    )
                    for (const existingColumn of existingColumns) {
                        if (!expectedColumns.includes(existingColumn)) {
                            result.warnings.push(`Table '${tableName}': Unexpected column '${existingColumn}'`)
                        }
                    }
                }

                result.tableResults[tableName] = tableResult
            }

            // Check for unexpected tables
            const expectedTables = Object.keys(this.schemaDefinition.tables)
            for (const existingTable of existingTables) {
                if (!expectedTables.includes(existingTable)) {
                    result.warnings.push(`Unexpected table '${existingTable}'`)
                }
            }

        } finally {
            db.close()
        }

        return result
    }

    printResult(result: ValidationResult) {
        console.log(`\n${'='.repeat(60)}`)
        console.log(`${result.database.toUpperCase()} Validation Results (v${result.version})`)
        console.log('='.repeat(60))

        if (result.passed) {
            console.log('✅ PASSED - Database structure matches schema definition\n')
        } else {
            console.log('❌ FAILED - Database structure does not match schema definition\n')
        }

        // Print errors
        if (result.errors.length > 0) {
            console.log('🔴 Errors:')
            result.errors.forEach(err => console.log(`   ${err}`))
            console.log('')
        }

        // Print warnings
        if (result.warnings.length > 0) {
            console.log('⚠️  Warnings:')
            result.warnings.forEach(warn => console.log(`   ${warn}`))
            console.log('')
        }

        // Print table summary
        console.log('📊 Table Summary:')
        const tables = Object.entries(result.tableResults)
        const existingTables = tables.filter(([_, t]) => t.exists).length
        console.log(`   Total tables: ${tables.length}`)
        console.log(`   Existing: ${existingTables}`)
        console.log(`   Missing: ${tables.length - existingTables}`)
        console.log('')
    }
}

async function main() {
    // Get version from command line or package.json
    let version = process.argv[2]

    if (!version) {
        const packageJson = JSON.parse(
            readFileSync(join(__dirname, '../../package.json'), 'utf-8')
        )
        version = packageJson.version
        console.log(`📦 Using version from package.json: ${version}\n`)
    } else {
        console.log(`📦 Testing version: ${version}\n`)
    }

    const validator = new DatabaseStructureValidator(version)

    try {
        // Validate PostgreSQL
        const pgResult = await validator.validatePostgreSQL()
        validator.printResult(pgResult)

        // Validate SQLite
        const sqliteResult = await validator.validateSQLite()
        validator.printResult(sqliteResult)

        // Final summary
        console.log('='.repeat(60))
        console.log('🎯 Final Summary')
        console.log('='.repeat(60))

        const allPassed = pgResult.passed && sqliteResult.passed
        if (allPassed) {
            console.log('✅ All databases passed validation')
            process.exit(0)
        } else {
            console.log('❌ One or more databases failed validation')
            console.log(`   PostgreSQL: ${pgResult.passed ? '✅ PASSED' : '❌ FAILED'}`)
            console.log(`   SQLite: ${sqliteResult.passed ? '✅ PASSED' : '❌ FAILED'}`)
            process.exit(1)
        }

    } catch (error) {
        console.error('❌ Validation error:', error)
        process.exit(1)
    }
}

main()
