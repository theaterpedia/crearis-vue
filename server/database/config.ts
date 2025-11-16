/**
 * Database Configuration
 * 
 * Centralized configuration for database connections.
 * Supports both SQLite (default) and PostgreSQL.
 * 
 * TEMPORARY: Using dotenv for test database setup (next few days)
 * - Removed Nov 10: Fixed "require is not defined" ESM error in Nitro
 * - Reverted Nov 10: Need dotenv for test DB creation (user lacks CREATE DATABASE permission)
 * - See docs/DOTENV_NITRO_ESM_ISSUE.md for long-term solution
 * 
 * TODO: Remove dotenv once test databases are pre-created or superuser access obtained
 */

import { config as loadEnv } from 'dotenv'

// Load environment variables (temporary - causes ESM issues in Nitro bundles)
loadEnv()

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
