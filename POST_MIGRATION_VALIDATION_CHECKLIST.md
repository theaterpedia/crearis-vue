# Post-Migration Validation Checklist for Attached Components

## Critical Files to Test After Endpoint Updates

### 1. Composables (Core Logic)

#### ✅ useSysreg.ts
**What to verify:**
- [ ] `getStatus()` returns correct status info
- [ ] `getStatusLabelTranslated()` shows translated labels
- [ ] `getOptions()` for all tagfamilies works
- [ ] Bit operations (hasBit, setBit, etc.) still work
- [ ] No hardcoded column name references

**Test cases:**
```typescript
const sysreg = useSysreg()
const status = sysreg.getStatus('\\x01', 'posts')  // Should return status info
const label = sysreg.getStatusLabelTranslated('\\x01', 'posts', 'de')
const options = sysreg.getOptions('ttags')  // Should return array of options
```

#### ✅ useSysregAnalytics.ts
**What to verify:**
- [ ] Change all `e.status_val` → `e.status` (Line 112)
- [ ] Change all `e.ttags_val` → `e.ttags` (Lines 131, 246, 256)
- [ ] Change all `e.dtags_val` → `e.dtags` (Lines 159)
- [ ] Change all `e.rtags_val` → `e.rtags` (Lines 187)
- [ ] `fetchAnalytics()` returns correct data
- [ ] `statusDistribution` computed correctly
- [ ] `ttagsUsage`, `dtagsUsage`, `rtagsUsage` computed correctly

**Test cases:**
```typescript
const analytics = useSysregAnalytics('images')
await analytics.fetchAnalytics()
console.log(analytics.statusDistribution.value)  // Should show distribution
console.log(analytics.ttagsUsage.value)  // Should show tag usage
```

#### ✅ useSysregBatchOperations.ts
**What to verify:**
- [ ] No direct column references (works via API)
- [ ] `batchUpdateStatus()` completes successfully
- [ ] `batchAddTags()` works for ttags/dtags/rtags
- [ ] `batchRemoveTags()` works correctly
- [ ] Progress tracking updates correctly

**Test cases:**
```typescript
const batch = useSysregBatchOperations()
await batch.batchUpdateStatus('images', [1, 2, 3], '\\x02')
// Check progress.value updates correctly
```

#### ✅ useSysregBitGroups.ts
**What to verify:**
- [ ] No column references (works with metadata)
- [ ] `getBitGroupLabel()` returns translated labels
- [ ] `getBitGroupsWithLabels()` returns correct structure
- [ ] All bit group operations work

**Test cases:**
```typescript
const { getBitGroupLabel } = useSysregBitGroups()
const label = getBitGroupLabel('ctags', 'age_group', 'de')
```

#### ✅ useSysregOptions.ts
**What to verify:**
- [ ] No direct column references (loads from cache)
- [ ] `getOptions()` returns pre-translated labels
- [ ] Cache initialization works
- [ ] All tagfamilies load correctly

**Test cases:**
```typescript
const { getOptions } = useSysregOptions()
const statusOpts = getOptions('status').value
const ttagsOpts = getOptions('ttags').value
```

#### ✅ useSysregStatus.ts
**What to verify:**
- [ ] Change default `fieldName = 'status_val'` → `fieldName = 'status'`
- [ ] `bufferToHex()` still works
- [ ] `sanitizeStatusVal()` → rename to `sanitizeStatus()`?
- [ ] `getStatusInfo()` uses correct cache

**Test cases:**
```typescript
const { statusHex, prepareForSave } = useSysregStatus(formData, 'status')
const hex = bufferToHex(someBuffer)
```

#### ✅ useSysregSuggestions.ts
**What to verify:**
- [ ] Update interface: `project: { ttags_val, dtags_val }` → `{ ttags, dtags }`
- [ ] Update `currentTags` parameter interfaces
- [ ] `suggestFromProject()` works with new column names
- [ ] All suggestion functions return correct data

**Test cases:**
```typescript
const suggestions = useSysregSuggestions()
const projectSuggestions = suggestions.suggestFromProject({ 
  ttags: '\\x01', 
  dtags: '\\x02' 
})
```

#### ✅ useSysregTags.ts
**What to verify:**
- [ ] No column name dependencies (works with hex values)
- [ ] All bit operations work correctly
- [ ] `parseByteaHex()` still works
- [ ] `hasBit()`, `setBit()`, `clearBit()` work

**Test cases:**
```typescript
const bits = parseByteaHex('\\x06')
const has = hasBit('\\x06', 1)
const set = setBit('\\x00', 2)
```

#### ✅ useProjectStatus.ts
**What to verify:**
- [ ] Check for any `status_val` references
- [ ] Status transitions work correctly
- [ ] API calls use correct field names

---

### 2. Sysreg Components (UI Layer)

#### ✅ StatusBadge.vue
**What to verify:**
- [ ] Already uses `status` prop (not `status_val`) ✓
- [ ] Displays correct translated labels
- [ ] Color coding works correctly
- [ ] Click events work if enabled

**Manual test:**
```vue
<StatusBadge :value="'\\x01'" :label="'Draft'" />
<StatusBadge :status="'\\x02'" variant="solid" />
```

#### ✅ ImageStatusControls.vue
**What to verify:**
- [ ] Line 169: `props.image.status_val` → `props.image.status`
- [ ] Line 175: `props.image.config_val` → `props.image.config`
- [ ] All status transitions work
- [ ] Config bit toggles work
- [ ] Emitted updates have correct property names

**Manual test:**
- Load image in admin view
- Click "Start Processing" button
- Toggle config flags (public, featured, etc.)
- Verify updates in database

