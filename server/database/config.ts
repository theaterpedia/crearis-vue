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
 * Defaults to PostgreSQL if no DATABASE_TYPE is specified
 */
export function getDatabaseConfig(): DatabaseConfig {
    const type = (process.env.DATABASE_TYPE || 'postgresql') as DatabaseType

    const config: DatabaseConfig = {
        type
    }

    if (type === 'sqlite') {
        config.sqlite = {
            path: process.env.SQLITE_PATH || './demo-data.db'
        }
    } else if (type === 'postgresql') {
        // First check if DATABASE_URL is provided directly
        let connectionString = process.env.DATABASE_URL

        // If not, construct it from individual components
        if (!connectionString) {
            const dbUser = process.env.DB_USER
            const dbPassword = process.env.DB_PASSWORD
            const dbName = process.env.DB_NAME
            const dbHost = process.env.DB_HOST || 'localhost'
            const dbPort = process.env.DB_PORT || '5432'

            if (!dbUser || !dbPassword || !dbName) {
                throw new Error('PostgreSQL requires either DATABASE_URL or DB_USER, DB_PASSWORD, and DB_NAME environment variables')
            }

            connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`
        }

        config.postgresql = {
            connectionString
        }
    }

    return config
}

export const dbConfig = getDatabaseConfig()
