import Database from 'better-sqlite3'
import { nanoid } from 'nanoid'

const db = new Database('demo-data.db')

console.log('🚀 Starting Data Actions Script...\n')

// Enable foreign keys
db.pragma('foreign_keys = ON')

// ============================================================================
// 1. SET isbase=true FOR EXISTING EVENTS WITH _demo.* IDs
// ============================================================================

console.log('📋 Step 1: Setting isbase=true for demo events...')

const updateIsBase = db.prepare(`
    UPDATE events 
    SET isbase = 1 
    WHERE id LIKE '_demo.%'
`)

const result = updateIsBase.run()
console.log(`✅ Updated ${result.changes} events to isbase=true`)

// Verify
const baseCount = db.prepare("SELECT COUNT(*) as count FROM events WHERE isbase = 1").get() as { count: number }
console.log(`   Verification: ${baseCount.count} base events in database\n`)

// ============================================================================
// 2. GET SAMPLE DATA FOR DUPLICATION
// ============================================================================

console.log('📋 Step 2: Getting sample data for duplication...')

// Get 4 sample events to duplicate
const sampleEvents = db.prepare(`
    SELECT * FROM events 
    WHERE id LIKE '_demo.%' 
    LIMIT 4
`).all() as any[]

console.log(`   Found ${sampleEvents.length} sample events`)

// Get sample posts linked to these events
const samplePosts = db.prepare(`
    SELECT * FROM posts 
    WHERE event_id LIKE '_demo.%' 
    LIMIT 4
`).all() as any[]

console.log(`   Found ${samplePosts.length} sample posts`)

// Get sample locations
const sampleLocations = db.prepare(`
    SELECT * FROM locations 
    WHERE id LIKE '_demo.%' 
    LIMIT 4
`).all() as any[]

console.log(`   Found ${sampleLocations.length} sample locations`)

// Get sample instructors
const sampleInstructors = db.prepare(`
    SELECT * FROM instructors 
    WHERE id LIKE '_demo.%' 
    LIMIT 4
`).all() as any[]

console.log(`   Found ${sampleInstructors.length} sample instructors`)

// Get sample participants
const sampleParticipants = db.prepare(`
    SELECT * FROM participants 
    LIMIT 8
`).all() as any[]

console.log(`   Found ${sampleParticipants.length} sample participants\n`)

// ============================================================================
// 3. CREATE DATA FOR project1
// ============================================================================

console.log('📋 Step 3: Creating data for project1...')

const project1Events: string[] = []
const project1Posts: string[] = []
const project1Locations: string[] = []
const project1Instructors: string[] = []
const project1Participants: string[] = []

