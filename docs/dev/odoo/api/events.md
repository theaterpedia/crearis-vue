# Events API Reference

Complete API documentation for working with Odoo Events via XML-RPC in Crearis-Vue.

## Overview

The Events API provides access to:
- **Events** (`event.event`) - Main event records
- **Sessions** (`event.session`) - Sub-events/time slots (coming soon)
- **Registrations** (`event.registration`) - Attendee bookings
- **Tracks & Locations** (`event.track.location`) - Venues and spaces
- **Event Types** (`event.type`) - Event categories

## Base Configuration

```typescript
// server/utils/odooRpc.ts
const odoo = new OdooRpc({
    url: 'http://localhost:8069',
    database: 'crearis',
    username: 'admin',
    apiKey: process.env.ODOO_API_KEY
})
```

## Events Endpoint

### GET /api/odoo/events

Fetch events from Odoo with optional filtering.

#### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Max results (1-100) |
| `offset` | number | 0 | Pagination offset |
| `upcoming` | boolean | false | Only future events |
| `project_id` | number | - | Filter by domain/project |

#### Response

```typescript
interface OdooEventsResponse {
    success: boolean
    events: OdooEvent[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
}
```

#### Example Request

```bash
curl "http://localhost:3000/api/odoo/events?limit=10&upcoming=true"
```

#### Example Response

```json
{
  "success": true,
  "events": [
    {
      "id": 1,
      "odoo_id": 1,
      "name": "Theaterpedia-Konferenz",
      "date_begin": "2025-10-06 04:30:00",
      "date_end": "2025-10-07 04:30:00",
      "timezone": "UTC",
      "stage_id": { "id": 4, "name": "Ended" },
      "kanban_state": "normal",
      "seats_max": 100,
      "seats_available": 45,
      "seats_reserved": 30,
      "seats_used": 25,
      "seats_limited": true,
      "location": { "id": 1353, "name": "Eine-Welt-Haus" },
      "organizer": { "id": 1, "name": "Theaterpedia" },
      "responsible": { "id": 59, "name": "Hans Dönitz" },
      "event_type_id": { "id": 2, "name": "Conference" },
      "domain_code": { "id": 4, "name": "dasei" },
      "description": "<section>...</section>",
      "note": null,
      "active": true,
      "is_published": true,
      "website_url": "/event/theaterpedia-konferenz-1",
      "cid": "dasei.event-evnt__1",
      "rectitle": "KONF Theaterpedia-Konferenz",
      "teasertext": "Annual community gathering",
      "cimg": "https://res.cloudinary.com/.../image.jpg",
      "md": null,
      "schedule": "Day 1: Opening...",
      "header_type": "columns",
      "header_size": "prominent",
      "edit_mode": "content",
      "version": 3
    }
  ],
  "total": 12,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

### POST /api/odoo/events

Create a new event in Odoo.

#### Request Body

```typescript
interface CreateOdooEventInput {
    name: string              // Required: Event name
    date_begin: string        // Required: Start datetime
    date_end: string          // Required: End datetime
    seats_max?: number        // Optional: Max attendees
    description?: string      // Optional: HTML description
    teasertext?: string       // Optional: Teaser text
    timezone?: string         // Optional: Timezone
    event_type_id?: number    // Optional: Event type ID
}
```

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/odoo/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Workshop: Theater Basics",
    "date_begin": "2025-06-15 09:00:00",
    "date_end": "2025-06-15 17:00:00",
    "seats_max": 25,
    "teasertext": "Learn the fundamentals",
    "event_type_id": 3
  }'
```

#### Response

```json
{
  "success": true,
  "event": {
    "id": 15,
    "odoo_id": 15,
    "name": "Workshop: Theater Basics",
    ...
  },
  "message": "Event created successfully"
}
```

## Field Reference

### Standard Odoo Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Record ID |
| `name` | Char | Event name |
| `date_begin` | Datetime | Start date/time |
| `date_end` | Datetime | End date/time |
| `date_tz` | Selection | Timezone |
| `stage_id` | Many2one | Event stage (Odoo 16) |
| `kanban_state` | Selection | normal/done/blocked |
| `seats_max` | Integer | Maximum capacity |
| `seats_available` | Integer | Remaining seats |
| `seats_reserved` | Integer | Reserved seats |
| `seats_used` | Integer | Confirmed attendees |
| `seats_limited` | Boolean | Is seating limited? |
| `address_id` | Many2one | Venue (res.partner) |
| `organizer_id` | Many2one | Organizer (res.partner) |
| `user_id` | Many2one | Responsible user |
| `event_type_id` | Many2one | Event type |
| `description` | Html | Full description |
| `note` | Html | Internal notes |
| `active` | Boolean | Active record |
| `is_published` | Boolean | Website published |
| `website_url` | Char | Website path |

### Crearis Custom Fields

| Field | Type | Description |
|-------|------|-------------|
| `cid` | Char | Crearis ID (computed) |
| `rectitle` | Char | Display title (computed) |
| `teasertext` | Text | Short teaser |
| `schedule` | Text | Schedule overview |
| `md` | Text | Markdown content |
| `blocks` | Json | Content blocks |
| `cimg` | Text | Hero image URL |
| `header_type` | Selection | simple/columns/banner/cover/bauchbinde |
| `header_size` | Selection | mini/medium/prominent/full |
| `edit_mode` | Selection | locked/blocks/content/full |
| `domain_code` | Many2one | Website/project |
| `space_id` | Many2one | Default space |
| `version` | Integer | Version counter |

