/**
 * API Endpoint: Execute watch task
 * POST /api/admin/watch/execute
 * 
 * Executes a watch task with the selected filter
 * - watchcsv_base: Reset database from CSV files (CSV → DB)
 * - watchdb_base: Save database to CSV files (DB → CSV)
 * Includes conflict detection when both CSV and DB have changes
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../database/init'
import { getFileset, getFilesetFilePath, entityFileMapping } from '../../../settings'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { taskId, logic, filter, conflictResolution, conflictEntity } = body

        if (!taskId || !logic || !filter) {
            throw createError({
                statusCode: 400,
                message: 'taskId, logic, and filter are required'
            })
        }

        console.log(`📋 Executing watch task:`, { taskId, logic, filter, conflictResolution, conflictEntity })

        // If conflict resolution is provided, handle the specific entity
        if (conflictResolution && conflictEntity) {
            return await handleConflictResolution(logic, conflictEntity, conflictResolution)
        }

        // Switch statement for different logic types
        switch (logic) {
            case 'watchcsv_base':
                return await executeWatchCsvBase(filter)

            case 'watchdb_base':
                return await executeWatchDbBase(filter)

            default:
                throw createError({
                    statusCode: 400,
                    message: `Unknown logic type: ${logic}`
                })
        }
    } catch (error: any) {
        console.error('❌ Error executing watch task:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to execute watch task'
        })
    }
})

/**
 * Handle conflict resolution for a specific entity
 */
async function handleConflictResolution(logic: string, entity: string, resolution: 'cancel' | 'overwrite_csv' | 'reset_db'): Promise<any> {
    console.log(`🔧 Handling conflict for ${entity} with resolution: ${resolution}`)

    if (resolution === 'cancel') {
        return {
            success: true,
            cancelled: true,
            message: 'Operation cancelled',
            toastType: 'info',
            toastMessage: '❌ Operation cancelled'
        }
    }

    try {
        if (resolution === 'overwrite_csv') {
            // Save database to CSV (DB wins) - skip conflict check since we're resolving it
            return await executeWatchDbBase(entity, true)
        } else if (resolution === 'reset_db') {
            // Reset database from CSV (CSV wins) - skip conflict check since we're resolving it
            return await executeWatchCsvBase(entity, true)
        }

        return {
            success: false,
            message: 'Invalid resolution option',
            toastType: 'error',
            toastMessage: '❌ Invalid resolution option'
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            toastType: 'error',
            toastMessage: `❌ Error resolving conflict: ${error.message}`
        }
    }
}

/**
 * Parse CSV file
 */
function parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

    return lines.slice(1).map(line => {
        const values: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"' && (i === 0 || line[i - 1] === ',')) {
                inQuotes = true
            } else if (char === '"' && (i === line.length - 1 || line[i + 1] === ',')) {
                inQuotes = false
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim())
                current = ''
            } else if (!(char === '"' && (i === 0 || line[i - 1] === ',' || i === line.length - 1 || line[i + 1] === ','))) {
                current += char
            }
        }
        values.push(current.trim())

        const obj: any = {}
        headers.forEach((header, index) => {
            obj[header] = values[index] || ''
        })
        return obj
    })
}

/**
 * Convert records to CSV format
 */
function recordsToCSV(records: any[], headers: string[]): string {
    const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    const headerLine = headers.map(h => `"${h}"`).join(',')
    const dataLines = records.map(record =>
        headers.map(header => escapeCSV(record[header])).join(',')
    )

    return [headerLine, ...dataLines].join('\n')
}

/**
 * Check for conflicts: both CSV file modified AND database records modified
 */
async function checkConflict(entityTable: string): Promise<{ hasConflict: boolean, csvModified: boolean, dbModified: boolean }> {
    try {
        // Get CSV file info
        const csvFilename = entityFileMapping[entityTable]
        if (!csvFilename) {
            return { hasConflict: false, csvModified: false, dbModified: false }
        }

        const filePath = getFilesetFilePath(csvFilename, 'base')

        // Get system config for last check times
        const configRow = await db.get('SELECT value FROM system_config WHERE key = ?', ['watchcsv'])
        const config = configRow ? JSON.parse(configRow.value) : {}
        const lastCsvCheck = config.base?.lastCheck ? new Date(config.base.lastCheck) : null

        // Check if CSV file was modified
        let csvModified = false
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath)
            csvModified = !lastCsvCheck || stats.mtime > lastCsvCheck
        }

        // Check if DB records were modified
        const dbConfigRow = await db.get('SELECT value FROM system_config WHERE key = ?', ['watchdb'])
        const dbConfig = dbConfigRow ? JSON.parse(dbConfigRow.value) : {}
        const lastDbCheck = dbConfig.base?.lastCheck ? new Date(dbConfig.base.lastCheck).toISOString() : null

        let dbModified = false
        if (lastDbCheck) {
            const result = await db.get(
                `SELECT COUNT(*) as count FROM ${entityTable} WHERE isbase = 1 AND updated_at > ?`,
                [lastDbCheck]
            )
            dbModified = result && result.count > 0
        }

        const hasConflict = csvModified && dbModified

        return { hasConflict, csvModified, dbModified }
    } catch (error) {
        console.error(`Error checking conflict for ${entityTable}:`, error)
        return { hasConflict: false, csvModified: false, dbModified: false }
    }
}

