/**
 * Shared User Import Utilities
 * 
 * Used by:
 * - Migration 022 (CSV seed data)
 * - Production user import script
 * 
 * Provides consistent password generation, CSV parsing, and user creation logic
 */

import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import type { DatabaseAdapter } from '../database/adapter'
import { getDataPath } from '../settings'

/**
 * Generate a random 10-character password with letters and numbers
 */
export function generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Extract first name from username for display purposes
 */
export function extractFirstName(username: string): string {
    return username.split(' ')[0].toLowerCase()
}

/**
 * Parse CSV file into array of objects
 * Handles quoted fields and comma-separated values correctly
 */
export function parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

    return lines.slice(1).map(line => {
        const values: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"' && (i === 0 || line[i - 1] === ',')) {
                inQuotes = true
            } else if (char === '"' && (i === line.length - 1 || line[i + 1] === ',')) {
                inQuotes = false
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim())
                current = ''
            } else if (!(char === '"' && (i === 0 || line[i - 1] === ',' || i === line.length - 1 || line[i + 1] === ','))) {
                current += char
            }
        }
        values.push(current.trim())

        const obj: any = {}
        headers.forEach((header, index) => {
            obj[header] = values[index] || ''
        })
        return obj
    })
}

/**
 * Load existing passwords from PASSWORDS.csv
 * Returns Map<sysmail, {extmail, password}>
 */
export function loadExistingPasswords(): Map<string, { extmail: string, password: string }> {
    const passwordsFilePath = path.join(getDataPath(), 'PASSWORDS.csv')
    const existingPasswords = new Map<string, { extmail: string, password: string }>()

    if (fs.existsSync(passwordsFilePath)) {
        try {
            const existingCSV = fs.readFileSync(passwordsFilePath, 'utf-8')
            const existingRows = existingCSV.split('\n').slice(1).filter(row => row.trim())

            for (const row of existingRows) {
                const match = row.match(/"([^"]*)","([^"]*)","([^"]*)"/)
                if (match) {
                    existingPasswords.set(match[1], {
                        extmail: match[2],
                        password: match[3]
                    })
                }
            }
        } catch (error) {
            console.log('    ⚠️  Could not parse existing PASSWORDS.csv')
        }
    }

    return existingPasswords
}

/**
 * Save passwords to PASSWORDS.csv
 * Merges with existing entries
 */
export function savePasswords(
    newEntries: Array<{ sysmail: string, extmail: string, password: string }>
): void {
    const passwordsFilePath = path.join(getDataPath(), 'PASSWORDS.csv')
    const allEntries = new Map<string, { sysmail: string, extmail: string, password: string }>()

    // Load existing entries
    const existingPasswords = loadExistingPasswords()
    for (const [sysmail, data] of existingPasswords.entries()) {
        allEntries.set(sysmail, { sysmail, ...data })
    }

    // Add/update new entries
    for (const entry of newEntries) {
        allEntries.set(entry.sysmail, entry)
    }

    // Write to file
    const passwordsCSVContent = [
        'sysmail,extmail,password',
        ...Array.from(allEntries.values()).map(entry =>
            `"${entry.sysmail}","${entry.extmail}","${entry.password}"`
        )
    ].join('\n')

    fs.writeFileSync(passwordsFilePath, passwordsCSVContent, 'utf-8')
    fs.chmodSync(passwordsFilePath, 0o600) // Secure permissions
}

/**
 * Process user CSV row and generate/reuse password
 * Returns password entry for PASSWORDS.csv and hashed password for DB
 */
export async function processUserPassword(
    user: { sysmail: string, extmail?: string },
    existingPasswords: Map<string, { extmail: string, password: string }>,
    db: DatabaseAdapter
): Promise<{
    passwordEntry: { sysmail: string, extmail: string, password: string }
    hashedPassword: string
    action: 'generated' | 'reused' | 'skipped'
}> {
    // Check if user already exists in database
    const existingUser = await db.get('SELECT id FROM users WHERE sysmail = ?', [user.sysmail])

    if (existingUser) {
        // User exists, don't generate new password
        if (existingPasswords.has(user.sysmail)) {
            const existing = existingPasswords.get(user.sysmail)!
            return {
                passwordEntry: {
                    sysmail: user.sysmail,
                    extmail: existing.extmail,
                    password: existing.password
                },
                hashedPassword: '', // Not used for existing users
                action: 'skipped'
            }
        }
        // User exists but no password in CSV (shouldn't happen)
        return {
            passwordEntry: { sysmail: user.sysmail, extmail: '', password: '' },
            hashedPassword: '',
            action: 'skipped'
        }
    }

    // Check if we already have a password for this user
    if (existingPasswords.has(user.sysmail)) {
        const existing = existingPasswords.get(user.sysmail)!
        const hashedPassword = await bcrypt.hash(existing.password, 10)
        return {
            passwordEntry: {
                sysmail: user.sysmail,
                extmail: user.extmail || existing.extmail,
                password: existing.password
            },
            hashedPassword,
            action: 'reused'
        }
    }

    // Generate new password
    const randomPassword = generateRandomPassword()
    const hashedPassword = await bcrypt.hash(randomPassword, 10)

    return {
        passwordEntry: {
            sysmail: user.sysmail,
            extmail: user.extmail || '',
            password: randomPassword
        },
        hashedPassword,
        action: 'generated'
    }
}

