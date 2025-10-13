import { defineEventHandler, readBody, createError } from 'h3'
import db from '../../database/db'

interface UpdateTaskBody {
  title?: string
  description?: string
  status?: 'todo' | 'in-progress' | 'done' | 'archived'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  due_date?: string
  completed_at?: string
}

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Task ID is required'
      })
    }
    
    // Check if task exists
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    if (!existingTask) {
      throw createError({
        statusCode: 404,
        message: 'Task not found'
      })
    }
    
    const body = await readBody<UpdateTaskBody>(event)
    
    // Validate status if provided
    if (body.status && !['todo', 'in-progress', 'done', 'archived'].includes(body.status)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid status. Must be: todo, in-progress, done, or archived'
      })
    }
    
    // Validate priority if provided
    if (body.priority && !['low', 'medium', 'high', 'urgent'].includes(body.priority)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid priority. Must be: low, medium, high, or urgent'
      })
    }
    
    const updates: string[] = []
    const values: any[] = []
    
    if (body.title !== undefined) {
      if (body.title.trim() === '') {
        throw createError({
          statusCode: 400,
          message: 'Title cannot be empty'
        })
      }
      updates.push('title = ?')
      values.push(body.title.trim())
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?')
      values.push(body.description || null)
    }
    
    if (body.status !== undefined) {
      updates.push('status = ?')
      values.push(body.status)
      
      // Auto-set completed_at when marking as done
      if (body.status === 'done' && !body.completed_at) {
        updates.push('completed_at = ?')
        values.push(new Date().toISOString())
      }
      
      // Clear completed_at when unmarking as done
      if (body.status !== 'done') {
        updates.push('completed_at = NULL')
      }
    }
    
    if (body.priority !== undefined) {
      updates.push('priority = ?')
      values.push(body.priority)
    }
    
    if (body.assigned_to !== undefined) {
      updates.push('assigned_to = ?')
      values.push(body.assigned_to || null)
    }
    
    if (body.due_date !== undefined) {
      updates.push('due_date = ?')
      values.push(body.due_date || null)
    }
    
    if (body.completed_at !== undefined) {
      updates.push('completed_at = ?')
      values.push(body.completed_at || null)
    }
    
    // Always update the updated_at timestamp
    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    
    // Add id to the end for WHERE clause
    values.push(id)
    
    if (updates.length === 1) {
      // Only updated_at was set, nothing meaningful to update
      throw createError({
        statusCode: 400,
        message: 'No valid fields to update'
      })
    }
    
    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`
    
    db.prepare(sql).run(...values)
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    
    return {
      success: true,
      task,
      message: 'Task updated successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to update task',
      data: error
    })
  }
})
