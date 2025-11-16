# Post-It Event Bridge System

## Overview

The Post-It Event Bridge solves the fundamental challenge of having cloned HTML content (Post-Its) communicate with Vue's reactive system. When Post-It content is cloned from the template, it loses all Vue reactivity and event bindings. This system provides a clean, declarative way to bridge that gap.

## The Problem

**Before:** Manual DOM manipulation and polling
```typescript
// ❌ Fragile approach - polling for elements
const checkInterval = setInterval(() => {
    const button = document.getElementById('some-button')
    if (button) {
        button.addEventListener('click', handler)
        clearInterval(checkInterval)
    }
}, 100)
```

**Issues:**
- Manual event attachment requires polling
- Event handlers can attach to wrong elements (template vs clone)
- No cleanup mechanism
- Hard to maintain and debug
- Vue scoped attributes interfere with element selection

## The Solution

**After:** Declarative event bridge
```html
<!-- In Post-It HTML template -->
<button 
    data-fpost-event="theme-rotate"
    data-fpost-payload='{"direction":"next"}'>
    Next Theme
</button>
```

```typescript
// In Vue component
const events = useFpostitEvents()

events.on('theme-rotate', async (payload) => {
    await rotateTheme(payload.direction)
})
```

**Benefits:**
- ✅ Declarative syntax - events defined in HTML
- ✅ Automatic discovery - MutationObserver finds elements
- ✅ Type-safe payloads - JSON parsed automatically
- ✅ Auto-cleanup - handlers removed on unmount
- ✅ Vue-friendly - works seamlessly with reactive state
- ✅ Debuggable - console logs show event flow

## Architecture

### 1. HTML Layer (Data Attributes)

Post-It content uses data attributes to declare events:

```html
<div data-fpostcontent>
    <!-- Event with payload -->
    <button 
        data-fpost-event="theme-rotate"
        data-fpost-payload='{"themeId":3,"duration":30}'>
        Try Theme
    </button>
    
    <!-- Simple event (no payload) -->
    <button data-fpost-event="reset-demo">
        Reset
    </button>
    
    <!-- Multiple events on same element (use click, change, etc.) -->
    <select 
        data-fpost-event="theme-select"
        data-fpost-payload-from="value">
        <option value="1">Ocean</option>
        <option value="2">Forest</option>
    </select>
</div>
```

**Attributes:**
- `data-fpost-event` - Event name to emit (required)
- `data-fpost-payload` - Static JSON payload (optional)
- `data-fpost-payload-from` - Dynamic payload from element property (optional)

### 2. Bridge Layer (Event Discovery & Routing)

The `FpostitEventBridge` class handles the magic:

1. **MutationObserver** watches DOM for new Post-It content
2. **Discovery** finds all `[data-fpost-event]` elements
3. **Attachment** adds click listeners to discovered elements
4. **Routing** translates DOM events to Vue callbacks
5. **Cleanup** automatically removes handlers

```typescript
class FpostitEventBridge {
    private handlers: Map<string, Set<FpostitEventHandler>>
    private discoveredElements: WeakSet<HTMLElement>
    private mutationObserver: MutationObserver
    
    // Automatically discovers and attaches
    private discoverEvents(root: HTMLElement)
    
    // Routes events to registered handlers
    async emit(eventName: string, payload: any, element: HTMLElement)
}
```

### 3. Vue Layer (Composable)

Vue components use `useFpostitEvents()` to listen for events:

```typescript
const events = useFpostitEvents()

// Register handler (auto-cleanup on unmount)
events.on('theme-rotate', async (payload, element) => {
    console.log('Theme rotate requested:', payload)
    await applyTheme(payload.themeId)
})

// Manual emit (rare)
events.emit('custom-event', { data: 'value' })

// Manual discovery (if needed)
events.discover(containerElement)
```

## Usage Patterns

### Pattern 1: Simple Button Action

**HTML:**
```html
<button data-fpost-event="save-settings">
    Save
</button>
```

**Vue:**
```typescript
const events = useFpostitEvents()

events.on('save-settings', async () => {
    await saveSettings()
    showNotification('Settings saved!')
})
```

