# TDD Recovery Plan

## Current Situation

As of December 10, 2025, significant new functionality has been implemented without corresponding test coverage. This document outlines a plan to restore Test-Driven Development practices.

---

## Test Infrastructure Status

### Existing Test Setup

```
vitest.config.ts          ✅ Configured
tests/                    ✅ Directory exists
test-results/             ✅ Output directory
```

### Last Known Good State

Testing was comprehensive until **Thursday, December 5, 2025**. Since then:
- Multiple new components created
- Route architecture refactored
- New interaction patterns added

---

## Priority 1: Critical Path Tests

These tests cover functionality that affects user experience directly.

### 1.1 Route Navigation Tests

**File**: `tests/unit/router.spec.ts`

```typescript
describe('Project Routes', () => {
    it('redirects /projects/:id to /projects/:id/home')
    it('extracts projectId from route params')
    it('maps section to correct NavStop')
    it('requires auth for protected routes')
})

describe('Event Routes', () => {
    it('loads EventPage for /sites/:domaincode/events/:id')
    it('passes domaincode and id as props')
})
```

### 1.2 pList Interaction Tests

**File**: `tests/unit/components/pList.spec.ts`

```typescript
describe('pList activation modes', () => {
    it('opens modal when onActivate="modal"')
    it('navigates when onActivate="route"')
    it('shows modal with button when onActivate="route-modal"')
})

describe('pList trash functionality', () => {
    it('shows trash icon when showTrash=true')
    it('emits item-trash when trash clicked')
    it('does not show trash when showTrash=false')
})
```

### 1.3 ItemList/ItemTile/ItemRow Tests

**File**: `tests/unit/components/clist/ItemList.spec.ts`

```typescript
describe('ItemList trash option', () => {
    it('passes trash=true to item options when showTrash')
    it('emits item-trash with item data')
})

describe('ItemTile trash icon', () => {
    it('renders trash icon when options.trash=true')
    it('emits trash event on click')
    it('stops propagation (no item-click)')
})
```

---

## Priority 2: Business Logic Tests

### 2.1 Status Constants

**File**: `tests/unit/utils/status-constants.spec.ts`

```typescript
describe('STATUS values', () => {
    it('NEW equals 1')
    it('DEMO equals 8')
    it('DRAFT equals 64')
    // ... all values
})

describe('statusToUsermode', () => {
    it('maps null to "no"')
    it('maps NEW to "guest"')
    it('maps DRAFT to "user"')
    it('maps CONFIRMED_USER to "verified"')
    it('maps RELEASED to "loggedin"')
})

describe('usermodeToStatus', () => {
    it('maps "no" to null')
    it('maps "guest" to NEW')
    // ... inverse mappings
})
```

### 2.2 Onboarding Configuration

**File**: `tests/unit/utils/onboarding-config.spec.ts`

```typescript
describe('ONBOARDING_STEPS', () => {
    it('has 5 steps defined')
    it('each step has required properties')
    it('steps are in correct status order')
})

describe('getCurrentOnboardingStep', () => {
    it('returns first step for new user')
    it('returns correct step based on user.status')
    it('returns null for completed users')
})

describe('canAdvanceToNextStep', () => {
    it('returns false when requirements incomplete')
    it('returns true when all requirements met')
})

describe('requirement checks', () => {
    it('email-verified checks user.email_verified')
    it('partner-linked checks user.partner_id')
    it('avatar-uploaded checks user.img_id')
})
```

---

## Priority 3: Component Integration Tests

### 3.1 ProjectDashboard

**File**: `tests/unit/views/ProjectDashboard.spec.ts`

```typescript
describe('ProjectDashboard', () => {
    it('extracts projectId from route')
    it('determines section from route path')
    it('defaults to home section')
    it('passes props to DashboardLayout')
})
```

### 3.2 DashboardLayout NavStops

**File**: `tests/unit/components/DashboardLayout.spec.ts`

```typescript
describe('DashboardLayout NavStops', () => {
    it('renders 5 NavStop tabs')
    it('shows home view for home NavStop')
    it('shows entity view for agenda/topics/partners')
    it('shows settings view for settings NavStop')
    it('integrates ProjectSettingsPanel in settings')
})
```

### 3.3 ProjectSettingsPanel

