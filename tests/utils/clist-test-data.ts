/**
 * CList Test Data Factory
 * 
 * Provides consistent mock data for CList component testing.
 * All factory functions return realistic test data matching database schema.
 * 
 * @module tests/utils/clist-test-data
 */

/**
 * Image shape data structure matching ImgShape component props
 */
export interface ImgShapeData {
  type: 'url' | 'cloudinary' | 'vimeo' | 'external'
  url: string | null
  blur: string | null
  turl: string | null
  tpar: string | null
  x: number | null
  y: number | null
  z: number | null
}

/**
 * Mock entity data structure for CList components
 */
export interface MockEntityData {
  id: number
  title: string
  xmlID: string
  img_thumb?: ImgShapeData | null
  img_square?: ImgShapeData | null
  img_wide?: ImgShapeData | null
  img_vertical?: ImgShapeData | null
  // Entity-specific fields
  date_start?: string
  date_end?: string
  location?: string
  instructor_id?: number
  project_id?: number
  owner_id?: number
  status_id?: number
  domaincode?: string
}

/**
 * Entity types supported by the system
 */
export type EntityType = 'event' | 'instructor' | 'post' | 'project' | 'user' | 'location'

/**
 * Shape types for images
 */
export type ShapeType = 'thumb' | 'square' | 'wide' | 'vertical'

/**
 * Sample blurhash strings for realistic testing
 */
const SAMPLE_BLURHASHES = [
  'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  'LGF5?xYk^6#M@-5c,1J5@[or[Q6.',
  'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  'LKO2?U%2Tw=w]~RBVZRi};RPxuwH',
  'LNAdAqof00WC5dRjWAj[H?ayj[jZ'
]

/**
 * Sample Unsplash image URLs
 */
const SAMPLE_UNSPLASH_URLS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e'
]

/**
 * Create mock image data for a specific shape
 * 
 * @param shape - Image shape type
 * @param overrides - Optional field overrides
 * @returns Mock ImgShapeData
 * 
 * @example
 * const thumbData = createMockImageData('thumb')
 * const customData = createMockImageData('wide', { url: 'https://custom.com/img.jpg' })
 */
export function createMockImageData(
  shape: ShapeType,
  overrides?: Partial<ImgShapeData>
): ImgShapeData {
  const dimensions = {
    thumb: { w: 64, h: 64 },
    square: { w: 128, h: 128 },
    wide: { w: 336, h: 168 },
    vertical: { w: 126, h: 224 }
  }

  const dim = dimensions[shape]
  const randomIndex = Math.floor(Math.random() * SAMPLE_UNSPLASH_URLS.length)

  return {
    type: 'url',
    url: `${SAMPLE_UNSPLASH_URLS[randomIndex]}?w=${dim.w}&h=${dim.h}`,
    blur: SAMPLE_BLURHASHES[randomIndex],
    tpar: 'fit=crop&w={W}&h={H}',
    turl: null,
    x: null,
    y: null,
    z: null,
    ...overrides
  }
}

/**
 * Create a mock event entity
 * 
 * Events are avatar-eligible and typically have wide/thumb images.
 * 
 * @param overrides - Optional field overrides
 * @returns Mock event entity
 * 
 * @example
 * const event = createMockEvent()
 * const customEvent = createMockEvent({ title: 'Custom Event', date_start: '2025-12-01' })
 */
export function createMockEvent(overrides?: Partial<MockEntityData>): MockEntityData {
  const id = overrides?.id ?? 1
  const title = overrides?.title ?? `Summer Festival ${2024 + id}`
  const slug = title.toLowerCase().replace(/\s+/g, '-')

  return {
    id,
    title,
    xmlID: `tp.event.${slug}`,
    img_thumb: createMockImageData('thumb'),
    img_square: createMockImageData('square'),
    img_wide: createMockImageData('wide'),
    img_vertical: null,
    date_start: '2025-06-15',
    date_end: '2025-06-18',
    location: 'Central Park Amphitheater',
    status_id: 18,
    domaincode: 'tp',
    ...overrides
  }
}

/**
 * Create a mock instructor entity
 * 
 * Instructors are avatar-eligible and typically only have thumb images.
 * 
 * @param overrides - Optional field overrides
 * @returns Mock instructor entity
 * 
 * @example
 * const instructor = createMockInstructor()
 * const customInstructor = createMockInstructor({ title: 'Jane Smith' })
 */
export function createMockInstructor(overrides?: Partial<MockEntityData>): MockEntityData {
  const id = overrides?.id ?? 1
  const names = ['John Doe', 'Jane Smith', 'Maria Garcia', 'Chen Wei', 'Sarah Johnson']
  const title = overrides?.title ?? names[(id - 1) % names.length]
  const slug = title.toLowerCase().replace(/\s+/g, '-')

  return {
    id,
    title,
    xmlID: `tp.instructor.${slug}`,
    img_thumb: createMockImageData('thumb'),
    img_square: null,
    img_wide: null,
    img_vertical: null,
    status_id: 18,
    domaincode: 'tp',
    ...overrides
  }
}

