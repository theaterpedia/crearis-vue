import { ref, computed, watch } from 'vue'

interface Event {
  id: string
  name: string
  date_begin: string
  date_end: string
  address_id: string
  user_id: string
  seats_max: number
  cimg: string
  header_type: string
  rectitle: string
  teaser: string
}

interface Post {
  id: string
  name: string
  subtitle: string
  teaser: string
  'author_id/id': string
  'event_id/id': string
  cimg: string
  post_date: string
}

interface Location {
  id: string
  name: string
  phone: string
  email: string
  city: string
  zip: string
  street: string
  cimg: string
  md: string
  event_id: string
}

interface Instructor {
  id: string
  name: string
  email: string
  phone: string
  city: string
  cimg: string
  description: string
  'event_id/id': string
}

interface Participant {
  id: string
  name: string
  age: number
  city: string
  cimg: string
  description: string
  'event_id/id': string
}

// Partner unifies Instructor, Location, Participant via partner_types bitmask
// bit 0 (1) = instructor, bit 1 (2) = location, bit 2 (4) = participant
interface Partner {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
  cimg?: string
  description?: string
  partner_types: number  // Bitmask: 1=instructor, 2=location, 4=participant, 8=organisation
}



export const useDemoData = () => {
  const currentEventId = ref('_demo.event_forum_theater_schwabing')
  const dataSource = ref<'csv' | 'sql'>('sql') // Default to SQL since CSV files are server-side only
  const sqlData = ref<any>(null)

  // Fetch SQL data when source is SQL
  const fetchSqlData = async () => {
    try {
      const response = await fetch('/api/demo/data')
      sqlData.value = await response.json()
    } catch (error) {
      console.error('Failed to fetch SQL data:', error)
    }
  }

  // Automatically fetch SQL data on initialization
  fetchSqlData()

  // Watch data source and fetch SQL data if needed
  watch(dataSource, async (newSource: 'csv' | 'sql') => {
    if (newSource === 'sql' && !sqlData.value) {
      await fetchSqlData()
    }
  })

  // Return SQL data (CSV files are now server-side only)
  const events = computed(() => {
    return sqlData.value?.events as Event[] || []
  })

  const posts = computed(() => {
    if (!sqlData.value?.posts) return []
    return sqlData.value.posts.map((p: any) => ({
      ...p,
      'author_id/id': p.author_id,
      'event_id/id': p.event_id
    })) as Post[]
  })

  const locations = computed(() => {
    return sqlData.value?.locations as Location[] || []
  })

  const instructors = computed(() => {
    if (!sqlData.value?.instructors) return []
    return sqlData.value.instructors.map((i: any) => ({
      ...i,
      'event_id/id': i.event_id
    })) as Instructor[]
  })

  const children = computed(() => {
    if (!sqlData.value?.participants) return []
    return sqlData.value.participants
      .filter((p: any) => p.type === 'child')
      .map((p: any) => ({
        ...p,
        'event_id/id': p.event_id
      })) as Participant[]
  })

  const teens = computed(() => {
    if (!sqlData.value?.participants) return []
    return sqlData.value.participants
      .filter((p: any) => p.type === 'teen')
      .map((p: any) => ({
        ...p,
        'event_id/id': p.event_id
      })) as Participant[]
  })

  const adults = computed(() => {
    if (!sqlData.value?.participants) return []
    return sqlData.value.participants
      .filter((p: any) => p.type === 'adult')
      .map((p: any) => ({
        ...p,
        'event_id/id': p.event_id
      })) as Participant[]
  })

  // Get current event
  const currentEvent = computed(() =>
    events.value.find((event: Event) => event.id === currentEventId.value)
  )

  // Helper function to check if an item's event_id field contains the current event
  const hasEvent = (eventIdField: string, targetEventId: string): boolean => {
    if (!eventIdField) return false
    // Split by comma and trim whitespace, then check if any matches
    const eventIds = eventIdField.split(',').map(id => id.trim())
    return eventIds.includes(targetEventId)
  }

  // Get data related to current event
  const currentEventPosts = computed(() =>
    posts.value.filter((post: Post) => hasEvent(post['event_id/id'], currentEventId.value)).slice(0, 4)
  )

  const currentEventLocations = computed(() =>
    locations.value.filter((location: Location) => hasEvent(location.event_id, currentEventId.value)).slice(0, 3)
  )

  const currentEventInstructors = computed(() =>
    instructors.value.filter((instructor: Instructor) => hasEvent(instructor['event_id/id'], currentEventId.value)).slice(0, 3)
  )

  const currentEventChildren = computed(() =>
    children.value.filter((child: Participant) => hasEvent(child['event_id/id'], currentEventId.value)).slice(0, 4)
  )

  const currentEventTeens = computed(() =>
    teens.value.filter((teen: Participant) => hasEvent(teen['event_id/id'], currentEventId.value)).slice(0, 4)
  )

  const currentEventAdults = computed(() =>
    adults.value.filter((adult: Participant) => hasEvent(adult['event_id/id'], currentEventId.value)).slice(0, 4)
  )

  const switchEvent = (eventId: string) => {
    currentEventId.value = eventId
  }

  return {
    // Data
    events,
    currentEvent,
    currentEventPosts,
    currentEventLocations,
    currentEventInstructors,
    currentEventChildren,
    currentEventTeens,
    currentEventAdults,

    // Actions
    switchEvent,
    refreshSqlData: fetchSqlData,

    // State
    currentEventId,
    dataSource
  }
}