/**
 * Export Images Table to JSON
 * 
 * This script exports all data from the images table to /server/data/images/root.json
 * All 42 fields are included in the export.
 * 
 * Usage:
 *   pnpm tsx scripts/export-images-json.ts
 */

import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { getDataPath } from '../server/settings'

// Get database path from environment or use default
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'server/database/demo-data.db')

interface ImageRecord {
    id: number
    xmlid: string
    name: string
    url: string
    fileformat: string | null
    mediaformat: string | null
    function: string | null
    length: number | null
    provider: string | null
    has_video: boolean
    has_audio: boolean
    is_public: boolean
    is_private: boolean
    is_dark: boolean
    is_light: boolean
    domaincode: string | null
    owner_id: number | null
    date: string | null
    geo: string | null // JSONB stored as string
    x: number | null
    y: number | null
    copyright: string | null
    alt_text: string | null
    title: string | null
    status_id: number | null
    tags: number
    av_x: number | null
    av_y: number | null
    av_z: number | null
    ca_x: number | null
    ca_y: number | null
    ca_z: number | null
    he_x: number | null
    he_y: number | null
    he_z: number | null
    created_at: string
    updated_at: string
}

async function exportImages(): Promise<void> {
    console.log('🖼️  Exporting images table to JSON...')
    console.log(`Database: ${DB_PATH}`)

    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
        console.error(`❌ Database not found at: ${DB_PATH}`)
        console.error('Please ensure the database exists and DB_PATH is correct.')
        process.exit(1)
    }

    // Connect to database
    const db = new Database(DB_PATH, { readonly: true })

    try {
        // Query all images (all 42 fields)
        const images = db.prepare(`
      SELECT 
        id,
        xmlid,
        name,
        url,
        fileformat,
        mediaformat,
        function,
        length,
        provider,
        has_video,
        has_audio,
        is_public,
        is_private,
        is_dark,
        is_light,
        domaincode,
        owner_id,
        date,
        geo,
        x,
        y,
        copyright,
        alt_text,
        title,
        status_id,
        tags,
        av_x,
        av_y,
        av_z,
        ca_x,
        ca_y,
        ca_z,
        he_x,
        he_y,
        he_z,
        created_at,
        updated_at
      FROM images
      ORDER BY id ASC
    `).all() as ImageRecord[]

        console.log(`✓ Found ${images.length} images in database`)

        // Convert boolean values (SQLite stores as 0/1)
        const processedImages = images.map(img => ({
            ...img,
            has_video: Boolean(img.has_video),
            has_audio: Boolean(img.has_audio),
            is_public: Boolean(img.is_public),
            is_private: Boolean(img.is_private),
            is_dark: Boolean(img.is_dark),
            is_light: Boolean(img.is_light),
            geo: img.geo ? JSON.parse(img.geo) : null // Parse JSONB string to object
        }))

        // Prepare output directory and file path
        const outputDir = path.join(getDataPath(), 'images')
        const outputFile = path.join(outputDir, 'root.json')

        // Ensure directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
            console.log(`✓ Created directory: ${outputDir}`)
        }

        // Write JSON file with pretty formatting
        fs.writeFileSync(outputFile, JSON.stringify(processedImages, null, 2), 'utf-8')

        console.log(`✅ Successfully exported ${processedImages.length} images to:`)
        console.log(`   ${outputFile}`)
        console.log(`   File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`)

        // Show summary statistics
        const stats = {
            total: processedImages.length,
            with_owner: processedImages.filter(img => img.owner_id !== null).length,
            public: processedImages.filter(img => img.is_public).length,
            private: processedImages.filter(img => img.is_private).length,
            with_tags: processedImages.filter(img => img.tags > 0).length,
            with_video: processedImages.filter(img => img.has_video).length,
            with_audio: processedImages.filter(img => img.has_audio).length,
            providers: new Set(processedImages.filter(img => img.provider).map(img => img.provider)).size
        }

        console.log('\n📊 Export Statistics:')
        console.log(`   Total images: ${stats.total}`)
        console.log(`   With owner: ${stats.with_owner}`)
        console.log(`   Public: ${stats.public}`)
        console.log(`   Private: ${stats.private}`)
        console.log(`   With tags: ${stats.with_tags}`)
        console.log(`   With video: ${stats.with_video}`)
        console.log(`   With audio: ${stats.with_audio}`)
        console.log(`   Unique providers: ${stats.providers}`)

    } catch (error) {
        console.error('❌ Export failed:', error)
        process.exit(1)
    } finally {
        db.close()
    }
}

// Run export
exportImages()
