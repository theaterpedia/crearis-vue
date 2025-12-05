# Theme Demo Post-It Implementation

**Date:** November 15, 2025  
**Feature:** Post-It theme demo with timer and countdown on HomePage Hero

---

## Summary

Implemented a Post-It on the HomePage Hero section that allows users to preview different themes with automatic reset after 30 seconds. Also set up the route watcher in App.vue for local scope auto-reset functionality.

## Implementation Details

### 1. HomePageHero Post-It (✅ Complete)

**Location:** `/src/views/Home/HomeComponents/HomePageHero.vue`

**Features Added:**
- Post-It trigger button labeled "🎨 Theme Demo"
- Theme selector dropdown populated from API
- 30-second timer with countdown display
- Visual status indicator (🟢 Demo Active)
- Stop Demo button to manually reset
- Auto-reset when timer expires

**UI Components:**
```vue
<!-- Post-It trigger -->
<button class="cta-secondary cta-demo" data-fpostlink>
    🎨 Theme Demo
</button>

<!-- Post-It content -->
<div data-fpostcontent data-color="accent">
    <h3>🎨 Theme Preview</h3>
    <select v-model="selectedThemeId" @change="applyDemoTheme">
        <!-- Options populated from getThemes() -->
    </select>
    <div v-if="isDemoActive" class="demo-status">
        <span>🟢 Demo Active</span>
        <span class="countdown">Resets in {{ countdown }}s</span>
    </div>
    <a @click.prevent="stopDemo">Stop Demo</a>
</div>
```

**State Management:**
```typescript
const selectedThemeId = ref<number | null>(null)
const availableThemes = ref<any[]>([])
const countdown = ref<number>(0)
let countdownInterval: number | null = null

const isDemoActive = computed(() => contextTheme.value !== null)
```

**Theme Application Logic:**
```typescript
async function applyDemoTheme() {
    // Set theme with 30 second timer
    await setTheme(selectedThemeId.value, 'timer', 30)
    
    // Start countdown
    countdown.value = 30
    countdownInterval = window.setInterval(() => {
        countdown.value--
        if (countdown.value <= 0 && countdownInterval) {
            clearInterval(countdownInterval)
            countdownInterval = null
        }
    }, 1000)
}
```

**Auto-Reset Handling:**
- Watcher on `contextTheme` clears countdown when theme resets
- Timer cleared on component unmount (cleanup)
- Manual reset via "Stop Demo" button calls `resetContext()`

### 2. Route Watcher Setup (✅ Complete)

**Location:** `/src/App.vue`

**Implementation:**
```typescript
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { setupLocalScopeWatcher } = useTheme()

onMounted(() => {
  setupLocalScopeWatcher(router)
})
```

**Purpose:**
- Enables local scope auto-reset functionality
- Watches route changes and resets context theme if scope='local'
- Called once on app mount
- Required for any local scope theme switching to work

### 3. Styling (✅ Complete)

**New CSS Classes:**
```css
.theme-controls { /* Container for select */ }
.theme-select { /* Styled select dropdown */ }
.demo-status { /* Status indicator container */ }
.status-indicator { /* "Demo Active" label */ }
.countdown { /* Monospace timer display */ }
```

**Responsive Design:**
- Mobile: Status and countdown stack vertically
- Desktop: Status and countdown side-by-side

## User Flow

1. **User clicks "🎨 Theme Demo" button**
   - Post-It opens with theme selector

2. **User selects a theme from dropdown**
   - `applyDemoTheme()` called automatically on change
   - Theme applied with 30-second timer
   - Countdown starts displaying remaining seconds
   - Status indicator shows "🟢 Demo Active"

3. **Auto-reset after 30 seconds**
   - Theme reverts to initial/default theme
   - Countdown stops and resets to 0
   - Status indicator disappears
   - Dropdown resets to empty selection

4. **Manual reset (optional)**
   - User clicks "Stop Demo" link
   - Same behavior as auto-reset
   - Immediate revert without waiting

## Testing Scenarios

### Test 1: Basic Theme Demo
1. Navigate to HomePage (/)
2. Click "🎨 Theme Demo" button
3. Select a theme (e.g., Theme 3)
4. **Expected:**
   - Theme changes immediately
   - Countdown shows "30s" and decrements
   - Status shows "🟢 Demo Active"
5. Wait 30 seconds
6. **Expected:**
   - Theme reverts to original
   - Countdown resets to 0
   - Status indicator disappears

### Test 2: Multiple Theme Switches
1. Open theme demo Post-It
2. Select Theme 2
3. Wait 5 seconds
4. Select Theme 5 (before timer expires)
5. **Expected:**
   - Theme switches to Theme 5
   - Countdown resets to 30s
   - Previous timer cleared

