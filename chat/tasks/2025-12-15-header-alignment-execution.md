# Header Type/Size Alignment - Execution Plan

**Date:** 2025-12-15  
**Status:** Ready for Execution  
**Context:** Hero.vue and PageHeading.vue are complete reference implementations

---

## Today's Achievements (Reference Points)

### Validated Working:
1. **Hero.vue** - Full image system with hero instances, cover sizing
2. **PageHeading.vue** - useHeaderConfig integration, three-layer merge
3. **Post 49** - Test case with `header_type: "banner"`, `header_size: "medium"`, `img_id: 107`
4. **Migrations 066+067** - `header_size` column + `header_configs` tables

### Key Odoo Model Alignment:
| Field | Values | Default |
|-------|--------|---------|
| `header_type` | simple, columns, banner, cover, bauchbinde | banner |
| `header_size` | mini, medium, prominent, full | medium |

### CSS Height Mapping:
| header_size | CSS |
|-------------|-----|
| mini | 25vh |
| medium | 50vh |
| prominent | 75vh |
| full | 100vh |

---

## Components to Align

### Current Status Scan:

| Component | header_type | header_size | Status |
|-----------|-------------|-------------|--------|
| Hero.vue | via props | ✅ heightTmp | ✅ DONE |
| PageHeading.vue | ✅ via useHeaderConfig | ✅ passed to Hero | ✅ DONE |
| PostPage.vue | ✅ passes from post | ✅ passes from post | ✅ DONE |
| EventPage.vue | ✅ passes from event | ✅ passes from event | ✅ Check defaults |
| ProjectSite.vue | ✅ passes from project | ✅ passes from project | ✅ Check defaults |
| EditPanel.vue | ⚠️ Disabled/wrong values | ⚠️ Wrong values | 🔧 FIX |
| EventPanel.vue | ❌ Hardcoded 'cover' | ❌ Missing | 🔧 FIX |
| AddPostPanel.vue | ❌ Missing | ❌ Missing | 🔧 ADD |
| TextImage.vue | N/A (disabled) | ⚠️ Uses heightTmp | 🔧 ENABLE |

---

## Execution Steps (In Order)

### Step 1: Fix EditPanel.vue
**Goal:** Enable header_type dropdown with correct Odoo values

**Current State:**
```vue
<!-- Header Type disabled
<select id="edit-header-type" v-model="formData.header_type" class="form-select">
    <option value="">Default</option>
    <option value="hero">Hero</option>  ❌ Wrong
    <option value="banner">Banner</option>
    <option value="minimal">Minimal</option>  ❌ Wrong
</select> -->
```

**Fix To:**
```vue
<div class="form-group form-group-fixed">
    <label class="form-label" for="edit-header-type">Header Type</label>
    <select id="edit-header-type" v-model="formData.header_type" class="form-select">
        <option value="">Default</option>
        <option value="simple">Simple</option>
        <option value="columns">Columns</option>
        <option value="banner">Banner</option>
        <option value="cover">Cover</option>
        <option value="bauchbinde">Bauchbinde</option>
    </select>
</div>
```

**Also fix header_size values:**
```vue
<select id="edit-header-size" v-model="formData.header_size" class="form-select">
    <option :value="null">Default</option>
    <option value="mini">Mini (25%)</option>
    <option value="medium">Medium (50%)</option>
    <option value="prominent">Prominent (75%)</option>
    <option value="full">Full (100%)</option>
</select>
```

### Step 2: Fix EventPanel.vue
**Goal:** Remove hardcoded `header_type: 'cover'`, add selection UI

**Current State (line 429):**
```typescript
header_type: 'cover'  // ❌ Hardcoded
```

**Fix:** Add form fields for header_type/size selection, default to entity value

### Step 3: Update AddPostPanel.vue
**Goal:** Add header_type and header_size to post creation form

