# Projectlogin Workflow - Locations Entity

**Sprint Target Implementation:** 0%  
**Focus:** Target state (planning phase)

---

## Target State (v0.2-v0.4)

### v0.2: Basic Status
- Status composable (`useLocationStatus`)
- Basic status display

### v0.3: External Presentation
- Location display in event pages
- Location maps integration

### v0.4: Extended Features
- Location reuse across events
- Location management view

---

## Status Configuration

### Applicable Statuses
Simplified status set:
- new, confirmed, archived, trash

### No Scope Toggles
Location visibility tied to containing event

---

## Composable: useLocationStatus

```typescript
// Target API
interface UseLocationStatus {
  currentStatus: ComputedRef<number>
  statusLabel: ComputedRef<string>
  isActive: ComputedRef<boolean>
  
  // Transitions
  toConfirmed(): Promise<void>
  toArchived(): Promise<void>
}
```

---

## Database Fields

### Status-Related Columns
- `status` (integer) - Location status

### Location Fields
- `name` - Location name
- `address` - Full address
- `coordinates` - Lat/lng for maps
- `description` - Additional details

---

## Related Components

- `LocationDisplay.vue` - Location info display
- `LocationPicker.vue` - Location selection
- `LocationMap.vue` - Map view

---

## Test Files

- `status.locations.spec.ts` - Status composable tests
- `common.locations.spec.ts` - General location tests

---

## Quick Links

- [Main Workflow Doc](./Projectlogin_Workflow.md)
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
