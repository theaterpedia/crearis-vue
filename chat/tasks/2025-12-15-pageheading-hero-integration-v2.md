# PageHeading.vue & Hero.vue Integration Plan

**Date:** 2025-12-15  
**Status:** PHASE 1-2 COMPLETE - Ready for Phase 3+  
**Last Updated:** 2025-12-15 11:45

---

## Strategic Decision: Phased Approach

### Phase A: Header System (Beta → 1.0)
- Complete header_configs via sysreg approach
- Test per-project override pattern thoroughly
- Hero.vue is stable and sophisticated - use as reference
- Make header broadly configurable before 1.0 release

### Phase B: Full FormatOptions (Post 1.0 → 2.0)
- Let aside/footer/page chapters evolve naturally
- Wait until all 3 chapters reach stable status
- Extend pattern to all 4 chapters together
- Consider bit-encoding once schema is finalized
- Target: ~1 year from now (2.0 release)

---

## Implementation Status

| Item | Status | Notes |
|------|--------|-------|
| Q1: Fetch Strategy | ✅ COMPLETE | useHeaderConfig composable with 5-min cache |
| Q2.1: Migrations | ✅ COMPLETE | 066 (header_size) + 067 (header_configs tables) |
| Q2.2: Hero.vue | ✅ COMPLETE | usesCoverSizing fixed, hero instances working |
| Q2.3: PageHeading.vue | ✅ COMPLETE | Integrated useHeaderConfig composable |
| Q3.1: Header Configs Admin | ✅ COMPLETE | SysregAdmin tab with ConfigPreview |
| Q3.3: Domaincode Preview | ⏳ TODO | Add input field for testing project overrides |
| Q4: HeaderOptionsPanel | ⏳ NEXT | header_type/size dropdowns for editing panels |
| Q5: TextImageHeader.vue | ⏳ AFTER Q4 | Columns layout with half_* shape instances |

---

## Hero.vue - IMPLEMENTATION COMPLETE

### Key Understanding (Final):
- **ALL hero types with images use `background-size: cover`**
- The difference between banner/cover is `background-position-y`:
  - **Banner**: `top` (show top of image, good for portraits)
  - **Cover**: `center` (centered image)
- Both use full-width background that scales to fill container

### Hero Instance System:
- API `/api/images/[id].get.ts` computes hero instances
- Returns URLs for `hero_wide_xl` (1440×820), `hero_wide` (1100×620), etc.
- Regenerate-shapes endpoint creates instance files from source

### Hero Props from PageHeading:
```typescript
:heightTmp="headerprops.headerSize"      // mini|medium|prominent|full → 25vh|50vh|75vh|100vh
:imgTmpAlignX="headerprops.imgTmpAlignX" // horizontal position (center)
:imgTmpAlignY="headerprops.imgTmpAlignY" // banner='top', cover='center'
:image_id="image_id"                     // API-based image loading
```

### Hero Heights:
| Value | Viewport Height |
|-------|-----------------|
| mini | 25vh |
| medium | 50vh |
| prominent | 75vh |
| full | 100vh |

---

## PageHeading.vue - IMPLEMENTATION COMPLETE

### Three-Layer Merge Chain:
```typescript
const headerprops = computed(() => {
  const merged = Object.assign(
    {},
    apiResolvedConfig.value,     // Layer 1: Base → Subcategory → Project Override
    siteHeader.value,             // Legacy: headerConfigs prop (backwards compat)
    parsedFormatOptions.value,    // Entity: formatOptions JSON field
    props.headerSize ? { headerSize: props.headerSize } : {}  // Entity: DB column
  )
  return merged
})
```

### Display Logic:
```typescript
// Shows Hero for: banner, cover, bauchbinde (with image)
const showHero = computed(() =>
  headerprops.value.name !== 'simple' &&
  headerprops.value.name !== 'columns' &&
  (props.imgTmp || props.image_id || props.image_xmlid)
)

// Shows TextImage for: columns (with image) - TODO
const showTextImage = computed(() =>
  headerprops.value.name === 'columns' && props.imgTmp
)
```

---

## Next Actions - Execution Plan

### PHASE 3: PostPage.vue Validation (NOW)
**Goal:** Verify full flow works end-to-end

**Test Matrix:**
| Test | Expected Result | Status |
|------|----------------|--------|
| Banner post | Image aligned to top, medium height | ⏳ |
| Cover post | Image centered, prominent height | ⏳ |
| header_size='mini' | 25vh height | ⏳ |
| header_size='full' | 100vh height | ⏳ |
| /sites/:domaincode | Project override applies | ⏳ |

