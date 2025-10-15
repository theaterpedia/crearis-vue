import { defineEventHandler, readBody, createError } from 'h3'
import { nanoid } from 'nanoid'
import { db } from '../../database/db-new'

interface VersionCreateRequest {
  version_number: string
  name: string
  description?: string
  created_by?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<VersionCreateRequest>(event)

  const { version_number, name, description, created_by } = body

  // Validate required fields
  if (!version_number || !name) {
    throw createError({
      statusCode: 400,
      message: 'version_number and name are required'
    })
  }

  // Check if version_number already exists
  const existingVersion = await db.get('SELECT id FROM versions WHERE version_number = ?', [version_number])
  if (existingVersion) {
    throw createError({
      statusCode: 409,
      message: `Version ${version_number} already exists`
    })
  }

  try {
    // Create snapshot of all current data
    // Note: status column might not exist in older schemas, so we select all records
    const events = await db.all('SELECT * FROM events', [])
    const posts = await db.all('SELECT * FROM posts', [])
    const locations = await db.all('SELECT * FROM locations', [])
    const instructors = await db.all('SELECT * FROM instructors', [])
    const participants = await db.all('SELECT * FROM participants', [])

    const snapshot = {
      events,
      posts,
      locations,
      instructors,
      participants,
      timestamp: new Date().toISOString()
    }

    const id = nanoid()

    // Deactivate previous active version
    await db.run('UPDATE versions SET is_active = 0 WHERE is_active = 1', [])

    // Create new version
    await db.run(
      `INSERT INTO versions (id, version_number, name, description, created_by, is_active, snapshot_data)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        version_number,
        name,
        description || null,
        created_by || null,
        JSON.stringify(snapshot)
      ]
    )

    // Store individual record versions
    const recordTypes = [
      { type: 'events', records: events },
      { type: 'posts', records: posts },
      { type: 'locations', records: locations },
      { type: 'instructors', records: instructors },
      { type: 'participants', records: participants }
    ]

    for (const { type, records } of recordTypes) {
      for (const record of records) {
        await db.run(
          `INSERT INTO record_versions (id, version_id, record_type, record_id, data)
           VALUES (?, ?, ?, ?, ?)`,
          [
            nanoid(),
            id,
            type,
            record.id,
            JSON.stringify(record)
          ]
        )
      }
    }

    // Fetch the created version
    const version = await db.get('SELECT * FROM versions WHERE id = ?', [id])

    // Don't send the full snapshot_data in response (could be large)
    const responseVersion = {
      ...version,
      snapshot_data: undefined,
      record_counts: {
        events: events.length,
        posts: posts.length,
        locations: locations.length,
        instructors: instructors.length,
        participants: participants.length,
        total: events.length + posts.length + locations.length + instructors.length + participants.length
      }
    }

    return {
      success: true,
      version: responseVersion,
      message: `Version ${version_number} created successfully`
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error creating version:', errorMessage, error)
    throw createError({
      statusCode: 500,
      message: `Failed to create version snapshot: ${errorMessage}`
    })
  }
})
