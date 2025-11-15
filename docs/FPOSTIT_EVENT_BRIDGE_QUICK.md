# Post-It Event Bridge - Quick Reference

## Setup (30 seconds)

### 1. Import the composable
```typescript
import { useFpostitEvents } from '@/fpostit/composables/useFpostitEvents'
```

### 2. Initialize in component
```typescript
const events = useFpostitEvents()
```

### 3. Register handlers in onMounted
```typescript
onMounted(() => {
    events.on('event-name', handler)
    setTimeout(() => events.discover(), 500)
})
```

## HTML Syntax

### Basic Button
```html
<button data-fpost-event="action-name">
    Click Me
</button>
```

### Button with Payload
```html
<button 
    data-fpost-event="action-name"
    data-fpost-payload='{"key":"value"}'>
    Click Me
</button>
```

### Display Element (Convention)
```html
<span data-theme-display="identifier">
    Text content
</span>
```

## Vue Handler Syntax

### Simple Handler
```typescript
events.on('save', async () => {
    await saveData()
})
```

### Handler with Payload
```typescript
events.on('apply-filter', async (payload) => {
    await applyFilter(payload.type, payload.value)
})
```

### Handler with Element Access
```typescript
events.on('toggle', async (payload, element) => {
    element.classList.add('active')
    await performAction()
})
```

## Common Patterns

### Pattern: Rotate State
```typescript
const options = ['A', 'B', 'C']
let index = 0

events.on('cycle', () => {
    index = (index + 1) % options.length
    updateDisplay(options[index])
})
```

### Pattern: Update Display
```typescript
events.on('change-theme', (payload) => {
    const el = document.querySelector('[data-theme-display="name"]')
    if (el) el.textContent = payload.themeName
})
```

### Pattern: Countdown Timer
```typescript
let interval: number | null = null

events.on('start-timer', () => {
    if (interval) clearInterval(interval)
    
    let seconds = 30
    interval = setInterval(() => {
        seconds--
        const el = document.querySelector('[data-timer="display"]')
        if (el) el.textContent = `${seconds}s`
        if (seconds <= 0) clearInterval(interval)
    }, 1000)
})
```

### Pattern: Form Submission
```typescript
events.on('submit-form', async () => {
    const input = document.querySelector<HTMLInputElement>('#search')
    if (!input) return
    
    const results = await searchAPI(input.value)
    displayResults(results)
})
```

### Pattern: Confirmation Dialog
```html
<!-- HTML -->
<button 
    data-fpost-event="confirm"
    data-fpost-payload='{"action":"delete","id":123}'>
    Delete
</button>
<a href="#" data-fpostact1 data-fpost-event="cancel">Cancel</a>
```

```typescript
// Vue
events.on('confirm', async (payload) => {
    await performAction(payload.action, payload.id)
    controller.closePostit('p5')
})

events.on('cancel', () => {
    resetForm()
})
```

## Debugging

### Check Discovery
```typescript
// In component
events.discover()
// Check console for: [fpostit-events] Discovered event element
```

### Manual Trigger
```javascript
// In browser console
document.querySelector('[data-fpost-event="my-event"]').click()
```

### Verify Handler Registration
```typescript
events.on('test', () => console.log('Handler works!'))
// Then click element with data-fpost-event="test"
```

## Best Practices

### ✅ DO
- Use kebab-case for event names
- Use data-theme-display for display elements
- Add `setTimeout(() => events.discover(), 500)` after Post-It opens
- Keep payloads simple and flat
- Handle errors in async handlers
- Use semantic event names

### ❌ DON'T
- Use IDs for display elements (conflicts)
- Use complex nested payloads
- Forget to call `events.discover()`
- Use camelCase or snake_case for event names
- Rely on Vue reactivity inside Post-It content
- Create circular event dependencies

## Complete Example

```html
<!-- HTML Template -->
<div data-fpostcontainer data-fpostkey="p5">
    <button data-fpostlink>Settings</button>
    
    <div style="display: none;" data-fpostcontent data-color="primary">
        <h3>Settings</h3>
        
        <div class="current-status">
            <strong data-status-display="mode">Auto</strong>
            <p data-status-display="info">Current mode</p>
        </div>
        
        <button 
            data-fpost-event="toggle-mode"
            data-fpost-payload='{"action":"toggle"}'>
            Toggle Mode
        </button>
        
        <div data-status-display="countdown" style="display: none;">
            Auto-reset in <span data-status-display="seconds">30</span>s
        </div>
        
        <a href="#" 
           data-fpostact1 
           data-fpost-event="reset-settings">
           Reset
        </a>
        <a href="#" data-fpostact2>Close</a>
    </div>
</div>
```