**Check PostPage.vue passes:**
- `headerType` from post entity
- `headerSize` from post entity  
- `image_id` for API-based image loading
- `formatOptions` for additional config

### PHASE 4: HeaderOptionsPanel.vue
**Goal:** Enable header_type/size selection in editing panels

**Create Component:**
```vue
<template>
  <div class="header-options-panel">
    <div class="form-group">
      <label>Header Type</label>
      <select v-model="localHeaderType" @change="emitChange">
        <option value="simple">Simple (no hero)</option>
        <option value="columns">Columns (side image)</option>
        <option value="banner">Banner (short hero)</option>
        <option value="cover">Cover (tall hero)</option>
        <option value="bauchbinde">Bauchbinde (text overlay)</option>
      </select>
    </div>
    
    <div class="form-group" v-if="showSizeOption">
      <label>Header Size</label>
      <select v-model="localHeaderSize" @change="emitChange">
        <option value="mini">Mini (25%)</option>
        <option value="medium">Medium (50%)</option>
        <option value="prominent">Prominent (75%)</option>
        <option value="full">Full (100%)</option>
      </select>
    </div>
  </div>
</template>
```

**Integration Points:**
1. EditPanel.vue - For posts
2. EventPanel.vue - For events
3. Wire changes to entity PATCH endpoints

### PHASE 5: TextImageHeader.vue
**Goal:** Columns layout with side-by-side image/text

**Implementation:**
1. Create from `src/disabled/TextImage.vue` base
2. Add half_* shape instance support (550×620 for half-width)
3. Wire into PageHeading.vue when `headerType='columns'`
4. Support left/right image placement

### PHASE 6: HeaderConfigsEditor Enhancement
**Goal:** Add domaincode preview for testing project overrides

**Add to existing editor:**
1. Text input for domaincode
2. "Preview as Project" button
3. Show resolved config with overrides
4. Highlight diff from central config

### PHASE 7: Full Panel Alignment
**Goal:** Complete formatOptions editing capability

**EditPanel.vue:**
- Enable header_type dropdown (currently exists but limited)
- Add header_size dropdown
- Optional: header_subtype for subcategories

**EventPanel.vue:**
- Remove `header_type: 'cover'` hardcode
- Add header selection UI

**PageConfigController.vue:**
- Add HeaderOptionsPanel integration
- Bridge to formatOptions JSON field
- Enable header customization for project pages

---

## Files to Modify (By Phase)

### Phase 3 (Validation):
- [ ] `src/views/PostPage.vue` - Check prop passing

### Phase 4 (HeaderOptionsPanel):
- [ ] `src/components/panels/HeaderOptionsPanel.vue` - Create
- [ ] `src/views/admin/EditPanel.vue` - Integrate
- [ ] `src/views/admin/EventPanel.vue` - Integrate

### Phase 5 (TextImageHeader):
- [ ] `src/components/TextImageHeader.vue` - Create
- [ ] `src/components/PageHeading.vue` - Wire columns condition

### Phase 6 (Admin Preview):
- [ ] `src/views/admin/sysregAdmin/HeaderConfigsEditor.vue` - Add domaincode

### Phase 7 (Panel Alignment):
- [ ] `src/views/admin/EditPanel.vue` - Full header options
- [ ] `src/views/admin/EventPanel.vue` - Remove hardcodes
- [ ] `src/views/admin/PageConfigController.vue` - formatOptions editing

---

## Resolved Questions

| Question | Decision |
|----------|----------|
| Cover vs Banner sizing? | Both use `background-size: cover`, differ in `background-position-y` |
| Hero instance generation? | Generate 1440×820 hero_wide_xl files, API builds URLs from xmlid |
| Three-layer merge order? | API config → siteHeader → formatOptions → props.headerSize |
| Where do project overrides apply? | Only on `/sites/:domaincode/*` routes |
| What is bauchbinde? | Text overlay band on image (uses Banner component with option) |

---

## API Endpoints (Complete)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/header-configs` | GET | List all central configs |
| `/api/header-configs` | POST | Create new config |
| `/api/header-configs/[id]` | GET | Get single config |
| `/api/header-configs/[id]` | PUT | Update config |
| `/api/header-configs/[id]` | DELETE | Delete config |
| `/api/header-configs/resolve` | GET | Resolve config for type/subtype/domaincode |
| `/api/header-configs/project/[domaincode]` | GET | List project overrides |
| `/api/header-configs/project/[domaincode]` | POST | Create/update project override |
