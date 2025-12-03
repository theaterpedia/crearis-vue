# i18n Quick Reference

## Import

```typescript
import { useI18n } from '@/composables/useI18n'
```

## Basic Usage

```typescript
const i18n = useI18n()

// Get translations (async)
const text = await i18n.button('save')
const nav = await i18n.nav('dashboard')
const label = await i18n.field('name')
const desc = await i18n.desc('welcome')

// With context variation
const instructorName = await i18n.field('name', 'instructors')
```

## Language Management

```typescript
// Get current language
const lang = i18n.language.value  // 'de' | 'en' | 'cz'

// Switch language
i18n.setLanguage('en')
i18n.setLanguage('cz')
i18n.setLanguage('de')
```

## Reactive Updates

```vue
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'

const i18n = useI18n()
const saveLabel = ref('')

onMounted(async () => {
    saveLabel.value = await i18n.button('save')
})

// Reload on language change
watch(() => i18n.language.value, async () => {
    saveLabel.value = await i18n.button('save')
})
</script>

<template>
    <button>{{ saveLabel }}</button>
</template>
```

## System Status

```typescript
// Check if preloaded
i18n.isPreloaded.value  // boolean

// Check if loading
i18n.isLoading.value  // boolean

// Get cache stats
i18n.cacheStats.value
// { total: 5, byType: { button: 2, nav: 1, field: 2, desc: 0 }, isPreloaded: true }

// Check errors
i18n.errors.value  // string[]
```

## Available Translations (Seed Data)

```typescript
await i18n.button('ok')           // de: "ok", en: "ok", cz: "ok"
await i18n.button('abbrechen')     // de: "abbrechen", en: "cancel", cz: "zrusit"
await i18n.field('name')           // de: "Titel", en: "Heading", cz: "titul"
await i18n.field('name', 'instructors')  // de: "Vor- und Nachname", en: "Full name", cz: pending
```

## API Endpoints

```javascript
// List translations
GET /api/i18n
GET /api/i18n?preload=true
GET /api/i18n?type=button
GET /api/i18n?status=de

// Create translation
POST /api/i18n
{
    name: 'save',
    type: 'button',
    text: { de: 'Speichern', en: 'Save', cz: 'Uložit' },
    status: 'ok'
}

// Update translation
PUT /api/i18n/1
{
    text: { de: 'Speichern', en: 'Save', cz: 'Uložit' },
    status: 'ok'
}

// Delete translation
DELETE /api/i18n/1

// Get or create
POST /api/i18n/get-or-create
{
    name: 'newkey',
    type: 'button',
    defaultText: 'New Key'
}
```

## Types

```typescript
type Language = 'de' | 'en' | 'cz'
type TranslationType = 'button' | 'nav' | 'field' | 'desc'

interface I18nCode {
    id: number
    name: string
    variation: string
    type: TranslationType
    text: Record<string, string>
    status: string
}
```

## Fallback Chain

1. **Requested language** (e.g., 'en')
2. **German** (default: 'de')
3. **First available** (any key in text object)
4. **Empty string** (if nothing found)

## Performance

- **Preload**: button + nav (~2 entries) on app startup
- **Lazy-load**: field + desc on first use
- **Cache**: All translations cached in memory
- **Network**: Minimal (only uncached translations)

## Debugging

```typescript
// Clear cache
i18n.clearCache()

// Check errors
console.log(i18n.errors.value)

// Manual preload
await i18n.preload()

// Get cache stats
console.log(i18n.cacheStats.value)
```
