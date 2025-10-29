/**
 * ❌ DO NOT IMPORT FROM THIS FILE ❌
 * 
 * This file exists ONLY to prevent incorrect imports.
 * 
 * CORRECT IMPORT:
 *   import { db } from '../database/init'
 * 
 * INCORRECT IMPORT:
 *   import { db } from '../database/db'  // ❌ WRONG!
 * 
 * The database connection is exported from 'init.ts', not 'db.ts'.
 * 
 * This file will throw an error if imported to catch mistakes early.
 */

throw new Error(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   ❌ INCORRECT IMPORT DETECTED ❌                                     ║
║                                                                       ║
║   You tried to import from: 'database/db'                            ║
║                                                                       ║
║   ✅ Correct import:                                                  ║
║      import { db } from '../database/init'                           ║
║                                                                       ║
║   Please update your import statement!                               ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`)

// This export will never be reached, but TypeScript needs it
export const db = null as any
