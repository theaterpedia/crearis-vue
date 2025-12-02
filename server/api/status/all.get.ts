/**
 * API Endpoint: Get All Statuses
 * 
 * Returns all status entries for client-side caching
 */

import { defineEventHandler } from 'h3'
import { db } from '../../database/db-new'

export default defineEventHandler(async (event) => {
    try {
        const statuses = await db.all(`
            SELECT 
                id, 
                value, 
                name,
                tagfamily,
                name_i18n,
                desc_i18n
            FROM sysreg
            WHERE tagfamily = 'status'
            ORDER BY name
        `, [])

        // Parse JSON fields for PostgreSQL
        const parsedStatuses = (statuses as any[]).map(status => {
            let nameI18n = status.name_i18n
            let descI18n = status.desc_i18n

            // Parse if string (PostgreSQL JSONB returned as object, SQLite as string)
            if (typeof nameI18n === 'string') {
                try {
                    nameI18n = JSON.parse(nameI18n)
                } catch (e) {
                    nameI18n = {}
                }
            }

            if (descI18n && typeof descI18n === 'string') {
                try {
                    descI18n = JSON.parse(descI18n)
                } catch (e) {
                    descI18n = null
                }
            }

            return {
                ...status,
                name_i18n: nameI18n || {},
                desc_i18n: descI18n
            }
        })

        return {
            statuses: parsedStatuses,
            count: parsedStatuses.length
        }
    } catch (error: any) {
        console.error('Error fetching status data:', error)
        return {
            statuses: [],
            count: 0,
            error: error.message
        }
    }
})
