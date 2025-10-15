# Demo Data Editor - Developer Documentation

## Overview

The Demo Data Editor is a Vue 3-based interface for managing demo content in the Crearis application. It provides an interactive way to view, edit, and synchronize demo data stored in a SQLite database.

## Architecture

### Technology Stack

- **Frontend**: Vue 3 with Composition API
- **Router**: Vue Router 4
- **Server**: Nitro 3
- **Database**: SQLite3 via better-sqlite3
- **Build Tool**: Vite 5
- **Language**: TypeScript

### Data Flow

```
CSV Files → Sync API → SQLite Database → Data API → Vue Components
    ↓                                                      ↓
src/assets/csv/                                    Interactive UI
```

## Key Components

### 1. HeroEditModal (`src/views/demo/HeroEditModal.vue`)

**Purpose**: Modal dialog for editing hero section content

**Features**:
- Edit hero image URL (`cimg`)
- Edit heading and description text
- Link events to non-event heroes
- Real-time form validation
- Saving state management

**Props**:
```typescript
interface Props {
  isOpen: boolean              // Control modal visibility
  heroData: HeroData | null    // Current hero data to edit
  availableEvents: Event[]     // Events that can be linked
}
```

**Emits**:
```typescript
interface Emits {
  close: []                    // Close modal without saving
  save: [data: HeroData]       // Save hero data
}
```

**Usage Example**:
```vue
<HeroEditModal
  :is-open="showModal"
  :hero-data="currentHero"
  :available-events="events"
  @close="showModal = false"
  @save="handleSave"
/>
```

### 2. Demo View (`src/views/demo.vue`)

**Purpose**: Main demo management interface

**Sections**:
1. **Data Synchronization** - Sync CSV files to database
2. **Events Grid** - Display and manage events
3. **Blog Posts** - Manage blog content
4. **Locations** - Venue management
5. **Instructors** - Instructor profiles
6. **Participants** - Participant data

**Key Methods**:
```typescript
// Sync database from CSV files
async syncData()

// Load all demo data
async loadData()

// Update hero section
async updateHero(heroData: HeroData)
```

### 3. Other Demo Components

#### BlogPreview (`src/views/demo/BlogPreview.vue`)
- Displays blog post cards
- Shows post metadata (date, category, author)

#### EventsDropdown (`src/views/demo/EventsDropdown.vue`)
- Dropdown selector for events
- Filterable event list

#### InstructorCard (`src/views/demo/InstructorCard.vue`)
- Instructor profile display
- Bio and contact information

#### LocationCard (`src/views/demo/LocationCard.vue`)
- Venue information display
- Address and capacity details

#### ParticipantCard & ParticipantGrid
- Participant information display
- Grid layout for multiple participants

## API Endpoints

### GET `/api/demo/data`

**Purpose**: Retrieve all demo data

**Response**:
```json
{
  "events": [...],
  "posts": [...],
  "locations": [...],
  "instructors": [...],
  "participants": [...],
  "heroOverrides": [...]
}
```

**Usage**:
```typescript
const response = await fetch('/api/demo/data')
const data = await response.json()
```

### POST `/api/demo/sync`

**Purpose**: Sync database from CSV files

**Response**:
```json
{
  "success": true,
  "message": "Database synchronized from CSV files",
  "counts": {
    "events": 21,
    "posts": 30,
    "locations": 21,
    "instructors": 20,
    "participants": 45
  }
}
```

**Usage**:
```typescript
const response = await fetch('/api/demo/sync', { method: 'POST' })
const result = await response.json()
```

### PUT `/api/demo/hero`

**Purpose**: Update hero section data

**Request**:
```json
{
  "id": "_demo.event_forum_theater",
  "cimg": "https://example.com/image.jpg",
  "heading": "New Heading",
  "description": "New description text",
  "event_ids": ["event1", "event2"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Hero updated successfully"
}
```

**Usage**:
```typescript
const response = await fetch('/api/demo/hero', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(heroData)
})
```

## Database Schema

### Events Table
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_begin TEXT,
  date_end TEXT,
  address_id TEXT,
  user_id TEXT,
  seats_max INTEGER,
  cimg TEXT,
  header_type TEXT,
  rectitle TEXT,
  teaser TEXT
)
```

### Posts Table
```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author TEXT,
  date TEXT,
  category TEXT,
  thumbnail TEXT
)
```

### Locations Table
```sql
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  capacity INTEGER,
  description TEXT
)
```

### Instructors Table
```sql
CREATE TABLE instructors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  email TEXT,
  phone TEXT,
  specialization TEXT,
  photo TEXT
)
```

### Participants Table
```sql
CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age_group TEXT,
  bio TEXT,
  photo TEXT,
  joined_date TEXT
)
```

### Hero Overrides Table
```sql
CREATE TABLE hero_overrides (
  id TEXT PRIMARY KEY,
  cimg TEXT,
  heading TEXT,
  description TEXT,
  event_ids TEXT  -- JSON array stored as string
)
```

## CSV Import Process

### CSV File Structure

All CSV files should be located in `src/assets/csv/`:

- `events.csv`
- `posts.csv`
- `locations.csv`
- `instructors.csv`
- `children.csv`, `teens.csv`, `adults.csv`

### CSV Format

**Example: events.csv**
```csv
id,name,date_begin,date_end,address_id,user_id,seats_max,cimg,header_type,rectitle,teaser
_demo.event_1,Workshop Title,2025-11-15 10:00:00,2025-11-15 17:00:00,_demo.location_1,_demo.instructor_1,25,https://...,default,Title,Teaser text
```

### Sync Process

1. **Initialization**: Drop existing tables and recreate schema
2. **CSV Reading**: Read CSV files from filesystem
3. **Parsing**: Parse CSV into JavaScript objects
4. **Validation**: Validate data structure
5. **Insertion**: Bulk insert into SQLite database
6. **Response**: Return counts of inserted records

## Development Workflow

### 1. Running Development Server

```bash
# Start Nitro server (API + Vue SPA)
pnpm run dev