/**
 * Create or link instructor for user
 * Returns instructor_id or null
 */
export async function processUserInstructor(
    user: { username: string, sysmail: string, extmail?: string },
    instructorXmlId: string | null,
    db: DatabaseAdapter
): Promise<number | null> {
    if (!instructorXmlId || !instructorXmlId.trim()) {
        return null
    }

    // Check if instructor exists by xmlid
    const existingInstructor = await db.get(
        'SELECT id FROM instructors WHERE xmlid = ?',
        [instructorXmlId]
    )

    if (existingInstructor) {
        return existingInstructor.id
    }

    // Create new instructor from user data
    const firstSlug = instructorXmlId.split('.')[0]
    let regioId: number | null = null

    // Check if first slug matches a project with is_regio = true
    const regioProject = await db.get(
        'SELECT id FROM projects WHERE domaincode = ? AND is_regio = ?',
        [firstSlug, db.type === 'postgresql' ? true : 1]
    )

    if (regioProject) {
        regioId = regioProject.id
    }

    // Use extmail if available, fallback to sysmail
    const instructorEmail = user.extmail && user.extmail.trim() ? user.extmail : user.sysmail

    if (db.type === 'postgresql') {
        const newInstructor = await db.get(`
            INSERT INTO instructors (xmlid, name, email, regio_id, isbase)
            VALUES ($1, $2, $3, $4, 0)
            RETURNING id
        `, [instructorXmlId, user.username, instructorEmail, regioId])
        return newInstructor?.id || null
    } else {
        await db.run(`
            INSERT INTO instructors (xmlid, name, email, regio_id, isbase)
            VALUES (?, ?, ?, ?, 0)
        `, [instructorXmlId, user.username, instructorEmail, regioId])
        const newInstructor = await db.get(
            'SELECT id FROM instructors WHERE xmlid = ?',
            [instructorXmlId]
        )
        return newInstructor?.id || null
    }
}

/**
 * Import single user into database
 * Returns true if user was created, false if skipped
 */
export async function importUser(
    user: any,
    hashedPassword: string,
    instructorId: number | null,
    db: DatabaseAdapter
): Promise<boolean> {
    if (db.type === 'postgresql') {
        const result = await db.run(`
            INSERT INTO users 
            (sysmail, extmail, username, password, role, lang, instructor_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT(sysmail) DO NOTHING
        `, [
            user.sysmail,
            user.extmail || null,
            user.username,
            hashedPassword,
            user.role || 'user',
            user.lang || 'de',
            instructorId
        ])
        // PostgreSQL returns rowCount for INSERT ... ON CONFLICT DO NOTHING
        return true // Assume success if no error
    } else {
        await db.run(`
            INSERT OR IGNORE INTO users 
            (sysmail, extmail, username, password, role, lang, instructor_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            user.sysmail,
            user.extmail || null,
            user.username,
            hashedPassword,
            user.role || 'user',
            user.lang || 'de',
            instructorId
        ])
        return true
    }
}

/**
 * Validate user CSV row
 * Returns array of validation errors (empty if valid)
 */
export function validateUserRow(user: any, rowNumber: number): string[] {
    const errors: string[] = []

    if (!user.sysmail || !user.sysmail.trim()) {
        errors.push(`Row ${rowNumber}: Missing required field 'sysmail'`)
    } else if (!user.sysmail.includes('@')) {
        errors.push(`Row ${rowNumber}: Invalid email format for 'sysmail': ${user.sysmail}`)
    }

    if (!user.username || !user.username.trim()) {
        errors.push(`Row ${rowNumber}: Missing required field 'username'`)
    }

    // password field is ignored (we generate random passwords)

    if (user.role && !['admin', 'base', 'user'].includes(user.role)) {
        errors.push(`Row ${rowNumber}: Invalid role '${user.role}' (must be: admin, base, or user)`)
    }

    if (user.lang && !['de', 'en', 'cz'].includes(user.lang)) {
        errors.push(`Row ${rowNumber}: Invalid language '${user.lang}' (must be: de, en, or cz)`)
    }

    return errors
}
