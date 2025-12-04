# ItemRow Heading Prefix - Test Specification

**Created:** 2025-11-14  
**Component:** ItemRow.vue  
**Feature:** Dynamic heading prefix for events with date formatting

## Overview

ItemRow now supports an optional `headingPrefix` prop and automatic date formatting via `dateBegin` prop. For events, this displays formatted dates (e.g., "FR 14.11 ") at the correct position in the heading based on the heading structure.

## Component Changes

### Props Added
- `headingPrefix?: string` - Optional prefix to inject into heading
- `dateBegin?: string` - ISO date string for events (auto-formats to "FR 14.11 " format)

### Logic Implemented
- `formatDatePrefix()` - Formats ISO date to German format: "DAY DD.MM "
- `computedHeading` - Injects prefix at correct position based on heading structure

### Heading Injection Rules
1. **Overline-Headline format** (`overline **headline**`): Prefix inserted at absolute beginning
2. **Headline-Subline format** (`**headline** subline`): Prefix inserted after second `**`
3. **Plain text** (no `**` markers): Prefix prepended

## Test Cases

### Unit Tests - Date Formatting

#### Test 1: Format Current Date
```typescript
describe('formatDatePrefix', () => {
  it('formats 2025-11-14 as "DO 14.11 " (Thursday)', () => {
    const result = formatDatePrefix('2025-11-14')
    expect(result).toBe('DO 14.11 ')
  })
  
  it('formats 2025-11-15 as "FR 15.11 " (Friday)', () => {
    const result = formatDatePrefix('2025-11-15')
    expect(result).toBe('FR 15.11 ')
  })
  
  it('formats 2025-12-25 as "DO 25.12 " (Christmas)', () => {
    const result = formatDatePrefix('2025-12-25')
    expect(result).toBe('DO 25.12 ')
  })
})
```

### Unit Tests - Heading Injection

#### Test 2: Overline-Headline Format
```typescript
describe('computedHeading - Overline format', () => {
  it('inserts prefix at beginning for overline format', () => {
    const heading = 'Theater am See **Hamlet**'
    const prefix = 'FR 14.11 '
    const expected = 'FR 14.11 Theater am See **Hamlet**'
    
    // Component with props
    const result = computedHeading({ heading, headingPrefix: prefix })
    expect(result).toBe(expected)
  })
})
```

#### Test 3: Headline-Subline Format
```typescript
describe('computedHeading - Subline format', () => {
  it('inserts prefix after second ** for headline-subline format', () => {
    const heading = '**Hamlet** Premiere am Theater'
    const prefix = 'FR 14.11 '
    const expected = '**Hamlet** FR 14.11 Premiere am Theater'
    
    const result = computedHeading({ heading, headingPrefix: prefix })
    expect(result).toBe(expected)
  })
})
```

#### Test 4: Plain Text Format
```typescript
describe('computedHeading - Plain text', () => {
  it('prepends prefix for plain text heading', () => {
    const heading = 'Hamlet Premiere'
    const prefix = 'FR 14.11 '
    const expected = 'FR 14.11 Hamlet Premiere'
    
    const result = computedHeading({ heading, headingPrefix: prefix })
    expect(result).toBe(expected)
  })
})
```

#### Test 5: Auto-format from dateBegin
```typescript
describe('computedHeading - Auto-format', () => {
  it('automatically formats dateBegin when no explicit prefix', () => {
    const heading = '**Hamlet** Premiere'
    const dateBegin = '2025-11-15'
    const expected = '**Hamlet** FR 15.11 Premiere'
    
    const result = computedHeading({ heading, dateBegin })
    expect(result).toBe(expected)
  })
  
  it('uses explicit headingPrefix over dateBegin', () => {
    const heading = '**Hamlet** Premiere'
    const headingPrefix = 'CUSTOM '
    const dateBegin = '2025-11-15'
    const expected = '**Hamlet** CUSTOM Premiere'
    
    const result = computedHeading({ heading, headingPrefix, dateBegin })
    expect(result).toBe(expected)
  })
})
```

### Integration Tests - ItemList with Events

#### Test 6: Events in ItemList Display Date Prefix
```typescript
describe('ItemList with events', () => {
  it('passes dateBegin to ItemRow for events', async () => {
    const wrapper = mount(ItemList, {
      props: {
        entity: 'events',
        dataMode: true,
        size: 'small'
      }
    })
    
    await wrapper.vm.fetchEntityData()
    
    const rowComponents = wrapper.findAllComponents(ItemRow)
    expect(rowComponents.length).toBeGreaterThan(0)
    
    // Check first event has date prefix
    const firstRow = rowComponents[0]
    expect(firstRow.props('dateBegin')).toBeDefined()
    expect(firstRow.props('heading')).toContain('**')
  })
})
```

### Visual Regression Tests

#### Test 7: Event List Display
**Setup:**
- Create ItemList with entity="events"
- Use real event data with date_begin values
- Size: small (triggers ItemRow)

**Verify:**
- [ ] Date prefixes appear in correct format (e.g., "FR 14.11 ")
- [ ] Prefix positioning respects overline/subline format
- [ ] Text wrapping works correctly with prefix
- [ ] No layout shifts or overflow issues

### Manual Testing Checklist

#### Events Display
- [ ] Navigate to `/sites/tp/events` or `/start` (events list)
- [ ] Verify each event shows formatted date prefix
- [ ] Check format matches: "DAY DD.MM " (e.g., "FR 14.11 ")
- [ ] Verify prefix position:
  - Overline format: prefix at start
  - Subline format: prefix after headline
- [ ] Test with different dates (past, today, future)
- [ ] Verify German day names: SO, MO, DI, MI, DO, FR, SA

#### Edge Cases
- [ ] Events without date_begin: No prefix shown
- [ ] Events with invalid dates: No prefix or error handling
- [ ] Very long headings: Prefix doesn't cause overflow
- [ ] Mobile responsive: Prefix visible and readable

### Performance Tests

#### Test 8: Date Formatting Performance
```typescript
describe('Performance', () => {
  it('formats 1000 dates in under 100ms', () => {
    const start = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      formatDatePrefix('2025-11-14')
    }
    
    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })
})
```

## ItemCard Tests (To Be Added)

### Spec Location
`/docs/tasks/2025-11-14_ITEMCARD_TESTS.md`

### Coverage Needed
- [ ] Anatomy variants (topimage, bottomimage, fullimage, heroimage)
- [ ] Image data handling (data prop vs cimg)
- [ ] Visual indicators (badge, checkbox, entity icon, marker)
- [ ] Selection states
- [ ] Size variants
- [ ] Deprecated cimg warning overlay
- [ ] CornerBanner integration
- [ ] Background fade overlay positioning

### Test Types
- Unit tests for computed properties
- Integration tests with ItemGallery
- Visual regression for all anatomy types
- Accessibility tests (ARIA labels, keyboard nav)

## Implementation Status

- [x] Props added to ItemRow
- [x] formatDatePrefix() implemented
- [x] computedHeading logic implemented
- [x] Template updated to use computedHeading
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Visual regression tests
- [ ] Manual testing completed
- [ ] ItemCard test spec created

## Notes

- Date format is hardcoded German for now (SO-SA day names)
- Future: Consider i18n for date formatting
- Prefix logic handles edge cases (missing markers, single marker)
- Performance: Date formatting is lightweight, no caching needed
