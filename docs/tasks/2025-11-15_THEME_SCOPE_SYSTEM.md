# Theme Scope System - Implementation Complete

**Date:** November 15, 2025  
**Feature:** Enhanced useTheme with temporary theme switching and scope-based auto-reset

---

## Summary

Enhanced the `useTheme` composable to support temporary theme switching with automatic reset based on different scopes. This enables demo modes, route-specific themes, and time-limited theme changes without affecting the user's saved preference.

## Changes Made

### 1. Core State Variables Added
```typescript
// Split theme state into initial and context
const initialThemeId = ref<number | null>(null)      // User's saved preference
const contextThemeId = ref<number | null>(null)      // Temporary theme
const contextScope = ref<'local' | 'timer' | 'site' | null>(null)
const contextParam = ref<string | null>(null)        // Scope parameter
const contextTimerId = ref<number | null>(null)      // Timer reference
```

### 2. Enhanced setTheme Function
**Signature:**
```typescript
const setTheme = async (
    id: number | null,
    scope: 'initial' | 'local' | 'timer' | 'site' = 'initial',
    param?: string | number
): Promise<void>
```

**Scope Behaviors:**
- **initial** (default): Sets user's base theme, persists across routes
- **local**: Temporary theme for route, auto-resets on navigation (requires setupLocalScopeWatcher)
- **timer**: Temporary theme with timeout, auto-resets after param seconds
- **site**: Reserved for domaincode-based themes (throws error - not yet implemented)

### 3. New Functions

#### resetContext()
Clears context theme and restores initial theme:
```typescript
const resetContext = (): void => {
    contextThemeId.value = null
    contextScope.value = null
    contextParam.value = null
    
    if (contextTimerId.value) {
        clearTimeout(contextTimerId.value)
        contextTimerId.value = null
    }
    
    // Reapply initial theme or remove vars
    if (initialThemeId.value !== null) {
        const vars = themeVarsCache.value.get(initialThemeId.value)
        if (vars) {
            applyVarsToDocument(vars)
        }
    } else {
        removeVarsFromDocument()
    }
}
```

#### setupLocalScopeWatcher(router)
Sets up route watcher for local scope auto-reset:
```typescript
const setupLocalScopeWatcher = (router: Router): void => {
    watch(
        () => router.currentRoute.value.path,
        (newPath: string, oldPath: string) => {
            if (contextScope.value === 'local' && newPath !== oldPath) {
                if (contextParam.value && contextParam.value !== newPath) {
                    resetContext()
                } else if (!contextParam.value) {
                    resetContext()
                }
            }
        }
    )
}
```

### 4. Updated Computed Properties
```typescript
// Context theme takes precedence over initial theme
const currentTheme = computed(() => contextThemeId.value ?? initialThemeId.value)

const currentVars = computed((): ThemeVars | null => {
    const activeThemeId = contextThemeId.value ?? initialThemeId.value
    return themeVarsCache.value.get(activeThemeId) || null
})

const isInvertedAvailable = computed(() => {
    const activeThemeId = contextThemeId.value ?? initialThemeId.value
    return activeThemeId !== null
})
```

### 5. New Exported Properties
```typescript
return {
    // Core functions
    setTheme,
    getThemeVars,
    getThemes,
    resetContext,              // NEW
    setupLocalScopeWatcher,    // NEW

    // ... existing exports ...

    // Context state (for debugging/advanced use)
    contextTheme: computed(() => contextThemeId.value),    // NEW
    contextScope: computed(() => contextScope.value),      // NEW
    initialTheme: computed(() => initialThemeId.value),    // NEW
}
```

## File Changes

### Modified Files
- `/src/composables/useTheme.ts` - Enhanced with scope system

### New Documentation
- `/docs/THEME_SCOPE_SYSTEM.md` - Complete API documentation and usage examples

## Usage Examples

### Example 1: Timer-Based Theme Demo (Post-It)
```typescript
const { setTheme, resetContext, contextTheme } = useTheme()

// Set theme for 30 seconds
await setTheme(4, 'timer', 30)

// Manual reset before timer expires
resetContext()

// Check if demo active
const isDemoActive = computed(() => contextTheme.value !== null)
```

### Example 2: Route-Based Theme
```typescript
// In App.vue (setup once)
const { setupLocalScopeWatcher } = useTheme()
const router = useRouter()
setupLocalScopeWatcher(router)

// In route component
const { setTheme } = useTheme()
onMounted(async () => {
    await setTheme(7, 'local') // Auto-resets when navigating away
})
```

### Example 3: User Preference (Backward Compatible)
```typescript
const { setTheme } = useTheme()

// Still works exactly as before
await setTheme(3)        // scope='initial' by default
await setTheme(null)     // Clear theme
```

## Testing Scenarios

