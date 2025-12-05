# i18n System Implementation

Complete internationalization (i18n) system for 3 languages: **de** (German), **en** (English), **cz** (Czech)

## Overview

The i18n system provides multi-language support with:
- **Preload Strategy**: Button and navigation translations loaded on app startup
- **Lazy-Load Strategy**: Field and description translations loaded on demand
- **Caching**: All translations cached in memory after first fetch
- **Fallback Chain**: Requested language → German (default) → First available
- **Type Safety**: Full TypeScript support with auto-generated types
- **Inline Creation**: Automatic creation of missing translations in development

## Architecture

### Database Schema

**Table: `i18n_codes`**
```sql
CREATE TABLE i18n_codes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                -- Translation key
    variation TEXT DEFAULT 'false',     -- Context variation
    type TEXT NOT NULL,                 -- button | nav | field | desc
    text JSONB NOT NULL,                -- {"de": "...", "en": "...", "cz": "..."}
    status TEXT NOT NULL DEFAULT 'de',  -- de | en | cz | draft | ok
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE (name, variation, type)
)
```

**Indexes:**
- `idx_i18n_codes_name` - Fast name lookups
- `idx_i18n_codes_type` - Filter by type
- `idx_i18n_codes_status` - Filter by translation status
- `idx_i18n_codes_name_variation` - Combined lookups
- `idx_i18n_codes_unique` - Enforce uniqueness

### Backend API

**GET /api/i18n**
- List translations with filters
- Query params: `status`, `name`, `variation`, `type`, `orderBy`, `order`, `preload`
- Preload mode: `?preload=true` returns only button/nav without variations

**POST /api/i18n**
- Create new translation
- Requires: `name`, `type`, `text` (with at least `de` key)
- Optional: `variation`, `status`
- Validates uniqueness: (name, variation, type)

**PUT /api/i18n/[id]**
- Update existing translation
- Partial updates supported
- Re-validates uniqueness if name/variation/type changed

**DELETE /api/i18n/[id]**
- Remove translation by ID
- Returns deleted entry

**POST /api/i18n/get-or-create**
- Get existing or create with defaults
- Used for inline creation from Vue components
- Automatically creates missing translations in development

### Backend Utilities

**File: `server/utils/i18n-helpers.ts`**

```typescript
// Extract text with fallback chain
resolveI18nText(entry: I18nCodesTableFields, lang: Language): string

// Database lookup
lookupI18nCode(name: string, variation: string, type: Type): Promise<I18nCode | null>

// Create default entry
createDefaultI18nCode(name: string, variation: string, type: Type, deText: string): Promise<I18nCode>

// Preload button/nav
preloadI18nCodes(): Promise<I18nCode[]>

// Get by ID
getI18nCodeById(id: number): Promise<I18nCode | null>

// Get by type
getI18nCodesByType(type: Type, includeVariations: boolean): Promise<I18nCode[]>

// Pattern search
searchI18nCodes(namePattern: string): Promise<I18nCode[]>
```

### Frontend Composable

**File: `src/composables/useI18n.ts`**

```typescript
const i18n = useI18n()

// Reactive state
i18n.language          // Current language (readonly ref)
i18n.isPreloaded       // Preload complete (readonly ref)
i18n.isLoading         // Loading state (readonly ref)
i18n.errors            // Error messages (readonly ref)
i18n.cacheStats        // Cache statistics (computed)

// Translation functions (async)
await i18n.button('ok')                    // Button translation
await i18n.nav('dashboard')                 // Navigation translation
await i18n.field('name')                    // Field label
await i18n.field('name', 'instructors')     // With variation
await i18n.desc('welcome')                  // Description

// Language management
i18n.setLanguage('en')                      // Switch language

// Lifecycle
await i18n.preload()                        // Manual preload
i18n.clearCache()                           // Clear cache

// Advanced
await i18n.getTranslation(name, type, variation)
await i18n.getOrCreate(name, type, variation, defaultText)
```

### Plugin

**File: `src/plugins/i18n.ts`**

```typescript
import i18nPlugin from './plugins/i18n'

app.use(i18nPlugin, {
    skipPreload: false,           // Skip preload (testing)
    defaultLanguage: 'de'          // Default language
})
```

