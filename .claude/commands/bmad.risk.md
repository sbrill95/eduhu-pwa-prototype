---
description: Assess implementation risks before development. Identifies technical, security, performance, and integration risks with mitigation strategies.
---

## BMad Risk Assessment

You are executing the **risk-profile** task as the BMad Test Architect (Quinn).

## User Input

```text
$ARGUMENTS
```

Expected: Path to story file or feature spec (e.g., `specs/003-agent-confirmation-ux/spec.md`)

### Purpose
Identify and assess implementation risks BEFORE development begins to prevent issues and guide test strategy.

### Task Execution

1. **Load Story/Spec**
   - Read the provided story or spec file
   - Extract requirements, acceptance criteria, technical approach
   - Understand scope and complexity

2. **Identify Risks**

   Analyze across categories:

   - **Technical Risks**: Implementation complexity, technology challenges
   - **Security Risks**: Authentication, authorization, data exposure
   - **Performance Risks**: Scalability, response time, resource usage
   - **Data Risks**: Data integrity, migration, backup/recovery
   - **Integration Risks**: API compatibility, third-party services
   - **Regression Risks** (Brownfield): Existing feature breakage

3. **Score Each Risk**

   Use formula: **Risk Score = Probability × Impact** (1-9 scale)

   - **Probability** (1-3): How likely is this to occur?
     - 1 = Low (unlikely)
     - 2 = Medium (possible)
     - 3 = High (likely)

   - **Impact** (1-3): How severe if it occurs?
     - 1 = Low (minor inconvenience)
     - 2 = Medium (feature degradation)
     - 3 = High (critical failure)

   - **Risk Score**:
     - 1-3 = Low risk (monitor)
     - 4-6 = Medium risk (mitigation plan needed)
     - 7-9 = High risk (critical attention required)

4. **Provide Mitigation Strategies**

   For each identified risk:
   - Specific mitigation actions
   - Testing strategies to validate
   - Monitoring/detection approaches
   - Fallback plans if risk materializes

5. **Generate Risk Profile**

   Create assessment document with:
   - Risk summary (counts by severity)
   - Detailed risk breakdown
   - Mitigation strategies
   - Recommendations for development approach
   - Quality gate impact (≥9 = FAIL, ≥6 = CONCERNS)

### Output

Save to: `docs/qa/assessments/{epic}.{story}-risk-{YYYYMMDD}.md`

### Brownfield Focus

For existing projects, pay special attention to:
- Regression risks (breaking existing features)
- Integration point complexity
- Data migration safety
- Backward compatibility
- Performance degradation

### Success Criteria

- [ ] All risk categories analyzed
- [ ] Each risk scored with clear reasoning
- [ ] Mitigation strategies provided
- [ ] Output saved to correct location
- [ ] Recommendations actionable

### Reference

Load from `.bmad-core/tasks/risk-profile.md` for detailed workflow if needed.
