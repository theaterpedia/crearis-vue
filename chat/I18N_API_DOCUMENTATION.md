# i18n API Documentation

Complete REST API documentation for the i18n translation management system.

## Base URL

```
/api/i18n
```

## Authentication

All endpoints require authentication. Admin role required for create, update, and delete operations.

---

## Endpoints

### 1. List Translations

Get a list of translations with optional filtering and sorting.

**Endpoint:** `GET /api/i18n`

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `type` | string | Filter by type (`button`, `nav`, `field`, `desc`) | `?type=button` |
| `status` | string | Filter by status (`de`, `en`, `cz`, `draft`, `ok`) | `?status=ok` |
| `name` | string | Filter by exact name match | `?name=save` |
| `variation` | string | Filter by variation | `?variation=instructors` |
| `orderBy` | string | Sort by field (`name`, `type`, `status`, `updated_at`) | `?orderBy=name` |
| `order` | string | Sort direction (`asc`, `desc`) | `?order=desc` |
| `preload` | string | Preload mode: only button/nav without variations | `?preload=true` |

**Response:**

```json
{
  "success": true,
  "count": 4,
  "i18n_codes": [
    {
      "id": 1,
      "name": "save",
      "variation": "false",
      "type": "button",
      "text": {
        "de": "Speichern",
        "en": "Save",
        "cz": "Uložit"
      },
      "status": "ok",
      "created_at": "2025-10-24T10:00:00.000Z",
      "updated_at": "2025-10-24T10:00:00.000Z"
    }
  ]
}
```

**Examples:**

