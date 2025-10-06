# Definition of Done - Quality Gate Checklist

**Purpose**: Objective criteria for marking tasks as ✅ complete

---

## Task is DONE when ALL of these pass:

### 1. Code Quality
- [ ] `npm run build` → 0 TypeScript errors
- [ ] `npm run lint` → 0 critical errors (warnings OK)
- [ ] Code follows project patterns
- [ ] No @ts-ignore or @ts-expect-error added

### 2. Testing
- [ ] Unit tests pass: `npm test`
- [ ] Integration tests pass (if applicable)
- [ ] E2E tests pass: `npm run test:e2e` (if feature has E2E coverage)

### 3. Functionality
- [ ] Feature works as specified in User Story
- [ ] Acceptance Criteria met (all checkboxes)
- [ ] Manual testing done (document in session log)
- [ ] Edge cases handled

### 4. Documentation
- [ ] Session log created in `docs/development-logs/sessions/YYYY-MM-DD/`
- [ ] Session log includes:
  - What was implemented
  - Build output (screenshot or paste)
  - Test results
  - Manual verification notes
  - Any deviations from plan

### 5. Pre-Commit Hook
- [ ] `git add .` + `git commit` succeeds (pre-commit hook passes)

---

## Agent Rules

**ONLY mark task as ✅ in tasks.md when ALL above criteria met**

**If blocked**:
- Keep task status as ⏳ in_progress
- Document blocker in session log
- Create new task for blocker resolution

---

**Enforced by**: Pre-commit hooks (Phase 1) + Agent instructions
**Created**: 2025-10-06 Phase 3
