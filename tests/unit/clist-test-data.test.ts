/**
 * clist-test-data - Unit Tests
 * 
 * Validates the test data factory functions work correctly.
 * This test file ensures all mock data generators produce valid output.
 */

import { describe, it, expect } from 'vitest'
import {
  createMockEvent,
  createMockInstructor,
  createMockPost,
  createMockProject,
  createMockUser,
  createMockLocation,
  createMockEvents,
  createMockInstructors,
  createMockPosts,
  createMockProjects,
  createMockUsers,
  createMockImageData,
  randomEntityType,
  randomShape,
  randomXmlID,
  createMockEntityByType,
  createMockEntitiesByType
} from '../utils/clist-test-data'

describe('clist-test-data Factory', () => {
  describe('Single Entity Factories', () => {
    it('should create mock event with defaults', () => {
      const event = createMockEvent()

      expect(event.id).toBe(1)
      expect(event.title).toBeDefined()
      expect(event.xmlID).toMatch(/^tp\.event\./)
      expect(event.img_thumb).toBeDefined()
      expect(event.img_wide).toBeDefined()
      expect(event.date_start).toBeDefined()
      expect(event.date_end).toBeDefined()
    })

    it('should create mock event with overrides', () => {
      const event = createMockEvent({
        id: 99,
        title: 'Custom Event',
        date_start: '2025-12-01'
      })

      expect(event.id).toBe(99)
      expect(event.title).toBe('Custom Event')
      expect(event.date_start).toBe('2025-12-01')
    })

    it('should create mock instructor with defaults', () => {
      const instructor = createMockInstructor()

      expect(instructor.id).toBe(1)
      expect(instructor.title).toBeDefined()
      expect(instructor.xmlID).toMatch(/^tp\.instructor\./)
      expect(instructor.img_thumb).toBeDefined()
      expect(instructor.img_wide).toBeNull()
    })

    it('should create mock post with defaults', () => {
      const post = createMockPost()

      expect(post.id).toBe(1)
      expect(post.title).toBeDefined()
      expect(post.xmlID).toMatch(/^tp\.post\./)
      expect(post.img_thumb).toBeDefined()
      expect(post.img_wide).toBeDefined()
    })

    it('should create mock project (not avatar-eligible)', () => {
      const project = createMockProject()

      expect(project.id).toBe(1)
      expect(project.title).toBeDefined()
      expect(project.xmlID).toMatch(/^tp\.project\./)
      expect(project.img_thumb).toBeNull() // Projects don't have thumbs
      expect(project.img_wide).toBeDefined()
    })

    it('should create mock user with defaults', () => {
      const user = createMockUser()

      expect(user.id).toBe(1)
      expect(user.title).toMatch(/@example\.com$/)
      expect(user.xmlID).toMatch(/^tp\.user\./)
      expect(user.img_thumb).toBeDefined()
    })

    it('should create mock location with defaults', () => {
      const location = createMockLocation()

      expect(location.id).toBe(1)
      expect(location.title).toBeDefined()
      expect(location.xmlID).toMatch(/^tp\.location\./)
      expect(location.img_wide).toBeDefined()
    })
  })

  describe('Batch Entity Factories', () => {
    it('should create multiple events', () => {
      const events = createMockEvents(5)

      expect(events).toHaveLength(5)
      expect(events[0].id).toBe(1)
      expect(events[4].id).toBe(5)

      // Each should have unique xmlID
      const xmlIDs = events.map(e => e.xmlID)
      const uniqueXmlIDs = new Set(xmlIDs)
      expect(uniqueXmlIDs.size).toBe(5)
    })

    it('should create multiple instructors', () => {
      const instructors = createMockInstructors(3)

      expect(instructors).toHaveLength(3)
      expect(instructors[0].id).toBe(1)
      expect(instructors[2].id).toBe(3)
    })

    it('should create multiple posts', () => {
      const posts = createMockPosts(10)

      expect(posts).toHaveLength(10)
      expect(posts[0].id).toBe(1)
      expect(posts[9].id).toBe(10)
    })

    it('should create multiple projects', () => {
      const projects = createMockProjects(4)

      expect(projects).toHaveLength(4)
      projects.forEach(project => {
        expect(project.img_thumb).toBeNull() // Projects don't have thumbs
      })
    })

    it('should create multiple users', () => {
      const users = createMockUsers(5)

      expect(users).toHaveLength(5)
      users.forEach((user, i) => {
        expect(user.title).toMatch(/@example\.com$/)
        expect(user.id).toBe(i + 1)
      })
    })
  })

  describe('Image Data Factory', () => {
    it('should create thumb image data', () => {
      const img = createMockImageData('thumb')

      expect(img.type).toBe('url')
      expect(img.url).toBeDefined()
      expect(img.url).toContain('w=64')
      expect(img.url).toContain('h=64')
      expect(img.blur).toBeDefined()
      expect(img.tpar).toBe('fit=crop&w={W}&h={H}')
    })

    it('should create square image data', () => {
      const img = createMockImageData('square')

      expect(img.url).toContain('w=128')
      expect(img.url).toContain('h=128')
    })

    it('should create wide image data', () => {
      const img = createMockImageData('wide')

      expect(img.url).toContain('w=336')
      expect(img.url).toContain('h=168')
    })

    it('should create vertical image data', () => {
      const img = createMockImageData('vertical')

      expect(img.url).toContain('w=126')
      expect(img.url).toContain('h=224')
    })

    it('should accept overrides', () => {
      const img = createMockImageData('thumb', {
        type: 'cloudinary',
        url: 'https://custom.com/img.jpg'
      })

      expect(img.type).toBe('cloudinary')
      expect(img.url).toBe('https://custom.com/img.jpg')
    })

    it('should support null images', () => {
      const event = createMockEvent({
        img_thumb: null,
        img_wide: null
      })

      expect(event.img_thumb).toBeNull()
      expect(event.img_wide).toBeNull()
    })
  })

  describe('Random Generators', () => {
    it('should generate random entity type', () => {
      const type = randomEntityType()

      expect(['event', 'instructor', 'post', 'project', 'user', 'location']).toContain(type)
    })

    it('should generate random shape', () => {
      const shape = randomShape()

      expect(['thumb', 'square', 'wide', 'vertical']).toContain(shape)
    })

    it('should generate random xmlID', () => {
      const xmlID = randomXmlID('event')

      expect(xmlID).toMatch(/^tp\.event\./)
    })

    it('should generate xmlID with custom slug', () => {
      const xmlID = randomXmlID('instructor', 'john-doe')

      expect(xmlID).toBe('tp.instructor.john-doe')
    })
  })

  describe('Generic Factory Functions', () => {
    it('should create entity by type', () => {
      const event = createMockEntityByType('event')
      const instructor = createMockEntityByType('instructor')
      const post = createMockEntityByType('post')

      expect(event.xmlID).toMatch(/^tp\.event\./)
      expect(instructor.xmlID).toMatch(/^tp\.instructor\./)
      expect(post.xmlID).toMatch(/^tp\.post\./)
    })

    it('should create entity by type with overrides', () => {
      const entity = createMockEntityByType('event', {
        title: 'Custom Title',
        id: 999
      })

      expect(entity.title).toBe('Custom Title')
      expect(entity.id).toBe(999)
    })

    it('should create multiple entities by type', () => {
      const events = createMockEntitiesByType('event', 5)
      const instructors = createMockEntitiesByType('instructor', 3)

      expect(events).toHaveLength(5)
      expect(instructors).toHaveLength(3)

      events.forEach((event, i) => {
        expect(event.id).toBe(i + 1)
      })
    })

    it('should throw error for unknown entity type', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid type
        createMockEntityByType('invalid-type')
      }).toThrow('Unknown entity type')
    })
  })

  describe('Avatar Eligibility', () => {
    it('should identify avatar-eligible entities', () => {
      // Avatar-eligible: event, instructor, post, user
      const event = createMockEvent()
      const instructor = createMockInstructor()
      const post = createMockPost()
      const user = createMockUser()

      expect(event.img_thumb).toBeDefined()
      expect(instructor.img_thumb).toBeDefined()
      expect(post.img_thumb).toBeDefined()
      expect(user.img_thumb).toBeDefined()
    })

    it('should identify non-avatar-eligible entities', () => {
      // Not avatar-eligible: project, location
      const project = createMockProject()
      const location = createMockLocation()

      expect(project.img_thumb).toBeNull()
      expect(location.img_thumb).toBeNull()
    })
  })

  describe('Data Consistency', () => {
    it('should generate valid xmlID format', () => {
      const entities = [
        createMockEvent(),
        createMockInstructor(),
        createMockPost(),
        createMockProject(),
        createMockUser(),
        createMockLocation()
      ]

      entities.forEach(entity => {
        expect(entity.xmlID).toMatch(/^tp\.[a-z]+\.[a-z0-9-]+$/)
      })
    })

    it('should have consistent ID assignment in batches', () => {
      const events = createMockEvents(10)

      events.forEach((event, i) => {
        expect(event.id).toBe(i + 1)
      })
    })

    it('should include realistic data', () => {
      const event = createMockEvent()

      // Should have realistic data, not placeholders
      expect(event.title).not.toBe('')
      expect(event.date_start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(event.location).toBeDefined()
      expect(event.status_id).toBe(18)
      expect(event.domaincode).toBe('tp')
    })
  })
})
