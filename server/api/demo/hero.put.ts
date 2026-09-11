import { defineEventHandler, readBody, createError } from 'h3'
import { validateHeadingFields } from '../../utils/heading-validation'
import { db } from '../../database/init'

export default defineEventHandler(async (event) => {
  const { id, cimg, heading, description, event_ids } = await readBody(event)


    // Reject a three-part crearis-md heading rather than let HeadingParser drop the
    // third part silently (HD 2026-07-28: reject, do not truncate — the authored text
    // IS the data). See server/utils/heading-validation.ts.
    const headingCheck = validateHeadingFields({ heading: heading })
    if (!headingCheck.ok) {
        throw createError({ statusCode: 400, message: headingCheck.reason })
    }

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required'
    })
  }

  try {
    // Check if this is an event update or hero override
    const isEvent = id.startsWith('_demo.event_')

    if (isEvent) {
      // Update event
      await db.run(`
        UPDATE events 
        SET cimg = ?, rectitle = ?, teaser = ?
        WHERE id = ?
      `, [cimg, heading, description, id])
    } else {
      // Insert or update hero override
      // PostgreSQL uses ON CONFLICT, SQLite also supports it
      await db.run(`
        INSERT INTO hero_overrides (id, cimg, heading, description, event_ids, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          cimg = excluded.cimg,
          heading = excluded.heading,
          description = excluded.description,
          event_ids = excluded.event_ids,
          updated_at = CURRENT_TIMESTAMP
      `, [id, cimg, heading, description, event_ids || ''])
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating hero:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update hero'
    })
  }
})
