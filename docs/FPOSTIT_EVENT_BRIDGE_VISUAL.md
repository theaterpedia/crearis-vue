# Post-It Event Bridge - Visual Architecture

## The Problem: Vue ↔️ DOM Boundary

```
┌─────────────────────────────────────────────────────────────┐
│ Vue Component (HomePageHero.vue)                            │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ Template (Vue Reactive)                       │          │
│  │                                               │          │
│  │  <div data-fpostcontent style="display:none">│          │
│  │    <button id="try-btn">Try Theme</button>   │          │
│  │  </div>                                       │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│                      ❌ PROBLEM ❌                           │
│                                                              │
│  Content gets CLONED → loses Vue reactivity                 │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ Floating Post-It (Plain HTML Clone)          │          │
│  │                                               │          │
│  │  <button id="try-btn">Try Theme</button>     │          │
│  │  ☠️ No @click binding                         │          │
│  │  ☠️ No Vue reactivity                         │          │
│  │  ⚠️ ID conflicts with template                │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

OLD SOLUTION (Fragile):
- Poll every 100ms for 5 seconds
- Find element by ID (wrong element risk)
- Manually attach listener
- Manually cleanup
- No debugging
```

## The Solution: Event Bridge Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HTML LAYER (Declarative)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  <div data-fpostcontent>                                        │
│    <button                                                      │
│      data-fpost-event="theme-rotate"                           │
│      data-fpost-payload='{"action":"next"}'>                   │
│      🎨 Try Next Theme                                          │
│    </button>                                                    │
│  </div>                                                         │
│                                                                  │
│  ✅ Semantic event name                                         │
│  ✅ Type-safe payload                                           │
│  ✅ No Vue bindings needed                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ DOM Cloned
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. BRIDGE LAYER (Automatic)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────┐              │
│  │ MutationObserver                             │              │
│  │                                              │              │
│  │  Watches DOM for new elements                │              │
│  │  ↓                                            │              │
│  │  Finds [data-fpost-event]                   │              │
│  │  ↓                                            │              │
│  │  Attaches click listener                     │              │
│  │  ↓                                            │              │
│  │  Adds to WeakSet (no duplicates)            │              │
│  └─────────────────────────────────────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────┐              │
│  │ Event Router                                 │              │
│  │                                              │              │
│  │  DOM Click                                   │              │
│  │    ↓                                          │              │
│  │  Parse payload JSON                          │              │
│  │    ↓                                          │              │
│  │  Emit to Vue handlers                        │              │
│  └─────────────────────────────────────────────┘              │
│                                                                  │
│  ✅ Automatic discovery                                         │
│  ✅ No polling                                                  │
│  ✅ Prevents duplicates                                         │
│  ✅ Console logging                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Event Emitted
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. VUE LAYER (Reactive)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  const events = useFpostitEvents()                              │
│                                                                  │
│  events.on('theme-rotate', async (payload) => {                │
│    const theme = getNextTheme()                                 │
│    await setTheme(theme.id, 'timer', 30)                       │
│    updateDisplay(theme)                                         │
│  })                                                             │
│                                                                  │
│  ✅ Clean async/await                                           │
│  ✅ Auto-cleanup on unmount                                     │
│  ✅ Full Vue reactivity                                         │
│  ✅ Type-safe payloads                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
USER CLICKS BUTTON
      │
      ▼
┌────────────────────────────────────┐
│ Floating Post-It (Cloned HTML)    │
│                                    │
│ <button data-fpost-event=          │
│   "theme-rotate"                   │
│   data-fpost-payload='{"next"}'>   │
│                                    │
│   [CLICK EVENT]                    │
└────────────────────────────────────┘
      │
      │ DOM Event
      ▼
┌────────────────────────────────────┐
│ FpostitEventBridge                 │
│                                    │
│ 1. Prevent default                 │
│ 2. Parse payload JSON              │
│ 3. Find registered handlers        │
│ 4. Execute handlers                │
└────────────────────────────────────┘
      │
      │ Handler Call
      ▼
┌────────────────────────────────────┐
│ Vue Component Handler              │
│                                    │
│ async (payload) => {               │
│   // Access Vue reactive state    │
│   // Call composables              │
│   // Update DOM via selectors      │
│   // Trigger Vue actions           │
│ }                                  │
└────────────────────────────────────┘
      │
      │ State Update
      ▼
┌────────────────────────────────────┐
│ Vue Reactive System                │
│                                    │
│ - Theme applied                    │
│ - Timer started                    │
│ - Display updated                  │
│ - Countdown running                │
└────────────────────────────────────┘
```

## Discovery Process

```
POST-IT OPENS
      │
      ▼
┌──────────────────────────────────────────┐
│ FpostitRenderer renders content          │
│                                           │
│ Teleport → document.body                 │
│   <div class="floating-postit">          │
│     <button data-fpost-event="...">      │
│   </div>                                  │
└──────────────────────────────────────────┘
      │
      │ MutationObserver detects
      ▼
┌──────────────────────────────────────────┐
│ Bridge discovers new elements            │
│                                           │
│ for each [data-fpost-event]:             │
│   1. Check if already discovered ✓       │
│   2. Parse event name               ✓   │
│   3. Parse payload                  ✓   │
│   4. Add click listener             ✓   │
│   5. Add to WeakSet                 ✓   │
│   6. Add CSS class                  ✓   │
│   7. Log discovery                  ✓   │
└──────────────────────────────────────────┘
      │
      │ Ready for interaction
      ▼
