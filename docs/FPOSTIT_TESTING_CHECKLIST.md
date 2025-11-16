# Floating Post-Its Testing Checklist

## Setup

Before testing, ensure:
- [ ] Dev server is running (`npm run dev` or `pnpm dev`)
- [ ] All TypeScript compilation errors are resolved
- [ ] `FpostitRenderer` component is included in App.vue or main layout

## 1. DemoFloatHard - Programmatic API Testing

**URL:** `/demo/float-hard`

### Basic Functionality
- [ ] Page loads without errors
- [ ] Three trigger buttons are visible
- [ ] Click "Post-It 1 (Default/Right)" - post-it opens on the right side
- [ ] Click "Post-It 2 (Left)" - post-it opens on the left side
- [ ] Click "Post-It 3 (Element)" - post-it opens relative to button position
- [ ] Each post-it shows correct title, content, and styling
- [ ] Post-its have random rotation (-3deg to +3deg)

### Post-It Features
- [ ] Post-It 1: Shows primary theme, content with list, 2 action buttons
- [ ] Post-It 2: Shows secondary theme, 1 action button
- [ ] Post-It 3: Shows accent theme, has image, 2 action buttons
- [ ] Action buttons are clickable
- [ ] "Learn More" action shows alert
- [ ] "Got it!" action closes the post-it
- [ ] Close button (X) works on all post-its

### Controller Methods
- [ ] "Close All" button closes all open post-its
- [ ] "Show Status" displays correct count of registered/open post-its
- [ ] Status message appears and auto-hides after 2 seconds
- [ ] Can reopen closed post-its

### Max Limit Testing
- [ ] Open all 3 post-its
- [ ] Try to open more post-its (if you create more) - oldest should auto-close
- [ ] Verify max 9 post-its enforced (need to create 10+ for full test)

### Keyboard & UX
- [ ] Press `Esc` key - closes currently open post-it
- [ ] Click outside post-it - post-it stays open (expected behavior)
- [ ] Window resize updates post-it positions correctly

---

## 2. DemoFloatDyn - HTML Discovery Testing

**URL:** `/demo/float-dyn`

### Discovery Mechanism
- [ ] Page loads without errors
- [ ] Status message shows "Discovered 4 post-its from HTML"
- [ ] Four trigger buttons are visible with correct icons/labels

### Post-It Triggers
- [ ] Click "⚠️ Important Notice" - warning theme post-it opens
  - [ ] Has image displayed
  - [ ] Shows maintenance content
  - [ ] Has 2 action links
  - [ ] Opens on right (hlogic="default")

- [ ] Click "✅ New Feature" - positive theme post-it opens
  - [ ] Green/positive styling
  - [ ] Shows feature list
  - [ ] Has 1 action link
  - [ ] Opens on left (hlogic="left")

- [ ] Click "💡 Quick Tip" - accent theme post-it opens
  - [ ] Has SVG icon displayed
  - [ ] Shows keyboard shortcuts with `<kbd>` tags
  - [ ] Has 2 action links
  - [ ] Positions intelligently relative to trigger (hlogic="element")

- [ ] Click "📚 Documentation" - secondary theme post-it opens
  - [ ] Shows documentation content
  - [ ] Has 1 action link
  - [ ] Opens on right (hlogic="right")

### Discovery Controls
- [ ] Click "Re-discover Post-Its" - shows re-discovery status
- [ ] Click "Close All" - closes all open post-its
- [ ] Re-open after re-discovery - all still work correctly

### HTML Data Attributes
- [ ] Inspect trigger buttons - verify `data-fpostlink` attribute
- [ ] Inspect hidden divs - verify `data-fpostcontent`, `data-color` attributes
- [ ] Verify action links have `data-fpostact1` and `data-fpostact2` attributes
- [ ] Verify container has `data-fpostcontainer` and `data-fpostkey` attributes

---

## 3. DemoFloatMarkdown - Markdown Integration Testing

**URL:** `/demo/float-markdown`

### Marked.js Installation
- [ ] If `marked` not installed, warning box appears
- [ ] Warning shows installation instructions
- [ ] Example markdown syntax is displayed in `<pre>` block

### With Marked.js Installed
**First install:** `npm install marked` or `pnpm add marked`

- [ ] Page loads without errors
- [ ] Markdown content is rendered as HTML
- [ ] Post-it triggers are embedded in markdown content
- [ ] Console shows "Discovered X post-its from markdown"

### Markdown Post-Its
- [ ] "💡 Pro Tip" trigger visible in markdown
  - [ ] Opens accent theme post-it
  - [ ] Content shows markdown formatting (lists, bold, italic)
  - [ ] Has 2 action buttons
  - [ ] Opens on right

- [ ] "📚 Documentation" trigger visible
  - [ ] Opens primary theme post-it
  - [ ] Shows numbered list
  - [ ] Has 1 action button
  - [ ] Opens on left

- [ ] "⚠️ Important Notice" trigger visible
  - [ ] Opens warning theme post-it
  - [ ] Has image displayed
  - [ ] Shows system maintenance info
  - [ ] Has 2 action buttons
  - [ ] Uses element-relative positioning

### Markdown Rendering
- [ ] Regular markdown content between post-its renders correctly
- [ ] Headers, paragraphs, lists all styled properly
- [ ] `::fpostit` blocks don't show raw syntax
- [ ] Action link syntax `{.fpostact1}` is hidden from rendered output
- [ ] All markdown inside post-it content is properly rendered

---

## 4. Mobile Responsiveness Testing

**Test on devices or browser DevTools mobile emulation (< 768px width)**

