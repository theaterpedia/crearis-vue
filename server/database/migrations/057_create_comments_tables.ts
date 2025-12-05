/**
 * Migration: Create Comments Tables
 * 
 * Creates tables for the Post-IT comment system:
 * - comments: Main comments table with threading support
 * - comment_reactions: Emoji reactions on comments
 * 
 * December 2025
 */

import { db } from '../init'

export async function up() {
  console.log('📝 Creating comments tables...')

  // Comments table
  await db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'project', 'event', 'image')),
      entity_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)

  // Indexes for efficient querying
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comments_entity 
    ON comments(entity_type, entity_id, project_id)
  `)

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comments_parent 
    ON comments(parent_id)
  `)

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comments_author 
    ON comments(author_id)
  `)

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comments_pinned 
    ON comments(is_pinned) WHERE is_pinned = 1
  `)

  // Comment reactions table
  await db.run(`
    CREATE TABLE IF NOT EXISTS comment_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      emoji TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(comment_id, user_id, emoji)
    )
  `)

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment 
    ON comment_reactions(comment_id)
  `)

  console.log('✅ Comments tables created')
}

export async function down() {
  console.log('🗑️ Dropping comments tables...')
  
  await db.run('DROP TABLE IF EXISTS comment_reactions')
  await db.run('DROP TABLE IF EXISTS comments')
  
  console.log('✅ Comments tables dropped')
}
