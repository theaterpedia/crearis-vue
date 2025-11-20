import { createDatabaseAdapter } from './server/database/adapter'
import { config } from './server/config'

async function test() {
    const db = await createDatabaseAdapter()

    console.log('Database type:', db.type)
    console.log('Testing config read...')

    const result = await db.get('SELECT config FROM crearis_config WHERE id = 1', [])
    console.log('Raw result:', result)

    if (result) {
        const configData = JSON.parse((result as any).config)
        console.log('Parsed config:', configData)
        console.log('Migrations run:', configData.migrations_run)
        console.log('Count:', configData.migrations_run?.length || 0)
    }

    await db.close()
}

test().catch(console.error)
