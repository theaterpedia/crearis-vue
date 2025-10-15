import pg from 'pg'
import type { DatabaseAdapter, PreparedStatement, QueryResult } from '../adapter'

const { Pool } = pg

/**
 * Convert string numbers from PostgreSQL COUNT/SUM/etc to actual numbers
 * This makes PostgreSQL behave like SQLite for consistency
 */
function convertNumericFields(row: any): any {
    if (!row || typeof row !== 'object') return row

    const converted: any = {}
    for (const [key, value] of Object.entries(row)) {
        // Convert string numbers to actual numbers for common aggregate fields
        if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
            const numValue = Number(value)
            // Only convert if it's a reasonable number (not NaN, not too large)
            if (!isNaN(numValue) && isFinite(numValue)) {
                converted[key] = numValue
                continue
            }
        }
        converted[key] = value
    }
    return converted
}

class PostgreSQLPreparedStatement implements PreparedStatement {
    constructor(
        private pool: pg.Pool,
        private sql: string
    ) { }

    async run(...params: any[]): Promise<QueryResult> {
        const result = await this.pool.query(this.sql, params)
        return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
            changes: result.rowCount || 0
        }
    }

    async get(...params: any[]): Promise<any> {
        const result = await this.pool.query(this.sql, params)
        const row = result.rows[0]
        // Convert null to undefined to match SQLite behavior
        if (!row) return undefined
        // Convert string numbers from COUNT/aggregations to actual numbers
        return convertNumericFields(row)
    }

    async all(...params: any[]): Promise<any[]> {
        const result = await this.pool.query(this.sql, params)
        // Convert string numbers from COUNT/aggregations to actual numbers
        return result.rows.map(row => convertNumericFields(row))
    }
}

export class PostgreSQLAdapter implements DatabaseAdapter {
    readonly type = 'postgresql' as const
    private pool: pg.Pool
    private inTransaction = false

    constructor(connectionString: string) {
        this.pool = new Pool({
            connectionString,
            // Connection pool settings
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })
    }

    async exec(sql: string): Promise<void> {
        // For PostgreSQL, execute the SQL directly
        // pg driver can handle multiple statements
        await this.pool.query(sql)
    }

    prepare(sql: string): PreparedStatement {
        // PostgreSQL uses $1, $2, etc. for parameters
        // Convert ? placeholders to $1, $2, etc.
        let paramIndex = 0
        const convertedSql = sql.replace(/\?/g, () => `$${++paramIndex}`)
        return new PostgreSQLPreparedStatement(this.pool, convertedSql)
    }

    async run(sql: string, params: any[] = []): Promise<QueryResult> {
        // Convert ? to $ parameters
        let paramIndex = 0
        const convertedSql = sql.replace(/\?/g, () => `$${++paramIndex}`)

        const result = await this.pool.query(convertedSql, params)
        return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
            changes: result.rowCount || 0
        }
    }

    async get(sql: string, params: any[] = []): Promise<any> {
        let paramIndex = 0
        const convertedSql = sql.replace(/\?/g, () => `$${++paramIndex}`)

        const result = await this.pool.query(convertedSql, params)
        const row = result.rows[0]
        // Convert null to undefined to match SQLite behavior
        if (!row) return undefined
        // Convert string numbers from COUNT/aggregations to actual numbers
        return convertNumericFields(row)
    }

    async all(sql: string, params: any[] = []): Promise<any[]> {
        let paramIndex = 0
        const convertedSql = sql.replace(/\?/g, () => `$${++paramIndex}`)

        const result = await this.pool.query(convertedSql, params)
        // Convert string numbers from COUNT/aggregations to actual numbers
        return result.rows.map(row => convertNumericFields(row))
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')
            this.inTransaction = true
            const result = await fn()
            await client.query('COMMIT')
            this.inTransaction = false
            return result
        } catch (error) {
            await client.query('ROLLBACK')
            this.inTransaction = false
            throw error
        } finally {
            client.release()
        }
    }

    async close(): Promise<void> {
        await this.pool.end()
    }

    // PostgreSQL-specific: Get underlying pool for advanced usage
    getUnderlying(): pg.Pool {
        return this.pool
    }
}