### Pattern 2: Action with Static Payload

**HTML:**
```html
<button 
    data-fpost-event="apply-filter"
    data-fpost-payload='{"type":"category","value":"drama"}'>
    Drama Only
</button>
```

**Vue:**
```typescript
events.on('apply-filter', async (payload) => {
    await applyFilter(payload.type, payload.value)
})
```

### Pattern 3: Rotating States

**HTML:**
```html
<button 
    data-fpost-event="cycle-option"
    data-fpost-payload='{"action":"next"}'>
    Next Option →
</button>
```

**Vue:**
```typescript
const options = ['A', 'B', 'C']
let currentIndex = 0

events.on('cycle-option', (payload) => {
    if (payload.action === 'next') {
        currentIndex = (currentIndex + 1) % options.length
    }
    updateDisplay(options[currentIndex])
})
```

### Pattern 4: Update Display Elements

**HTML:**
```html
<div class="theme-info">
    <strong data-display="theme-name">Default</strong>
    <p data-display="theme-desc">Current theme</p>
</div>
<button data-fpost-event="theme-change">
    Change Theme
</button>
```

**Vue:**
```typescript
events.on('theme-change', async () => {
    const theme = getNextTheme()
    
    // Update DOM elements by data attribute
    const nameEl = document.querySelector('[data-display="theme-name"]')
    const descEl = document.querySelector('[data-display="theme-desc"]')
    
    if (nameEl) nameEl.textContent = theme.name
    if (descEl) descEl.textContent = theme.description
    
    await applyTheme(theme.id)
})
```

### Pattern 5: Form Interaction

**HTML:**
```html
<input 
    type="text" 
    id="search-input"
    data-fpost-event="search-update"
    placeholder="Search...">
    
<button 
    data-fpost-event="search-submit"
    data-fpost-payload-from="value">
    Search
</button>
```

**Vue:**
```typescript
events.on('search-submit', async (payload) => {
    const query = document.getElementById('search-input').value
    const results = await searchAPI(query)
    displayResults(results)
})
```

### Pattern 6: Combined with Post-It Actions

**HTML:**
```html
<button 
    data-fpost-event="confirm-action"
    data-fpost-payload='{"confirmed":true}'>
    Confirm
</button>

<a href="#" 
   data-fpostact1 
   data-fpost-event="cancel-action">
   Cancel
</a>

<a href="#" data-fpostact2>Close</a>
```

**Vue:**
```typescript
events.on('confirm-action', async (payload) => {
    if (payload.confirmed) {
        await performAction()
        controller.closePostit('p5')
    }
})

events.on('cancel-action', () => {
    resetForm()
    // Post-It closes automatically via data-fpostact1
})
```

## Implementation Example: Theme Demo

Here's the complete implementation from HomePageHero:

**HTML Template:**
```html
<div data-fpostcontainer data-fpostkey="p5">
    <button class="cta-secondary" data-fpostlink data-hlogic="default">
        🎨 Theme Demo
    </button>
    
    <div style="display: none;" data-fpostcontent data-color="accent">
        <h3>🎨 Theme Preview</h3>
        <p>Try different themes temporarily!</p>
        
        <div class="theme-info">
            <strong data-theme-display="name">Click to try</strong>
            <p data-theme-display="desc">Themes rotate automatically</p>
        </div>
        
        <!-- Event-driven button -->
        <button 
            data-fpost-event="theme-rotate"
            data-fpost-payload='{"action":"next"}'>
            🎨 Try Next Theme
        </button>
        
        <div data-theme-display="status" style="display: none;">
            <span>🟢 Active</span>
            <span data-theme-display="countdown">30s</span>
        </div>
        
        <a href="#" 
           data-fpostact1 
           data-fpost-event="theme-stop">
           Stop Demo
        </a>
        <a href="#" data-fpostact2>Close</a>
    </div>
</div>
```

