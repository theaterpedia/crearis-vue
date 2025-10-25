# PageLayout Integration Test Plan

## Implementation Status ✅

**Date**: October 25, 2025  
**Component**: ProjectSite.vue  
**Strategy**: Strategy 2 (Content Loads Layout) + PageHeading Component

### Changes Completed

1. ✅ **Removed old navigation**: Navbar, AdminMenu moved to PageLayout's TopNav
2. ✅ **Removed old layout**: Box, Main, Footer removed (now in PageLayout)
3. ✅ **Added PageLayout**: Wrapper component imported and used
4. ✅ **Added PageHeading**: Header slot populated with project data
5. ✅ **Cleaned imports**: Removed AlertBanner, Navbar, AdminMenu, Box, Main, Hero, Banner, Footer

### Architecture Pattern

```
ProjectSite.vue (outer)
  └─ PageLayout.vue (imported)
      ├─ TopNav (with EditPanelButton in actions slot)
      ├─ Header slot → PageHeading
      │   ├─ Props: heading, teaserText, imgTmp, headerType, headerSize
      │   ├─ CTA: Get Involved → /getstarted
      │   └─ Link: Back to Home → /
      ├─ Default slot → Project content
      │   ├─ Section: Events (background="muted")
      │   ├─ RegioContentDemo (conditional)
      │   ├─ Section: Posts (background="accent")
      │   └─ Section: Team (background="muted")
      └─ Footer (from PageLayout)
```

## Test Plan

### Phase 1: Visual Verification (Manual)

#### Test 1.1: Basic Rendering
- [ ] Navigate to `/projects/theaterpedia`
- [ ] Verify PageHeading displays with project image
- [ ] Verify heading and teaser text render correctly
- [ ] Verify CTA buttons appear and are clickable
- [ ] Verify TopNav appears at top

#### Test 1.2: Layout Modes

**Default Layout** (layoutSettings.siteLayout = 'default'):
- [ ] Content is boxed (max-width centered)
- [ ] Right sidebar shows (if showAside = true)
- [ ] TopNav is full-width
- [ ] Footer is full-width

**Full-Width Two Column** (layoutSettings.siteLayout = 'fullTwo'):
- [ ] Content stretches full-width with padding
- [ ] Right sidebar visible
- [ ] All sections full-width

**Full-Width Three Column** (layoutSettings.siteLayout = 'fullThree'):
- [ ] Left sidebar appears
- [ ] Main content in center
- [ ] Right sidebar appears
- [ ] All full-width with padding

**Sidebar Mode** (layoutSettings.siteLayout = 'sidebar'):
- [ ] Left navigation sidebar appears
- [ ] TopNav is hidden
- [ ] Content area adjusts for sidebar

### Phase 2: PageHeading Integration Tests

#### Test 2.1: Header Types
Test each headerType value:

**banner** (default):
- [ ] Image displays as background
- [ ] Content overlay with gradient
- [ ] Medium height (50vh)
- [ ] Content aligned to top

**cover**:
- [ ] Full cover image
- [ ] Content at bottom
- [ ] Prominent height (75vh)
- [ ] Strong gradient overlay

**bauchbinde**:
- [ ] Content in banner overlay
- [ ] Fixed width content
- [ ] Left-aligned text
- [ ] No gradient

**simple**:
- [ ] No hero image
- [ ] Just heading + teaser in Section
- [ ] Standard padding

#### Test 2.2: Header Sizes
Test each headerSize value:

**mini**:
- [ ] 25vh height
- [ ] Compact appearance

**medium**:
- [ ] 50vh height
- [ ] Balanced layout

**prominent**:
- [ ] 75vh height
- [ ] Large hero presence

**full**:
- [ ] 100vh height
- [ ] Fullscreen hero

### Phase 3: Dynamic Data Tests

#### Test 3.1: Project Data Mapping
- [ ] project.heading → PageHeading :heading
- [ ] project.teaser → PageHeading :teaserText (fallback to project.md)
- [ ] project.cimg → PageHeading :imgTmp (with default fallback)
- [ ] project.header_type → PageHeading :headerType (default 'banner')
- [ ] project.header_size → PageHeading :headerSize (default 'prominent')

#### Test 3.2: Missing Data Handling
- [ ] Project without heading (uses project.id)
- [ ] Project without teaser (uses md or default text)
- [ ] Project without cimg (uses default image)
- [ ] Project without header_type (uses 'banner')
- [ ] Project without header_size (uses 'prominent')

