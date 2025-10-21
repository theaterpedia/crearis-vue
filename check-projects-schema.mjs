import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '.data', 'crearis_admin_dev.db')
const db = new Database(dbPath)

console.log('📋 Projects table schema:')
const schema = db.prepare("PRAGMA table_info(projects)").all()
schema.forEach(col => {
  console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`)
})

console.log('\n📋 Sample project records:')
const projects = db.prepare("SELECT * FROM projects LIMIT 3").all()
console.log(JSON.stringify(projects, null, 2))

db.close()