**Vue Component:**
```typescript
import { useFpostitEvents } from '@/fpostit/composables/useFpostitEvents'
import { useTheme } from '@/composables/useTheme'

const events = useFpostitEvents()
const { setTheme, resetContext } = useTheme()

const themes = [
    { id: 0, name: 'E-Motion', desc: 'Performance und Energie' },
    { id: 2, name: 'Pastell', desc: 'dezente Farben und Übergänge' },
    { id: 3, name: 'Institut', desc: 'professionell und seriös' }
]
let currentIndex = 0

onMounted(() => {
    // Discover Post-Its
    controller.discoverFromDOM({ root: ctaGroup.value })
    
    // Register event handlers
    events.on('theme-rotate', async (payload) => {
        currentIndex = (currentIndex + 1) % themes.length
        const theme = themes[currentIndex]
        
        // Update display
        updateThemeDisplay(theme)
        
        // Apply theme
        await setTheme(theme.id, 'timer', 30)
        
        // Start countdown
        startCountdown()
    })
    
    events.on('theme-stop', () => {
        resetContext()
        stopCountdown()
        currentIndex = 0
    })
    
    // Trigger discovery after Post-It might be rendered
    setTimeout(() => events.discover(), 500)
})

function updateThemeDisplay(theme) {
    const nameEl = document.querySelector('[data-theme-display="name"]')
    const descEl = document.querySelector('[data-theme-display="desc"]')
    
    if (nameEl) nameEl.textContent = `Active: ${theme.name}`
    if (descEl) descEl.textContent = theme.desc
}

function startCountdown() {
    const statusDiv = document.querySelector('[data-theme-display="status"]')
    const countdownEl = document.querySelector('[data-theme-display="countdown"]')
    
    if (statusDiv) statusDiv.style.display = 'flex'
    
    let seconds = 30
    const interval = setInterval(() => {
        seconds--
        if (countdownEl) countdownEl.textContent = `${seconds}s`
        if (seconds <= 0) clearInterval(interval)
    }, 1000)
}
```

## Best Practices

### 1. Use data-theme-display for Display Elements

Don't use IDs for display elements - use data attributes:

```html
<!-- ❌ Bad: IDs can conflict -->
<strong id="theme-name">Default</strong>

<!-- ✅ Good: Data attributes are unique and semantic -->
<strong data-theme-display="name">Default</strong>
```

### 2. Keep Payloads Simple

```html
<!-- ✅ Good: Simple, flat object -->
<button 
    data-fpost-event="apply-theme"
    data-fpost-payload='{"id":3,"duration":30}'>
    Apply
</button>

<!-- ❌ Bad: Complex nested structures -->
<button 
    data-fpost-event="apply-config"
    data-fpost-payload='{"theme":{"id":3,"options":{"dark":true}}}'>
    Apply
</button>
```

### 3. Manual Discovery After Post-It Opens

Post-Its render asynchronously. Trigger discovery after opening:

```typescript
onMounted(() => {
    controller.discoverFromDOM({ root: ctaGroup.value })
    
    // Give Post-It time to render
    setTimeout(() => {
        events.discover()
    }, 500)
})
```

### 4. Clean Event Names

Use kebab-case, descriptive names:

```html
<!-- ✅ Good -->
<button data-fpost-event="theme-rotate">Next</button>
<button data-fpost-event="settings-save">Save</button>
<button data-fpost-event="filter-apply">Filter</button>

<!-- ❌ Bad -->
<button data-fpost-event="click">Next</button>
<button data-fpost-event="btn1">Save</button>
<button data-fpost-event="do_thing">Filter</button>
```

### 5. Error Handling

Always handle errors in event handlers:

```typescript
events.on('save-data', async (payload) => {
    try {
        await api.save(payload)
        showSuccess('Saved!')
    } catch (error) {
        console.error('Save failed:', error)
        showError('Failed to save')
    }
})
```

### 6. Use Semantic Payloads

Make payloads self-documenting:

```html
<!-- ✅ Good: Clear intent -->
<button 
    data-fpost-event="theme-apply"
    data-fpost-payload='{"themeId":3,"scope":"timer","duration":30}'>
    Apply Theme
</button>

<!-- ❌ Bad: Unclear values -->
<button 
    data-fpost-event="action"
    data-fpost-payload='{"t":3,"s":"t","d":30}'>
    Apply Theme
</button>
```