/**
 * Reset Base: Load data from CSV files into database
 */
async function executeWatchCsvBase(filter: string, skipConflictCheck: boolean = false): Promise<any> {
    console.log(`🔄 Reset Base from CSV: ${filter}`)

    try {
        const fileset = getFileset('base')

        // Determine which entities to process
        let entitiesToProcess: string[] = []

        if (filter === 'all') {
            entitiesToProcess = ['events', 'posts', 'locations', 'instructors', 'participants']
        } else {
            // Single entity
            entitiesToProcess = [filter]
        }

        // Check for conflicts first (unless we're resolving a conflict)
        if (!skipConflictCheck) {
            const conflicts: string[] = []
            for (const entity of entitiesToProcess) {
                const { hasConflict } = await checkConflict(entity)
                if (hasConflict) {
                    conflicts.push(entity)
                }
            }

            if (conflicts.length > 0) {
                return {
                    success: false,
                    requiresConflictResolution: true,
                    conflicts,
                    message: `Conflict detected: Both CSV and database have been modified for: ${conflicts.join(', ')}`,
                    toastType: 'warning',
                    toastMessage: `⚠️ Conflict detected! Both CSV and database modified for: ${conflicts.join(', ')}`
                }
            }
        }

        // No conflicts - proceed with reset
        let recordsImported = 0

        for (const entityTable of entitiesToProcess) {
            const csvFilename = entityFileMapping[entityTable]
            if (!csvFilename) continue

            const filePath = getFilesetFilePath(csvFilename, 'base')
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ CSV file not found: ${csvFilename}`)
                continue
            }

            // Read and parse CSV
            const csvText = fs.readFileSync(filePath, 'utf-8')
            const records = parseCSV(csvText)

            console.log(`  📥 Importing ${records.length} ${entityTable} from ${csvFilename}`)

            // Import each record
            for (const record of records) {
                // Only import records with IDs starting with _demo. (base records)
                if (!record.id || !record.id.startsWith('_demo.')) continue

                // Entity-specific import logic
                if (entityTable === 'events') {
                    await db.run(`
                        INSERT INTO events (id, name, date_begin, date_end, address_id, user_id, seats_max, cimg, header_type, rectitle, teaser, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            date_begin = excluded.date_begin,
                            date_end = excluded.date_end,
                            address_id = excluded.address_id,
                            user_id = excluded.user_id,
                            seats_max = excluded.seats_max,
                            cimg = excluded.cimg,
                            header_type = excluded.header_type,
                            rectitle = excluded.rectitle,
                            teaser = excluded.teaser,
                            isbase = 1,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        record.id,
                        record.name,
                        record.date_begin,
                        record.date_end,
                        record['address_id/id'] || record.address_id,
                        record['user_id/id'] || record.user_id,
                        record.seats_max || 0,
                        record.cimg,
                        record.header_type,
                        record.rectitle,
                        record.teaser
                    ])
                } else if (entityTable === 'posts') {
                    await db.run(`
                        INSERT INTO posts (id, name, subtitle, teaser, author_id, blog_id, tag_ids, website_published, is_published, post_date, cover_properties, event_id, cimg, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            subtitle = excluded.subtitle,
                            teaser = excluded.teaser,
                            author_id = excluded.author_id,
                            blog_id = excluded.blog_id,
                            tag_ids = excluded.tag_ids,
                            website_published = excluded.website_published,
                            is_published = excluded.is_published,
                            post_date = excluded.post_date,
                            cover_properties = excluded.cover_properties,
                            event_id = excluded.event_id,
                            cimg = excluded.cimg,
                            isbase = 1,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        record.id,
                        record.name,
                        record.subtitle,
                        record.teaser,
                        record['author_id/id'] || record.author_id,
                        record['blog_id/id'] || record.blog_id,
                        record['tag_ids/id'] || record.tag_ids,
                        record.website_published,
                        record.is_published,
                        record.post_date,
                        record.cover_properties,
                        record['event_id/id'] || record.event_id,
                        record.cimg
                    ])
                } else if (entityTable === 'locations') {
                    await db.run(`
                        INSERT INTO locations (id, name, phone, email, city, zip, street, country_id, is_company, category_id, cimg, header_type, header_size, md, is_location_provider, event_id, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            phone = excluded.phone,
                            email = excluded.email,
                            city = excluded.city,
                            zip = excluded.zip,
                            street = excluded.street,
                            country_id = excluded.country_id,
                            is_company = excluded.is_company,
                            category_id = excluded.category_id,
                            cimg = excluded.cimg,
                            header_type = excluded.header_type,
                            header_size = excluded.header_size,
                            md = excluded.md,
                            is_location_provider = excluded.is_location_provider,
                            event_id = excluded.event_id,
                            isbase = 1,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        record.id,
                        record.name,
                        record.phone,
                        record.email,
                        record.city,
                        record.zip,
                        record.street,
                        record['country_id/id'] || record.country_id,
                        record.is_company,
                        record['category_id/id'] || record.category_id,
                        record.cimg,
                        record.header_type,
                        record.header_size,
                        record.md,
                        record.is_location_provider,
                        record['event_id/id'] || record.event_id
                    ])
                } else if (entityTable === 'instructors') {
                    await db.run(`
                        INSERT INTO instructors (id, name, email, phone, city, country_id, cimg, description, event_id, isbase)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            email = excluded.email,
                            phone = excluded.phone,
                            city = excluded.city,
                            country_id = excluded.country_id,
                            cimg = excluded.cimg,
                            description = excluded.description,
                            event_id = excluded.event_id,
                            isbase = 1,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        record.id,
                        record.name,
                        record.email,
                        record.phone,
                        record.city,
                        record['country_id/id'] || record.country_id,
                        record.cimg,
                        record.description,
                        record['event_id/id'] || record.event_id
                    ])
                } else if (entityTable === 'participants') {
                    // Participants come from multiple CSV files (children, teens, adults)
                    // This would need more complex logic - skip for now or handle separately
                    continue
                }

                recordsImported++
            }
        }

        return {
            success: true,
            recordsImported,
            message: `Successfully reset ${recordsImported} base records from CSV`,
            toastType: 'success',
            toastMessage: `✅ Reset Base: Imported ${recordsImported} records from CSV files`
        }
    } catch (error: any) {
        console.error('❌ Error resetting base from CSV:', error)
        return {
            success: false,
            message: error.message,
            toastType: 'error',
            toastMessage: `❌ Error resetting base: ${error.message}`
        }
    }
}

/**
 * Save Base: Export data from database to CSV files
 */
async function executeWatchDbBase(filter: string, skipConflictCheck: boolean = false): Promise<any> {
    console.log(`💾 Save Base to CSV: ${filter}`)

    try {
        // Determine which entities to process
        let entitiesToProcess: string[] = []

        if (filter === 'all') {
            entitiesToProcess = ['events', 'posts', 'locations', 'instructors']
        } else {
            entitiesToProcess = [filter]
        }

        // Check for conflicts first (unless we're resolving a conflict)
        if (!skipConflictCheck) {
            const conflicts: string[] = []
            for (const entity of entitiesToProcess) {
                const { hasConflict } = await checkConflict(entity)
                if (hasConflict) {
                    conflicts.push(entity)
                }
            }

            if (conflicts.length > 0) {
                return {
                    success: false,
                    requiresConflictResolution: true,
                    conflicts,
                    message: `Conflict detected: Both CSV and database have been modified for: ${conflicts.join(', ')}`,
                    toastType: 'warning',
                    toastMessage: `⚠️ Conflict detected! Both CSV and database modified for: ${conflicts.join(', ')}`
                }
            }
        }

        // No conflicts - proceed with save
        let filesUpdated = 0

        for (const entityTable of entitiesToProcess) {
            const csvFilename = entityFileMapping[entityTable]
            if (!csvFilename) continue

            const filePath = getFilesetFilePath(csvFilename, 'base')

            // Query base records from database
            const records = await db.all(
                `SELECT * FROM ${entityTable} WHERE isbase = 1 ORDER BY id`
            )

            if (records.length === 0) {
                console.warn(`⚠️ No base records found in ${entityTable}`)
                continue
            }

            console.log(`  💾 Exporting ${records.length} ${entityTable} to ${csvFilename}`)

            // Get column names from first record
            const headers = Object.keys(records[0])

            // Convert to CSV
            const csvContent = recordsToCSV(records, headers)

            // Write to file
            fs.writeFileSync(filePath, csvContent, 'utf-8')
            filesUpdated++
        }

        return {
            success: true,
            filesUpdated,
            message: `Successfully saved ${filesUpdated} CSV files from database`,
            toastType: 'success',
            toastMessage: `✅ Save Base: Exported ${filesUpdated} files to CSV`
        }
    } catch (error: any) {
        console.error('❌ Error saving base to CSV:', error)
        return {
            success: false,
            message: error.message,
            toastType: 'error',
            toastMessage: `❌ Error saving base: ${error.message}`
        }
    }
}
