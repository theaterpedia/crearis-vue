import { defineEventHandler, createError } from 'h3'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { db } from '../../../database/init'

interface DbRow {
  [key: string]: any
}

function objectToCSV(data: DbRow[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])

  // Escape CSV values
  const escapeValue = (val: any): string => {
    if (val === null || val === undefined) return ''

    const strVal = String(val)

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
      return `"${strVal.replace(/"/g, '""')}"`
    }

    return strVal
  }

  const rows = data.map(obj =>
    headers.map(h => escapeValue(obj[h])).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
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

    // Parse snapshot data
    const snapshot = JSON.parse(version.snapshot_data)
    const csvDir = join(process.cwd(), 'src/assets/csv')
    const versionDir = join(csvDir, `version_${version.version_number}`)

    // Create version directory
    await mkdir(versionDir, { recursive: true })

    // Export each data type to CSV
    const exports = [
      { name: 'events.csv', data: snapshot.events || [] },
      { name: 'posts.csv', data: snapshot.posts || [] },
      { name: 'locations.csv', data: snapshot.locations || [] },
      { name: 'instructors.csv', data: snapshot.instructors || [] },
      { name: 'participants.csv', data: snapshot.participants || [] }
    ]

    const exportedFiles: string[] = []

    for (const exp of exports) {
      if (exp.data.length > 0) {
        const csv = objectToCSV(exp.data)
        const filePath = join(versionDir, exp.name)
        await writeFile(filePath, csv, 'utf-8')
        exportedFiles.push(exp.name)
      }
    }

    // Update version to mark as exported
    await db.run('UPDATE versions SET csv_exported = 1 WHERE id = ?', [versionId])

    return {
      success: true,
      message: `CSV files exported successfully`,
      path: versionDir,
      files: exportedFiles,
      version_number: version.version_number
    }
  } catch (error) {
    console.error('Error exporting CSV:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to export CSV files: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
