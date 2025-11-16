/**
 * Database Adapter Interface
 * 
 * Provides a unified interface for both SQLite and PostgreSQL operations.
 * PostgreSQL operations are async, so all methods return Promise or direct values.
 * For SQLite, promises resolve immediately with the result.
 */

export interface QueryResult {
    rows: any[]
    rowCount: number
    lastID?: string | number | bigint
    changes?: number
}

export interface DatabaseAdapter {
    // Query execution (async for PostgreSQL, sync for SQLite but returns Promise)
    exec(sql: string): void | Promise<void>
    prepare(sql: string): PreparedStatement
    run(sql: string, params?: any[]): QueryResult | Promise<QueryResult>
    get(sql: string, params?: any[]): any | Promise<any>
    all(sql: string, params?: any[]): any[] | Promise<any[]>

    // Transaction support
    transaction<T>(fn: () => T | Promise<T>): T | Promise<T>

    // Utility
    close(): void | Promise<void>

    // Type identifier
    readonly type: 'sqlite' | 'postgresql'
}

export interface PreparedStatement {
    run(...params: any[]): QueryResult | Promise<QueryResult>
    get(...params: any[]): any | Promise<any>
    all(...params: any[]): any[] | Promise<any[]>
}