### Phase 4: EditPanel Integration

#### Test 4.1: EditPanel Button Location
- [ ] EditPanelButton appears in TopNav actions slot (not visible yet in current implementation)
- [ ] Button shows when authenticated
- [ ] Button respects permissions (admin/owner/member)

#### Test 4.2: EditPanel Functionality
- [ ] Clicking button opens EditPanel
- [ ] EditPanel displays current project data
- [ ] Saving updates project data
- [ ] PageHeading updates after save
- [ ] All fields persist (heading, teaser, cimg, header_type, header_size, md)

### Phase 5: Responsive Behavior

#### Test 5.1: Mobile (< 640px)
- [ ] PageHeading adapts to mobile
- [ ] TopNav shows hamburger menu
- [ ] Content sections stack properly
- [ ] Sliders work on mobile
- [ ] CTA buttons stack vertically

#### Test 5.2: Tablet (640px - 1024px)
- [ ] PageHeading shows medium sizing
- [ ] TopNav shows full menu
- [ ] Content maintains readability
- [ ] Columns adjust (2-column grid)

#### Test 5.3: Desktop (> 1024px)
- [ ] PageHeading shows full layout
- [ ] Sidebar appears (if enabled)
- [ ] Content uses optimal width
- [ ] All interactive elements accessible

### Phase 6: Layout Settings Integration

#### Test 6.1: Fullwidth Padding Toggle
In layoutsettings.ts, toggle `fullwidthPadding`:
- [ ] `true`: Sections have 1rem (mobile) / 2rem (desktop) padding
- [ ] `false`: Sections stretch to screen edges

#### Test 6.2: TopNav Scroll Behavior
Test `scrollStyle` values:
- [ ] `'simple'`: TopNav scrolls away normally
- [ ] `'overlay'`: TopNav stays fixed at top
- [ ] `'overlay_reappear'`: TopNav hides on scroll down, reappears on scroll up

#### Test 6.3: Background Colors
Test `backgroundColor` values:
- [ ] `'default'`: Standard background
- [ ] `'primary'`: Primary theme color
- [ ] `'muted'`: Muted/gray background
- [ ] `'accent'`: Accent color background

### Phase 7: Content Section Tests

#### Test 7.1: Events Section
- [ ] Events load from API
- [ ] Slider displays events
- [ ] Event cards show: image, heading, date, location, md preview
- [ ] Empty state: "No events for this project yet."

#### Test 7.2: Posts Section
- [ ] Posts load from API
- [ ] Card grid (3 columns on desktop)
- [ ] Post cards show: image, heading, md preview
- [ ] Empty state: "No posts for this project yet."

#### Test 7.3: Team Section
- [ ] Users load from API
- [ ] Slider displays team members
- [ ] User cards show: avatar/initial, username, role, email
- [ ] Empty state: "No team members listed yet."

## Testing Checklist Summary

### Critical Path (Must Pass) 🔴
- [ ] ProjectSite renders without errors
- [ ] PageHeading displays with project data
- [ ] PageLayout wraps content correctly
- [ ] TopNav appears and functions
- [ ] Content sections render
- [ ] Responsive behavior works (mobile/desktop)

### High Priority (Should Pass) 🟡
- [ ] All header types work (banner, cover, simple, bauchbinde)
- [ ] All header sizes work (mini, medium, prominent, full)
- [ ] Layout mode switching (default, fullTwo, fullThree, sidebar)
- [ ] EditPanel opens and saves
- [ ] Data fallbacks work correctly

### Medium Priority (Nice to Have) 🟢
- [ ] Scroll behaviors work (simple, overlay, overlay_reappear)
- [ ] Background color switching works
- [ ] Fullwidth padding toggle works
- [ ] Empty states display correctly

## Known Issues & TODOs

### Current Issues
1. **EditPanelButton not visible**: Need to add to TopNav actions slot via PageLayout
2. **Admin navigation**: TopNav doesn't show AdminMenu yet (PageLayout hardcoded ToggleMenu)
3. **TypeScript LSP errors**: Vue import errors (runtime works fine)

### Future Improvements
1. **UserMenu integration**: Move UserMenu to Floating Vue dropdown in TopNav actions
2. **AdminMenu integration**: Move AdminMenu to Floating Vue dropdown in TopNav actions
3. **PageLayout props**: Consider passing user/auth state to PageLayout
4. **Dynamic navigation**: Load TopNav menu items from database/settings

