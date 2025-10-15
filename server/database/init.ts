/**
 * Database Initialization Module
 * Handles connection setup and runs migrations
 */

import { db } from './db-new'
import { runMigrations } from './migrations/index'

// Run migrations on initialization
await runMigrations(db, false)

// Export initialized database
export { db }
export default db