The plugin:
1. Initializes language from localStorage
2. Preloads button/nav translations
3. Makes `$i18n` available globally
4. Provides `i18n` for injection

## Usage Examples

### Basic Component Usage

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

const i18n = useI18n()
const saveLabel = ref('')
const cancelLabel = ref('')

onMounted(async () => {
    saveLabel.value = await i18n.button('save')
    cancelLabel.value = await i18n.button('cancel')
})
</script>

<template>
    <button>{{ saveLabel }}</button>
    <button>{{ cancelLabel }}</button>
</template>
```

### Language Switcher Component

```vue
<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

const i18n = useI18n()

function switchLanguage(lang: 'de' | 'en' | 'cz') {
    i18n.setLanguage(lang)
    // Translations will update reactively
}
</script>

<template>
    <div class="language-switcher">
        <button 
            @click="switchLanguage('de')"
            :class="{ active: i18n.language.value === 'de' }"
        >
            Deutsch
        </button>
        <button 
            @click="switchLanguage('en')"
            :class="{ active: i18n.language.value === 'en' }"
        >
            English
        </button>
        <button 
            @click="switchLanguage('cz')"
            :class="{ active: i18n.language.value === 'cz' }"
        >
            Čeština
        </button>
    </div>
</template>
```

### Form Field Labels

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'

const i18n = useI18n()
const labels = ref({
    name: '',
    email: '',
    phone: ''
})

async function loadLabels() {
    labels.value.name = await i18n.field('name')
    labels.value.email = await i18n.field('email')
    labels.value.phone = await i18n.field('phone')
}

onMounted(loadLabels)
watch(() => i18n.language.value, loadLabels)
</script>

<template>
    <form>
        <label>{{ labels.name }}: <input type="text" /></label>
        <label>{{ labels.email }}: <input type="email" /></label>
        <label>{{ labels.phone }}: <input type="tel" /></label>
    </form>
</template>
```

### Context Variations

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

const i18n = useI18n()

// Generic name field
const genericName = ref('')

// Instructor-specific name field (expects full name)
const instructorName = ref('')

onMounted(async () => {
    genericName.value = await i18n.field('name')              // "Titel"
    instructorName.value = await i18n.field('name', 'instructors')  // "Vor- und Nachname"
})
</script>

<template>
    <div>
        <label>{{ genericName }}: <input /></label>
        <label>{{ instructorName }}: <input /></label>
    </div>
</template>
```

### Global Access (Options API)

```vue
<script>
export default {
    async mounted() {
        // Access via $i18n
        this.saveLabel = await this.$i18n.button('save')
        this.cancelLabel = await this.$i18n.button('cancel')
    },
    
    methods: {
        changeLanguage(lang) {
            this.$i18n.setLanguage(lang)
        }
    }
}
</script>
```

## Translation Management

### Adding New Translations

**Via API:**
```javascript
const response = await fetch('/api/i18n', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'save',
        type: 'button',
        text: {
            de: 'Speichern',
            en: 'Save',
            cz: 'Uložit'
        },
        status: 'ok'
    })
})
```

**Via Database:**
```sql
INSERT INTO i18n_codes (name, type, text, status)
VALUES (
    'save',
    'button',
    '{"de": "Speichern", "en": "Save", "cz": "Uložit"}',
    'ok'
)
```

### Translation Workflow

1. **Create German translation** (status: 'de')
2. **Add English translation** (status: 'en')
3. **Add Czech translation** (status: 'cz')
4. **Mark complete** (status: 'ok')

Or use status 'draft' for work-in-progress.

### Finding Missing Translations

```sql
-- Find entries needing English translation
SELECT * FROM i18n_codes WHERE status IN ('de', 'en');

-- Find entries needing Czech translation
SELECT * FROM i18n_codes WHERE status IN ('de', 'en', 'cz');

