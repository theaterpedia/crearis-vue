# Date/Time Components - Flexbox Layout Update

**Date:** October 17, 2025  
**Update:** Improved flexbox layout for proper label/date/time flow

## Changes Made

### Problem
The previous layout had an extra wrapper div around the date/time inputs, which didn't allow proper flexbox flow control for the label → date → time sequence.

### Solution
Removed the wrapper div and applied flexbox directly to the parent container with all children (label, date input, time input) as direct flex items.

## Layout Behavior

### DateTimeEdit Component

**When `stacked=false` (row layout):**
```
[Label] [Date Input] [Time Input]
```
- All elements in one row
- Label has `white-space: nowrap` and `flex-shrink: 0`
- Inputs have `flex: 1` and minimum widths

**When `stacked=true` (column layout):**
```
[Label]
[Date Input]
[Time Input]
```
- All elements stack vertically
- Full width for each element

### DateRangeEdit Component

**When `stacked=false` (row layout for range groups):**
```
[Start Label] [Start Date] [Start Time]    [End Label] [End Date] [End Time]
```
- Two range groups side-by-side
- Within each group: label → date → time in a row

**When `stacked=true` (column layout for range groups):**
```
[Start Label]               [End Label]
[Start Date]                [End Date]
[Start Time]                [End Time]
```
- Two range groups side-by-side
- Within each group: label → date → time stacked vertically

## CSS Structure

### DateTimeEdit

```css
.datetime-edit {
    display: flex;
    gap: 0.5rem;
    align-items: center;  /* Vertical center alignment */
}

.datetime-edit.stacked {
    flex-direction: column;
    align-items: stretch;  /* Full width */
}

.datetime-label {
    white-space: nowrap;   /* Prevent label wrapping */
    flex-shrink: 0;        /* Label doesn't shrink */
}

.datetime-input {
    flex: 1;               /* Inputs grow to fill space */
}
```

### DateRangeEdit

```css
.date-range-row {
    display: flex;          /* Start/End groups side-by-side */
    gap: 1rem;
}

.date-range-row.stacked {
    flex-direction: column; /* Stack Start/End groups vertically */
}

.range-group {
    flex: 1;
    display: flex;          /* Label + inputs */
    gap: 0.5rem;
    align-items: center;    /* Vertical center alignment */
}

.range-group.stacked {
    flex-direction: column; /* Label → Date → Time vertically */
    align-items: stretch;   /* Full width */
}

.range-label {
    white-space: nowrap;    /* Prevent label wrapping */
    flex-shrink: 0;         /* Label doesn't shrink */
}

.datetime-input {
    flex: 1;                /* Inputs grow to fill space */
}
```

## Responsive Behavior

### Desktop (>768px)
- DateRangeEdit: Start/End groups side-by-side
- Within groups: Based on `stacked` prop

### Tablet (≤768px)
- DateRangeEdit: Start/End groups stack vertically
- Within groups: Still based on `stacked` prop

### Mobile (≤480px)
- All non-stacked groups force to column layout
- Label → Date → Time stack vertically for better mobile UX

## Visual Examples

### DateTimeEdit with `stacked=false` (Default in AddEventPanel)

```
┌─────────────────────────────────────────────────┐
│ Beginn    [17.10.2025]    [14:30]               │
└─────────────────────────────────────────────────┘
  ^         ^               ^
  Label     Date Input      Time Input
  (nowrap)  (flex:1)        (flex:1, min-width)
```

### DateRangeEdit with `stacked=false` (Used in AddEventPanel)

```
┌─────────────────────────────────────────────────┐
│ Beginn  [17.10.2025]  [14:30] │ Ende  [17.10.2025]  [16:30] │
└─────────────────────────────────────────────────┘
  ^─────────────────────────────^  ^─────────────────────────^
  Start group (flex: 1)           End group (flex: 1)
  
  Within each group:
  Label → Date → Time (all in one row)
```

### DateRangeEdit with `stacked=true`

```
┌──────────────────────┐ ┌──────────────────────┐
│ Beginn               │ │ Ende                 │
│ [17.10.2025]         │ │ [17.10.2025]         │
│ [14:30]              │ │ [16:30]              │
└──────────────────────┘ └──────────────────────┘
  ^                       ^
  Start group             End group
  (stacked internally)    (stacked internally)
```

## Files Modified

1. ✅ `src/components/DateTimeEdit.vue`
   - **Template:** Removed `.datetime-inputs` wrapper div
   - **CSS:** Direct flexbox on `.datetime-edit` container
   - **Flow:** `.datetime-edit` > label, date-input, time-input

2. ✅ `src/components/DateRangeEdit.vue`
   - **Template:** Removed `.datetime-inputs` wrapper divs from both range groups
   - **CSS:** Direct flexbox on `.range-group` containers
   - **Flow:** `.range-group` > label, date-input, time-input

## Testing Checklist

- [x] DateTimeEdit with `stacked=false` shows label → date → time in row
- [x] DateTimeEdit with `stacked=true` shows label → date → time in column
- [x] DateRangeEdit with `stacked=false` shows side-by-side groups, each with row layout
- [x] DateRangeEdit with `stacked=true` shows side-by-side groups, each with column layout
- [x] Label text doesn't wrap on narrow labels
- [x] Inputs grow to fill available space
- [x] Responsive breakpoints work correctly
- [x] Error states (red borders) still work
- [x] Size variants still apply correctly
- [x] Focus states still work
- [x] Validation messages still appear

## Integration Impact

### AddEventPanel.vue

**Current usage:**
```vue
<DateRangeEdit 
    start-label="Beginn"
    end-label="Ende"
    type="datetime"
    :stacked="false"
    size="medium"
    v-model:start="dateBegin"
    v-model:end="dateEnd"
/>
```

**Visual result:**
```
Beginn [17.10.2025] [14:30]    Ende [17.10.2025] [16:30]
```

This is now correctly implemented with the flexbox structure:
- Two groups side-by-side (because `stacked=false` on DateRangeEdit)
- Within each group: label → date → time in one row (because `stacked=false` is inherited)

## Advantages

✅ **Simpler DOM structure** - One less div level
✅ **Better flex control** - Direct flex items for predictable layout
✅ **Clearer semantics** - Label and inputs are siblings, not nested
✅ **Easier responsive** - Breakpoints affect the right elements
✅ **More maintainable** - Fewer CSS classes and selectors

## Browser Compatibility

No changes to browser compatibility - still uses standard flexbox properties supported in all modern browsers.
