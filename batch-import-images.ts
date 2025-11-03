/**
 * Batch Import Unsplash Images
 * 
 * Imports a batch of Unsplash images using the import API logic.
 * URLs provided:
 * - https://unsplash.com/photos/woman-lying-on-stairway-at-nighttime-brofJVz94tQ
 * - https://unsplash.com/photos/a-group-of-people-sitting-on-the-floor-talking-YFJecGLgo24
 * - https://unsplash.com/photos/a-group-of-young-people-standing-next-to-each-other-limXXsOCVMo
 * - https://unsplash.com/photos/a-group-of-people-standing-on-top-of-a-stage-TMTIGjHYKGo
 * - https://unsplash.com/photos/0pucvxYF3HM
 */

import { PostgreSQLAdapter } from './server/database/adapters/postgresql'
import { adapterRegistry } from './server/adapters/registry'
import type { ImageImportBatch } from './server/types/adapters'

// Extract photo IDs from URLs
const urls = [
    'brofJVz94tQ',  // woman lying on stairway at nighttime
    'YFJecGLgo24',  // group of people sitting on the floor talking
    'limXXsOCVMo',  // group of young people standing next to each other
    'TMTIGjHYKGo',  // group of people standing on top of a stage
    '0pucvxYF3HM'   // photo without slug
].map(id => `https://images.unsplash.com/photo-${id}`)

// Import function
async function importImages(urls: string[], batch: ImageImportBatch) {
    const results = []

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i]

        try {
            const adapter = adapterRegistry.detectAdapter(url)

            if (!adapter) {
                results.push({
                    success: false,
                    url,
                    adapter: 'external',
                    error: 'No adapter found for this URL. Supported: Unsplash'
                })
                continue
            }

            const batchWithSequence = { ...batch }
            if (batch?.xml_root) {
                const sequence = String(i).padStart(2, '0')
                batchWithSequence.xml_root = `${batch.xml_root}.${sequence}`
            }

            console.log(`\n[${i + 1}/${urls.length}] Importing: ${url}`)
            console.log(`  xmlid: ${batchWithSequence.xml_root}`)

            const result = await adapter.importImage(url, batchWithSequence)
            results.push(result)

            if (result.success) {
                console.log(`  ✅ Success - Image ID: ${result.image?.id}`)
                console.log(`     Title: ${result.image?.title || 'N/A'}`)
                console.log(`     Dimensions: ${result.image?.width}x${result.image?.height}`)
            } else {
                console.log(`  ❌ Failed: ${result.error}`)
            }

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            results.push({
                success: false,
                url,
                adapter: 'external',
                error: errorMsg
            })
            console.log(`  ❌ Exception: ${errorMsg}`)
        }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return {
        success: failed === 0,
        total: urls.length,
        successful,
        failed,
        results
    }
}

// Main execution
async function main() {
    console.log('='.repeat(60))
    console.log('BATCH IMPORT UNSPLASH IMAGES')
    console.log('='.repeat(60))
    console.log(`\nImporting ${urls.length} images...`)

    // Check for required environment variable
    if (!process.env.UNSPLASH_ACCESS_KEY) {
        console.error('\n❌ Error: UNSPLASH_ACCESS_KEY environment variable is not set!')
        console.error('   Please set it in your .env file or environment.')
        process.exit(1)
    }

    // Get database connection string from environment
    const connectionString = process.env.DATABASE_URL ||
        process.env.TEST_DATABASE_URL ||
        process.env.POSTGRES_URL ||
        'postgresql://crearis_user:crearis_pass@localhost:5432/crearis_db'

    try {
        // Initialize database connection
        const db = new PostgreSQLAdapter(connectionString)
        console.log('\n✅ Database connected')

        // Ensure test data exists
        console.log('\n📦 Setting up test data...')
        await db.run(`
            INSERT INTO users (id, sysmail, password, username, status_id, role)
            VALUES (101, 'batch_import@test.com', 'hash', 'batch_importer', 18, 'user')
            ON CONFLICT (id) DO NOTHING
        `)

        await db.run(`
            INSERT INTO projects (id, domaincode, name, status_id, owner_id)
            VALUES (101, 'batch_import', 'Batch Import Project', 24, 101)
            ON CONFLICT (id) DO NOTHING
        `)
        console.log('✅ Test data ready')

        // Import batch configuration
        const batchConfig = {
            domaincode: 'batch_import',
            owner_id: 101,
            alt_text: 'Batch imported from Unsplash',
            license: 'unsplash',
            xml_root: 'batch_import_nov2025'
        }

        // Run import
        const result = await importImages(urls, batchConfig)

        // Display summary
        console.log('\n' + '='.repeat(60))
        console.log('IMPORT SUMMARY')
        console.log('='.repeat(60))
        console.log(`Total:      ${result.total}`)
        console.log(`Successful: ${result.successful} ✅`)
        console.log(`Failed:     ${result.failed} ❌`)
        console.log(`Success:    ${result.success ? 'YES' : 'NO'}`)

        // Display failed images if any
        if (result.failed > 0) {
            console.log('\n❌ Failed imports:')
            result.results.filter(r => !r.success).forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.url}`)
                console.log(`      Error: ${r.error}`)
            })
        }

        // Query and display imported images
        if (result.successful > 0) {
            console.log('\n📸 Imported images in database:')
            const images = await db.all(`
                SELECT id, xmlid, title, width, height, url, adapter
                FROM images
                WHERE xmlid LIKE 'batch_import_nov2025%'
                ORDER BY xmlid
            `)

            images.forEach((img, i) => {
                console.log(`\n   ${i + 1}. [ID: ${img.id}] ${img.xmlid}`)
                console.log(`      Title: ${img.title || 'N/A'}`)
                console.log(`      Dimensions: ${img.width}x${img.height}`)
                console.log(`      URL: ${img.url}`)
                console.log(`      Adapter: ${img.adapter}`)
            })
        }

        console.log('\n' + '='.repeat(60))
        console.log('✅ BATCH IMPORT COMPLETE')
        console.log('='.repeat(60))

        process.exit(0)

    } catch (error) {
        console.error('\n' + '='.repeat(60))
        console.error('❌ FATAL ERROR')
        console.error('='.repeat(60))
        console.error(error)
        process.exit(1)
    }
}

main()