/**
 * Create a mock post entity
 * 
 * Posts are avatar-eligible and typically have wide/thumb images.
 * 
 * @param overrides - Optional field overrides
 * @returns Mock post entity
 * 
 * @example
 * const post = createMockPost()
 * const customPost = createMockPost({ title: 'My Blog Post' })
 */
export function createMockPost(overrides?: Partial<MockEntityData>): MockEntityData {
  const id = overrides?.id ?? 1
  const title = overrides?.title ?? `Blog Post ${id}: Exploring New Horizons`
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return {
    id,
    title,
    xmlID: `tp.post.${slug}`,
    img_thumb: createMockImageData('thumb'),
    img_square: createMockImageData('square'),
    img_wide: createMockImageData('wide'),
    img_vertical: null,
    status_id: 18,
    domaincode: 'tp',
    ...overrides
  }
}

/**
 * Create a mock project entity
 * 
 * Projects are NOT avatar-eligible and typically have wide/square images.
 * 
 * @param overrides - Optional field overrides
 * @returns Mock project entity
 * 
 * @example
 * const project = createMockProject()
 * const customProject = createMockProject({ title: 'Project Alpha' })
 */
export function createMockProject(overrides?: Partial<MockEntityData>): MockEntityData {
  const id = overrides?.id ?? 1
  const title = overrides?.title ?? `Project Alpha ${id}`
  const slug = title.toLowerCase().replace(/\s+/g, '-')

  return {
    id,
    title,
    xmlID: `tp.project.${slug}`,
    img_thumb: null,
    img_square: createMockImageData('square'),
    img_wide: createMockImageData('wide'),
    img_vertical: createMockImageData('vertical'),
    status_id: 18,
    domaincode: 'tp',
    ...overrides
  }
}

/**
 * Create a mock user entity
 * 
 * Users are avatar-eligible and typically only have thumb images.
 * 
 * @param overrides - Optional field overrides
 * @returns Mock user entity
 * 
 * @example
 * const user = createMockUser()
 * const customUser = createMockUser({ title: 'admin@example.com' })
 */
export function createMockUser(overrides?: Partial<MockEntityData>): MockEntityData {
  const id = overrides?.id ?? 1
  const title = overrides?.title ?? `user${id}@example.com`
  const username = title.split('@')[0]

  return {
    id,
    title,
    xmlID: `tp.user.${username}`,
    img_thumb: createMockImageData('thumb'),
    img_square: null,
    img_wide: null,
    img_vertical: null,
    status_id: 18,
    domaincode: 'tp',
    ...overrides
  }
}

/**
 * Create a mock location entity
 * 
 * Locations are NOT avatar-eligible and typically have wide/square images.
 * 
 * @param overrides - Optional field overrides
 * @returns Mock location entity
 * 
 * @example
 * const location = createMockLocation()
 * const customLocation = createMockLocation({ title: 'Central Park' })
 */
export function createMockLocation(overrides?: Partial<MockEntityData>): MockEntityData {
  const id = overrides?.id ?? 1
  const locations = ['Central Park', 'Grand Theater', 'Community Center', 'City Hall', 'Library']
  const title = overrides?.title ?? locations[(id - 1) % locations.length]
  const slug = title.toLowerCase().replace(/\s+/g, '-')

  return {
    id,
    title,
    xmlID: `tp.location.${slug}`,
    img_thumb: null,
    img_square: createMockImageData('square'),
    img_wide: createMockImageData('wide'),
    img_vertical: null,
    status_id: 18,
    domaincode: 'tp',
    ...overrides
  }
}

/**
 * Create multiple mock events
 * 
 * @param count - Number of events to create
 * @returns Array of mock events
 * 
 * @example
 * const events = createMockEvents(5)
 * // Returns 5 events with IDs 1-5
 */
export function createMockEvents(count: number): MockEntityData[] {
  return Array.from({ length: count }, (_, i) => createMockEvent({
    id: i + 1,
    title: `Event ${i + 1}`,
    xmlID: `tp.event.event-${i + 1}`,
    date_start: `2025-${String(6 + (i % 6)).padStart(2, '0')}-15`,
    date_end: `2025-${String(6 + (i % 6)).padStart(2, '0')}-18`
  }))
}

/**
 * Create multiple mock instructors
 * 
 * @param count - Number of instructors to create
 * @returns Array of mock instructors
 * 
 * @example
 * const instructors = createMockInstructors(3)
 * // Returns 3 instructors with IDs 1-3
 */