# Server runs on http://localhost:3000
```

### 2. Making Changes

#### Modify CSV Data
1. Edit CSV files in `src/assets/csv/`
2. Navigate to `/demo` route
3. Click "Sync Database" button
4. Verify changes in the UI

#### Modify Hero Section
1. Navigate to event or hero display
2. Click edit button (if implemented)
3. Modal opens with `HeroEditModal`
4. Make changes and save
5. Data updates via PUT `/api/demo/hero`

### 3. Adding New Fields

#### Step 1: Update Database Schema
Edit `server/database/db.ts`:

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    -- existing fields...
    new_field TEXT  -- Add new field
  )
`)
```

#### Step 2: Update CSV Import
Edit `server/api/demo/sync.post.ts`:

```typescript
eventStmt.run(
  // ...existing fields,
  event.new_field  // Add new field
)
```

#### Step 3: Update TypeScript Types
Create/update type definitions:

```typescript
interface Event {
  // ...existing fields
  new_field?: string
}
```

#### Step 4: Update UI Components
Update Vue components to display/edit new field.

### 4. Testing

```bash
# Build production version
pnpm run build

# Test production build
pnpm run start

# Verify all features work:
# 1. Data sync
# 2. Data display
# 3. Hero editing
# 4. API responses
```

## Composables

### useDemoData (`src/composables/useDemoData.ts`)

**Purpose**: Manage demo data state

**Usage**:
```typescript
import { useDemoData } from '@/composables/useDemoData'

const { data, loading, error, loadData, syncData } = useDemoData()

// Load data
await loadData()

// Sync from CSV
await syncData()
```

## Styling

### CSS Variables

Theme colors defined in `src/assets/css/`:

- `--color-primary-base`
- `--color-card-bg`
- `--color-contrast`
- `--color-border`
- `--radius-button`

### Component Styling

Components use scoped styles with:
- CSS custom properties for theming
- OKLCH color space for modern color support
- Responsive design patterns
- Accessibility considerations

## Error Handling

### API Errors

```typescript
try {
  const response = await fetch('/api/demo/data')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  console.error('Failed to load data:', error)
  // Show user-friendly error message
}
```

### Database Errors

Server-side errors return proper HTTP status codes:

- `400` - Bad Request (invalid data)
- `404` - Not Found
- `500` - Internal Server Error

## Performance Considerations

### Database Queries

- Use prepared statements for repeated queries
- Index frequently queried fields
- Batch operations when possible

### Frontend

- Lazy load components
- Use `v-show` vs `v-if` appropriately
- Debounce search/filter operations
- Implement virtual scrolling for large lists

## Security Notes

### SQL Injection Prevention

All database queries use parameterized statements:

```typescript
// ✅ SAFE - Parameterized
db.prepare('SELECT * FROM events WHERE id = ?').get(id)

// ❌ UNSAFE - String concatenation
db.prepare(`SELECT * FROM events WHERE id = '${id}'`).get()
```

### API Authentication

Currently no authentication implemented. For production:

1. Add JWT or session-based auth
2. Implement CORS properly
3. Rate limit API endpoints
4. Validate all input data

## Troubleshooting

### Database Not Found

```bash
# Sync database first
curl -X POST http://localhost:3000/api/demo/sync
```

### CSV Import Fails

1. Check CSV file format (UTF-8 encoding)
2. Verify all required columns exist
3. Check for special characters
4. Validate data types match schema

### Build Errors

```bash
# Clean build
rm -rf .output .nitro dist node_modules/.vite

# Reinstall and rebuild
pnpm install
pnpm run build
```

## Future Enhancements

### Planned Features

1. **Task Management** - Track demo data updates
2. **Version Control** - Snapshot demo data versions
3. **Bulk Operations** - Update multiple records
4. **Data Validation** - Enhanced validation rules
5. **Import/Export** - JSON/CSV export functionality
6. **User Authentication** - Secure editing access
7. **Audit Log** - Track all data changes
8. **Search & Filter** - Advanced search capabilities

## Related Documentation

- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [demo-data-versioning.md](./demo-data-versioning.md) - Versioning guide

## Support

For questions or issues:
- GitHub Issues: https://github.com/theaterpedia/demo-data/issues
- Documentation: https://github.com/theaterpedia/demo-data#readme
