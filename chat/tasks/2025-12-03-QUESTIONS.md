# Questions for Tomorrow: December 3, 2025

> Pre-work questions to clarify before continuing sprint implementation.
> Please answer these based on alpha-prod testing results.

---

## 1. Alpha-Prod Test Results

### Q1.1: Did the 4 use cases work as expected?

| Use Case | Status | Notes |
|----------|--------|-------|
| A: Member sees new/demo posts | ⬜ | |
| B: Participant doesn't see new/demo | ⬜ | |
| C: User creates post → becomes owner | ⬜ | |
| D: Project-owner has member-role | ⬜ | |

### Q1.2: Any unexpected behaviors or errors?
<!-- Please describe any issues observed -->

### Q1.3: Did the owner dropdown in AddPostPanel show the correct users?
<!-- Specifically: project owner + project members -->

---

## 2. Frontend Visibility Logic

### Q2.1: How should `r_*` columns affect frontend queries?

**Current state:** Posts API returns all posts regardless of `r_*` values.

**Options:**
- **A)** Filter in backend API based on user's role
- **B)** Return all, filter in frontend based on current user
- **C)** Add optional `?role=member` query param to filter

**Recommendation:** Option A is cleanest - the backend already knows the user's role from session.

**Your choice:** ⬜ A / ⬜ B / ⬜ C / ⬜ Other: ___

### Q2.2: Where is the user's project role determined?

**Current flow:**
1. User logs in → session has `user.id`
2. User selects project → we have `project.id`
3. Need to determine: Is user owner, member, participant, or partner for this project?

**Question:** Should we add a `/api/auth/project-role?project_id=X` endpoint, or include role in existing session?

---

## 3. usePostStatus Composable

### Q3.1: Should usePostStatus follow useImageStatus pattern exactly?

**useImageStatus has:**
- Status checks (isRaw, isProcessing, isApproved, etc.)
- Config bit checks (isPublic, isFeatured, etc.)
- Status transitions (toProcessing, toApproved, etc.)
- API calls built-in

**For usePostStatus, do we need:**
- [ ] Status checks (isDraft, isReleased, etc.)
- [ ] Config/scope bit checks (isPublic, isProjectScoped, etc.)
- [ ] Status transitions with API calls
- [ ] Role visibility checks (can current user see this post?)

### Q3.2: Status values for posts - should they match AUTH-SYSTEM-SPEC states?

| AUTH-SYSTEM-SPEC State | Bit Value | Map to Post Status? |
|------------------------|-----------|---------------------|
| new | 001 | Yes - newly created |
| demo | 010 | Yes - demo/example |
| draft | 011 | Yes - work in progress |
| review | 100 | Yes - awaiting approval |
| released | 101 | Yes - published |
| archived | 110 | Yes - historical |
| trash | 111 | Yes - marked for deletion |

---

## 4. Project Priority

### Q4.1: What's most important for tomorrow?

Please rank 1-5:

- [ ] Connect r_* columns to API filtering (backend visibility)
- [ ] Implement usePostStatus composable
- [ ] Add project role detection to frontend
- [ ] Fix any alpha-prod issues from testing
- [ ] Other: ___

### Q4.2: Any blockers or dependencies we should address first?

---

## 5. Migration 048 Status

### Q5.1: Did you run migration 048 (recompute helpers)?

The fixed version is ready. To run:
```bash
# In .env, set SKIP_MIGRATIONS=false
pnpm dev  # starts server, runs migration
# Then set SKIP_MIGRATIONS=true again
```

**Note:** This migration adds helper functions but doesn't change data. Safe to skip if triggers are working.

---

## Summary: Key Decisions Needed

1. **Visibility filtering:** Backend (A) vs Frontend (B) vs Query param (C)
2. **Project role detection:** New endpoint vs session enhancement
3. **usePostStatus scope:** Full implementation vs minimal MVP
4. **Tomorrow's priority:** Which feature first

---

*Please answer inline or in our next session. These answers will guide tomorrow's implementation.*