┌──────────────────────────────────────────┐
│ Element ready                             │
│                                           │
│ <button                                   │
│   data-fpost-event="theme-rotate"        │
│   class="fpostit-event-element">         │
│   ✅ Click listener attached              │
│   ✅ Visual feedback CSS                  │
│   ✅ Ready to emit events                 │
└──────────────────────────────────────────┘
```

## Lifecycle Management

```
COMPONENT MOUNTS
      │
      ▼
┌─────────────────────────────────────┐
│ const events = useFpostitEvents()   │
│                                      │
│ • Creates singleton bridge           │
│ • Starts MutationObserver            │
│ • Begins watching DOM                │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│ Register Handlers                    │
│                                      │
│ events.on('theme-rotate', handler)   │
│                                      │
│ • Handler stored in Map              │
│ • Cleanup function returned          │
│ • Added to cleanup array             │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│ Post-It Opens                        │
│                                      │
│ • Content cloned to DOM              │
│ • MutationObserver detects           │
│ • Elements discovered                │
│ • Listeners attached                 │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│ User Interaction                     │
│                                      │
│ • Clicks button                      │
│ • Event emitted                      │
│ • Handlers executed                  │
│ • State updated                      │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│ COMPONENT UNMOUNTS                   │
│                                      │
│ • onUnmounted() triggers             │
│ • All cleanup functions called       │
│ • Handlers removed from Map          │
│ • No memory leaks                    │
└─────────────────────────────────────┘
```

## Code Comparison

### Before (Manual DOM - 80 lines)

```typescript
onMounted(() => {
    let checkCount = 0
    const checkInterval = setInterval(() => {
        checkCount++
        const tryBtn = document.getElementById('try-theme-btn')
        
        if (tryBtn) {
            // Clone and replace to remove old listeners
            const newBtn = tryBtn.cloneNode(true) as HTMLElement
            tryBtn.parentNode?.replaceChild(newBtn, tryBtn)
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                rotateAndApplyTheme()
            }, { capture: true })
            
            clearInterval(checkInterval)
        } else if (checkCount > 50) {
            console.warn('Button not found after 5s')
            clearInterval(checkInterval)
        }
    }, 100)
})

async function rotateAndApplyTheme() {
    currentIndex = (currentIndex + 1) % themes.length
    const theme = themes[currentIndex]
    
    const nameEl = document.getElementById('theme-name')
    const descEl = document.getElementById('theme-desc')
    if (nameEl) nameEl.textContent = theme.name
    if (descEl) descEl.textContent = theme.desc
    
    await setTheme(theme.id, 'timer', 30)
    
    const statusDiv = document.getElementById('demo-status')
    if (statusDiv) statusDiv.style.display = 'flex'
    
    countdown.value = 30
    countdownInterval = setInterval(() => {
        countdown.value--
        const countdownEl = document.getElementById('countdown')
        if (countdownEl) {
            countdownEl.textContent = `${countdown.value}s`
        }
        if (countdown.value <= 0) {
            clearInterval(countdownInterval)
        }
    }, 1000)
}
```

### After (Event Bridge - 40 lines)

```typescript
const events = useFpostitEvents()

onMounted(() => {
    events.on('theme-rotate', async () => {
        currentIndex = (currentIndex + 1) % themes.length
        const theme = themes[currentIndex]
        
        updateThemeDisplay(theme)
        await setTheme(theme.id, 'timer', 30)
        startCountdown()
    })
    
    setTimeout(() => events.discover(), 500)
})

function updateThemeDisplay(theme) {
    const nameEl = document.querySelector('[data-theme-display="name"]')
    const descEl = document.querySelector('[data-theme-display="desc"]')
    if (nameEl) nameEl.textContent = theme.name
    if (descEl) descEl.textContent = theme.desc
}

function startCountdown() {
    const statusDiv = document.querySelector('[data-theme-display="status"]')
    const countdownEl = document.querySelector('[data-theme-display="countdown"]')
    
    if (statusDiv) statusDiv.style.display = 'flex'
    
    countdown.value = 30
    countdownInterval = setInterval(() => {
        countdown.value--
        if (countdownEl) countdownEl.textContent = `${countdown.value}s`
        if (countdown.value <= 0) clearInterval(countdownInterval)
    }, 1000)
}
```

**Improvements:**
- ✅ 50% less code
- ✅ No polling logic
- ✅ No element cloning
- ✅ No capture phase hacks
- ✅ Clean separation of concerns
- ✅ Easier to test
- ✅ Easier to debug

## Three Solution Paths (Evaluated)

### Path 1: Event Bridge ✅ CHOSEN

**Pros:**
- Clean separation of concerns
- Declarative HTML syntax
- Automatic discovery
- Easy to extend
- Works with any framework

**Cons:**
- New abstraction to learn
- Requires documentation

### Path 2: Vue Directives ❌

```html
<button v-on:click.post-it="handler">Click</button>
```

**Pros:**
- Familiar Vue syntax

**Cons:**
- Custom directive complexity
- Doesn't work in cloned HTML
- Vue processing overhead
- Still requires manual attachment

### Path 3: Props Manipulation ❌

```html
<button data-vue-prop="buttonHandler">Click</button>
```

**Pros:**
- Direct prop access

**Cons:**
- Breaks Vue's reactivity model
- Security concerns
- Fragile
- Hard to maintain

## Conclusion

The Event Bridge pattern provides the best balance of:
- **Simplicity** - Easy to use and understand
- **Maintainability** - Declarative and self-documenting
- **Reliability** - Automatic discovery, no polling
- **Scalability** - Easy to add new events
- **Debuggability** - Extensive logging

It successfully bridges the Vue-DOM boundary while maintaining clean architecture and developer experience.
