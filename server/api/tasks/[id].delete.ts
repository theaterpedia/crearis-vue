import { defineEventHandler, createError } from 'h3'
import db from '../../database/db'

export default defineEventHandler((event) => {
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
    
    // Delete the task
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
    
    return {
      success: true,
      message: 'Task deleted successfully',
      deletedTask: existingTask
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Failed to delete task',
      data: error
    })
  }
})
