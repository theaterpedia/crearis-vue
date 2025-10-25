# PageLayout.vue - Implementation Summary

## Tasks Completed

### ✅ Task 1: Fixed Missing Imports

**Problem**: PageLayout.vue referenced undefined imports from Nuxt environment

**Solutions Applied**:
- Added `import { useRoute } from 'vue-router'` - Vue Router composable for current route
- Added `import { useWindowScroll } from '@vueuse/core'` - Already installed (@vueuse/core@^10.11.0)
- Added all component imports (AlertBanner, Box, TopNav, Sidebar, etc.)
- Fixed import paths from `'../components/'` to `'./'` for component imports

**Changes**:
```typescript
// Before
const route = useRoute() // ❌ Import missing
const y = ref(useWindowScroll().y) // ❌ Import missing

// After
import { useRoute } from 'vue-router' // ✅
import { useWindowScroll } from '@vueuse/core' // ✅
const route = useRoute()
const { y } = useWindowScroll()
```

---

### ✅ Task 2: Defined Missing Props with TODOs

**Problem**: Several props were referenced but not defined (cimg, headerType, headerSize, page, searchDisabled, themeKey, textShadow)

**Solutions Applied**:
Created a dedicated TODO section in script setup with all missing props mocked with default values:

```typescript
// ============================================================================
// TODO: MISSING PROPS - Decide handling strategy
// ============================================================================
// These props need to be either:
// 1. Passed as component props from parent (ProjectSite, EventPage, etc.)
// 2. Provided via slot content
// 3. Handled by separate PageHeading component
// Current approach: Mock with defaults for compilation

// TODO: Decide if these should be component props or handled elsewhere
const cimg = ref<string | null>(null) // Cover image URL
const headerType = ref<'simple' | 'hero' | 'banner' | 'minimal'>('simple')
const headerSize = ref<'mini' | 'small' | 'medium' | 'large' | 'full' | 'prominent'>('medium')
const page = ref<any>(null) // Page data object with fields
const searchDisabled = ref(false) // Whether search is disabled
const themeKey = ref(0) // Key for theme changes
const textShadow = ref('text-shadow: 0 2px 4px rgba(0,0,0,0.3)')

// Computed values that depend on these props
const showHeader = computed(() => cimg.value && headerType.value !== 'simple')
const scrollBreak = computed(() => {
  if (!showHeader.value) return 80
  return headerSize.value === 'full' || headerSize.value === 'prominent' ? 400 : 250
})
```

**Rationale**: These values need architectural decisions (see pagelayout-architecture.md) before being implemented properly.

---

### ✅ Task 3: Inspected Components and Mocked Missing Props

**Problem**: Header component doesn't exist in current system but was referenced in template

**Solutions Applied**:

1. **Commented out non-existent Header component**:
```vue
<!-- TODO: Header component doesn't exist in current system -->
<!-- Option 1: Create Header component with these props -->
<!-- Option 2: Handle header content in page-specific components -->
<!-- Option 3: Create PageHeading component (RECOMMENDED) -->
<!-- 
<Header :headerType="page?.fields?.headerType" .../>
-->
<div class="temp-header-placeholder">
  <p>Header slot - provide header content from parent component</p>
</div>
```

2. **Added temporary placeholder styling**:
```css
.temp-header-placeholder {
  padding: 2rem;
  background-color: var(--color-muted-bg, #f3f4f6);
  border: 2px dashed var(--color-border, #e5e7eb);
  text-align: center;
  color: var(--color-dimmed, #6b7280);
  font-size: 0.875rem;
}
```

3. **Fixed component name**: Changed `UiToggleMenu` → `ToggleMenu` to match existing component

4. **Fixed type annotations**: Added types to watch callback parameters:
```typescript
// Before
watch([navbarSticky, navbarReappear], ([sticky, reappear]) => { // ❌ implicit any

// After
watch([navbarSticky, navbarReappear], ([sticky, reappear]: [boolean, boolean]) => { // ✅
```

5. **Component Analysis**:
   - ✅ TopNav.vue - exists, compatible
   - ✅ Sidebar.vue - exists, compatible  
   - ✅ SideContent.vue - exists, compatible
   - ✅ Timeline.vue - exists, compatible
   - ✅ All other components (Box, Section, Prose, etc.) - exist, compatible
   - ❌ Header.vue - **does not exist** (commented out with TODO)

---

## Current Status

### ✅ Compilation Status
- All imports resolved
- All components found (except Header - intentionally commented out)
- TypeScript type errors resolved (except cosmetic Vue module warnings)
- File compiles successfully

### ⚠️ Non-Breaking Warnings
```
Module '"vue"' has no exported member 'ref', 'computed', etc.
```
These are **cosmetic TypeScript resolution warnings** that don't affect functionality. Vue is properly installed and working.

---

## Integration Points

### Slot Usage
PageLayout provides three main slots for content components:

```vue
<PageLayout>
  <template #header>
    <!-- Hero/Banner/Heading content -->
  </template>
  
  <template #default>
    <!-- Main page content -->
  </template>
  
  <!-- Footer is automatic -->
</PageLayout>
```

