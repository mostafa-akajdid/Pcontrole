# Example: Refactoring

## Scenario

The Product Owner requests: "The user service is getting too large. Split it into smaller, focused services."

## AI Response (Following AIOS)

### Objective

Refactor the monolithic UserService into smaller, focused services while preserving all existing functionality.

### Analysis

Current state of `UserService`:
- 450+ lines
- Handles: CRUD, authentication, password management, profile updates, status changes, bulk operations, stats
- Used by 8 API routes
- Has 3 direct database queries
- Emits 5 different events

The service violates Single Responsibility. It handles user lifecycle, authentication, and profile management — three separate concerns.

### Questions

1. Should I split into `UserCrudService`, `UserAuthService`, and `UserProfileService`?
2. Or should I split into `UserService` (core CRUD) and `AuthService` (authentication)?
3. Should the event emission stay in each service, or move to a separate event wiring layer?

### Plan (After Answers)

Split into two services: `UserService` (CRUD + profile) and `AuthService` (authentication + password management). Events stay in each service.

**Critical constraint:** This is a refactor. No behavior changes. No API changes. No public interface changes.

### Tasks

1. Create `AuthService` with authentication methods (M)
2. Move auth methods from `UserService` to `AuthService` (M)
3. Update imports in API routes (M)
4. Verify all routes still work (M)
5. Run full test suite (M)

### Implementation

**Step 1: Create AuthService**

Extracted from UserService:
- `login(email, password)` → `AuthService.login()`
- `register(data)` → `AuthService.register()`
- `generateResetToken(email)` → `AuthService.generateResetToken()`
- `resetPassword(token, password)` → `AuthService.resetPassword()`
- `verifyEmail(token)` → `AuthService.verifyEmail()`

**Step 2: Update UserService**

Removed the extracted methods. UserService now handles:
- `findById(id)`
- `findAll(filters)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `updateStatus(id, status)`
- `bulkAction(ids, action)`
- `getStats()`

**Step 3: Update Imports**

Updated 8 API route files to import from the correct service.

**Step 4: Verify Barrel Export**

Updated `lib/services/index.js` to export both services.

### Verification

- Build: PASSED
- All API routes: Responding correctly
- Login/Register: Working via AuthService
- User CRUD: Working via UserService
- Password reset: Working via AuthService
- Existing tests: All passing
- No behavior changes: Confirmed
- No API changes: Confirmed

### Risks

- The split creates two services where one existed — the team must understand the new structure
- Import paths changed in 8 files — this could cause merge conflicts if other branches are active

### Key Patterns Demonstrated

1. **Minimal change** — Only the split was performed, no behavior changes
2. **Preserved interfaces** — All public APIs remain identical
3. **Verified thoroughly** — Every route tested after the change
4. **Honest risks** — Merge conflict risk identified
5. **No over-engineering** — Split into two services, not six
