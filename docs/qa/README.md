# Quality Assurance (QA) - BMad Method

**QA Framework**: BMad Test Architect (Quinn)
**Last Updated**: 2025-10-23
**Methodology**: Comprehensive Quality Gates with Zero Tolerance Standards

---

## 📋 Overview

This directory contains all **Quality Assurance artifacts** for the Teacher Assistant project, following the BMad Method for brownfield development.

**QA Philosophy**: **Quality is NOT optional**. Every story must pass comprehensive QA review before deployment.

---

## 🗂️ Directory Structure

```
qa/
├── README.md                           # This file
├── assessments/                        # QA Assessment Reports
│   ├── epic-X.story-Y-risk-YYYYMMDD.md           # Risk Assessment
│   ├── epic-X.story-Y-test-design-YYYYMMDD.md    # Test Strategy
│   ├── epic-X.story-Y-trace-YYYYMMDD.md          # Requirements Tracing
│   ├── epic-X.story-Y-nfr-YYYYMMDD.md            # NFR Assessment
│   └── epic-X.story-Y-review-YYYYMMDD.md         # Comprehensive Review
└── gates/                              # Quality Gate Decisions
    └── epic-X.story-Y-{slug}.yml       # YAML format quality gates
```

---

## 🎯 QA Workflow (BMad Method)

### Before Implementation

```bash
# 1. Risk Assessment (for complex/risky stories)
/bmad.risk docs/stories/epic-X.story-Y.md

# Output: docs/qa/assessments/epic-X.story-Y-risk-YYYYMMDD.md
# Identifies: Technical risks, integration risks, regression risks
```

```bash
# 2. Test Design
/bmad.test-design docs/stories/epic-X.story-Y.md

# Output: docs/qa/assessments/epic-X.story-Y-test-design-YYYYMMDD.md
# Defines: Test scenarios, test levels, priorities, execution approach
```

### During Implementation

```bash
# 3. Requirements Tracing (mid-development)
/bmad.trace docs/stories/epic-X.story-Y.md

# Output: docs/qa/assessments/epic-X.story-Y-trace-YYYYMMDD.md
# Validates: Test coverage matches acceptance criteria
```

```bash
# 4. NFR Assessment
/bmad.nfr docs/stories/epic-X.story-Y.md

# Output: docs/qa/assessments/epic-X.story-Y-nfr-YYYYMMDD.md
# Checks: Performance, security, reliability, scalability
```

### After Implementation

```bash
# 5. Comprehensive Review (MANDATORY before deployment)
/bmad.review docs/stories/epic-X.story-Y.md

# Output:
# - docs/qa/assessments/epic-X.story-Y-review-YYYYMMDD.md
# - docs/qa/gates/epic-X.story-Y-{slug}.yml
#
# Validates:
# - All acceptance criteria met
# - All tests passing (100%)
# - Zero console errors
# - Build clean (0 TypeScript errors)
# - Quality Gate decision
```

```bash
# 6. Gate Update (if fixes applied)
/bmad.gate docs/stories/epic-X.story-Y.md

# Updates: Quality gate status after fixes
```

---

## 🚦 Quality Gate Decisions

### Decision Types

| Decision | Symbol | Meaning | Action |
|----------|--------|---------|--------|
| **PASS** | ✅ | All critical requirements met | Deploy approved |
| **CONCERNS** | ⚠️ | Non-critical issues identified | Team review recommended |
| **FAIL** | ❌ | Critical issues found | MUST fix before deploy |
| **WAIVED** | 🟡 | Issues accepted with justification | Documented exception |

### Quality Gate Criteria

**PASS Requirements**:
- ✅ All P0 acceptance criteria met
- ✅ 100% of P0 tests passing
- ✅ ZERO console errors
- ✅ Build clean (0 TypeScript errors)
- ✅ Screenshots captured for all features
- ✅ No critical security issues
- ✅ Performance targets met

**FAIL Triggers** (Automatic):
- ❌ Any P0 acceptance criteria unmet
- ❌ P0 tests failing (< 85% pass rate)
- ❌ ANY console errors
- ❌ TypeScript compilation errors
- ❌ Critical security vulnerabilities
- ❌ Original preservation safety violated

---

## 🎭 Meet Quinn: BMad Test Architect