**Add form fields:**
```vue
<div class="form-group">
    <label class="form-label">Header Type</label>
    <select v-model="headerType" class="form-select">
        <option value="banner">Banner</option>
        <option value="cover">Cover</option>
        <option value="simple">Simple</option>
        <option value="columns">Columns</option>
        <option value="bauchbinde">Bauchbinde</option>
    </select>
</div>

<div class="form-group">
    <label class="form-label">Header Size</label>
    <select v-model="headerSize" class="form-select">
        <option value="medium">Medium (50%)</option>
        <option value="mini">Mini (25%)</option>
        <option value="prominent">Prominent (75%)</option>
        <option value="full">Full (100%)</option>
    </select>
</div>
```

### Step 4: Enable TextImage.vue for Columns Layout
**Goal:** Move from disabled/ to active, add shape instance support

**Location:** `src/disabled/components/TextImage.vue` → `src/components/TextImageHeader.vue`

**Enhancements:**
1. Add `image_id` prop for API-based loading (like Hero)
2. Add shape instance support (half_wide: 550×310)
3. Wire into PageHeading.vue when `headerType === 'columns'`

### Step 5: Verify EventPage.vue Defaults
**Goal:** Ensure correct defaults when event has no header_type/size

**Current (line 35):**
```vue
:headerType="event.header_type || 'banner'" 
:headerSize="event.header_size || 'prominent'"
```

**Decision:** These defaults look good for events (banner with prominent = visible hero)

### Step 6: Verify ProjectSite.vue Defaults
**Goal:** Ensure correct defaults for project pages

**Current (line 49):**
```vue
:headerType="project.header_type || 'banner'" 
:headerSize="project.header_size || 'prominent'"
```

**Decision:** Good defaults ✅

---

## Files to Modify (Execution Order)

### Phase 1: Editing Panels (Enable Selection)
1. [ ] `src/components/EditPanel.vue`
   - Uncomment/fix header_type dropdown
   - Fix header_size values to match Odoo

2. [ ] `src/components/EventPanel.vue`
   - Remove `header_type: 'cover'` hardcode
   - Add header_type/size form fields

3. [ ] `src/components/AddPostPanel.vue`
   - Add header_type selection
   - Add header_size selection
   - Include in create POST payload

### Phase 2: TextImage Component
4. [ ] Create `src/components/TextImageHeader.vue`
   - Copy from `src/disabled/components/TextImage.vue`
   - Add image_id prop
   - Add useImageFetch composable
   - Wire shape instances

5. [ ] Update `src/components/PageHeading.vue`
   - Import TextImageHeader
   - Render when `headerType === 'columns'`

### Phase 3: Cleanup
6. [ ] Remove debug console.logs from Hero.vue
7. [ ] Add domaincode preview to HeaderConfigsEditor

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| PATCH `/api/posts/:id` | Update post header_type/size |
| PATCH `/api/events/:id` | Update event header_type/size |
| GET `/api/header-configs/resolve` | Get resolved config for type |

---

## Test Checklist

After each step:
- [ ] Post 49 still displays correctly (banner, medium, top-aligned)
- [ ] EditPanel saves header_type/size changes
- [ ] EventPanel creates events with correct header settings
- [ ] AddPostPanel creates posts with header settings
- [ ] Columns layout renders TextImageHeader (when implemented)

---

## Dependencies

```
EditPanel.vue
    └── No dependencies (standalone panel)
    
EventPanel.vue  
    └── No dependencies (standalone panel)
    
AddPostPanel.vue
    └── No dependencies (standalone panel)
    
TextImageHeader.vue
    └── useImageFetch composable (exists)
    └── PageHeading.vue (wire in)
    
PageHeading.vue (for columns)
    └── TextImageHeader.vue (import)
```

---

## Estimated Time

| Step | Time |
|------|------|
| 1. EditPanel fix | 10 min |
| 2. EventPanel fix | 15 min |
| 3. AddPostPanel add | 15 min |
| 4. TextImageHeader create | 30 min |
| 5-6. Verify defaults | 5 min |
| 7. Cleanup | 5 min |
| **Total** | ~80 min |