#### ✅ SysregSelect.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] Loads options correctly
- [ ] Emits correct values
- [ ] v-model binding works

**Manual test:**
```vue
<SysregSelect v-model="selectedStatus" tagfamily="status" label="Status" />
<SysregSelect v-model="selectedTopic" tagfamily="ttags" label="Topic" />
```

#### ✅ SysregMultiToggle.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] Works with hex values
- [ ] Multi-selection works
- [ ] Emits correct bit arrays

**Manual test:**
```vue
<SysregMultiToggle 
  v-model="topicTags" 
  tagfamily="ttags" 
  label="Topics" 
/>
```

#### ✅ SysregBitGroupSelect.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] CTags bit groups load correctly
- [ ] Selection works
- [ ] Emits correct values

**Manual test:**
```vue
<SysregBitGroupSelect 
  v-model="ageGroup" 
  bitGroup="age_group" 
  label="Age Group" 
/>
```

#### ✅ FilterChip.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] Displays correctly
- [ ] Toggle/remove events work
- [ ] Color variants work

**Manual test:**
```vue
<FilterChip label="Democracy" value="\\x01" variant="topic" />
```

#### ✅ SysregFilterSet.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] All filter types work
- [ ] Active chips display correctly
- [ ] Clear all works

**Manual test:**
- Apply various filters
- Check active filter chips
- Clear all filters
- Save/load filter sets

#### ✅ SysregTagDisplay.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] Displays tag selections
- [ ] Updates emit correctly
- [ ] All tag types work

---

### 3. Admin Views

#### ✅ SysregAdminView.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] Tab 1 (Viewer): Displays all tags correctly
- [ ] Tab 2 (Create): Tag creation works
- [ ] Tab 3 (Analytics): Shows correct statistics
- [ ] Tab 4 (Batch): Batch operations complete

**Manual test sequence:**
1. Open `/admin/sysreg`
2. **Viewer Tab:**
   - Switch between tagfamilies
   - Apply filters
   - Click edit on a tag
3. **Create Tab:**
   - Create a new tag
   - Edit existing tag
   - Try to delete non-default tag
4. **Analytics Tab:**
   - Verify status distribution chart
   - Check top tags lists
   - Click refresh button
5. **Batch Tab:**
   - Select entity and IDs
   - Try batch status update
   - Try batch tag add/remove
   - Verify progress updates

#### ✅ SysregDemo.vue
**What to verify:**
- [ ] No direct column references ✓
- [ ] All demo sections work
- [ ] Status select works
- [ ] Topic/domain toggles work
- [ ] CTags bit groups work
- [ ] Utility demos work

**Manual test:**
- Open `/admin/sysreg-demo`
- Test each section
- Verify output displays correct hex values

---

### 4. Plugin System

#### ✅ sysreg.ts (Plugin)
**What to verify:**
- [ ] Cache loads correctly
- [ ] `getSysregCache()` returns data
- [ ] Plugin initializes on app startup
- [ ] localStorage cache works

**Test:**
```typescript
// In browser console:
console.log($sysreg.cache)
console.log($sysreg.initialized)
```

---

## Testing Sequence

### Phase 1: Database Verification (Post-Migration)
```bash
# Run after migration 035 completes
psql -d crearis_admin_dev -c "\d images" | grep -E "tags"
psql -d crearis_admin_dev -c "\d posts" | grep -E "tags"
psql -d crearis_admin_dev -c "SELECT COUNT(*) FROM images WHERE ctags IS NOT NULL;"
```

### Phase 2: API Endpoint Testing
```bash
# Test sysreg API
curl http://localhost:3000/api/sysreg | jq '.[0]'

# Test images API
curl http://localhost:3000/api/images?project_id=1 | jq '.[0]'

# Test tasks API
curl http://localhost:3000/api/tasks | jq '.[0]'
```

### Phase 3: Composable Unit Tests
1. Open browser console at `http://localhost:3000`
2. Test each composable as shown in test cases above

### Phase 4: Component Integration Tests
1. Test SysregAdminView (all 4 tabs)
2. Test SysregDemo (all sections)
3. Test ImageStatusControls (status transitions)
4. Test filter components (selection, clear)

### Phase 5: Full Application Test
1. Login to admin
2. Navigate through all admin views
3. Create/edit posts, events, images
4. Apply filters in galleries
5. Run batch operations
6. Verify no console errors

---

## Success Criteria

✅ All composables load without errors  
✅ All components render correctly  
✅ No TypeScript type errors  
✅ No Vue template errors  
✅ API responses use new column names  
✅ Database queries complete successfully  
✅ Batch operations complete without errors  
✅ Analytics display correct data  
✅ Filter operations work correctly  
✅ Status transitions work correctly  

---

## Common Issues & Solutions

**Issue:** Type errors about missing properties
**Solution:** Update TypeScript interfaces to use new column names

**Issue:** API returns 500 error
**Solution:** Check server logs, likely SQL query using old column name

**Issue:** Component doesn't display data
**Solution:** Check if composable is fetching with correct field names

**Issue:** Batch operation fails
**Solution:** Verify API endpoint uses new column names in UPDATE query

**Issue:** Analytics shows 0 for all values
**Solution:** Check useSysregAnalytics line 112+ uses new column names

---

## Rollback Triggers

**Immediately rollback if:**
- Migration fails mid-execution
- Data loss detected
- More than 3 API endpoints broken
- Critical components non-functional
- Cannot complete login/auth flow

**Can fix forward if:**
- Single composable has issues
- Single component needs adjustment
- Documentation needs updates
- Minor type errors