## Test Execution Log

### Run 1: Initial Integration (Date: _______)
**Tester**: _____  
**Environment**: Local dev server (http://localhost:3001)

#### Critical Path Results
- [ ] ProjectSite renders: ✅ / ❌
- [ ] PageHeading displays: ✅ / ❌
- [ ] Content sections render: ✅ / ❌

**Notes**:
_____________________________________________________________________
_____________________________________________________________________

### Run 2: Layout Modes (Date: _______)
**Tester**: _____

#### Layout Mode Results
- [ ] Default layout: ✅ / ❌
- [ ] FullTwo layout: ✅ / ❌
- [ ] FullThree layout: ✅ / ❌
- [ ] Sidebar layout: ✅ / ❌

**Notes**:
_____________________________________________________________________
_____________________________________________________________________

### Run 3: Header Variations (Date: _______)
**Tester**: _____

#### Header Type Results
- [ ] banner: ✅ / ❌
- [ ] cover: ✅ / ❌
- [ ] bauchbinde: ✅ / ❌
- [ ] simple: ✅ / ❌

#### Header Size Results
- [ ] mini: ✅ / ❌
- [ ] medium: ✅ / ❌
- [ ] prominent: ✅ / ❌
- [ ] full: ✅ / ❌

**Notes**:
_____________________________________________________________________
_____________________________________________________________________

## Manual Testing Instructions

### Setup
```bash
# Start dev server (if not running)
cd /home/persona/crearis/demo-data
npm run dev

# Open browser
http://localhost:3001/projects/theaterpedia
```

### Test 1: Basic Rendering
1. Navigate to project page
2. Verify PageHeading appears with image
3. Verify all sections render
4. Check console for errors

### Test 2: Layout Mode Switching
1. Open `src/layoutsettings.ts`
2. Change `siteLayout` to each value:
   - `'default'`
   - `'fullTwo'`
   - `'fullThree'`
   - `'sidebar'`
3. Refresh browser after each change
4. Verify layout changes

### Test 3: Header Type Testing
1. Open EditPanel (if working) or manually edit database
2. Set `header_type` to each value:
   - `'banner'`
   - `'cover'`
   - `'bauchbinde'`
   - `'simple'`
3. Refresh and verify appearance

### Test 4: Responsive Testing
1. Open browser DevTools
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Test at breakpoints:
   - 375px (mobile)
   - 768px (tablet)
   - 1024px (desktop)
   - 1440px (large desktop)
4. Verify all content adapts

## Success Criteria

✅ **Phase 1 Complete**: All critical path tests pass  
✅ **Phase 2 Complete**: All header types and sizes work  
✅ **Phase 3 Complete**: All layout modes functional  
✅ **Phase 4 Complete**: EditPanel integration working  
✅ **Phase 5 Complete**: Fully responsive across breakpoints

## Next Steps After Testing

1. **If tests pass**:
   - Document any issues found
   - Create EventPage.vue using same pattern
   - Create PostPage.vue using same pattern
   - Update PageLayout to show EditPanelButton

2. **If tests fail**:
   - Document specific failures
   - Debug and fix issues
   - Re-run failed tests
   - Update implementation as needed

## Automated Test Ideas (Future)

```typescript
// Vitest component test
describe('ProjectSite with PageLayout', () => {
  it('renders PageHeading with project data', async () => {
    const wrapper = mount(ProjectSite, {
      global: {
        stubs: ['PageLayout', 'PageHeading']
      }
    })
    
    await wrapper.vm.fetchProject('theaterpedia')
    
    expect(wrapper.findComponent(PageHeading).props()).toMatchObject({
      heading: expect.any(String),
      imgTmp: expect.any(String),
      headerType: 'banner'
    })
  })
  
  it('switches layout modes correctly', async () => {
    // Test layout mode switching
  })
  
  it('handles missing project data gracefully', async () => {
    // Test fallbacks
  })
})
```

---

## Conclusion

This test plan provides comprehensive coverage of the PageLayout + PageHeading integration in ProjectSite.vue. Execute tests systematically and document all findings. Use this as a template for testing EventPage, PostPage, and other content pages.

**Estimated Testing Time**: 2-3 hours for complete manual test coverage
