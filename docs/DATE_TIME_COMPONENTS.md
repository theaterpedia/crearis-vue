# Date/Time Components Documentation

## Overview

Two reusable Vue components for handling date and time inputs with German formatting and validation.

**Created:** October 17, 2025  
**Location:** `src/components/`

## Components

### 1. DateTimeEdit.vue

Single date/time input with flexible configuration.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Optional label text above input(s) |
| `type` | `'date' \| 'time' \| 'datetime'` | `'datetime'` | Input type - controls which fields are shown |
| `stacked` | `boolean` | `true` | If true, date and time inputs stack vertically; if false, side-by-side |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size variant |
| `modelValue` | `string` | `''` | V-model binding for the date/time value |

#### Events

- `update:modelValue`: Emitted when value changes (ISO format: `YYYY-MM-DDTHH:mm`)

#### Usage Examples

```vue
<!-- DateTime (date + time, stacked) -->
<DateTimeEdit 
    label="Event Start"
    type="datetime"
    v-model="startDateTime"
/>

<!-- Date only -->
<DateTimeEdit 
    label="Birth Date"
    type="date"
    size="medium"
    v-model="birthDate"
/>

<!-- Time only -->
<DateTimeEdit 
    label="Start Time"
    type="time"
    v-model="startTime"
/>

<!-- Date + time side-by-side -->
<DateTimeEdit 
    label="Appointment"
    type="datetime"
    :stacked="false"
    v-model="appointment"
/>
```

#### Format Handling

**Input formats supported:**
- ISO datetime: `2025-10-17T14:30`
- Date only: `2025-10-17`
- Time only: `14:30`
- JavaScript Date objects (parsed)

**Output format:**
- `type="datetime"`: `YYYY-MM-DDTHH:mm` (ISO format)
- `type="date"`: `YYYY-MM-DD`
- `type="time"`: `HH:mm`

**Default values:**
- When date is missing and time is entered: Uses today's date
- When time is missing and date is entered: Uses `09:00` as default time

### 2. DateRangeEdit.vue

Date/time range input with start and end values, including validation.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `startLabel` | `string` | `'Beginn'` | Label for start date/time |
| `endLabel` | `string` | `'Ende'` | Label for end date/time |
| `type` | `'date' \| 'time' \| 'datetime'` | `'datetime'` | Input type - controls which fields are shown |
| `stacked` | `boolean` | `true` | If true, start/end groups stack vertically; if false, side-by-side |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size variant |
| `start` | `string` | `''` | Start date/time value |
| `end` | `string` | `''` | End date/time value |

#### Events

- `update:start`: Emitted when start value changes
- `update:end`: Emitted when end value changes

#### Validation

**Built-in validation:**
- End date/time must be after start date/time
- Visual error indicators (red border on inputs)
- Error message displayed below inputs
- Real-time validation on value changes

**Error messages (German):**
- DateTime/Date: "Das Enddatum muss nach dem Beginndatum liegen"
- Time: "Die Endzeit muss nach der Beginnzeit liegen"

#### Usage Examples

```vue
<!-- DateTime range (side-by-side groups) -->
<DateRangeEdit 
    start-label="Beginn"
    end-label="Ende"
    type="datetime"
    :stacked="false"
    size="medium"
    v-model:start="dateBegin"
    v-model:end="dateEnd"
/>

<!-- Date range (no time) -->
<DateRangeEdit 
    start-label="Von"
    end-label="Bis"
    type="date"
    v-model:start="fromDate"
    v-model:end="toDate"
/>

<!-- Time range (stacked) -->
<DateRangeEdit 
    start-label="Öffnung"
    end-label="Schließung"
    type="time"
    :stacked="true"
    v-model:start="openTime"
    v-model:end="closeTime"
/>

<!-- Large size variant -->
<DateRangeEdit 
    type="datetime"
    size="large"
    v-model:start="eventStart"
    v-model:end="eventEnd"
/>
```

#### Format Handling

Same as DateTimeEdit component. Both start and end values follow the same format rules.

## Implementation in AddEventPanel

**Replaced:** Manual datetime-local inputs  
**With:** DateRangeEdit component

```vue
<!-- Before -->
<div class="form-row">
    <div class="form-group">
        <label class="form-label">Beginn</label>
        <input v-model="dateBegin" type="datetime-local" class="form-input" required />
    </div>
    <div class="form-group">
        <label class="form-label">Ende</label>
        <input v-model="dateEnd" type="datetime-local" class="form-input" required />
    </div>
</div>

<!-- After -->
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

**Benefits:**
- ✅ Automatic validation with user feedback
- ✅ Consistent styling across application
- ✅ Reusable in other forms
- ✅ German date/time formatting
- ✅ Responsive design (stacks on mobile)
- ✅ Visual error indicators

## Technical Details

### Browser Compatibility

Uses HTML5 `<input type="date">` and `<input type="time">`:
- Native date/time pickers on modern browsers
- German locale formatting (DD.MM.YYYY, HH:mm)
- 24-hour time format (no AM/PM)

### Styling

**CSS Variables used:**
- `--color-text`: Text color
- `--color-background`: Input background
- `--color-border`: Input border
- `--color-border-hover`: Hover state border
- `--color-primary`: Focus ring color

**Size variants:**
- `small`: 0.375rem padding, 0.8125rem font
- `medium`: 0.5rem padding, 0.875rem font (default, matches current forms)
- `large`: 0.625rem padding, 1rem font

**Responsive breakpoints:**
- `768px`: Stacks date range groups on tablets
- `480px`: Stacks date/time inputs on phones

### Accessibility

- ✅ Proper label associations
- ✅ Focus indicators (blue ring)
- ✅ Error states (red border, error message)
- ✅ Keyboard navigation support
- ✅ Native browser controls (accessible date/time pickers)

## Testing Checklist

- [ ] Date input updates modelValue correctly
- [ ] Time input updates modelValue correctly
- [ ] Combined datetime produces correct ISO format
- [ ] Start/end validation triggers on invalid range
- [ ] Error message displays in German
- [ ] Inputs show red border on validation error
- [ ] Side-by-side layout works on desktop
- [ ] Stacked layout works on mobile
- [ ] Size variants render correctly
- [ ] Default values populate when template selected
- [ ] Form resets dates on cancel
- [ ] Dates save correctly to database
- [ ] Component integrates with existing form styling

## Future Enhancements

**Potential improvements:**
- [ ] Custom date picker overlay (more control over styling)
- [ ] Time zone support
- [ ] Recurring event patterns
- [ ] Duration calculation/display
- [ ] Quick presets (today, tomorrow, next week)
- [ ] Calendar view integration
- [ ] Min/max date constraints
- [ ] Disabled date ranges
- [ ] Custom validation rules prop
- [ ] i18n support for multiple languages

## Files Modified

1. **Created:**
   - `src/components/DateTimeEdit.vue` - Single date/time input component
   - `src/components/DateRangeEdit.vue` - Date range input component
   - `docs/DATE_TIME_COMPONENTS.md` - This documentation

2. **Modified:**
   - `src/components/AddEventPanel.vue`:
     - Replaced manual datetime-local inputs with DateRangeEdit
     - Added import for DateRangeEdit component
     - Kept validation logic in handleApply for extra safety
     - Removed custom `.form-row` CSS (now in component)

## Related Documentation

- [Events Dropdown Component](./EVENTS_DROPDOWN_COMPONENT.md)
- [Locations Dropdown Component](./LOCATIONS_DROPDOWN_COMPONENT.md)
- [Add Event Panel Integration](./core/PROJECTS_CRUD_COMPLETE.md)
