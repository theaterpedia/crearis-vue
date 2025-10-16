import { defineEventHandler, createError } from 'h3'
import { db } from '../../database/init'

export default defineEventHandler(async () => {
    try {
        const instructors = await db.all('SELECT * FROM instructors ORDER BY name')
        return instructors
    } catch (error) {
        console.error('Error fetching instructors:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to fetch instructors'
        })
    }
})