export function createMockInstructors(count: number): MockEntityData[] {
  const names = ['John Doe', 'Jane Smith', 'Maria Garcia', 'Chen Wei', 'Sarah Johnson',
    'Ahmed Hassan', 'Lisa Anderson', 'Raj Patel', 'Emma Wilson', 'Carlos Rodriguez']

  return Array.from({ length: count }, (_, i) => createMockInstructor({
    id: i + 1,
    title: names[i % names.length],
    xmlID: `tp.instructor.instructor-${i + 1}`
  }))
}

/**
 * Create multiple mock posts
 * 
 * @param count - Number of posts to create
 * @returns Array of mock posts
 * 
 * @example
 * const posts = createMockPosts(10)
 * // Returns 10 posts with IDs 1-10
 */
export function createMockPosts(count: number): MockEntityData[] {
  const topics = ['Technology', 'Art', 'Music', 'Science', 'Nature',
    'Travel', 'Food', 'Sports', 'History', 'Culture']

  return Array.from({ length: count }, (_, i) => createMockPost({
    id: i + 1,
    title: `${topics[i % topics.length]} Post ${i + 1}`,
    xmlID: `tp.post.post-${i + 1}`
  }))
}

/**
 * Create multiple mock projects
 * 
 * @param count - Number of projects to create
 * @returns Array of mock projects
 * 
 * @example
 * const projects = createMockProjects(4)
 * // Returns 4 projects with IDs 1-4
 */
export function createMockProjects(count: number): MockEntityData[] {
  const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
    'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa']

  return Array.from({ length: count }, (_, i) => createMockProject({
    id: i + 1,
    title: `Project ${prefixes[i % prefixes.length]}`,
    xmlID: `tp.project.project-${i + 1}`
  }))
}

/**
 * Create multiple mock users
 * 
 * @param count - Number of users to create
 * @returns Array of mock users
 * 
 * @example
 * const users = createMockUsers(5)
 * // Returns 5 users with IDs 1-5
 */
export function createMockUsers(count: number): MockEntityData[] {
  return Array.from({ length: count }, (_, i) => createMockUser({
    id: i + 1,
    title: `user${i + 1}@example.com`,
    xmlID: `tp.user.user${i + 1}`
  }))
}

/**
 * Generate random entity type
 * 
 * @returns Random entity type
 * 
 * @example
 * const type = randomEntityType()
 * // Returns one of: 'event', 'instructor', 'post', 'project', 'user', 'location'
 */
export function randomEntityType(): EntityType {
  const types: EntityType[] = ['event', 'instructor', 'post', 'project', 'user', 'location']
  return types[Math.floor(Math.random() * types.length)]
}

/**
 * Generate random shape type
 * 
 * @returns Random shape type
 * 
 * @example
 * const shape = randomShape()
 * // Returns one of: 'thumb', 'square', 'wide', 'vertical'
 */
export function randomShape(): ShapeType {
  const shapes: ShapeType[] = ['thumb', 'square', 'wide', 'vertical']
  return shapes[Math.floor(Math.random() * shapes.length)]
}

/**
 * Generate random xmlID for entity
 * 
 * @param type - Entity type
 * @param slug - Optional custom slug
 * @returns Generated xmlID
 * 
 * @example
 * const xmlID = randomXmlID('event')
 * // Returns: 'tp.event.random-slug-123'
 * 
 * const customXmlID = randomXmlID('instructor', 'john-doe')
 * // Returns: 'tp.instructor.john-doe'
 */
export function randomXmlID(type: EntityType, slug?: string): string {
  const randomSlug = slug ?? `random-${type}-${Math.floor(Math.random() * 10000)}`
  return `tp.${type}.${randomSlug}`
}

/**
 * Create mock entity by type
 * 
 * Factory function that creates appropriate entity based on type.
 * 
 * @param type - Entity type to create
 * @param overrides - Optional field overrides
 * @returns Mock entity of specified type
 * 
 * @example
 * const entity = createMockEntityByType('event', { title: 'My Event' })
 * const instructor = createMockEntityByType('instructor')
 */
export function createMockEntityByType(
  type: EntityType,
  overrides?: Partial<MockEntityData>
): MockEntityData {
  switch (type) {
    case 'event':
      return createMockEvent(overrides)
    case 'instructor':
      return createMockInstructor(overrides)
    case 'post':
      return createMockPost(overrides)
    case 'project':
      return createMockProject(overrides)
    case 'user':
      return createMockUser(overrides)
    case 'location':
      return createMockLocation(overrides)
    default:
      throw new Error(`Unknown entity type: ${type}`)
  }
}

/**
 * Create multiple mock entities by type
 * 
 * @param type - Entity type to create
 * @param count - Number of entities
 * @returns Array of mock entities
 * 
 * @example
 * const entities = createMockEntitiesByType('event', 5)
 * // Returns 5 mock events
 */
export function createMockEntitiesByType(
  type: EntityType,
  count: number
): MockEntityData[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEntityByType(type, { id: i + 1 })
  )
}