**Role**: Independent quality validation specialist

**Responsibilities**:
- Create test strategies before development
- Assess risks for complex stories
- Conduct comprehensive code reviews
- Enforce zero-tolerance quality standards
- Generate quality gate decisions
- Validate all acceptance criteria

**Standards Enforced**:
- **ZERO tolerance for console errors**
- **100% P0 test coverage mandatory**
- **Screenshots required for all features**
- **Original preservation safety (image editing)**
- **Performance benchmarks validation**
- **Security verification**

**Quinn's Motto**:
> "If it's not tested, it doesn't work. If it has console errors, it's not done. If it fails acceptance criteria, it's not ready."

---

## 📊 Assessment Types

### 1. Risk Assessment (`/bmad.risk`)

**When**: Before implementing complex/risky stories

**Identifies**:
- Technical risks (API integration, performance, complexity)
- Security risks (data exposure, authentication, authorization)
- Integration risks (breaking changes, dependencies)
- Regression risks (impact on existing features)

**Output**: Risk mitigation strategies and test focus areas

---

### 2. Test Design (`/bmad.test-design`)

**When**: Before writing any code

**Defines**:
- Test scenarios (happy path, error cases, edge cases)
- Test levels (unit, integration, E2E)
- Test priorities (P0, P1, P2)
- Execution approach (manual, automated, mixed)
- Success criteria

**Output**: Complete test strategy document

---

### 3. Requirements Tracing (`/bmad.trace`)

**When**: Mid-development or before QA review

**Validates**:
- Every acceptance criterion has tests
- Test coverage is comprehensive
- No missing test scenarios
- Tests actually validate requirements

**Output**: Traceability matrix (AC → Tests)

---

### 4. NFR Assessment (`/bmad.nfr`)

**When**: During or after implementation

**Checks**:
- **Performance**: Response times, load times, throughput
- **Security**: Auth, authorization, input validation, data protection
- **Reliability**: Error handling, retry logic, graceful degradation
- **Usability**: UI/UX quality, accessibility, responsiveness
- **Maintainability**: Code quality, documentation, test quality
- **Scalability**: Can handle growth, resource usage

**Output**: NFR compliance report

---

### 5. Comprehensive Review (`/bmad.review`)

**When**: After implementation complete (MANDATORY)

**Comprehensive Analysis**:
1. **Code Review**
   - TypeScript type safety
   - Error handling completeness
   - Security checks
   - Performance optimizations

2. **Test Validation**
   - All tests passing
   - Test quality assessment
   - Coverage verification
   - Console error checking

3. **Requirements Verification**
   - All acceptance criteria met
   - No scope creep
   - Edge cases handled

4. **Documentation Check**
   - Session logs complete
   - Screenshots captured
   - README updates

5. **Quality Gate Decision**
   - PASS / CONCERNS / FAIL
   - Justification provided
   - Action items documented

**Output**:
- Comprehensive review document
- Quality gate YAML file

---

## 📝 File Naming Conventions

### Assessment Files (Markdown)

```
Pattern: epic-{epic}.story-{story}-{type}-{YYYYMMDD}.md

Examples:
- epic-3.0.story-1-risk-20251017.md
- epic-3.0.story-1-test-design-20251017.md
- epic-3.0.story-1-review-20251020.md
- epic-3.1.story-2-trace-20251021.md
- epic-3.1.story-2-nfr-20251021.md
```

### Quality Gate Files (YAML)

```
Pattern: epic-{epic}.story-{story}-{slug}.yml

Examples:
- epic-3.0.story-1-openai-agents-sdk-setup.yml
- epic-3.0.story-2-router-agent.yml
- epic-3.1.story-2-image-editing.yml
```

**Exception**: Critical assessments may use `.md` for comprehensive detail:
```
epic-3.1.story-2-QUINN-CRITICAL-ASSESSMENT-20251023.md
```

---

## 🔍 Quality Standards (Non-Negotiable)

### Zero Tolerance Policies

1. **Console Errors**: ANY console error = Test FAIL
   - No exceptions
   - Even warnings should be investigated
   - Tests must scan for console output

2. **P0 Test Coverage**: 100% of P0 tests must pass
   - < 85% pass rate = FAIL quality gate
   - Flaky tests = FAIL (must be deterministic)

