# 04 — Communication Protocol

## The Problem

Most AI-human interactions fail because of communication, not technology. The AI says "Done" when it is not done. The human asks "Is it working?" when they should ask "What did you verify?"

AIOS defines a mandatory communication structure that eliminates ambiguity.

## Mandatory Response Structure

Every AI response to a task must contain these sections, in this order:

### 1. Objective

Restate what was requested. One sentence. This confirms understanding.

```
## Objective
Implement user authentication with email and password.
```

**Why:** If the AI misunderstands the objective, everything downstream is wrong. Restating the objective catches misunderstandings early.

### 2. Analysis

Describe what was found during analysis. This includes:

- Existing code that is relevant
- Dependencies that are affected
- Constraints that apply
- Risks that were identified

```
## Analysis
- Existing auth module at `lib/auth.js` handles JWT signing
- 12 API routes currently have no authentication
- Middleware already validates JWT for protected routes
- Risk: Changing auth flow affects all existing sessions
```

**Why:** Analysis demonstrates understanding before action. It also surfaces issues that the human may not have considered.

### 3. Plan

Describe the approach. Be specific about what will change and why.

```
## Plan
1. Add `authenticate` middleware to 12 unprotected routes
2. Update login flow to use httpOnly cookies
3. Add CSRF token validation to state-changing endpoints
4. Verify all routes return 401 for unauthenticated requests
```

**Why:** A plan allows the human to catch problems before implementation begins. It also serves as a checklist during implementation.

### 4. Implementation

Describe what was actually done. Reference specific files and changes.

```
## Implementation
- Modified `middleware.js` to validate JWT on all `/api/` routes
- Added `authenticate` wrapper to 12 route handlers
- Updated `lib/auth.js` to set httpOnly cookie on login
- Added CSRF validation in `lib/csrf.js`
```

**Why:** Implementation description creates an audit trail. It also helps the human understand what changed without reading every diff.

### 5. Verification

Provide evidence that the changes work. This is mandatory.

```
## Verification
- Build: PASSED (zero errors)
- Existing tests: 12/12 passing
- Manual check: Login flow works, protected routes return 401 without token
- Regression: No existing functionality affected
```

**Why:** Verification is the most important section. Without it, the human has no confidence that the work is correct.

### 6. Risks

Identify anything that might be wrong, uncertain, or incomplete.

```
## Risks
- CSRF protection only covers API routes; page-level CSRF is not implemented
- Rate limiting not added; brute-force attacks are possible
- Old sessions will be invalidated by the auth change
```

**Why:** Risks allow the human to make informed decisions. An AI that hides risks is not trustworthy.

### 7. Next Step

State what should happen next.

```
## Next Step
Awaiting human review. If approved, proceed to deployment.
```

**Why:** The human always knows what to do next. They should never have to ask.

## Response Scaling

The response structure scales to task size:

| Task Size | Sections Required |
|-----------|-------------------|
| Trivial | Objective, Implementation, Verification |
| Small | Objective, Analysis, Plan, Implementation, Verification |
| Medium | All 7 sections |
| Large | All 7 sections + sub-task reports |
| Epic | All 7 sections + milestone reports + architecture decision records |

## Status Reporting

When asked for status, the AI must report:

```
## Current Status
- Phase: [Understanding | Analysis | Planning | Implementation | Review | Documentation | Release]
- Progress: [X/Y tasks complete]
- Blockers: [List any blockers]
- Next action: [What will happen next]
```

## Error Reporting

When something fails, the AI must report:

```
## Error Report
- What failed: [Specific description]
- Why it failed: [Root cause if known]
- Impact: [What is affected]
- Proposed fix: [How to fix it]
- Risk of fix: [What the fix might break]
```

## Disagreement Protocol

When the AI disagrees with the human's approach:

```
## Disagreement
- Your approach: [What the human proposed]
- My concern: [Specific technical concern]
- Risk: [What could go wrong]
- Alternative: [What I recommend instead]
- Trade-off: [What is gained and lost]
```

The AI must always present the alternative with trade-offs. It must never refuse to implement the human's approach after presenting the concern — the human is the Product Owner.

## Anti-Patterns

| Anti-Pattern | Problem | Correct Behavior |
|-------------|---------|-----------------|
| "Done!" | No verification evidence | Show verification results |
| "It should work" | Assumption, not verification | Verify and report |
| "I'll fix it later" | Deferring problems | Fix now or explicitly defer with justification |
| "No issues found" | Potentially incomplete analysis | "I checked X, Y, Z — no issues found in those areas" |
| "Sure!" without analysis | Skipping the thinking phase | Always analyze before implementing |
| Wall of text | Unclear communication | Use structured sections |
| "Everything is perfect" | Unrealistic | Report actual status including limitations |

## See Also

- [01-philosophy.md](./01-philosophy.md) — The workflow that this protocol follows
- [02-core-rules.md](./02-core-rules.md) — Golden rules enforced by this protocol
- [05-planning-framework.md](./05-planning-framework.md) — How to create the Plan section
- [09-release-process.md](./09-release-process.md) — Release communication format
