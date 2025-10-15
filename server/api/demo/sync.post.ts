import { defineEventHandler, createError } from 'h3'
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../../database/init'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// CSV file paths - resolve from project root  
const csvDir = join(process.cwd(), 'src/assets/csv')

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))

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
        values.push(current)
        current = ''
      } else if (!(char === '"' && (i === 0 || line[i - 1] === ',' || i === line.length - 1 || line[i + 1] === ','))) {
        current += char
      }
    }
    values.push(current)

    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

export default defineEventHandler(async () => {
  try {
    // Note: Database is initialized by migration system on startup
    // This endpoint imports CSV data into existing tables

    // Read and parse CSV data
    const eventsCSV = await readFile(join(csvDir, 'events.csv'), 'utf-8')
    const postsCSV = await readFile(join(csvDir, 'posts.csv'), 'utf-8')
    const locationsCSV = await readFile(join(csvDir, 'locations.csv'), 'utf-8')
    const instructorsCSV = await readFile(join(csvDir, 'instructors.csv'), 'utf-8')
    const childrenCSV = await readFile(join(csvDir, 'children.csv'), 'utf-8')
    const teensCSV = await readFile(join(csvDir, 'teens.csv'), 'utf-8')
    const adultsCSV = await readFile(join(csvDir, 'adults.csv'), 'utf-8')

    const events = parseCSV(eventsCSV)
    const posts = parseCSV(postsCSV)
    const locations = parseCSV(locationsCSV)
    const instructors = parseCSV(instructorsCSV)
    const children = parseCSV(childrenCSV)
    const teens = parseCSV(teensCSV)
    const adults = parseCSV(adultsCSV)

    // Insert events using UPSERT (compatible with both SQLite and PostgreSQL)
    for (const event of events) {
      await db.run(`
        INSERT INTO events 
        (id, name, date_begin, date_end, address_id, user_id, seats_max, cimg, header_type, rectitle, teaser)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          date_begin = excluded.date_begin,
          date_end = excluded.date_end,
          address_id = excluded.address_id,
          user_id = excluded.user_id,
          seats_max = excluded.seats_max,
          cimg = excluded.cimg,
          header_type = excluded.header_type,
          rectitle = excluded.rectitle,
          teaser = excluded.teaser
      `, [
        event.id,
        event.name,
        event.date_begin,
        event.date_end,
        event['address_id/id'] || event.address_id,
        event['user_id/id'] || event.user_id,
        event.seats_max || 0,
        event.cimg,
        event.header_type,
        event.rectitle,
        event.teaser
      ])
    }

    // Insert posts
    for (const post of posts) {
      await db.run(`
        INSERT INTO posts 
        (id, name, subtitle, teaser, author_id, blog_id, tag_ids, website_published, is_published, post_date, cover_properties, event_id, cimg)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          subtitle = excluded.subtitle,
          teaser = excluded.teaser,
          author_id = excluded.author_id,
          blog_id = excluded.blog_id,
          tag_ids = excluded.tag_ids,
          website_published = excluded.website_published,
          is_published = excluded.is_published,
          post_date = excluded.post_date,
          cover_properties = excluded.cover_properties,
          event_id = excluded.event_id,
          cimg = excluded.cimg
      `, [
        post.id,
        post.name,
        post.subtitle,
        post.teaser,
        post['author_id/id'] || post.author_id,
        post['blog_id/id'] || post.blog_id,
        post['tag_ids/id'] || post.tag_ids,
        post.website_published,
        post.is_published,
        post.post_date,
        post.cover_properties,
        post['event_id/id'] || post.event_id,
        post.cimg
      ])
    }

    // Insert locations
    for (const location of locations) {
      await db.run(`
        INSERT INTO locations 
        (id, name, phone, email, city, zip, street, country_id, is_company, category_id, cimg, header_type, header_size, md, is_location_provider, event_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          email = excluded.email,
          city = excluded.city,
          zip = excluded.zip,
          street = excluded.street,
          country_id = excluded.country_id,
          is_company = excluded.is_company,
          category_id = excluded.category_id,
          cimg = excluded.cimg,
          header_type = excluded.header_type,
          header_size = excluded.header_size,
          md = excluded.md,
          is_location_provider = excluded.is_location_provider,
          event_id = excluded.event_id
      `, [
        location.id,
        location.name,
        location.phone,
        location.email,
        location.city,
        location.zip,
        location.street,
        location['country_id/id'] || location.country_id,
        location.is_company,
        location['category_id/id'] || location.category_id,
        location.cimg,
        location.header_type,
        location.header_size,
        location.md,
        location.is_location_provider,
        location.event_id
      ])
    }

    // Insert instructors
    for (const instructor of instructors) {
      await db.run(`
        INSERT INTO instructors 
        (id, name, email, phone, city, country_id, cimg, description, event_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          phone = excluded.phone,
          city = excluded.city,
          country_id = excluded.country_id,
          cimg = excluded.cimg,
          description = excluded.description,
          event_id = excluded.event_id
      `, [
        instructor.id,
        instructor.name,
        instructor.email,
        instructor.phone,
        instructor.city,
        instructor['country_id/id'] || instructor.country_id,
        instructor.cimg,
        instructor.description,
        instructor['event_id/id'] || instructor.event_id
      ])
    }

    // Insert participants (children, teens, adults)
    for (const child of children) {
      await db.run(`
        INSERT INTO participants 
        (id, name, age, city, country_id, cimg, description, event_id, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          age = excluded.age,
          city = excluded.city,
          country_id = excluded.country_id,
          cimg = excluded.cimg,
          description = excluded.description,
          event_id = excluded.event_id,
          type = excluded.type
      `, [
        child.id,
        child.name,
        parseInt(child.age) || 0,
        child.city,
        child['country_id/id'] || child.country_id,
        child.cimg,
        child.description,
        child['event_id/id'] || child.event_id,
        'child'
      ])
    }

    for (const teen of teens) {
      await db.run(`
        INSERT INTO participants 
        (id, name, age, city, country_id, cimg, description, event_id, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          age = excluded.age,
          city = excluded.city,
          country_id = excluded.country_id,
          cimg = excluded.cimg,
          description = excluded.description,
          event_id = excluded.event_id,
          type = excluded.type
      `, [
        teen.id,
        teen.name,
        parseInt(teen.age) || 0,
        teen.city,
        teen['country_id/id'] || teen.country_id,
        teen.cimg,
        teen.description,
        teen['event_id/id'] || teen.event_id,
        'teen'
      ])
    }

    for (const adult of adults) {
      await db.run(`
        INSERT INTO participants 
        (id, name, age, city, country_id, cimg, description, event_id, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          age = excluded.age,
          city = excluded.city,
          country_id = excluded.country_id,
          cimg = excluded.cimg,
          description = excluded.description,
          event_id = excluded.event_id,
          type = excluded.type
      `, [
        adult.id,
        adult.name,
        parseInt(adult.age) || 0,
        adult.city,
        adult['country_id/id'] || adult.country_id,
        adult.cimg,
        adult.description,
        adult['event_id/id'] || adult.event_id,
        'adult'
      ])
    }

    return {
      success: true,
      message: 'Database synchronized from CSV files',
      counts: {
        events: events.length,
        posts: posts.length,
        locations: locations.length,
        instructors: instructors.length,
        participants: children.length + teens.length + adults.length
      }
    }
  } catch (error) {
    console.error('Error syncing database:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to sync database'
    })
  }
})
