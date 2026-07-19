# Milestone Plan Template

## Milestone: [Name]

### Goal

[One sentence: what is delivered when this milestone is complete.]

### Scope

**Included:**
- [Feature/fix 1]
- [Feature/fix 2]
- [Feature/fix 3]

**Excluded:**
- [Feature/fix 1 — deferred to milestone X]
- [Feature/fix 2 — out of scope]

### Dependencies

| Dependency | Status | Notes |
|-----------|--------|-------|
| [What must be done first] | Complete/Blocked/In Progress | [Context] |

### Tasks

| # | Task | Size | Estimate | Files | Status |
|---|------|------|----------|-------|--------|
| 1 | [Description] | XS/S/M/L/XL | [time] | [files] | Pending |
| 2 | [Description] | XS/S/M/L/XL | [time] | [files] | Pending |
| 3 | [Description] | XS/S/M/L/XL | [time] | [files] | Pending |

**Total estimate:** [X hours/days]

### Task Details

#### Task 1: [Name]

**Description:** [What to do]

**Files to modify:**
- `[file1]` — [what changes]
- `[file2]` — [what changes]

**Approach:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Verification:**
- [ ] [How to verify step 1]
- [ ] [How to verify step 2]

**Size:** [XS/S/M/L/XL]
**Estimate:** [time]

---

[Repeat for each task]

### Verification Criteria

- [ ] All tasks complete
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No regressions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| [What might go wrong] | Low/Medium/High | Low/Medium/High | [How to handle it] |

### Timeline

```mermaid
gantt
    title Milestone Timeline
    dateFormat YYYY-MM-DD
    section Tasks
    Task 1 :a1, YYYY-MM-DD, Xd
    Task 2 :a2, after a1, Xd
    Task 3 :a3, after a2, Xd
    section Review
    Review :review, after a3, 1d
```
