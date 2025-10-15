/**
 * Version update script for demo-data
 * - Validates schema before version bump
 * - Updates package.json version
 * - Updates crearis_config table in both databases
 * - Prompts for update description
 * - Appends to CHANGELOG.md
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { spawn } from 'child_process'
import { db as pgdb } from './init.js'
import Database from 'better-sqlite3'

const PACKAGE_JSON = path.resolve('package.json')
const CHANGELOG_MD = path.resolve('CHANGELOG.md')
const SQLITE_PATH = path.resolve('demo-data.db')

async function prompt(question: string) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    return new Promise<string>(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

/**
 * Run schema validation and return results
 */
async function runSchemaValidation(): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
        const child = spawn('npx', ['tsx', 'server/database/check-structure.ts'], {
            cwd: process.cwd(),
            env: process.env,
        })

        let output = ''
        let errorOutput = ''

        child.stdout.on('data', (data) => {
            output += data.toString()
        })

        child.stderr.on('data', (data) => {
            errorOutput += data.toString()
        })

        child.on('close', (code) => {
            const allOutput = output + errorOutput
            resolve({
                success: code === 0,
                output: allOutput,
            })
        })

        child.on('error', (err) => {
            resolve({
                success: false,
                output: `Failed to run validation: ${err.message}`,
            })
        })
    })
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
    console.log('🔍 Running schema validation...\n')

    const validation = await runSchemaValidation()

    // Display validation results
    console.log(validation.output)

    if (!validation.success) {
        console.log('\n❌ Schema validation FAILED!')
        console.log('💡 Tip: Run migrations first: pnpm db:migrate\n')

        const continueAnyway = await prompt('Continue with version update anyway? (y/N): ')
        if (continueAnyway.toLowerCase() !== 'y') {
            console.log('❌ Version update cancelled.')
            process.exit(0)
        }
    } else {
        console.log('\n✅ Schema validation PASSED!')
    }

    // Proceed with version update
    const currentVersion = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8')).version
    console.log(`\nCurrent version: ${currentVersion}`)
    const newVersion = await prompt('Enter new version: ')

    if (!newVersion || newVersion === currentVersion) {
        console.log('❌ Invalid or unchanged version. Cancelled.')
        process.exit(0)
    }

    const description = await prompt('Enter update description: ')

    if (!description) {
        console.log('❌ Description is required. Cancelled.')
        process.exit(0)
    }

    console.log('\n📝 Updating version...')
    await updatePackageJson(newVersion)
    await updateCrearisConfigPostgres(newVersion)
    updateCrearisConfigSqlite(newVersion)
    await updateChangelog(newVersion, description)

    console.log(`\n✅ Version updated to ${newVersion} everywhere.`)
    console.log(`   - package.json`)
    console.log(`   - PostgreSQL crearis_config`)
    console.log(`   - SQLite crearis_config`)
    console.log(`   - CHANGELOG.md`)
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1) })