## Debugging

### Enable Console Logs

The event bridge logs all activity:

```
[fpostit-events] Discovered event element: theme-rotate <button>
[fpostit-events] Emitting event: theme-rotate { action: "next" }
[fpostit-events] Handler executed for: theme-rotate
```

### Check Element Discovery

```typescript
// See what elements were discovered
events.discover()
// Check console for "Discovered event element" logs
```

### Manual Testing

```javascript
// In browser console
document.querySelector('[data-fpost-event="theme-rotate"]').click()
```

### Check Handler Registration

```typescript
events.on('test-event', () => {
    console.log('Handler registered and working!')
})

// Then trigger from console or HTML
```

## API Reference

### `useFpostitEvents()`

Returns event bridge interface with auto-cleanup on unmount.

**Methods:**

#### `on(eventName: string, handler: Function): UnsubscribeFn`
Register an event handler.

```typescript
const unsubscribe = events.on('my-event', (payload) => {
    console.log(payload)
})

// Manual cleanup (usually not needed)
unsubscribe()
```

#### `off(eventName: string, handler: Function): void`
Unregister a specific handler.

```typescript
const handler = (payload) => console.log(payload)
events.on('my-event', handler)
events.off('my-event', handler)
```

#### `emit(eventName: string, payload?: any): Promise<void>`
Manually emit an event (rarely needed).

```typescript
await events.emit('custom-event', { value: 123 })
```

#### `discover(root?: HTMLElement): void`
Manually trigger element discovery.

```typescript
// Discover in entire document
events.discover()

// Discover in specific container
events.discover(postItContainer)
```

## HTML Attributes

### `data-fpost-event`
**Required.** Event name to emit when element is clicked.

```html
<button data-fpost-event="my-action">Click Me</button>
```

### `data-fpost-payload`
**Optional.** Static JSON payload to send with event.

```html
<button 
    data-fpost-event="apply-filter"
    data-fpost-payload='{"type":"genre","value":"comedy"}'>
    Comedy
</button>
```

### `data-theme-display` (Convention)
**Optional.** Mark elements that display dynamic data.

```html
<span data-theme-display="status">Ready</span>
```

## Integration with Post-It Actions

Event system works alongside Post-It actions:

```html
<!-- Action 1: Confirm (event + close Post-It) -->
<a href="#" 
   data-fpostact1 
   data-fpost-event="confirm-delete">
   Delete
</a>

<!-- Action 2: Cancel (just close) -->
<a href="#" data-fpostact2>Cancel</a>
```

```typescript
events.on('confirm-delete', async () => {
    await deleteItem()
    // Post-It closes automatically
})
```

## Future Enhancements

Potential improvements to consider:

1. **Event Types**: Support change, input, focus events
2. **Dynamic Payloads**: `data-fpost-payload-from="attribute"`
3. **Event Modifiers**: `data-fpost-event-once`, `data-fpost-event-debounce`
4. **Type Safety**: TypeScript event name validation
5. **DevTools**: Browser extension for debugging events

## Migration Guide

### From Manual DOM to Event Bridge

**Before:**
```typescript
onMounted(() => {
    const interval = setInterval(() => {
        const button = document.getElementById('my-button')
        if (button) {
            button.addEventListener('click', handleClick)
            clearInterval(interval)
        }
    }, 100)
})

function handleClick() {
    // Handle click
}
```

**After:**
```html
<button data-fpost-event="my-action">Click</button>
```

```typescript
onMounted(() => {
    events.on('my-action', handleAction)
    setTimeout(() => events.discover(), 500)
})

function handleAction() {
    // Handle action
}
```

## Conclusion

The Post-It Event Bridge provides a clean, maintainable solution to the Vue-DOM boundary problem. By using declarative HTML attributes and an automatic discovery system, it eliminates the need for fragile DOM polling and manual event attachment.

**Key Benefits:**
- Declarative and maintainable
- Automatic cleanup
- Type-safe payloads
- Debuggable
- Scalable

This system can be extended to other scenarios where cloned HTML needs to communicate with Vue, such as markdown-rendered content, server-rendered snippets, or dynamically injected widgets.
