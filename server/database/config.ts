/**
 * Database Configuration
 * 
 * Centralized configuration for database connections.
 * Supports both SQLite (default) and PostgreSQL.
 */

export type DatabaseType = 'sqlite' | 'postgresql'

export interface DatabaseConfig {
    type: DatabaseType
    sqlite?: {
        path: string
    }
    postgresql?: {
        connectionString: string
    }
}

/**
 * Get database configuration from environment variables
 * Defaults to SQLite if no DATABASE_TYPE is specified
 */
export function getDatabaseConfig(): DatabaseConfig {
    const type = (process.env.DATABASE_TYPE || 'sqlite') as DatabaseType

    const config: DatabaseConfig = {
        type
    }

    if (type === 'sqlite') {
        config.sqlite = {
            path: process.env.SQLITE_PATH || './demo-data.db'
        }
    } else if (type === 'postgresql') {
        const connectionString = process.env.DATABASE_URL
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is required for PostgreSQL')
        }
        config.postgresql = {
            connectionString
        }
    }

    return config
}

export const dbConfig = getDatabaseConfig()
