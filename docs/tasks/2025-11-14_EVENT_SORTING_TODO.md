# Event Sorting Implementation TODO

**Date:** 2025-11-14  
**Status:** Pending Implementation  
**Priority:** Medium

## Overview
Both ItemList and GalleryList components should automatically sort events by start date when `entity="events"`.

## Requirements

### ItemList Component
- When `props.entity === 'events'`, sort items by `date_begin` field (ascending - earliest first)
- Sort should happen after fetching data and before applying client-side filters
- Should handle null/undefined `date_begin` values (push to end)

### GalleryList Component
- Same sorting logic as ItemList
- When `props.entity === 'events'`, sort by `date_begin` ascending
- Handle null/undefined dates appropriately

## Implementation Notes

**Location in code:**
- ItemList: After `fetchEntityData()` completes, before `filteredAndSortedData` computed
- GalleryList: Similar location in data processing pipeline

**Sort logic:**
```typescript
if (props.entity === 'events') {
  entityData.value.sort((a, b) => {
    if (!a.date_begin) return 1
    if (!b.date_begin) return -1
    return new Date(a.date_begin).getTime() - new Date(b.date_begin).getTime()
  })
}
```

## Testing Checklist

### Unit Tests
- [ ] ItemList sorts events by date_begin ascending
- [ ] ItemList handles null date_begin (items at end)
- [ ] ItemList doesn't sort non-event entities
- [ ] GalleryList sorts events by date_begin ascending
- [ ] GalleryList handles null date_begin (items at end)
- [ ] GalleryList doesn't sort non-event entities

### Integration Tests
- [ ] StartPage events display in chronological order
- [ ] Events with same date maintain stable sort order
- [ ] Mixed status events still sort by date first

### Manual Testing
- [ ] Navigate to `/start` - verify events appear chronologically
- [ ] Check events with past dates appear first
- [ ] Check events without dates appear last
- [ ] Verify other entities (posts, instructors) are not affected

## Related Files
- `/src/components/clist/ItemList.vue`
- `/src/components/clist/GalleryList.vue` (if exists)
- `/src/views/Home/StartPage.vue` (test location)

## Dependencies
- Events must have `date_begin` field populated
- Database query returns date_begin in ISO format or parseable date string