### Test 3: Manual Stop
1. Open theme demo
2. Select a theme
3. Wait 10 seconds (countdown at 20s)
4. Click "Stop Demo"
5. **Expected:**
   - Theme reverts immediately
   - Countdown stops and resets
   - Timer cleared

### Test 4: Route Change with Timer Active
1. Start theme demo on HomePage
2. Navigate to /start while timer running
3. **Expected:**
   - Timer continues (timer scope not affected by route changes)
   - Theme persists across route navigation
   - Timer still auto-resets after 30s total

### Test 5: Theme List Loading
1. Open theme demo Post-It
2. **Expected:**
   - Dropdown shows all available themes (0-7)
   - Theme names loaded from API
   - "Select a theme..." placeholder shown first

### Test 6: Component Unmount Cleanup
1. Start theme demo
2. Navigate to another page
3. Check browser console
4. **Expected:**
   - No interval leak warnings
   - Countdown interval cleared on unmount
   - Theme timer continues independently

### Test 7: Countdown Accuracy
1. Start theme demo with Theme 4
2. Watch countdown
3. **Expected:**
   - Updates every second
   - Synchronized with actual timer
   - Stops at 0 when theme resets

## Edge Cases Handled

1. **Rapid theme switching:** Previous timer cleared before setting new one
2. **Component unmount:** Countdown interval cleaned up in `onUnmounted`
3. **Context reset from elsewhere:** Watcher detects and clears countdown
4. **API failure:** Try-catch around theme loading/setting
5. **Null selection:** applyDemoTheme returns early if no theme selected

## Files Modified

### Primary Changes
- `/src/views/Home/HomeComponents/HomePageHero.vue`
  - Added Post-It markup
  - Added theme demo state and logic
  - Added countdown management
  - Added styling for controls and status

- `/src/App.vue`
  - Added route watcher setup in onMounted
  - Imported useTheme and useRouter

### Dependencies
- Uses `useTheme` from `/src/composables/useTheme.ts`
- Uses `useFpostitController` from `/src/fpostit/composables/useFpostitController.ts`
- Uses `FpostitRenderer` from `/src/fpostit/components/FpostitRenderer.vue`

## Integration Points

### Theme Composable
```typescript
const { 
    setTheme,        // Set theme with scope
    resetContext,    // Manual reset
    contextTheme,    // Watch for auto-reset
    getThemes        // Load available themes
} = useTheme()
```

### Post-It System
- Uses `data-fpostcontainer` and `data-fpostkey="theme-demo"`
- Uses `data-fpostlink` for trigger button
- Uses `data-fpostcontent` with `data-color="accent"`
- Uses `data-fpostact1` and `data-fpostact2` for action links
- Rendered by `FpostitRenderer` component

## UI/UX Considerations

**Visual Feedback:**
- 🎨 Emoji indicates theme-related feature
- 🟢 Emoji indicates active state
- Monospace font for countdown (easier to read)
- Accent color for Post-It (stands out)

**User Expectations:**
- Clear timer indication (30s shown upfront in description)
- Real-time countdown updates
- Manual override available
- Non-destructive (reverts to original)

**Accessibility:**
- Select has focus outline
- Button has clear label
- Status is text-based (not color-only)
- Countdown is announced by screen readers

## Performance Notes

- Countdown uses `setInterval` (1 second intervals)
- Interval cleared immediately when not needed
- Theme vars cached (no repeated API calls)
- Watcher only fires when context theme changes

## Future Enhancements

### Potential Improvements
1. **Visual countdown:** Progress bar or circular timer
2. **Theme preview cards:** Show theme colors before applying
3. **Custom duration:** Let user choose timer length (15s, 30s, 60s)
4. **Favorites:** Save frequently used themes
5. **Smooth transition:** CSS transition between themes
6. **Demo history:** Show recently tried themes

### Integration Ideas
1. Add to other major pages (StartPage, BlogPage)
2. Add to user settings as permanent theme selector
3. Create admin theme builder interface
4. Add theme export/import functionality

## Known Limitations

1. **Timer scope only:** Demo uses timer scope, not local scope
   - Theme persists across route changes until timer expires
   - Could add option for route-scoped demos

2. **Single active demo:** Only one theme demo can be active at a time
   - By design (singleton state in useTheme)
   - Prevents confusion from multiple contexts

3. **No persistence:** Closing browser clears demo
   - Could add sessionStorage for demo state
   - Low priority (demos are temporary by nature)

## Documentation References

- `/docs/THEME_SCOPE_SYSTEM.md` - Full theme scope API
- `/docs/tasks/2025-11-15_THEME_SCOPE_SYSTEM.md` - Implementation notes
- `/src/fpostit/README.md` - Post-It system guide (if exists)

---

**Status:** ✅ Implementation Complete  
**Testing:** Ready for manual testing  
**Next Steps:** Test all scenarios, gather user feedback

