import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async () => {
  try {
    // Get all events
    const events = await db.all('SELECT * FROM events')

    // Get all posts
    const posts = await db.all('SELECT * FROM posts')

    // Get all locations
    const locations = await db.all('SELECT * FROM locations')

    // Get all instructors
    const instructors = await db.all('SELECT * FROM instructors')

    // Get all participants
    const participants = await db.all('SELECT * FROM participants')

    // Get hero overrides
    const heroOverrides = await db.all('SELECT * FROM hero_overrides')

    return {
      events,
      posts,
      locations,
      instructors,
      participants,
      heroOverrides
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch data'
    })
  }
})