```bash
# Get all translations
curl /api/i18n

# Get only button translations
curl /api/i18n?type=button

# Get translations needing translation (status=de)
curl /api/i18n?status=de

# Preload (button/nav, no variations)
curl /api/i18n?preload=true

# Sort by name descending
curl /api/i18n?orderBy=name&order=desc

# Search by name
curl /api/i18n?name=save
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### 2. Create Translation

Create a new translation entry.

**Endpoint:** `POST /api/i18n`

**Request Body:**

```json
{
  "name": "save",
  "variation": "false",
  "type": "button",
  "text": {
    "de": "Speichern",
    "en": "Save",
    "cz": "Uložit"
  },
  "status": "ok"
}
```

**Required Fields:**
- `name` (string) - Translation key
- `type` (string) - Type: `button`, `nav`, `field`, `desc`
- `text` (object) - Must contain at least `de` (German) key

**Optional Fields:**
- `variation` (string) - Default: `"false"`
- `status` (string) - Default: `"de"`

**Response:**

```json
{
  "success": true,
  "i18n_code": {
    "id": 5,
    "name": "save",
    "variation": "false",
    "type": "button",
    "text": {
      "de": "Speichern",
      "en": "Save",
      "cz": "Uložit"
    },
    "status": "ok",
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

**Examples:**

```bash
# Create button translation
curl -X POST /api/i18n \
  -H "Content-Type: application/json" \
  -d '{
    "name": "delete",
    "type": "button",
    "text": {
      "de": "Löschen",
      "en": "Delete",
      "cz": "Smazat"
    },
    "status": "ok"
  }'

# Create with variation
curl -X POST /api/i18n \
  -H "Content-Type: application/json" \
  -d '{
    "name": "name",
    "variation": "instructors",
    "type": "field",
    "text": {
      "de": "Vor- und Nachname",
      "en": "Full name"
    },
    "status": "en"
  }'
```

**Status Codes:**
- `200` - Success
- `400` - Validation error (missing fields, invalid type, etc.)
- `409` - Duplicate (name + variation + type already exists)
- `500` - Server error

**Validation Rules:**
1. `name` must be non-empty string
2. `type` must be: `button`, `nav`, `field`, or `desc`
3. `text.de` (German) is required
4. `status` must be: `de`, `en`, `cz`, `draft`, or `ok`
5. Unique constraint: (name, variation, type) combination must be unique

---

### 3. Update Translation

Update an existing translation.

**Endpoint:** `PUT /api/i18n/:id`

**URL Parameters:**
- `id` (number) - Translation ID

**Request Body:**

```json
{
  "text": {
    "de": "Speichern",
    "en": "Save",
    "cz": "Uložit"
  },
  "status": "ok"
}
```

**Updatable Fields:**
- `text` (object) - Translation text
- `status` (string) - Translation status

**Non-updatable Fields:**
- `name` - Locked (unique constraint)
- `variation` - Locked (unique constraint)
- `type` - Locked (unique constraint)

**Response:**

```json
{
  "success": true,
  "i18n_code": {
    "id": 1,
    "name": "save",
    "variation": "false",
    "type": "button",
    "text": {
      "de": "Speichern",
      "en": "Save",
      "cz": "Uložit"
    },
    "status": "ok",
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:30:00.000Z"
  }
}
```

**Examples:**

```bash
# Add English translation
curl -X PUT /api/i18n/1 \
  -H "Content-Type: application/json" \
  -d '{
    "text": {
      "de": "Speichern",
      "en": "Save"
    },
    "status": "en"
  }'

# Mark as complete
curl -X PUT /api/i18n/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ok"
  }'
```

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `404` - Translation not found
- `500` - Server error

---

### 4. Delete Translation

Delete a translation by ID.

**Endpoint:** `DELETE /api/i18n/:id`

**URL Parameters:**
- `id` (number) - Translation ID

**Response:**

```json
{
  "success": true,
  "message": "i18n code with id=1 deleted successfully",
  "deleted": {
    "id": 1,
    "name": "save",
    "variation": "false",
    "type": "button",
    "text": {
      "de": "Speichern"
    },
    "status": "de"
  }
}
```

**Examples:**

```bash
# Delete translation
curl -X DELETE /api/i18n/1
```

**Status Codes:**
- `200` - Success
- `404` - Translation not found
- `500` - Server error

---

### 5. Get or Create Translation

Get existing translation or create it with defaults. Used for inline creation.

**Endpoint:** `POST /api/i18n/get-or-create`

**Request Body:**

```json
{
  "name": "newkey",
  "type": "button",
  "variation": "false",
  "defaultText": "New Key"
}
```

**Required Fields:**
- `name` (string) - Translation key
- `type` (string) - Type: `button`, `nav`, `field`, `desc`

**Optional Fields:**
- `variation` (string) - Default: `"false"`
- `defaultText` (string) - Default text for all languages (default: name)
- `status` (string) - Default: `"de"`

**Response:**

```json
{
  "success": true,
  "created": true,
  "i18n_code": {
    "id": 10,
    "name": "newkey",
    "variation": "false",
    "type": "button",
    "text": {
      "de": "New Key",
      "en": "New Key",
      "cz": "New Key"
    },
    "status": "de",
    "created_at": "2025-10-24T10:00:00.000Z",
    "updated_at": "2025-10-24T10:00:00.000Z"
  }
}
```

**Examples:**

```bash
# Get existing or create
curl -X POST /api/i18n/get-or-create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "newbutton",
    "type": "button",
    "defaultText": "New Button"
  }'
```

**Status Codes:**
- `200` - Success (existing or created)
- `400` - Validation error
- `500` - Server error

**Behavior:**
1. Searches for existing translation by (name, variation, type)
2. If found: Returns existing (`created: false`)
3. If not found: Creates with default text (`created: true`)
4. Default text is copied to all 3 languages (de, en, cz)

---

## Data Types

### Translation Object

```typescript
interface I18nCode {
  id: number                    // Auto-increment ID
  name: string                  // Translation key
  variation: string             // Context variation (default: "false")
  type: string                  // Type: button | nav | field | desc
  text: Record<string, string>  // JSONB: { de, en, cz }
  status: string                // Status: de | en | cz | draft | ok
  created_at: string            // ISO 8601 timestamp
  updated_at: string            // ISO 8601 timestamp
}
```

### Type Values

| Type | Description | Example |
|------|-------------|---------|
| `button` | Button labels | save, cancel, ok |
| `nav` | Navigation items | dashboard, settings |
| `field` | Form field labels | name, email, phone |
| `desc` | Descriptions | welcome, instructions |

### Status Values

| Status | Description | Meaning |
|--------|-------------|---------|
| `de` | German only | Needs English and Czech translation |
| `en` | English added | Needs Czech translation |
| `cz` | Czech added | Needs final review |
| `draft` | Draft | Work in progress |
| `ok` | Complete | All translations complete |

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Validation error: name is required"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "i18n code with id=999 not found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "i18n code already exists with name=\"save\", variation=\"false\", type=\"button\""
}
```

### 500 Server Error

```json
{
  "statusCode": 500,
  "message": "Failed to create i18n code: Database error"
}
```

---

## Rate Limiting

No rate limiting currently implemented.

---

## Pagination

No pagination currently implemented. All matching records are returned.

For large datasets, consider using filters to reduce response size.

---

## Best Practices

### Creating Translations

1. **Always provide German (de) translation** - Required field
2. **Use descriptive names** - e.g., `save_project` not `btn1`
3. **Use variations for context** - e.g., `name` with `instructors` variation
4. **Set appropriate status** - Track translation progress
5. **Use correct type** - Helps with preloading strategy

### Updating Translations

1. **Update status as translations progress** - de → en → cz → ok
2. **Don't change name/variation/type** - These are locked (unique constraint)
3. **Keep all languages in sync** - Update status to reflect reality

### Querying Translations

1. **Use preload for app startup** - `?preload=true` for button/nav
2. **Filter by status for management** - Find missing translations
3. **Use exact name search** - Don't rely on partial matches
4. **Order results** - Sort by name for better UX

### Bulk Operations

1. **Use CSV export/import** - For bulk editing
2. **Test with small dataset first** - Validate CSV format
3. **Backup before bulk import** - Cannot undo easily

---

## Examples

### Complete Workflow

```bash
# 1. Create German translation
curl -X POST /api/i18n \
  -H "Content-Type: application/json" \
  -d '{
    "name": "submit",
    "type": "button",
    "text": { "de": "Absenden" },
    "status": "de"
  }'