```typescript
// Vue Component
import { useFpostitController } from '@/fpostit/composables/useFpostitController'
import { useFpostitEvents } from '@/fpostit/composables/useFpostitEvents'

const controller = useFpostitController()
const events = useFpostitEvents()

const modes = ['Auto', 'Manual', 'Custom']
let currentMode = 0
let countdownInterval: number | null = null

onMounted(() => {
    // Discover Post-Its
    controller.discoverFromDOM({ root: container.value })
    
    // Toggle mode handler
    events.on('toggle-mode', async () => {
        currentMode = (currentMode + 1) % modes.length
        const mode = modes[currentMode]
        
        // Update display
        updateModeDisplay(mode)
        
        // Apply mode
        await applyMode(mode)
        
        // Start countdown
        startCountdown()
    })
    
    // Reset handler
    events.on('reset-settings', () => {
        stopCountdown()
        currentMode = 0
        updateModeDisplay(modes[0])
        resetMode()
    })
    
    // Discover events after Post-It might be rendered
    setTimeout(() => events.discover(), 500)
})

onUnmounted(() => {
    stopCountdown()
})

function updateModeDisplay(mode: string) {
    const modeEl = document.querySelector('[data-status-display="mode"]')
    const infoEl = document.querySelector('[data-status-display="info"]')
    
    if (modeEl) modeEl.textContent = mode
    if (infoEl) infoEl.textContent = `Mode: ${mode}`
}

function startCountdown() {
    const countdownDiv = document.querySelector('[data-status-display="countdown"]') as HTMLElement
    const secondsSpan = document.querySelector('[data-status-display="seconds"]')
    
    if (countdownDiv) countdownDiv.style.display = 'block'
    
    if (countdownInterval) clearInterval(countdownInterval)
    
    let seconds = 30
    countdownInterval = window.setInterval(() => {
        seconds--
        if (secondsSpan) secondsSpan.textContent = seconds.toString()
        if (seconds <= 0) stopCountdown()
    }, 1000)
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
    }
    
    const countdownDiv = document.querySelector('[data-status-display="countdown"]') as HTMLElement
    if (countdownDiv) countdownDiv.style.display = 'none'
}
```

## Troubleshooting

### Events Not Firing?

1. Check console for discovery logs
2. Verify `data-fpost-event` attribute is present
3. Call `events.discover()` after Post-It opens
4. Check handler is registered before Post-It opens

### Wrong Element Found?

1. Use `[data-theme-display="name"]` not `#id`
2. Query within Post-It container if possible
3. Check for duplicate elements

### Payload Not Parsing?

1. Verify JSON syntax in `data-fpost-payload`
2. Use single quotes around attribute, double quotes inside JSON
3. Check console for parse errors

### Memory Leaks?

1. Ensure using `useFpostitEvents()` composable (auto-cleanup)
2. Check `countdownInterval` is cleared properly
3. Use WeakSet for element tracking (automatic GC)

## API Summary

### `useFpostitEvents()`
Returns event bridge with auto-cleanup.

| Method | Description | Example |
|--------|-------------|---------|
| `on(name, handler)` | Register handler | `events.on('save', handler)` |
| `off(name, handler)` | Unregister handler | `events.off('save', handler)` |
| `emit(name, payload)` | Manual emit | `events.emit('custom', {})` |
| `discover(root?)` | Manual discovery | `events.discover()` |

### HTML Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-fpost-event` | Event name | `data-fpost-event="save"` |
| `data-fpost-payload` | JSON payload | `data-fpost-payload='{"id":1}'` |
| `data-theme-display` | Display marker | `data-theme-display="name"` |

## Documentation Links

- **Full Guide**: `docs/FPOSTIT_EVENT_BRIDGE.md`
- **Summary**: `docs/FPOSTIT_EVENT_BRIDGE_SUMMARY.md`
- **Visual Guide**: `docs/FPOSTIT_EVENT_BRIDGE_VISUAL.md`
- **Quick Reference**: `docs/FPOSTIT_EVENT_BRIDGE_QUICK.md` (this file)

---

**Need Help?** Check the console logs - the event bridge provides extensive debugging output.