-- Find draft entries
SELECT * FROM i18n_codes WHERE status = 'draft';
```

## Performance

### Preload Strategy
- **When**: App startup
- **What**: Button and navigation translations (no variations)
- **Why**: These are used frequently across all pages
- **Impact**: ~2 entries loaded initially (based on seed data)

### Lazy-Load Strategy
- **When**: First use of field/desc translation
- **What**: Single translation on demand
- **Why**: These are page/context-specific
- **Impact**: Minimal network overhead, cached after first fetch

### Caching
- **Location**: Memory (Vue ref)
- **Lifetime**: Application session
- **Invalidation**: Manual via `clearCache()` or page refresh
- **Size**: Minimal (JSON text data)

## Development

### Inline Creation

In development, missing translations are automatically created:

```typescript
// If 'newkey' doesn't exist, it's created automatically
const text = await i18n.button('newkey')  // Creates with default text 'newkey'
```

This speeds up development but should be disabled in production.

### Debugging

```typescript
const i18n = useI18n()

// Check cache statistics
console.log(i18n.cacheStats.value)
// { total: 5, byType: { button: 2, nav: 1, field: 2, desc: 0 }, isPreloaded: true }

// Check errors
console.log(i18n.errors.value)
// ['Error fetching i18n codes: ...']

// Check loading state
console.log(i18n.isLoading.value)  // true/false
console.log(i18n.isPreloaded.value)  // true/false
```

## Migration from v0.0.1 to v0.0.2

**Database Changes:**
1. Added `lang` field to `users` table (default: 'de')
2. Added `i18n_codes` table with 5 indexes
3. Seeded 4 example translations

**Type Generation:**
- Schema registry updated: 26 → 27 tables
- Types updated: 311 → 319 columns
- New `I18nCodesTableFields` interface
- Updated `UsersTableFields` with `lang` field

**API Endpoints:**
- 5 new endpoints: GET, POST, PUT, DELETE, get-or-create

**Frontend:**
- New composable: `useI18n`
- New plugin: `i18n`
- New component: `I18nDemo`

## Testing

### Unit Tests (Planned - Batch 4)

```typescript
describe('useI18n', () => {
    it('should preload button and nav translations', async () => {
        const i18n = useI18n()
        await i18n.preload()
        expect(i18n.isPreloaded.value).toBe(true)
    })

    it('should resolve text with fallback chain', async () => {
        const i18n = useI18n()
        const text = await i18n.button('ok')
        expect(text).toBe('ok')
    })

    it('should lazy-load field translations', async () => {
        const i18n = useI18n()
        const text = await i18n.field('name')
        expect(text).toBeTruthy()
    })

    it('should switch language', () => {
        const i18n = useI18n()
        i18n.setLanguage('en')
        expect(i18n.language.value).toBe('en')
    })
})
```

### Integration Tests (Planned - Batch 4)

```typescript
describe('i18n API', () => {
    it('should create new translation', async () => {
        const response = await fetch('/api/i18n', {
            method: 'POST',
            body: JSON.stringify({
                name: 'test',
                type: 'button',
                text: { de: 'Test', en: 'Test', cz: 'Test' }
            })
        })
        expect(response.ok).toBe(true)
    })

    it('should prevent duplicate translations', async () => {
        // Create first
        await fetch('/api/i18n', { method: 'POST', body: {...} })
        
        // Try duplicate
        const response = await fetch('/api/i18n', { method: 'POST', body: {...} })
        expect(response.status).toBe(409)
    })
})
```

## Future Enhancements (Batch 3 & 4)

### Batch 3: UI Components
- [ ] Translation management dashboard
- [ ] Visual translation editor
- [ ] Bulk import/export (CSV)
- [ ] Translation status overview
- [ ] Missing translation detector

### Batch 4: Testing & Documentation
- [ ] Unit tests for composable
- [ ] Integration tests for API
- [ ] E2E tests for language switching
- [ ] Performance benchmarks
- [ ] API documentation (OpenAPI)

## Troubleshooting

**Translations not loading:**
- Check `i18n.errors.value` for error messages
- Verify API endpoints are accessible
- Check browser console for network errors

**Language not switching:**
- Verify `setLanguage()` is called
- Check localStorage for persisted language
- Reload translations after language change

**Cache issues:**
- Call `i18n.clearCache()` to force refresh
- Reload page for fresh start

**TypeScript errors:**
- Regenerate types: `npx tsx server/database/generate-types-from-schema.ts 0.0.2`
- Check schema registry is up to date

## License

MIT
