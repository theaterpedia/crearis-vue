import Database from 'better-sqlite3'
import type { DatabaseAdapter, PreparedStatement, QueryResult } from '../adapter'

class SQLitePreparedStatement implements PreparedStatement {
    constructor(private stmt: Database.Statement) { }

    run(...params: any[]): QueryResult {
        const result = this.stmt.run(...params)
        return {
            rows: [],
            rowCount: result.changes,
            lastID: result.lastInsertRowid,
            changes: result.changes
        }
    }

    get(...params: any[]): any {
        return this.stmt.get(...params)
    }

    all(...params: any[]): any[] {
        return this.stmt.all(...params)
    }
}

export class SQLiteAdapter implements DatabaseAdapter {
    readonly type = 'sqlite' as const
    private db: Database.Database

    constructor(dbPath: string) {
        this.db = new Database(dbPath)
        // Enable WAL mode for better concurrent access
        this.db.pragma('journal_mode = WAL')
    }

    exec(sql: string): void {
        this.db.exec(sql)
    }

    prepare(sql: string): PreparedStatement {
        return new SQLitePreparedStatement(this.db.prepare(sql))
    }

    run(sql: string, params: any[] = []): QueryResult {
        const stmt = this.db.prepare(sql)
        const result = stmt.run(...params)
        return {
            rows: [],
            rowCount: result.changes,
            lastID: result.lastInsertRowid,
            changes: result.changes
        }
    }

    get(sql: string, params: any[] = []): any {
        const stmt = this.db.prepare(sql)
        return stmt.get(...params)
    }

    all(sql: string, params: any[] = []): any[] {
        const stmt = this.db.prepare(sql)
        return stmt.all(...params)
    }

    transaction<T>(fn: () => T): T {
        return this.db.transaction(fn)()
    }

    close(): void {
        this.db.close()
    }

    // SQLite-specific: Get underlying database for compatibility
    getUnderlying(): Database.Database {
        return this.db
    }
}