3. **Original Preservation** (Image Editing):
   - Original images MUST NEVER be overwritten
   - Explicit safety check required
   - Violation = CRITICAL FAIL

4. **TypeScript Errors**: Build must be clean
   - 0 compilation errors
   - 0 type errors
   - `any` types must be justified

5. **Screenshots**: Visual proof required
   - Minimum 3 per feature (BEFORE, AFTER, ERROR)
   - Full page screenshots
   - Saved to `docs/testing/screenshots/YYYY-MM-DD/`

---

## 📈 Quality Metrics

### Current Project Stats (Epic 3.0 Complete)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Test Pass Rate** | 100% | 100% | ✅ PASS |
| **Console Errors** | 0 | 0 | ✅ PASS |
| **TypeScript Errors** | 0 | 0 | ✅ PASS |
| **P0 Test Coverage** | 100% | 100% | ✅ PASS |
| **Screenshots Captured** | ≥3 per feature | 12+ | ✅ PASS |
| **Quality Gates PASS** | 100% | 100% | ✅ PASS |

---

## 🚀 Quick Start Guide

### For Developers

**Before starting a story**:
```bash
# 1. Check if risk assessment exists
ls docs/qa/assessments/epic-X.story-Y-risk-*.md

# 2. Check if test design exists
ls docs/qa/assessments/epic-X.story-Y-test-design-*.md

# 3. If missing, request from QA agent
/bmad.risk docs/stories/epic-X.story-Y.md
/bmad.test-design docs/stories/epic-X.story-Y.md
```

**After completing implementation**:
```bash
# 1. Run all validations
npm run build          # TypeScript check
npm test               # Unit/integration tests
npx playwright test    # E2E tests

# 2. Check for console errors
# (Should be 0 in test output)

# 3. Verify screenshots
ls docs/testing/screenshots/$(date +%Y-%m-%d)/

# 4. Request QA review
/bmad.review docs/stories/epic-X.story-Y.md
```

### For QA Reviewers

**Comprehensive review checklist**:
- [ ] All acceptance criteria met
- [ ] All tests passing (100%)
- [ ] Zero console errors
- [ ] Build clean (0 TypeScript errors)
- [ ] Screenshots captured (≥3 per feature)
- [ ] Performance targets met
- [ ] Security verified
- [ ] Error handling comprehensive
- [ ] Documentation complete
- [ ] Session logs created

---

## 📚 Related Documentation

- **Main PRD**: [docs/prd.md](../prd.md)
- **Architecture**: [docs/architecture.md](../architecture.md)
- **Stories**: [docs/stories/](../stories/)
- **Testing**: [docs/testing/](../testing/)
- **BMad Method**: `CLAUDE.md` (project root)

---

## 🔗 BMad QA Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/bmad.risk` | Risk assessment | Before complex stories |
| `/bmad.test-design` | Test strategy | Before all stories |
| `/bmad.trace` | Requirements tracing | Mid-development |
| `/bmad.nfr` | NFR validation | During/after implementation |
| `/bmad.review` | Comprehensive review | **ALWAYS** after completion |
| `/bmad.gate` | Update quality gate | After fixes applied |

---

## ❓ FAQ

**Q: When is QA review required?**
A: **ALWAYS**. Every story must have a comprehensive QA review before deployment.

**Q: Can I skip QA review for small changes?**
A: **NO**. Even small changes need validation. Quality standards are non-negotiable.

**Q: What if tests are flaky?**
A: **FIX THEM**. Flaky tests = FAIL quality gate. Tests must be deterministic.

**Q: Can I ignore console warnings (not errors)?**
A: Warnings should be investigated. Some warnings indicate potential errors.

**Q: What if I disagree with Quinn's assessment?**
A: Document your reasoning, discuss with team, but respect quality standards.

**Q: How do I request a quality gate update after fixes?**
A: Run `/bmad.gate docs/stories/epic-X.story-Y.md` and re-run tests.

---

**Maintained By**: BMad QA Agent (Quinn)
**Review Schedule**: Continuous (per story completion)
**Contact**: Use `/bmad.review` command for comprehensive QA reviews

---

**Quality is everyone's responsibility, but Quinn ensures it's enforced.** ✅