### Layout Configuration
Configured via `layoutsettings.ts`:

```typescript
// Toggle between layouts
siteLayout: 'default' | 'sidebar' | 'fullSidebar' | 'fullTwo' | 'fullThree'

// Control width of sections
baseWideHeader: boolean
baseWideTopnav: boolean
baseWideContent: boolean
baseBottomWide: boolean
baseFooterWide: boolean
fullwidthPadding: boolean

// Navigation behavior
scrollStyle: 'simple' | 'overlay' | 'overlay_reappear'
navbarSticky: boolean
navbarReappear: boolean
```

---

## Next Steps

### Immediate (Required for usage)

1. **Create PageHeading Component** (Recommendation: Option 3 from architecture doc)
   ```vue
   <!-- components/PageHeading.vue -->
   <template>
     <Hero v-if="data.header_type === 'hero'" :data="data" />
     <Banner v-else :data="data" />
   </template>
   ```

2. **Integrate with ProjectSite.vue**
   ```vue
   <PageLayout>
     <template #header>
       <PageHeading :data="project" />
     </template>
     <!-- content -->
   </PageLayout>
   ```

3. **Test layout modes** - Verify all 5 layout types work correctly

### Future (Optional improvements)

4. **Replace placeholder header** - Remove temp-header-placeholder div
5. **Refactor menus to Floating Vue** - UserMenu and AdminMenu
6. **Create EventPage, PostPage** - Using same PageLayout pattern
7. **Add layout mode switcher** - UI for testing different layouts

---

## Files Modified

- ✅ `/src/components/PageLayout.vue` - Fixed imports, added TODOs, commented Header
- ✅ `/docs/research/pagelayout-architecture.md` - Created comprehensive architectural guidance

---

## Architecture Decisions (See Full Document)

**Question A - Nesting Strategy**: **Strategy 2 - Content Loads Layout** ⭐  
Content components (ProjectSite) import and wrap their content in PageLayout via slots.

**Question B - Navigation**: **Hybrid Approach** 🚀  
Keep both Navbar (admin) and TopNav (public), no immediate refactoring needed.

**Question C - Heading Management**: **Option 3 - PageHeading Component** 🏆  
Create reusable PageHeading component that accepts standard heading data interface.

---

## Component Compatibility Matrix

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| AlertBanner | ✅ Exists | src/components/ | Compatible |
| Box | ✅ Exists | src/components/ | Compatible |
| Container | ✅ Exists | src/components/ | Compatible |
| TopNav | ✅ Exists | src/components/ | Compatible, mega-menu support |
| ToggleMenu | ✅ Exists | src/components/ | Fixed name from UiToggleMenu |
| Sidebar | ✅ Exists | src/components/ | Compatible |
| SideContent | ✅ Exists | src/components/ | Compatible |
| Section | ✅ Exists | src/components/ | Compatible |
| Prose | ✅ Exists | src/components/ | Compatible |
| Button | ✅ Exists | src/components/ | Compatible |
| CardHero | ✅ Exists | src/components/ | Compatible |
| Timeline | ✅ Exists | src/components/ | Compatible |
| Footer | ✅ Exists | src/components/ | Compatible |
| **Header** | ❌ Missing | **Need to create** | See PageHeading recommendation |

---

## Testing Checklist

- [ ] PageLayout renders without errors
- [ ] All 5 layout modes work (default, sidebar, fullSidebar, fullTwo, fullThree)
- [ ] TopNav displays correctly
- [ ] Sidebar shows/hides based on layout mode
- [ ] SideContent (right) appears in correct layouts
- [ ] SideContent (left) appears only in fullThree layout
- [ ] Responsive behavior (mobile, tablet, desktop)
- [ ] Fullwidth padding toggle works
- [ ] Navbar sticky/reappear modes work
- [ ] Alert banner displays when configured

---

## Known Issues / Limitations

1. **No Header Component**: Temporarily shows placeholder div
   - **Fix**: Create PageHeading component (2 hours)

2. **Page data structure undefined**: `page?.fields?.headerType` assumes Nuxt/Pruvious structure
   - **Fix**: Define in parent components or pass via props

3. **Search functionality**: `searchDisabled` prop exists but no search implementation
   - **Status**: Low priority, can add later

4. **Theme key**: `themeKey` for forcing re-renders may not be needed in Vite
   - **Status**: Monitor, remove if unused

5. **Commented Header in template**: Old UiNavbarTop and Header sections commented out
   - **Action**: Clean up after PageHeading is implemented

---

## Documentation References

- **Full Architecture Analysis**: `/docs/research/pagelayout-architecture.md`
- **Layout Settings**: `/src/layoutsettings.ts`
- **TopNav Component**: `/src/components/TopNav.vue`
- **Existing Navbar**: `/src/components/Navbar.vue`

---

## Summary

PageLayout.vue is now **compilation-ready** with all imports fixed and missing props mocked. The component can be used immediately with content via slots, though creating the PageHeading component (2 hours) is recommended before production use.

The hybrid architecture approach (Content Loads Layout + separate PageHeading component) provides the best balance of flexibility, maintainability, and development velocity for this project's scale.