### DemoFloatHard (Mobile)
- [ ] Trigger buttons stack vertically
- [ ] Post-its are 50% viewport width
- [ ] Post-its position based on click location (left/right thirds)
- [ ] Click in left third - post-it appears on left
- [ ] Click in right third - post-it appears on right
- [ ] hLogic is ignored on mobile (expected)
- [ ] Content is readable at mobile width
- [ ] Action buttons stack vertically
- [ ] Close button remains accessible

### DemoFloatDyn (Mobile)
- [ ] All triggers are full width
- [ ] Post-its adapt to mobile positioning
- [ ] Images scale correctly
- [ ] SVG icons display properly
- [ ] Keyboard shortcuts still readable

### DemoFloatMarkdown (Mobile)
- [ ] Markdown content is readable
- [ ] Post-it triggers tap easily
- [ ] Warning box (if shown) is readable

---

## 5. Theme & Styling Testing

### Color Themes
Test each theme by inspecting post-its:
- [ ] `primary` - blue/primary brand color
- [ ] `secondary` - secondary brand color
- [ ] `warning` - yellow/orange warning color
- [ ] `positive` - green success color
- [ ] `negative` - red error color (create test post-it)
- [ ] `accent` - accent brand color
- [ ] `muted` - gray/muted color (create test post-it)
- [ ] `dimmed` - darker muted color (create test post-it)

### Rotation Classes
- [ ] Post-its have visible rotation (slight tilt)
- [ ] Rotation varies between post-its (-3° to +3°)
- [ ] Rotation persists when reopening same post-it

### Styling Elements
- [ ] Post-it shadow is visible
- [ ] Close button (X) is top-right corner
- [ ] SVG icons render correctly
- [ ] Images load and display (max-height 200px)
- [ ] Content prose styling (margins, line-height)
- [ ] Action buttons styled with hover effects
- [ ] Transition animation (fade + slide) works smoothly

---

## 6. Edge Cases & Error Handling

### Invalid Keys
- [ ] Try creating post-it with invalid key (not p1-p9 format) - should fail gracefully
- [ ] Console shows validation error

### Missing Elements
- [ ] HTML discovery with missing `data-fpostkey` - skips container
- [ ] HTML discovery with missing `data-fpostlink` - skips container
- [ ] HTML discovery with missing `data-fpostcontent` - skips container
- [ ] Console shows warning for invalid structures

### Max Post-Its Limit
- [ ] Create 10th post-it - oldest post-it closes automatically
- [ ] Open keys count never exceeds 9
- [ ] No errors in console

### SSR Safety
- [ ] No hydration mismatches in console
- [ ] Post-its only activate client-side
- [ ] No "window is undefined" errors

### Duplicate Keys
- [ ] Try registering same key twice - second registration is skipped
- [ ] Original post-it data is preserved

---

## 7. Browser Compatibility

Test in multiple browsers:

### Chrome/Edge
- [ ] All features work
- [ ] Transitions smooth
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] SVG rendering correct
- [ ] Positioning accurate

### Safari
- [ ] All features work
- [ ] Mobile Safari positioning works
- [ ] No webkit-specific issues

---

## 8. Performance Testing

### Large Content
- [ ] Post-it with very long content (1000+ words) - scrollable?
- [ ] Post-it with large image (2MB+) - loads correctly?
- [ ] Multiple images in one post-it

### Many Post-Its
- [ ] Open all 9 post-its simultaneously
- [ ] Page remains responsive
- [ ] No memory leaks (check DevTools Memory)

### Rapid Interactions
- [ ] Rapidly open/close post-its - no race conditions
- [ ] Spam "Close All" button - handles gracefully
- [ ] Open same post-it multiple times quickly - only one instance

---

## 9. Accessibility Testing

### Keyboard Navigation
- [ ] Tab through trigger buttons
- [ ] Enter/Space on trigger opens post-it
- [ ] Tab into post-it content
- [ ] Tab through action buttons
- [ ] Esc closes post-it
- [ ] Focus returns to trigger after closing

### Screen Readers
- [ ] Trigger buttons have readable labels
- [ ] Post-it content is announced
- [ ] Action buttons are announced correctly
- [ ] Close button is announced as "Close"

### Color Contrast
- [ ] All text readable on all theme colors
- [ ] Action buttons have sufficient contrast
- [ ] Close button visible on all themes

---

## 10. Integration Testing

### With Existing Components
- [ ] Post-its work alongside PostIt component
- [ ] No CSS conflicts with Section/Container/Prose
- [ ] No z-index issues with other modals/dropdowns

### With Router
- [ ] Navigate between demo pages - post-its close on route change?
- [ ] Browser back/forward - post-its don't persist incorrectly

### With Real Content
- [ ] Test integration in actual page content (e.g., /blog, /team)
- [ ] Post-its in PageContent component work correctly
- [ ] No conflicts with other interactive elements

---

## Test Results Summary

**Test Date:** ___________  
**Tester:** ___________  
**Browser(s):** ___________  
**Device(s):** ___________

### Critical Issues
- [ ] None found

### Non-Critical Issues
- [ ] None found

### Notes
_Add any observations, edge cases discovered, or recommendations here._

---

## Next Steps After Testing

1. [ ] Fix all critical issues
2. [ ] Document known limitations (if any)
3. [ ] Add `FpostitRenderer` to App.vue for global availability
4. [ ] Install `marked` package if markdown integration is needed
5. [ ] Create documentation for end users
6. [ ] Consider adding unit tests for core utilities
7. [ ] Consider adding E2E tests for critical user flows
