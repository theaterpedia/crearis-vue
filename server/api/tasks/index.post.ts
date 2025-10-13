import { defineEventHandler, readBody, createError } from 'h3'
import { nanoid } from 'nanoid'
import db from '../../database/db'

interface CreateTaskBody {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  record_type?: string
  record_id?: string
  assigned_to?: string
  due_date?: string
  version_id?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateTaskBody>(event)
    
    // Validate required fields
    if (!body.title || body.title.trim() === '') {
      throw createError({
        statusCode: 400,
        message: 'Title is required'
      })
    }
    
    // Validate priority if provided
    if (body.priority && !['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid priority. Must be: low, medium, high, or urgent'
      })
    }
    
    const id = nanoid()
    const now = new Date().toISOString()
    
    const stmt = db.prepare(`
      INSERT INTO tasks (
        id, 
        title, 
        description, 
        priority, 
        record_type, 
        record_id, 
        assigned_to,
        due_date, 
        version_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      id,
      body.title.trim(),
      body.description || null,
      body.priority || 'medium',
      body.record_type || null,
      body.record_id || null,
      body.assigned_to || null,
      body.due_date || null,
      body.version_id || null,
      now,
      now
    )
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    
    return {
      success: true,
      task,
      message: 'Task created successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to create task',
      data: error
    })
  }
})
