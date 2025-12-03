# Remove Subtitle Field - October 16, 2025

## Changes Made

Removed the subtitle field (`rectitle` for events, `subtitle` for posts) from both display and edit forms in BaseView and DemoView.

## Files Modified

### Frontend Changes

#### 1. `/src/views/BaseView.vue`

**Removed from Display (Left Column):**
- ✅ Event dropdown selector - removed `event.rectitle` display
- ✅ Hero section - removed `currentEvent.rectitle` line
- ✅ Post cards - removed `post.subtitle` line

**Removed from Edit Forms (Right Column):**
- ✅ Event form - removed "Untertitel" input field for `entityForm.rectitle`
- ✅ Post form - removed "Untertitel" input field for `entityForm.subtitle`

**Before (Hero Section):**
```vue
<div class="hero-content">
    <h2>{{ currentEvent.name }}</h2>
    <p v-if="currentEvent.rectitle" class="hero-subtitle">{{ currentEvent.rectitle }}</p>
    <p v-if="currentEvent.teaser" class="hero-teaser">{{ currentEvent.teaser }}</p>
    ...
</div>
```

**After:**
```vue
<div class="hero-content">
    <h2>{{ currentEvent.name }}</h2>
    <p v-if="currentEvent.teaser" class="hero-teaser">{{ currentEvent.teaser }}</p>
    ...
</div>
```

**Before (Event Form):**
```vue
<div class="form-group">
    <label>Name</label>
    <input type="text" v-model="entityForm.name" @input="markAsEdited" />
</div>
<div class="form-group">
    <label>Untertitel</label>
    <input type="text" v-model="entityForm.rectitle" @input="markAsEdited" />
</div>
<div class="form-group">
    <label>Teaser</label>
    <textarea v-model="entityForm.teaser" rows="3" @input="markAsEdited"></textarea>
</div>
```

**After:**
```vue
<div class="form-group">
    <label>Name</label>
    <input type="text" v-model="entityForm.name" @input="markAsEdited" />
</div>
<div class="form-group">
    <label>Teaser</label>
    <textarea v-model="entityForm.teaser" rows="3" @input="markAsEdited"></textarea>
</div>
```

#### 2. `/src/views/demo.vue`

**Removed from Display:**
- ✅ Event dropdown selector - removed `event.rectitle` display
- ✅ Hero section - removed `currentEvent.rectitle` line
- ✅ Post cards - removed `post.subtitle` line

Same pattern as BaseView, but demo.vue is read-only (no edit forms).

### Backend Changes

#### 3. `/server/api/demo/events/[id].put.ts`

Removed `rectitle` from UPDATE statement:

**Before:**
```typescript
UPDATE events SET 
    name = ?,
    rectitle = ?,
    teaser = ?,
    date_begin = ?,
    date_end = ?,
    cimg = ?
WHERE id = ?
```

**After:**
```typescript
UPDATE events SET 
    name = ?,
    teaser = ?,
    date_begin = ?,
    date_end = ?,
    cimg = ?
WHERE id = ?
```

#### 4. `/server/api/demo/posts/[id].put.ts`

Removed `subtitle` from UPDATE statement:

**Before:**
```typescript
UPDATE posts SET 
    name = ?,
    subtitle = ?,
    teaser = ?,
    cimg = ?
WHERE id = ?
```

**After:**
```typescript
UPDATE posts SET 
    name = ?,
    teaser = ?,
    cimg = ?
WHERE id = ?
```

## Database Schema

**Note:** The database columns (`rectitle` for events, `subtitle` for posts) still exist in the schema. They are simply not displayed or editable through the UI anymore.

If you want to completely remove these columns from the database, you would need to create a new migration:

```typescript
// Migration: Remove subtitle columns
await db.run('ALTER TABLE events DROP COLUMN rectitle')
await db.run('ALTER TABLE posts DROP COLUMN subtitle')
```

However, it's generally safer to keep the columns in the database (they won't cause any issues) in case you need them in the future.

## UI Impact

### Before
**Event Dropdown:**
```
Forum-Theater
Konflikte im Alltag  ← subtitle was here
```

**Hero Section:**
```
Forum-Theater
Konflikte im Alltag  ← subtitle was here
Eine intensive Auseinandersetzung mit...
```

**Edit Form:**
```
Name: [Forum-Theater]
Untertitel: [Konflikte im Alltag]  ← field removed
Teaser: [Eine intensive...]
```

### After
**Event Dropdown:**
```
Forum-Theater
```

**Hero Section:**
```
Forum-Theater
Eine intensive Auseinandersetzung mit...
```

**Edit Form:**
```
Name: [Forum-Theater]
Teaser: [Eine intensive...]
```

## CSS Classes Still Present

The following CSS classes are still defined but unused (safe to remove later if desired):
- `.hero-subtitle`
- `.entity-subtitle`
- `.event-option-desc`

These don't affect functionality but could be cleaned up in a future refactoring.

## Testing

### Test Scenario 1: View Mode
1. ✅ Load BaseView in view mode (CSV)
2. ✅ Check event dropdown - no subtitle shown
3. ✅ Check hero section - no subtitle shown
4. ✅ Check post cards - no subtitle shown

### Test Scenario 2: Edit Mode
1. ✅ Switch to edit/create mode
2. ✅ Activate event - form has Name, Teaser (no Untertitel)
3. ✅ Edit and save event - works without subtitle field
4. ✅ Activate post - form has Titel, Teaser (no Untertitel)
5. ✅ Edit and save post - works without subtitle field

### Test Scenario 3: Demo View
1. ✅ Load demo.vue route (`/demo`)
2. ✅ Check event dropdown - no subtitle shown
3. ✅ Check hero section - no subtitle shown
4. ✅ Check post cards - no subtitle shown

## Status
✅ **COMPLETE** - Subtitle fields removed from all displays and forms.

## Notes
- Database columns still exist but are not used
- Existing subtitle data in database is preserved
- Can be re-enabled in future if needed by reverting these changes
- No migration needed since we're only hiding the fields, not removing them
