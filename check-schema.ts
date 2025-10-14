import Database from 'better-sqlite3'

const db = new Database('demo-data.db')

console.log('Events table structure:')
const eventsColumns = db.prepare("PRAGMA table_info(events)").all()
console.log(eventsColumns)

db.close()