### Computed Feature Flags

| Field | Type | Source |
|-------|------|--------|
| `use_msteams` | Boolean | From domain |
| `use_jitsi` | Boolean | From domain |
| `use_template_codes` | Boolean | From domain |
| `use_tracks` | Boolean | From domain |
| `use_products` | Boolean | From domain |
| `owner_company` | Integer | From domain |

## TypeScript Types

```typescript
// src/types/odooEvent.ts

export type OdooHeaderType = 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
export type OdooHeaderSize = 'mini' | 'medium' | 'prominent' | 'full'
export type OdooEditMode = 'locked' | 'blocks' | 'content' | 'full'
export type OdooKanbanState = 'normal' | 'done' | 'blocked'

export interface OdooRelation {
    id: number
    name: string
}

export interface OdooEvent {
    id: number
    odoo_id: number
    name: string
    date_begin: string
    date_end: string
    timezone: string
    stage_id: OdooRelation | null
    kanban_state: OdooKanbanState
    // Seats
    seats_max: number
    seats_available: number
    seats_reserved: number
    seats_used: number
    seats_limited: boolean
    // Relations
    location: OdooRelation | null
    organizer: OdooRelation | null
    responsible: OdooRelation | null
    event_type_id: OdooRelation | null
    domain_code: OdooRelation | null
    // Content
    description: string | null
    note: string | null
    // Status
    active: boolean
    is_published: boolean
    website_url: string | null
    // Crearis fields
    cid: string | null
    rectitle: string
    teasertext: string | null
    cimg: string | null
    md: string | null
    schedule: string | null
    header_type: OdooHeaderType
    header_size: OdooHeaderSize
    edit_mode: OdooEditMode
    version: number
}
```

## Direct XML-RPC Usage

For advanced use cases, access Odoo directly:

### Search Events

```typescript
const odoo = getOdooRpc()

// Simple search
const events = await odoo.searchRead(
    'event.event',
    [['active', '=', true]],
    ['id', 'name', 'cid', 'date_begin'],
    { limit: 10, order: 'date_begin desc' }
)

// Complex domain
const upcomingEvents = await odoo.searchRead(
    'event.event',
    [
        ['active', '=', true],
        ['is_published', '=', true],
        ['date_begin', '>=', new Date().toISOString()]
    ],
    ['id', 'name', 'cid', 'date_begin', 'rectitle', 'teasertext', 'cimg']
)
```

### Create Event

```typescript
const eventId = await odoo.create('event.event', {
    name: 'New Event',
    date_begin: '2025-07-01 10:00:00',
    date_end: '2025-07-01 18:00:00',
    domain_code: websiteId,  // Required!
    seats_max: 50,
    teasertext: 'Event description',
    header_type: 'banner',
    header_size: 'medium'
})
```

### Update Event

```typescript
await odoo.write('event.event', [eventId], {
    teasertext: 'Updated teaser',
    cimg: 'https://cloudinary.com/new-image.jpg',
    header_type: 'cover'
})
// Note: version auto-increments
```

### Count Events

```typescript
const total = await odoo.count('event.event', [
    ['active', '=', true],
    ['domain_code', '=', websiteId]
])
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid field 'X'` | Field doesn't exist | Check field name spelling |
| `Access Denied` | Permission issue | Verify API key and user rights |
| `Connection refused` | Odoo not running | Start Odoo server |
| `Database not found` | Wrong database | Check ODOO_DATABASE config |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": 500
}
```

## Filtering Examples

### By Domain

```typescript
const domain = [
    ['domain_code', '=', websiteId],
    ['active', '=', true]
]
```

### By Date Range

```typescript
const domain = [
    ['date_begin', '>=', '2025-01-01'],
    ['date_end', '<=', '2025-12-31']
]
```

### By Event Type

```typescript
const domain = [
    ['event_type_id', '=', eventTypeId]
]
```

### Multiple Conditions (AND)

```typescript
const domain = [
    ['active', '=', true],
    ['is_published', '=', true],
    ['seats_available', '>', 0]
]
```

### OR Conditions

```typescript
const domain = [
    '|',
    ['event_type_id', '=', 1],
    ['event_type_id', '=', 2]
]
```

## Pagination

```typescript
// First page
const page1 = await odoo.searchRead(
    'event.event',
    domain,
    fields,
    { limit: 20, offset: 0 }
)

// Second page
const page2 = await odoo.searchRead(
    'event.event',
    domain,
    fields,
    { limit: 20, offset: 20 }
)

// Total for pagination
const total = await odoo.count('event.event', domain)
```

## Caching Considerations

1. **Use version field** - Check if cached data is stale
2. **Cache by cid** - Unique across domains
3. **Invalidate on write** - Clear cache when updating
4. **Short TTL for seats** - Availability changes frequently

```typescript
// Cache key pattern
const cacheKey = `event:${event.cid}:v${event.version}`
```
