/**
 * Migration 057: Create Comments Tables
 * 
 * Creates tables for the Post-IT comment system:
 * - comments: Main comments table with threading support
 * - comment_reactions: Emoji reactions on comments
 * 
 * Package: F (055-059) - Comments & Interaction System
 * December 2025
 */

import type { DatabaseAdapter } from '../adapter'

export const migration = {
  id: '057_create_comments_tables',
  description: 'Create comments and comment_reactions tables for Post-IT system',

  async up(db: DatabaseAdapter): Promise<void> {
    const isPostgres = db.type === 'postgresql'
    console.log('📝 Running migration 057: Creating comments tables...')

    // Comments table
    // Note: project_id and author_id are INTEGER (matching projects.id and users.id)
    // entity_id is TEXT (can reference different entity types with different ID formats)
    if (isPostgres) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'project', 'event', 'image')),
          entity_id TEXT NOT NULL,
          project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
          author_id INTEGER NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          is_pinned BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
    } else {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'project', 'event', 'image')),
          entity_id TEXT NOT NULL,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
          author_id TEXT NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          is_pinned INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
    }

    // Indexes for efficient querying
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comments_entity 
      ON comments(entity_type, entity_id, project_id)
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comments_parent 
      ON comments(parent_id)
    `)

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comments_author 
      ON comments(author_id)
    `)

    if (isPostgres) {
      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_comments_pinned 
        ON comments(is_pinned) WHERE is_pinned = true
      `)
    } else {
      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_comments_pinned 
        ON comments(is_pinned) WHERE is_pinned = 1
      `)
    }

    // Comment reactions table
    if (isPostgres) {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS comment_reactions (
          id SERIAL PRIMARY KEY,
          comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id),
          emoji TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(comment_id, user_id, emoji)
        )
      `)
    } else {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS comment_reactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id),
          emoji TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(comment_id, user_id, emoji)
        )
      `)
    }

    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment 
      ON comment_reactions(comment_id)
    `)

    console.log('✅ Migration 057 completed: Comments tables created')
  },

  async down(db: DatabaseAdapter): Promise<void> {
    console.log('🗑️ Rolling back migration 057: Dropping comments tables...')

    await db.exec('DROP TABLE IF EXISTS comment_reactions')
    await db.exec('DROP TABLE IF EXISTS comments')

    console.log('✅ Migration 057 rolled back')
  }
}
