# PageHeading.vue & Hero.vue Integration Plan

**Date:** 2025-12-15  
**Status:** DECISIONS MADE - Ready for Implementation  
**Context:** Header configs system implemented, proceeding with component integration

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

## Decisions Made

### Q1: Fetch Strategy → ON-DEMAND WITH CACHING ✅
- `useHeaderConfig()` composable handles resolution
- 5-minute cache TTL
- Fallback to BASE_CONFIGS if API unavailable

### Q2.1: Migrations → COMPLETED ✅
- Migration 066: `header_size` column on posts/pages
- Migration 067: `header_configs` + `project_header_overrides` tables

### Q2.2: Hero.vue Alignment → IMPLEMENT NOW
- Fix `usesCoverSizing` to respect headerType's `imgTmpAlignX/Y`
- Banner type should use `center/top`, not forced `cover`

### Q2.3: TextImageHeader (Columns) → WAIT FOR HERO.VUE
- Create after Hero.vue is updated as reference implementation
- Will use shared `useHeaderImage` composable

### Q3.1/Q3.3: Header Configs Admin → COMPLETED ✅
- SysregAdmin has "Header Configs" tab
- Central configs + Project overrides mode
- Add demo page with domaincode input field for testing

### Q4: TextImageHeader.vue → AFTER HERO/PAGEHEADING
- Sister component to Hero.vue for columns layout
- Uses half_* shape instances for 50%-width images

### Q5: Override Scope → STRICT /sites ONLY
- Project overrides only apply on `/sites/:domaincode/*` routes
- Dashboard uses central configs

---

## Implementation Sequence

### Phase 1: Hero.vue Alignment (NOW)
**Goal:** Fix usesCoverSizing to respect Odoo banner alignment

```typescript
// BEFORE (always cover for new image system)
const usesCoverSizing = computed(() => {
  if (effectiveImageData.value) return true
  // ...
})

// AFTER (respect headerType config)
const usesCoverSizing = computed(() => {
  // Explicit cover alignment requested
  if (props.imgTmpAlignX === 'cover' || props.imgTmpAlignY === 'cover') return true
  // New image system BUT non-cover alignment configured
  if (effectiveImageData.value) {
    // Check if we should NOT use cover
    if (props.imgTmpAlignX !== 'cover' && props.imgTmpAlignY !== 'cover') {
      return false // Respect configured alignment (e.g., banner: center/top)
    }
    return true
  }
  // Legacy behavior for blur hash and imgTmp
  if (isBlurHashActive.value) return true
  return false
})
```

### Phase 2: PageHeading.vue Integration (AFTER HERO)
**Goal:** Use useHeaderConfig composable instead of hardcoded headerTypes[]

1. Import and use `useHeaderConfig()`
2. Replace hardcoded `headerTypes[]` lookup with API resolution
3. Keep merge chain: resolvedConfig → formatOptions → props.headerSize
4. Handle loading state (use cached/fallback while loading)

### Phase 3: PostPage.vue Validation
**Goal:** Test the full flow works end-to-end

1. Ensure PostPage passes all required props
2. Test header_type changes reflect in Hero sizing
3. Test header_size entity override works
4. Verify /sites/:domaincode route applies project overrides

### Phase 4: TextImageHeader.vue (AFTER VALIDATION)
**Goal:** Sister component for columns layout

1. Create from disabled/TextImage.vue base
2. Add useHeaderImage composable (shared with Hero)
3. Add half_* shape instance support
4. Wire into PageHeading.vue showTextImage condition

### Phase 5: Demo Page with Domaincode Input
**Goal:** Add testing capability to Header Configs admin

1. Add text input for domaincode in HeaderConfigsEditor
2. Allow previewing resolved configs for any project
3. Show diff between central and project-overridden values

### Phase 6: Panel Alignment (FUTURE)
**Goal:** Enable formatOptions editing via panels

Components to update:
- EditPanel.vue - Enable header_type dropdown, add header_size
- EventPanel.vue - Remove hardcoded header_type: 'cover'
- PageConfigController.vue - Add header config editing
- HeaderOptionsPanel.vue - Expose header_type/size/subtype

---

## Files to Modify (Ordered)

### Phase 1: Hero.vue
- [ ] Fix `usesCoverSizing` computed
- [ ] Test banner type uses center/top alignment

### Phase 2: PageHeading.vue  
- [ ] Import `useHeaderConfig` composable
- [ ] Replace `headerTypes[]` lookup with `resolvedConfig`
- [ ] Update `headerprops` merge chain
- [ ] Handle loading state gracefully

### Phase 3: PostPage.vue (Validation Only)
- [ ] Test header_type: 'banner' shows correct alignment
- [ ] Test header_type: 'cover' shows cover alignment
- [ ] Test header_size override works

### Phase 4: TextImageHeader.vue (New)
- [ ] Create from TextImage.vue template
- [ ] Add shape instance support
- [ ] Wire into PageHeading.vue

### Phase 5: HeaderConfigsEditor.vue
- [ ] Add domaincode preview input
- [ ] Show resolved config preview

---

## Final Questions Before Implementation

**None remaining - all decisions made. Ready to implement.**

---

## Next Actions (After Core Components)

Once Hero.vue, PageHeading.vue, TextImageHeader.vue are aligned with Odoo:

1. **EditPanel.vue**
   - Enable header_type dropdown (fix values: simple, columns, banner, cover, bauchbinde)
   - Add header_size dropdown
   - Optional: header_subtype for power users

2. **EventPanel.vue**
   - Remove `header_type: 'cover'` hardcode
   - Add header_type selection

3. **PageConfigController.vue**
   - Add HeaderOptionsPanel integration
   - Expose header config editing for project pages
   - Bridge to formatOptions JSON field

4. **HeaderOptionsPanel.vue** (may need creation)
   - header_type dropdown with Odoo values
   - header_size dropdown
   - header_subtype dropdown (subcategories)
   - Visual preview of selected config