**File**: `tests/unit/components/ProjectSettingsPanel.spec.ts`

```typescript
describe('ProjectSettingsPanel', () => {
    it('renders 4 collapsible sections')
    it('expands theme section by default')
    it('toggles section on header click')
    it('shows activation section for owners only')
    it('emits activate-project on button click')
})
```

### 3.4 OnboardingStepper

**File**: `tests/unit/components/OnboardingStepper.spec.ts`

```typescript
describe('OnboardingStepper', () => {
    it('shows current step as active')
    it('shows completed steps with checkmark')
    it('dims upcoming steps')
    it('displays requirements for current step')
    it('enables advance button when requirements met')
    it('emits advance event with status values')
})
```

---

## Priority 4: API/Integration Tests

### 4.1 Event API

**File**: `tests/integration/events-api.spec.ts`

```typescript
describe('Events API', () => {
    it('GET /api/events/:id returns event data')
    it('PUT /api/events/:id updates event')
    it('includes date_begin, date_end fields')
})
```

### 4.2 Demo Project Script

**File**: `tests/integration/setup-demo-project.spec.ts`

```typescript
describe('setup-demo-project', () => {
    it('creates demo project if not exists')
    it('creates demo events')
    it('creates demo posts')
    it('reset clears and recreates entities')
})
```

---

## Implementation Schedule

### Week 1: Foundation (Days 1-3)

| Day | Focus | Tests |
|-----|-------|-------|
| 1 | Status constants, onboarding config | 2.1, 2.2 |
| 2 | pList modes and trash | 1.2, 1.3 |
| 3 | Router tests | 1.1 |

### Week 2: Components (Days 4-7)

| Day | Focus | Tests |
|-----|-------|-------|
| 4 | ProjectDashboard, DashboardLayout | 3.1, 3.2 |
| 5 | ProjectSettingsPanel | 3.3 |
| 6 | OnboardingStepper | 3.4 |
| 7 | Integration tests | 4.1, 4.2 |

---

## Test Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/unit/utils/status-constants.spec.ts

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run only changed tests
pnpm test --changed
```

---

## Coverage Goals

| Area | Current | Target |
|------|---------|--------|
| `src/utils/` | 0% | 90% |
| `src/components/clist/` | ~60% | 80% |
| `src/components/dashboard/` | 0% | 70% |
| `src/components/onboarding/` | 0% | 80% |
| `src/views/project/` | ~40% | 70% |
| Router | ~50% | 80% |

---

## Test Writing Guidelines

### 1. Follow AAA Pattern

```typescript
it('should emit item-trash when trash icon clicked', async () => {
    // Arrange
    const wrapper = mount(ItemTile, {
        props: { options: { trash: true } }
    })
    
    // Act
    await wrapper.find('.trash-icon').trigger('click')
    
    // Assert
    expect(wrapper.emitted('trash')).toBeTruthy()
})
```

### 2. Mock External Dependencies

```typescript
vi.mock('vue-router', () => ({
    useRouter: () => ({ push: vi.fn() }),
    useRoute: () => ({ params: { projectId: 'test' } })
}))
```

### 3. Test Edge Cases

```typescript
describe('edge cases', () => {
    it('handles null user gracefully')
    it('handles undefined status')
    it('handles empty requirements array')
})
```

### 4. Use Data-Driven Tests

```typescript
const statusMappings = [
    { status: null, expected: 'no' },
    { status: 1, expected: 'guest' },
    { status: 64, expected: 'user' },
]

statusMappings.forEach(({ status, expected }) => {
    it(`maps status ${status} to "${expected}"`, () => {
        expect(statusToUsermode(status)).toBe(expected)
    })
})
```

---

## Quick Wins

These tests can be written immediately with minimal setup:

1. **status-constants.ts** - Pure functions, no dependencies
2. **onboarding-config.ts** - Pure functions with mock user objects
3. **ItemOptions type** - Type checking tests
4. **Route definitions** - Static route array validation

---

## Blockers & Dependencies

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Missing test utils | Component mounting | Create test helpers |
| API mocking | Integration tests | Setup MSW or similar |
| Auth state | Protected routes | Mock useAuth composable |

---

*Created: December 10, 2025*
*Target Completion: End of Sprint (v0.5)*