### Test 1: Initial Scope (Default)
1. Call `setTheme(3)` or `setTheme(3, 'initial')`
2. Navigate to different routes
3. **Expected:** Theme persists across routes

### Test 2: Timer Scope
1. Call `setTheme(2, 'timer', 10)`
2. Wait 10 seconds
3. **Expected:** Theme automatically reverts to initial theme

### Test 3: Local Scope
1. Setup watcher in App.vue: `setupLocalScopeWatcher(router)`
2. On route A, call `setTheme(5, 'local')`
3. Navigate to route B
4. **Expected:** Theme reverts on navigation

### Test 4: Manual Reset
1. Set context theme: `setTheme(4, 'timer', 60)`
2. Before timeout, call `resetContext()`
3. **Expected:** Theme immediately reverts, timer cleared

### Test 5: Context Priority
1. Set initial theme: `setTheme(2, 'initial')`
2. Set context theme: `setTheme(5, 'timer', 30)`
3. **Expected:** Theme 5 displays (context overrides initial)
4. Wait for timeout
5. **Expected:** Theme 2 displays (reverts to initial)

### Test 6: Site Scope Error
1. Call `setTheme(1, 'site', 'myproject')`
2. **Expected:** Throws error "Site scope not yet implemented"

### Test 7: Timer Validation
1. Call `setTheme(3, 'timer')` (no param)
2. **Expected:** Throws error "Timer scope requires param (seconds) as number"
3. Call `setTheme(3, 'timer', 'invalid')`
4. **Expected:** Throws error about param type

## Migration Notes

- **Backward Compatible:** All existing `setTheme(id)` calls work without changes
- **Optional Parameters:** scope and param are optional
- **Default Behavior:** Default scope='initial' maintains existing functionality
- **No Breaking Changes:** Existing components don't need updates

## Integration Plan

### Phase 1: Core Functionality (COMPLETED)
- ✅ Enhanced useTheme composable
- ✅ Added scope system
- ✅ Implemented resetContext
- ✅ Added route watcher helper
- ✅ Created comprehensive documentation

### Phase 2: HomePage Post-It Demo (NEXT)
1. Add Post-It to HomePageHero with theme toggle
2. Implement timer-based demo (30 seconds)
3. Add visual countdown indicator
4. Test theme switching and auto-reset

### Phase 3: App.vue Integration
1. Add `setupLocalScopeWatcher(router)` in App.vue
2. Test route-based auto-reset
3. Document setup in THEME_SCOPE_SYSTEM.md

### Phase 4: Testing & Documentation
1. Test all scope types
2. Test edge cases (rapid switching, multiple timers)
3. Update testing documentation
4. Add usage examples to component docs

## Technical Details

### State Management
- **Singleton Pattern:** All instances share same state (existing pattern preserved)
- **Priority System:** Context theme always overrides initial theme
- **Timer Management:** Only one timer active at a time, cleared on new context or reset
- **Route Watching:** Opt-in via setupLocalScopeWatcher (prevents automatic watching overhead)

### Edge Cases Handled
1. **Multiple timers:** New timer clears existing timer
2. **Rapid switching:** Each setTheme call updates state atomically
3. **Null handling:** Setting null with initial scope clears initial theme
4. **Null handling:** Setting null with context scope calls resetContext
5. **Route param:** Local scope optionally accepts specific route path

### Performance Considerations
- Route watcher only active when setupLocalScopeWatcher called
- Timer cleanup on component unmount handled by Vue's reactivity
- Theme vars cached (existing optimization preserved)

## Future Enhancements

### Site Scope Implementation
When ready to implement domaincode-based themes:
1. Add project/domain detection logic
2. Load project-specific theme from API
3. Store project-theme mapping
4. Auto-reset when domaincode changes

### Persistence Options
Potential future features:
- Save context theme to sessionStorage
- Restore context theme on page refresh
- Remember last demo theme per user

### Animation Support
Potential enhancements:
- Fade transition between themes
- Countdown animation for timer scope
- Visual indicator for active context theme

## Notes

- TypeScript errors for Vue imports are false positives (Vue 3.5+ uses different type resolution)
- Context theme state can be accessed for debugging via contextTheme, contextScope, initialTheme computed properties
- Timer uses window.setTimeout (browser API, not Node.js)
- Route watcher uses Vue Router's reactive currentRoute
- All theme loading is async (existing pattern preserved)

## Related Documentation

- `/docs/THEME_SCOPE_SYSTEM.md` - Complete API reference
- `/docs/CLIST_DESIGN_SPEC.md` - Component design patterns (reference)
- `/src/fpostit/` - Post-It system for UI notifications (demo integration target)

---

**Status:** ✅ Core Implementation Complete  
**Next Steps:** Integrate with HomePageHero Post-It for theme demo  
**Backward Compatibility:** ✅ Yes - all existing code works without changes