for (let i = 0; i < 4; i++) {
    const sourceEvent = sampleEvents[i]
    const eventId = `project1.event_workshop_${i + 1}`

    // Create event
    db.prepare(`
        INSERT INTO events (
            id, name, date_begin, date_end, address_id, user_id, seats_max,
            cimg, header_type, rectitle, teaser, isBase, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        eventId,
        `${sourceEvent.name} - Project1 Edition ${i + 1}`,
        sourceEvent.date_begin,
        sourceEvent.date_end,
        sourceEvent.address_id,
        sourceEvent.user_id,
        sourceEvent.seats_max,
        sourceEvent.cimg,
        sourceEvent.header_type,
        sourceEvent.rectitle,
        sourceEvent.teaser,
        0, // isBase = false (project-specific)
        'active',
        new Date().toISOString(),
        new Date().toISOString()
    )
    project1Events.push(eventId)

    // Create post linked to this event
    const sourcePost = samplePosts[i]
    const postId = `project1.post_announcement_${i + 1}`

    db.prepare(`
        INSERT INTO posts (
            id, name, subtitle, teaser, author_id, blog_id, event_id,
            cimg, is_published, website_published, post_date, created_at, updated_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        postId,
        `${sourcePost.name || 'Workshop Announcement'} - Project1 ${i + 1}`,
        sourcePost.subtitle,
        sourcePost.teaser,
        sourcePost.author_id,
        sourcePost.blog_id,
        eventId, // Link to newly created event
        sourcePost.cimg,
        sourcePost.is_published,
        sourcePost.website_published,
        sourcePost.post_date,
        new Date().toISOString(),
        new Date().toISOString(),
        'active'
    )
    project1Posts.push(postId)

    // Create location for this event
    const sourceLocation = sampleLocations[i]
    const locationId = `project1.location_venue_${i + 1}`

    db.prepare(`
        INSERT INTO locations (
            id, name, phone, email, city, zip, street, country_id,
            cimg, header_type, event_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        locationId,
        `${sourceLocation.name} - Project1 Venue ${i + 1}`,
        sourceLocation.phone,
        sourceLocation.email,
        sourceLocation.city,
        sourceLocation.zip,
        sourceLocation.street,
        sourceLocation.country_id,
        sourceLocation.cimg,
        sourceLocation.header_type,
        eventId, // Link to newly created event
        new Date().toISOString(),
        new Date().toISOString()
    )
    project1Locations.push(locationId)

    // Create instructor for this event
    const sourceInstructor = sampleInstructors[i]
    const instructorId = `project1.instructor_${i + 1}`

    db.prepare(`
        INSERT INTO instructors (
            id, name, email, phone, city, country_id, cimg, description,
            event_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        instructorId,
        `${sourceInstructor.name} - Project1`,
        sourceInstructor.email,
        sourceInstructor.phone,
        sourceInstructor.city,
        sourceInstructor.country_id,
        sourceInstructor.cimg,
        sourceInstructor.description,
        eventId, // Link to newly created event
        new Date().toISOString(),
        new Date().toISOString()
    )
    project1Instructors.push(instructorId)

    // Create 1-2 participants for this event
    const numParticipants = i % 2 === 0 ? 1 : 2
    for (let j = 0; j < numParticipants; j++) {
        const sourceParticipant = sampleParticipants[i * 2 + j]
        const participantId = `project1.participant_${i * 2 + j + 1}`

        db.prepare(`
            INSERT INTO participants (
                id, name, age, city, country_id, event_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            participantId,
            `${sourceParticipant.name} - P1`,
            sourceParticipant.age,
            sourceParticipant.city,
            sourceParticipant.country_id,
            eventId, // Link to newly created event
            new Date().toISOString(),
            new Date().toISOString()
        )
        project1Participants.push(participantId)
    }
}

console.log(`✅ Created for project1:`)
console.log(`   - ${project1Events.length} events`)
console.log(`   - ${project1Posts.length} posts`)
console.log(`   - ${project1Locations.length} locations`)
console.log(`   - ${project1Instructors.length} instructors`)
console.log(`   - ${project1Participants.length} participants\n`)

// ============================================================================
// 4. CREATE DATA FOR project2
// ============================================================================

console.log('📋 Step 4: Creating data for project2...')

const project2Events: string[] = []
const project2Posts: string[] = []
const project2Locations: string[] = []
const project2Instructors: string[] = []
const project2Participants: string[] = []

for (let i = 0; i < 4; i++) {
    const sourceEvent = sampleEvents[i]
    const eventId = `project2.event_session_${i + 1}`

    // Create event
    db.prepare(`
        INSERT INTO events (
            id, name, date_begin, date_end, address_id, user_id, seats_max,
            cimg, header_type, rectitle, teaser, isBase, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        eventId,
        `${sourceEvent.name} - Project2 Session ${i + 1}`,
        sourceEvent.date_begin,
        sourceEvent.date_end,
        sourceEvent.address_id,
        sourceEvent.user_id,
        sourceEvent.seats_max,
        sourceEvent.cimg,
        sourceEvent.header_type,
        sourceEvent.rectitle,
        sourceEvent.teaser,
        0, // isBase = false (project-specific)
        'active',
        new Date().toISOString(),
        new Date().toISOString()
    )
    project2Events.push(eventId)

    // Create post linked to this event
    const sourcePost = samplePosts[i]
    const postId = `project2.post_update_${i + 1}`

    db.prepare(`
        INSERT INTO posts (
            id, name, subtitle, teaser, author_id, blog_id, event_id,
            cimg, is_published, website_published, post_date, created_at, updated_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        postId,
        `${sourcePost.name || 'Session Update'} - Project2 ${i + 1}`,
        sourcePost.subtitle,
        sourcePost.teaser,
        sourcePost.author_id,
        sourcePost.blog_id,
        eventId, // Link to newly created event
        sourcePost.cimg,
        sourcePost.is_published,
        sourcePost.website_published,
        sourcePost.post_date,
        new Date().toISOString(),
        new Date().toISOString(),
        'active'
    )
    project2Posts.push(postId)

    // Create location for this event
    const sourceLocation = sampleLocations[i]
    const locationId = `project2.location_space_${i + 1}`

    db.prepare(`
        INSERT INTO locations (
            id, name, phone, email, city, zip, street, country_id,
            cimg, header_type, event_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        locationId,
        `${sourceLocation.name} - Project2 Space ${i + 1}`,
        sourceLocation.phone,
        sourceLocation.email,
        sourceLocation.city,
        sourceLocation.zip,
        sourceLocation.street,
        sourceLocation.country_id,
        sourceLocation.cimg,
        sourceLocation.header_type,
        eventId, // Link to newly created event
        new Date().toISOString(),
        new Date().toISOString()
    )
    project2Locations.push(locationId)

    // Create instructor for this event
    const sourceInstructor = sampleInstructors[i]
    const instructorId = `project2.instructor_${i + 1}`

    db.prepare(`
        INSERT INTO instructors (
            id, name, email, phone, city, country_id, cimg, description,
            event_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        instructorId,
        `${sourceInstructor.name} - Project2`,
        sourceInstructor.email,
        sourceInstructor.phone,
        sourceInstructor.city,
        sourceInstructor.country_id,
        sourceInstructor.cimg,
        sourceInstructor.description,
        eventId, // Link to newly created event
        new Date().toISOString(),
        new Date().toISOString()
    )
    project2Instructors.push(instructorId)

    // Create 1-2 participants for this event
    const numParticipants = i % 2 === 0 ? 2 : 1
    for (let j = 0; j < numParticipants; j++) {
        const sourceParticipant = sampleParticipants[i * 2 + j]
        const participantId = `project2.participant_${i * 2 + j + 1}`

        db.prepare(`
            INSERT INTO participants (
                id, name, age, city, country_id, event_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            participantId,
            `${sourceParticipant.name} - P2`,
            sourceParticipant.age,
            sourceParticipant.city,
            sourceParticipant.country_id,
            eventId, // Link to newly created event
            new Date().toISOString(),
            new Date().toISOString()
        )
        project2Participants.push(participantId)
    }
}

console.log(`✅ Created for project2:`)
console.log(`   - ${project2Events.length} events`)
console.log(`   - ${project2Posts.length} posts`)
console.log(`   - ${project2Locations.length} locations`)
console.log(`   - ${project2Instructors.length} instructors`)
console.log(`   - ${project2Participants.length} participants\n`)

// ============================================================================
// 5. VERIFY MAIN TASKS WERE AUTO-CREATED
// ============================================================================

console.log('📋 Step 5: Verifying auto-created main tasks...')

const mainTasksCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM tasks 
    WHERE category = 'main' 
    AND (
        record_id LIKE 'project1.%' OR 
        record_id LIKE 'project2.%'
    )
`).get() as { count: number }

console.log(`✅ Auto-created ${mainTasksCount.count} main tasks for new entities\n`)

// ============================================================================
// 6. SUMMARY
// ============================================================================

console.log('📊 Data Actions Summary:')
console.log('='.repeat(60))

const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number }
const baseEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE isBase = 1').get() as { count: number }
const project1EventsCount = db.prepare("SELECT COUNT(*) as count FROM events WHERE id LIKE 'project1.%'").get() as { count: number }
const project2EventsCount = db.prepare("SELECT COUNT(*) as count FROM events WHERE id LIKE 'project2.%'").get() as { count: number }

console.log(`\n📋 Events:`)
console.log(`   Total: ${totalEvents.count}`)
console.log(`   Base (_demo.*): ${baseEvents.count}`)
console.log(`   Project1: ${project1EventsCount.count}`)
console.log(`   Project2: ${project2EventsCount.count}`)

const totalPosts = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number }
const project1PostsCount = db.prepare("SELECT COUNT(*) as count FROM posts WHERE id LIKE 'project1.%'").get() as { count: number }
const project2PostsCount = db.prepare("SELECT COUNT(*) as count FROM posts WHERE id LIKE 'project2.%'").get() as { count: number }

console.log(`\n📝 Posts:`)
console.log(`   Total: ${totalPosts.count}`)
console.log(`   Project1: ${project1PostsCount.count}`)
console.log(`   Project2: ${project2PostsCount.count}`)

const totalLocations = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number }
const project1LocationsCount = db.prepare("SELECT COUNT(*) as count FROM locations WHERE id LIKE 'project1.%'").get() as { count: number }
const project2LocationsCount = db.prepare("SELECT COUNT(*) as count FROM locations WHERE id LIKE 'project2.%'").get() as { count: number }

console.log(`\n📍 Locations:`)
console.log(`   Total: ${totalLocations.count}`)
console.log(`   Project1: ${project1LocationsCount.count}`)
console.log(`   Project2: ${project2LocationsCount.count}`)

const totalInstructors = db.prepare('SELECT COUNT(*) as count FROM instructors').get() as { count: number }
const project1InstructorsCount = db.prepare("SELECT COUNT(*) as count FROM instructors WHERE id LIKE 'project1.%'").get() as { count: number }
const project2InstructorsCount = db.prepare("SELECT COUNT(*) as count FROM instructors WHERE id LIKE 'project2.%'").get() as { count: number }

console.log(`\n👨‍🏫 Instructors:`)
console.log(`   Total: ${totalInstructors.count}`)
console.log(`   Project1: ${project1InstructorsCount.count}`)
console.log(`   Project2: ${project2InstructorsCount.count}`)

const totalParticipants = db.prepare('SELECT COUNT(*) as count FROM participants').get() as { count: number }
const project1ParticipantsCount = db.prepare("SELECT COUNT(*) as count FROM participants WHERE id LIKE 'project1.%'").get() as { count: number }
const project2ParticipantsCount = db.prepare("SELECT COUNT(*) as count FROM participants WHERE id LIKE 'project2.%'").get() as { count: number }

console.log(`\n👥 Participants:`)
console.log(`   Total: ${totalParticipants.count}`)
console.log(`   Project1: ${project1ParticipantsCount.count}`)
console.log(`   Project2: ${project2ParticipantsCount.count}`)

const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }
const totalMainTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE category = 'main'").get() as { count: number }

console.log(`\n✅ Tasks:`)
console.log(`   Total: ${totalTasks.count}`)
console.log(`   Main tasks: ${totalMainTasks.count}`)

console.log('\n' + '='.repeat(60))

db.close()

console.log('\n🎉 Data Actions Complete!')
console.log('\n📝 What was done:')
console.log('   ✅ Set isBase=true for all _demo.* events')
console.log('   ✅ Created 4 events for project1')
console.log('   ✅ Created 4 events for project2')
console.log('   ✅ Created 4 posts for project1 (linked to their events)')
console.log('   ✅ Created 4 posts for project2 (linked to their events)')
console.log('   ✅ Created 1 location per event (8 total)')
console.log('   ✅ Created 1 instructor per event (8 total)')
console.log('   ✅ Created 1-2 participants per event (12 total)')
console.log('   ✅ Main tasks auto-created via triggers')
