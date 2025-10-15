/**
 * Generate schema definition from actual database structures
 * 
 * This script reads the current database structures from both PostgreSQL and SQLite
 * and generates a schema definition JSON file.
 * 
 * Usage: npx tsx server/database/generate-schema-definition.ts [version]
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import pkg from 'pg'
const { Client } = pkg

const __dirname = dirname(fileURLToPath(import.meta.url))

async function generateSchemaDefinition(version: string) {
    console.log(`📝 Generating schema definition for version ${version}...\n`)

    // Connect to PostgreSQL
    const pgClient = new Client({
        user: process.env.DB_USER || 'crearis_admin',
        password: process.env.DB_PASSWORD || '7uqf9nE0umJmMMo',
        database: process.env.DB_NAME || 'crearis_admin_dev',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
    })

    await pgClient.connect()

    // Connect to SQLite
    const sqliteDb = new Database('./demo-data.db')

    const schema: any = {
        version,
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        description: `Database schema for crearis-demo-data system v${version}`,
        tables: {}
    }

    try {
        // Get PostgreSQL tables
        console.log('🔍 Reading PostgreSQL schema...')
        const pgTablesResult = await pgClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `)
        const pgTables = pgTablesResult.rows.map(r => r.table_name)

        // Get SQLite tables
        console.log('🔍 Reading SQLite schema...')
        const sqliteTables = sqliteDb.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `).all().map((r: any) => r.name)

        // Process each table
        const allTables = [...new Set([...pgTables, ...sqliteTables])]

        for (const tableName of allTables) {
            console.log(`   📋 Processing table: ${tableName}`)

            const tableSchema: any = {
                description: `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} table`,
                columns: {}
            }

            // Get PostgreSQL columns
            if (pgTables.includes(tableName)) {
                const columnsResult = await pgClient.query(`
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

                for (const col of columnsResult.rows) {
                    if (!tableSchema.columns[col.column_name]) {
                        tableSchema.columns[col.column_name] = {
                            type: col.data_type.toUpperCase(),
                            nullable: col.is_nullable === 'YES',
                            ...(col.column_default && { default: col.column_default })
                        }
                    }
                }
            }

            // Get SQLite columns
            if (sqliteTables.includes(tableName)) {
                const sqliteColumns = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all() as any[]

                for (const col of sqliteColumns) {
                    if (!tableSchema.columns[col.name]) {
                        tableSchema.columns[col.name] = {
                            type: col.type,
                            nullable: col.notnull === 0,
                            primaryKey: col.pk === 1,
                            ...(col.dflt_value && { default: col.dflt_value })
                        }
                    } else {
                        // Merge SQLite info
                        if (col.pk === 1) {
                            tableSchema.columns[col.name].primaryKey = true
                        }
                    }
                }
            }

            schema.tables[tableName] = tableSchema
        }

        // Note differences between databases
        schema.databaseDifferences = {
            postgresql: {},
            sqlite: {}
        }

        // Check for PostgreSQL-only columns
        for (const tableName of pgTables) {
            if (sqliteTables.includes(tableName)) {
                const pgColumns = await pgClient.query(`
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = $1
                `, [tableName])
                const pgColNames = pgColumns.rows.map(r => r.column_name)

                const sqliteColumns = sqliteDb.prepare(`PRAGMA table_info(${tableName})`).all()
                const sqliteColNames = sqliteColumns.map((c: any) => c.name)

                const pgOnly = pgColNames.filter(c => !sqliteColNames.includes(c))
                const sqliteOnly = sqliteColNames.filter(c => !pgColNames.includes(c))

                if (pgOnly.length > 0) {
                    schema.databaseDifferences.postgresql[tableName] = {
                        additionalColumns: pgOnly,
                        description: `PostgreSQL has additional columns`
                    }
                    schema.databaseDifferences.sqlite[tableName] = {
                        missingColumns: pgOnly,
                        description: `SQLite is missing these columns`
                    }
                }

                if (sqliteOnly.length > 0) {
                    if (!schema.databaseDifferences.sqlite[tableName]) {
                        schema.databaseDifferences.sqlite[tableName] = {}
                    }
                    schema.databaseDifferences.sqlite[tableName].additionalColumns = sqliteOnly
                }
            }
        }

        // Write schema file
        const schemaPath = join(__dirname, 'schema-definitions', `v${version}.json`)
        writeFileSync(schemaPath, JSON.stringify(schema, null, 2))

        console.log(`\n✅ Schema definition generated: ${schemaPath}`)
        console.log(`📊 Tables: ${Object.keys(schema.tables).length}`)
        console.log(`📊 PostgreSQL tables: ${pgTables.length}`)
        console.log(`📊 SQLite tables: ${sqliteTables.length}`)

    } finally {
        await pgClient.end()
        sqliteDb.close()
    }
}

// Main
const version = process.argv[2] || (() => {
    const packageJson = JSON.parse(
        require('fs').readFileSync(join(__dirname, '../../package.json'), 'utf-8')
    )
    return packageJson.version
})()

generateSchemaDefinition(version).catch(err => {
    console.error('❌ Error:', err)
    process.exit(1)
})
