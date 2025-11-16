import { defineEventHandler } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async () => {
  try {
    // Get all versions, ordered by creation date (newest first)
    const versions = await db.all(`
      SELECT 
        id,
        version_number,
        name,
        description,
        created_at,
        created_by,
        is_active,
        csv_exported,
        notes
      FROM versions
      ORDER BY created_at DESC
    `, [])

    // For each version, get record counts from snapshot_data
    const versionsWithCounts = await Promise.all(versions.map(async (version: any) => {
      try {
        const snapshotData = await db.get('SELECT snapshot_data FROM versions WHERE id = ?', [version.id]) as any

        if (snapshotData?.snapshot_data) {
          const snapshot = JSON.parse(snapshotData.snapshot_data)

          return {
            ...version,
            record_counts: {
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
          }
        }

        return version
      } catch (err) {
        console.error('Error parsing snapshot for version:', version.id, err)
        return version
      }
    }))

    return {
      success: true,
      versions: versionsWithCounts,
      total: versions.length
    }
  } catch (error) {
    console.error('Error fetching versions:', error)
    return {
      success: false,
      message: 'Failed to fetch versions',
      versions: [],
      total: 0
    }
  }
})
