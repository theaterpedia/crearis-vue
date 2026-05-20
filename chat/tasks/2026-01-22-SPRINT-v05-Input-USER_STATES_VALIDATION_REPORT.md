# User States Validation Report

## Summary

This report validates user states against `sysreg_config` and identifies discrepancies in the codebase.

## Official User Status Values (from sysreg_config)

From Migration 041, user status follows the bit allocation:

| Status | Bit Value | Description |
|--------|-----------|-------------|
| NEW | 1 | Newly registered, needs verification |
| DEMO | 8 | Demo mode - testing/learning |
| DRAFT | 64 | Unverified/incomplete profile |
| CONFIRMED_USER | 1024 | Verified active user |
| RELEASED | 4096 | Fully published/active |
| ARCHIVED | 32768 | Inactive/archived |
| TRASH | 65536 | Marked for deletion |

## Mapping to InitialPrompt Onboarding Phases

The InitialPrompt defines 4 onboarding phases:
1. **Verification** (NEW → should advance to DEMO)
2. **Profile** (DEMO → should advance to DRAFT)
3. **Learn the basics** (DRAFT → should advance to REVIEW/CONFIRMED)
4. **Full access** (CONFIRMED → RELEASED)

### Discrepancy Found

The InitialPrompt mentions a **REVIEW** state that doesn't exist in the current status values. Options:
1. Use CONFIRMED_USER (1024) as the review state
2. Add a new REVIEW bit value

**Recommendation**: Map REVIEW to CONFIRMED_USER since it serves the same purpose (user verified, awaiting full activation).

## Hardcoded Status Logic in StartPage.vue

Location: `src/views/Home/StartPage.vue`

**Current Implementation**:
```typescript
type usermode = 'no' | 'guest' | 'user' | 'verified' | 'loggedin'
```

**Issues**:
1. These are NOT mapped to sysreg_config status values
2. `'no'` is not a valid status (undefined status)
3. Logic determines mode by checking if email exists, not user status

### Proposed Mapping

| Current Mode | Should Map To | Status Value |
|--------------|---------------|--------------|
| 'no' | No user | null (not in DB) |
| 'guest' | NEW | 1 |
| 'user' | DRAFT | 64 |
| 'verified' | CONFIRMED_USER | 1024 |
| 'loggedin' | RELEASED | 4096 |

## Code Analysis

### StartPage.vue Issues

1. **Line 367**: Uses prop-based usermode instead of querying user.status
   ```typescript
   const usermode = ref<'no' | 'guest' | 'user' | 'verified' | 'loggedin' | undefined>(props.usermode)
   ```

2. **Line 616-637**: Checks email existence, not user status
   ```typescript
   async function checkEmailExists(email: string) {
       // Only checks if user exists, not their status
       if (foundUser) {
           usermode.value = 'user' // Should be based on foundUser.status
       } else {
           usermode.value = 'guest'
       }
   }
   ```

### Proposed Fix

Replace hardcoded modes with status-based logic:

```typescript
import { STATUS } from '@/utils/status-constants'

// Map status value to mode
function statusToMode(status: number | null): 'no' | 'guest' | 'user' | 'verified' | 'loggedin' {
    if (status === null) return 'no'
    if (status === STATUS.NEW) return 'guest'
    if (status === STATUS.DEMO || status === STATUS.DRAFT) return 'user'
    if (status === STATUS.CONFIRMED_USER) return 'verified'
    if (status >= STATUS.RELEASED) return 'loggedin'
    return 'no'
}

// In checkEmailExists:
if (foundUser) {
    currentUser.value = foundUser
    usermode.value = statusToMode(foundUser.status)
}
```

## Recommendations

### Immediate Actions

1. **Create status constants file** (`src/utils/status-constants.ts`):
   ```typescript
   export const STATUS = {
       NEW: 1,
       DEMO: 8,
       DRAFT: 64,
       CONFIRMED: 512,
       CONFIRMED_USER: 1024,
       RELEASED: 4096,
       ARCHIVED: 32768,
       TRASH: 65536
   }
   ```

2. **Update StartPage.vue** to use status-based logic

3. **Add status helpers** to convert between modes and status values

### Next Steps

1. Validate that `undefined` user status is handled correctly (should be treated as NEW)
2. Create a `useUserStatus` composable that abstracts status checking
3. Update onboarding flow to use status transitions via sysreg_config

## Questions for Discussion

1. Should REVIEW be added as a distinct status, or mapped to CONFIRMED_USER?
2. How should "invited" users (mentioned in InitialPrompt) be handled?
3. Should status transitions be logged/audited?

---

*Generated: December 10, 2025*