# 2. Add English translation
curl -X PUT /api/i18n/1 \
  -H "Content-Type: application/json" \
  -d '{
    "text": { "de": "Absenden", "en": "Submit" },
    "status": "en"
  }'

# 3. Add Czech translation
curl -X PUT /api/i18n/1 \
  -H "Content-Type: application/json" \
  -d '{
    "text": { "de": "Absenden", "en": "Submit", "cz": "Odeslat" },
    "status": "cz"
  }'

# 4. Mark as complete
curl -X PUT /api/i18n/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ok"
  }'

# 5. Verify
curl /api/i18n?name=submit
```

### Management Queries

```bash
# Find all incomplete translations
curl /api/i18n?status=de

# Find all button translations
curl /api/i18n?type=button&orderBy=name

# Find translations with variations
curl /api/i18n?variation=instructors

# Export for editing (use in UI)
curl /api/i18n > translations.json
```

---

## Frontend Integration

### JavaScript/TypeScript

```typescript
// Preload on app startup
async function preloadTranslations() {
  const response = await fetch('/api/i18n?preload=true')
  const data = await response.json()
  return data.i18n_codes
}

// Get specific translation
async function getTranslation(name: string, type: string) {
  const response = await fetch(`/api/i18n?name=${name}&type=${type}`)
  const data = await response.json()
  return data.i18n_codes[0]
}

// Create translation
async function createTranslation(translation: any) {
  const response = await fetch('/api/i18n', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(translation)
  })
  return response.json()
}
```

### Vue Composable

```typescript
import { useI18n } from '@/composables/useI18n'

const i18n = useI18n()

// Use in component
const saveLabel = await i18n.button('save')
const nameLabel = await i18n.field('name')
```

---

## Testing

### Example Test Cases

```typescript
// Test GET endpoint
const response = await fetch('/api/i18n?type=button')
expect(response.status).toBe(200)

// Test POST endpoint
const response = await fetch('/api/i18n', {
  method: 'POST',
  body: JSON.stringify({
    name: 'test',
    type: 'button',
    text: { de: 'Test' }
  })
})
expect(response.status).toBe(200)

// Test validation
const response = await fetch('/api/i18n', {
  method: 'POST',
  body: JSON.stringify({ name: 'test' }) // Missing type
})
expect(response.status).toBe(400)
```

---

## Version History

- **v0.0.2** - Initial i18n system implementation
- **Migration 020** - i18n_codes table created
- **Schema Registry** - 27 tables, 319 columns

---

## Support

For issues or questions:
- Check `docs/I18N_IMPLEMENTATION.md` for detailed documentation
- Check `docs/I18N_QUICK_REFERENCE.md` for quick reference
- Check `docs/BATCH_3_COMPLETE.md` for UI documentation
