import { defineEventHandler, createError } from 'h3'
import { readFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { constants } from 'node:fs'
import { db } from '../../../database/init'

interface DbRow {
  [key: string]: any
}

function parseCSV(csv: string): DbRow[] {
  const lines = csv.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())

  const parseValue = (value: string): string | null => {
    let val = value.trim()

    // Handle quoted values with escaped quotes
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/""/g, '"')
    }

    return val === '' ? null : val
  }

  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    // Parse CSV line handling quotes properly
    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current) // Add last field

    const obj: DbRow = {}
    headers.forEach((header, i) => {
      obj[header] = parseValue(values[i] || '')
    })
    return obj
  })
}

export default defineEventHandler(async (event) => {
  const versionId = event.context.params?.id

  if (!versionId) {
    throw createError({
      statusCode: 400,
      message: 'Version ID is required'
    })
  }

  try {
    // Get version
    const version = await db.get('SELECT * FROM versions WHERE id = ?', [versionId]) as any

    if (!version) {
      throw createError({
        statusCode: 404,
        message: 'Version not found'
      })
    }

    const versionDir = join(process.cwd(), 'server/data', `version_${version.version_number}`)

    // Check if directory exists
    try {
      await access(versionDir, constants.F_OK)
    } catch {
      throw createError({
        statusCode: 404,
        message: `CSV directory not found: ${versionDir}. Please export CSV first.`
      })
    }

    // Read CSV files
    const files = [
      { name: 'events.csv', table: 'events' },
      { name: 'posts.csv', table: 'posts' },
      { name: 'locations.csv', table: 'locations' },
      { name: 'instructors.csv', table: 'instructors' },
      { name: 'participants.csv', table: 'participants' }
    ]

    const updates: Record<string, number> = {}
    const newSnapshot: Record<string, any[]> = {}

    for (const file of files) {
      try {
        const csvPath = join(versionDir, file.name)
        const csv = await readFile(csvPath, 'utf-8')
        const data = parseCSV(csv)

        if (data.length === 0) {
          updates[file.table] = 0
          newSnapshot[file.table] = []
          continue
        }

        // Update database with CSV data
        for (const record of data) {
          const columns = Object.keys(record).filter(col => record[col] !== null)
          const placeholders = columns.map(() => '?').join(',')
          const values = columns.map(col => record[col])

          // Use INSERT ... ON CONFLICT to handle existing records
          await db.run(
            `INSERT INTO ${file.table} (${columns.join(',')})
             VALUES (${placeholders})
             ON CONFLICT(id) DO UPDATE SET ${columns.map(col => `${col} = excluded.${col}`).join(', ')}`,
            values
          )
        }

        updates[file.table] = data.length
        newSnapshot[file.table] = data
      } catch (err) {
        console.warn(`Skipping ${file.name}:`, err)
        updates[file.table] = 0
        newSnapshot[file.table] = []
      }
    }

    // Add timestamp to snapshot
    newSnapshot.timestamp = new Date().toISOString()

    // Update version snapshot with imported data
    await db.run(
      'UPDATE versions SET snapshot_data = ? WHERE id = ?',
      [JSON.stringify(newSnapshot), versionId]
    )

    // Update record_versions table with new data
    // First, delete old record_versions for this version
    await db.run('DELETE FROM record_versions WHERE version_id = ?', [versionId])

    // Insert new record_versions
    const { nanoid } = await import('nanoid')

    for (const [recordType, records] of Object.entries(newSnapshot)) {
      if (recordType === 'timestamp') continue

      for (const record of records as DbRow[]) {
        if (record.id) {
          await db.run(
            `INSERT INTO record_versions (id, version_id, record_type, record_id, data)
             VALUES (?, ?, ?, ?, ?)`,
            [
              nanoid(),
              versionId,
              recordType,
              record.id,
              JSON.stringify(record)
            ]
          )
        }
      }
    }

    return {
      success: true,
      message: 'CSV data imported successfully',
      version_number: version.version_number,
      updates
    }
  } catch (error) {
    console.error('Error importing CSV:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to import CSV files: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
