/**
 * Version update script for demo-data
 * - Updates package.json version
 * - Updates crearis_config table in both databases
 * - Prompts for update description
 * - Appends to CHANGELOG.md
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { db as pgdb } from './init.js'
import Database from 'better-sqlite3'

const PACKAGE_JSON = path.resolve('package.json')
const CHANGELOG_MD = path.resolve('CHANGELOG.md')
const SQLITE_PATH = path.resolve('demo-data.db')

async function prompt(question: string) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise<string>(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

async function updatePackageJson(newVersion: string) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'))
    pkg.version = newVersion
    fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2))
}

async function updateCrearisConfigPostgres(newVersion: string) {
    await pgdb.run(
        `UPDATE crearis_config SET config = jsonb_set(config, '{version}', '"${newVersion}"') WHERE id = 1`
    )
}

function updateCrearisConfigSqlite(newVersion: string) {
    const db = new Database(SQLITE_PATH)
    const row = db.prepare('SELECT id, config FROM crearis_config LIMIT 1').get() as any
    if (row) {
        const config = JSON.parse(row.config)
        config.version = newVersion
        db.prepare('UPDATE crearis_config SET config = ? WHERE id = ?').run(JSON.stringify(config), row.id)
    }
    db.close()
}

async function updateChangelog(newVersion: string, description: string) {
    const today = new Date().toISOString().slice(0, 10)
    const entry = `\n## [${newVersion}] - ${today}\n\n### Changed\n- Version bumped to ${newVersion}\n- ${description}\n`
    fs.appendFileSync(CHANGELOG_MD, entry)
}

async function main() {
    const currentVersion = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8')).version
    console.log(`Current version: ${currentVersion}`)
    const newVersion = await prompt('Enter new version: ')
    const description = await prompt('Enter update description: ')

    await updatePackageJson(newVersion)
    await updateCrearisConfigPostgres(newVersion)
    updateCrearisConfigSqlite(newVersion)
    await updateChangelog(newVersion, description)

    console.log(`\n✅ Version updated to ${newVersion} everywhere.`)
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1) })
