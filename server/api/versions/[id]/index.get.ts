import { defineEventHandler, createError } from 'h3'
import db from '../../../database/db'

export default defineEventHandler((event) => {
  const versionId = event.context.params?.id

  if (!versionId) {
    throw createError({
      statusCode: 400,
      message: 'Version ID is required'
    })
  }

  try {
    // Get version with full snapshot data
    const version = db.prepare('SELECT * FROM versions WHERE id = ?').get(versionId) as any

    if (!version) {
      throw createError({
        statusCode: 404,
        message: 'Version not found'
      })
    }

    // Parse snapshot data
    let snapshot = null
    let record_counts = null

    if (version.snapshot_data) {
      try {
        snapshot = JSON.parse(version.snapshot_data)
        record_counts = {
          events: snapshot.events?.length || 0,
          posts: snapshot.posts?.length || 0,
          locations: snapshot.locations?.length || 0,
          instructors: snapshot.instructors?.length || 0,
          participants: snapshot.participants?.length || 0,
          total: (snapshot.events?.length || 0) +
            (snapshot.posts?.length || 0) +
            (snapshot.locations?.length || 0) +
            (snapshot.instructors?.length || 0) +
            (snapshot.participants?.length || 0)
        }
      } catch (err) {
        console.error('Error parsing snapshot data:', err)
      }
    }

    return {
      success: true,
      version: {
        ...version,
        snapshot_data: snapshot,
        record_counts
      }
    }
  } catch (error) {
    console.error('Error fetching version:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch version'
    })
  }
})
