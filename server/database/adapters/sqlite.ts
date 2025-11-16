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
        // ⚠️ DEPRECATION WARNING ⚠️
        // SQLite support was dropped in Migration 019 (November 2025)
        // The database schema now uses PostgreSQL-specific features:
        // - Custom types (shape_opt_type, image_file_type, media_licence, etc.)
        // - Composite types (media_adapter, image_shape, image_variation)
        // - BYTEA fields for bitmatrix operations (ctags, rtags)
        // - Complex triggers with recursive functions
        // - JSONB field operations
        //
        // SQLite cannot support these features and will cause runtime errors.
        // Please migrate to PostgreSQL immediately.

        const errorMessage = `
╔═══════════════════════════════════════════════════════════════════════╗
║                    🚫 SQLITE ADAPTER DEPRECATED 🚫                    ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  SQLite support was REMOVED in Migration 019 (November 2025)         ║
║                                                                       ║
║  The database now requires PostgreSQL-specific features:             ║
║  • Custom types (image_file_type, media_licence, etc.)               ║
║  • Composite types (media_adapter, image_shape)                      ║
║  • BYTEA fields for bitmatrix operations                             ║
║  • Complex triggers with recursive functions                         ║
║  • JSONB operations                                                  ║
║                                                                       ║
║  ACTION REQUIRED:                                                    ║
║  1. Configure PostgreSQL connection in .env:                         ║
║     DB_TYPE=postgresql                                               ║
║     DB_HOST=localhost                                                ║
║     DB_PORT=5432                                                     ║
║     DB_NAME=crearis_admin_dev                                        ║
║     DB_USER=crearis_admin                                            ║
║     DB_PASSWORD=your_password                                        ║
║                                                                       ║
║  2. For tests, set: TEST_DATABASE_TYPE=postgresql                    ║
║                                                                       ║
║  Migration 019+ cannot run on SQLite. Execution stopped.             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`

        console.error(errorMessage)

        // Fail immediately - do not allow execution
        throw new Error(
            'SQLite adapter is deprecated and cannot be used. ' +
            'PostgreSQL is required for Migration 019+. ' +
            'See error message above for migration instructions.'
        )

    }

    exec(sql: string): void {
        this.db.exec(sql)
    }

    prepare(sql: string): PreparedStatement {
        return new SQLitePreparedStatement(this.db.prepare(sql))
    }

    run(sql: string, params: any[] = []): QueryResult {
        const stmt = this.db.prepare(sql)

        // Check if this is a RETURNING query
        if (sql.toUpperCase().includes('RETURNING')) {
            // Use get() to retrieve the returned row
            const row = stmt.get(...params) as any
            return {
                rows: row ? [row] : [],
                rowCount: 1,
                lastID: row?.id,
                changes: 1
            }
        }

        // Regular INSERT/UPDATE/DELETE without RETURNING
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
