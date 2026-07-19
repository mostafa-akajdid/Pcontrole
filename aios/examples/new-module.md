# Example: Adding a New Module

## Scenario

The Product Owner requests: "Add a task management module. Users should be able to create, read, update, and delete tasks. Tasks have a title, description, status (todo/in-progress/done), priority (low/medium/high), assignee, and due date."

## AI Response (Following AIOS)

### Objective

Add a task management module with full CRUD operations, status and priority management, assignment, and due date tracking.

### Analysis

Before implementing, I need to understand:

1. **Existing patterns:** The system already has [module A] and [module B]. I will follow the same service layer pattern, API route conventions, and component structure.
2. **Data model:** Tasks need a new database model with relationships to users (assignee).
3. **Permissions:** Tasks need CRUD permissions: `tasks.create`, `tasks.read`, `tasks.update`, `tasks.delete`.
4. **Events:** Task creation, update, and deletion should emit events for audit logging and notifications.
5. **UI:** Tasks need a list view, detail view, create/edit modal, and filtering.

### Questions

Before proceeding, I need clarification:

1. Should tasks be associated with projects, or are they standalone?
2. Should task assignment trigger a notification to the assignee?
3. Should there be task comments or just the description field?
4. What is the maximum number of tasks per project/user?
5. Should tasks have a trash/restore workflow like other modules?

### Plan (After Questions Answered)

Assuming answers: standalone tasks, notifications on assignment, no comments, no limit, trash/restore yes.

**Milestone 1: Data Layer**
1. Database schema for tasks (M)
2. Task service with CRUD methods (L)
3. Event listeners for audit and notifications (M)

**Milestone 2: API Layer**
4. API routes for tasks (GET list, GET detail, POST, PUT, DELETE) (L)
5. API routes for trash and restore (M)
6. API route for bulk operations (M)

**Milestone 3: Frontend**
7. Task list page with filtering and pagination (L)
8. Task create/edit modal (L)
9. Task detail view (M)
10. Trash page for tasks (S)

**Milestone 4: Integration**
11. Permission integration (S)
12. Dashboard widget for task stats (M)
13. Global search integration (S)

### Implementation (Abbreviated)

Following the plan, each task is implemented with:
- Database schema with proper indexes
- Service class following existing patterns
- API routes with auth, CSRF, validation, and standard responses
- Frontend components with loading, error, and empty states
- Event emission for audit and notifications

### Verification

- Build: PASSED (zero errors)
- All CRUD operations: Verified
- Permission checks: Verified (403 for unauthorized)
- CSRF protection: Verified (403 without token)
- Soft delete/restore: Verified
- Existing tests: All passing
- No regressions: Confirmed

### Risks

- Task assignment notifications may need email templates (deferred)
- Bulk operations could be slow with many tasks (pagination implemented)

### Next Step

Awaiting human review of the complete implementation.

## Key Patterns Demonstrated

1. **Questions before coding** — The AI asked 5 clarifying questions
2. **Milestone breakdown** — Work split into 4 milestones
3. **Following existing patterns** — Service layer, API conventions, component structure
4. **Complete verification** — Build, functionality, security, regressions
5. **Honest risks** — Identified potential issues
