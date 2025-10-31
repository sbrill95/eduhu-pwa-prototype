# CodeRabbit - Pilot Integration Guide (VS Code Extension)

**Status**: Ready to pilot in Story 3.1.1 (Google AI Studio Setup + Gemini API Integration)
**Created**: 2025-10-21
**Updated**: 2025-10-21
**Installation**: ✅ COMPLETE (VS Code Extension installed)
**Purpose**: Integrate CodeRabbit into BMad workflow to reduce QA round-trips and enable autonomous agent self-validation

---

## 🎯 Pilot Goals

1. **Reduce QA FAIL/CONCERNS gates** by catching issues before QA review
2. **Enable autonomous self-correction** during multi-hour agent sessions
3. **Enforce testing standards** (missing test detection)
4. **Validate AI-generated code** quality before human review

**Success Metrics**:
- Fewer QA review cycles (target: < 2 cycles per story)
- CodeRabbit catches issues Quinn would catch
- < 10% false positives (flagging valid code)

---

## 📦 Installation & Setup (VS Code Extension)

### ✅ Step 1: Install Extension (COMPLETE)

**Status**: Extension installed via VS Code marketplace

The CodeRabbit VS Code extension is now installed and ready to use!

### Step 2: How to Use the Extension

#### Starting a Code Review

**Method 1: Automatic on Git Commit**
- CodeRabbit automatically reviews all changes when you commit to your local Git repository
- A dialog appears asking: "Would you like to start a review?"
- Click "Yes" to start the review

**Method 2: Manual Review**
1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type: "CodeRabbit: Start Review"
3. Press Enter

**Method 3: From Sidebar**
1. Click the CodeRabbit icon in the VS Code activity bar (left sidebar)
2. Click "Start Review" button

#### Viewing Review Results

1. **Open CodeRabbit Sidebar**: Click the CodeRabbit icon in the activity bar
2. **Review Progress**: Sidebar shows progress as the review runs
3. **View Comments**: Review comments appear in the "Files" section
4. **Inline Suggestions**: Click any comment to see detailed suggestion inline in your editor

#### Applying Fixes

**One-Click Apply**:
- When CodeRabbit provides a specific code fix
- Click the **Apply suggested change** ✓ icon
- Fix is applied immediately to your code

**AI-Assisted Fix**:
- For complex issues
- Click the **Fix with AI** ⭐ icon
- Sends problem to your preferred AI coding agent (Claude Code)

### Step 3: Configure Settings (Optional)

Open VS Code settings and search for "CodeRabbit" to customize:
- Auto-review on commit (on/off)
- Review depth (quick/thorough)
- Language preferences
- Notification settings

---

## 🔧 Integration into BMad Workflow

### Integration Point 1: Dev Self-Check (Layer 1)

**Current Layer 1 Validation:**
```bash
npm run build          # 0 errors
npm test               # 100% pass
npx playwright test    # ALL pass
grep -r "console.error"
```

**Enhanced with CodeRabbit VS Code Extension:**
1. Run standard validations (build, test, playwright)
2. Open VS Code
3. Press `Ctrl+Shift+P` → "CodeRabbit: Start Review"
4. Review CodeRabbit findings in sidebar
5. Apply fixes or document false positives
6. Mark task as "Ready for QA Review"

**When to use**: Before marking task as "Ready for QA Review"

---

### Integration Point 2: Pre-Commit Hook (Automatic with Extension)

**VS Code Extension handles this automatically!**

**How it works**:
1. You make code changes
2. You run `git commit` in terminal OR use VS Code Git UI
3. CodeRabbit automatically asks: "Would you like to start a review?"
4. Click "Yes" to review before commit
5. Fix any issues found
6. Complete commit

**Configuration**:
- Go to VS Code Settings → Search "CodeRabbit"
- Enable: "Auto-review on commit"
- This makes reviews automatic without manual triggering

**Note**: Test this during pilot (Phase 1) to see if it improves workflow

---

### Integration Point 3: Autonomous Agent Checkpoints

**Enhanced 30-min checkpoint workflow** (for autonomous sessions):

1. **Standard Validation**:
   ```bash
   npm run build
   npm test
   npx playwright test
   ```

2. **CodeRabbit Review** (in VS Code):
   - Open VS Code
   - Press `Ctrl+Shift+P` → "CodeRabbit: Start Review"
   - Review findings automatically
   - Apply one-click fixes where appropriate

3. **Document findings** in session log

**Note**: For autonomous agents working via Claude Code, CodeRabbit reviews can be triggered as part of the validation workflow.

**Benefits**:
- Agents self-correct during multi-hour sessions
- Reduces user interruptions
- Improves "< 5% User Interventions" metric

---

## 📋 Updated Definition of Done (DoD) - Pilot Version

### Technical Validation (Agents):
1. ✅ Build Clean: `npm run build` → 0 errors
2. ✅ All Tests Pass: `npm test` → 100%
3. ✅ Playwright E2E Tests MANDATORY
4. ✅ Screenshots Captured (min 3 per feature)
5. ✅ Console Error Scanning: ZERO errors
6. ✅ **🆕 CodeRabbit Review: `wsl coderabbit review` → Document findings**
7. ✅ Quality Gate PASS: QA Review with Decision = PASS
8. ✅ Pre-Commit Pass
9. ✅ Session Log Complete (including CodeRabbit findings)

**Important**: During pilot, CodeRabbit is **advisory, not blocking**. Document findings but don't block on them.

---

## 🧪 Pilot Execution Plan

### Story Selection (Next Story After 3.0.5)

**Criteria for pilot story**:
- Medium complexity (not too simple, not too complex)
- Has clear acceptance criteria
- Requires E2E tests
- Will go through QA review anyway

### Pilot Workflow

#### Phase 1: Dev Implementation
1. Implement story tasks normally
2. Write Playwright E2E tests
3. Run standard validations (build, test, playwright)
4. **NEW**: Run `wsl coderabbit review` before marking "Ready for QA"
5. **Document findings** in session log:
   - What issues did CodeRabbit find?
   - Were they valid issues or false positives?
   - Did you fix them before QA review?

#### Phase 2: QA Review
1. Quinn runs `/bmad.review` as normal
2. **Compare**: Did CodeRabbit catch issues Quinn found?
3. **Analyze**: Did Quinn find issues CodeRabbit missed?
4. **Document**: Overlap analysis in QA assessment

#### Phase 3: Post-Pilot Analysis

**Questions to answer**:
- [ ] Did CodeRabbit reduce QA review cycles? (Fewer FAIL/CONCERNS?)
- [ ] What % of CodeRabbit findings were valid? (< 10% false positives?)
- [ ] Did CodeRabbit catch missing tests?
- [ ] Time cost: How long did CodeRabbit review take?
- [ ] Value: Was feedback actionable and helpful?

**Decision**:
- ✅ **Adopt**: If catches > 50% of issues Quinn would catch, integrate into DoD
- 🟡 **Refine**: If mixed results, adjust usage (e.g., only for complex stories)
- ❌ **Reject**: If < 30% useful findings or too many false positives

---

## 📊 Session Log Template (with CodeRabbit)

Add this section to your session logs during pilot:

```markdown
## CodeRabbit CLI Review (Pilot)

### Pre-QA Review Findings
- **Ran at**: HH:MM
- **Duration**: X seconds
- **Issues Found**: N
  - Critical: N
  - Non-critical: N
  - False positives: N

### Sample Findings
1. **Issue**: [Description]
   - **Valid?**: Yes/No
   - **Action**: Fixed / Ignored / Flagged for QA
   - **Impact**: Would Quinn catch this?

2. **Issue**: [Description]
   - **Valid?**: Yes/No
   - **Action**: Fixed / Ignored / Flagged for QA
   - **Impact**: Would Quinn catch this?

### Analysis
- **Useful findings**: X / N (X%)
- **Time saved**: Estimated Y minutes (if caught before QA)
- **Recommendation**: Adopt / Refine / Reject
```

---

## 🚀 Quick Start Guide (For Story 3.1.1)

### ✅ Setup (COMPLETE)

CodeRabbit VS Code extension is installed and ready to use!

### During Story 3.1.1 Development (Gemini API Integration)

#### Step 1: Implement tasks normally
- Install `@google/generative-ai` package
- Write Gemini API integration code
- Add error handling
- Write tests

#### Step 2: Before marking "Ready for QA"
1. Run standard validations:
   ```bash
   npm run build
   npm test
   npx playwright test
   ```

2. **Run CodeRabbit Review**:
   - Open VS Code
   - Press `Ctrl+Shift+P`
   - Type: "CodeRabbit: Start Review"
   - Press Enter

3. **Review findings** in CodeRabbit sidebar:
   - Read each suggestion
   - Apply valid fixes (click ✓ icon)
   - Document false positives
   - Note anything unclear

4. **Document in session log**:
   - How many issues found?
   - How many were valid?
   - How many false positives?
   - Time spent on review?

5. Mark "Ready for QA Review"

### Post-Story
- Compare CodeRabbit findings vs Quinn's QA findings
- Update this guide with learnings
- Decide: Adopt / Refine / Reject

---

## 📌 Notes & Considerations

### VS Code Extension vs CLI
- **You're using**: VS Code Extension (Windows-native, no WSL needed)
- **Advantages**: Visual UI, one-click fixes, automatic integration
- **Best for**: Windows users, visual workflow, IDE integration

### Rate Limits (Free Tier)
- Free tier has usage limits
- For pilot, this should be fine (few reviews per story)
- If piloting succeeds and you use heavily, consider paid tier

### False Positives
- AI reviewers can flag valid code
- Use your judgment - CodeRabbit is **advisory, not absolute**
- Document false positives to assess quality

### Integration with Quinn (QA Agent)
- **CodeRabbit** = Dev's pre-flight check
- **Quinn** = Official quality gate authority
- CodeRabbit findings are **input to QA**, not replacement

---

## ✅ Checklist for Story 3.1.1 Pilot

Before starting Story 3.1.1:
- [x] ✅ VS Code Extension installed
- [x] ✅ Authentication completed (automatic with extension)
- [ ] Test review run successfully (run test review once)
- [x] ✅ Session log template ready
- [x] ✅ Story selected: Story 3.1.1 (Gemini API Integration)
- [ ] Read Story 3.1.1 acceptance criteria
- [ ] Understand implementation requirements

During Story 3.1.1 development:
- [ ] Run CodeRabbit review before marking "Ready for QA"
  - Open VS Code
  - Press `Ctrl+Shift+P` → "CodeRabbit: Start Review"
- [ ] Document findings in session log (use template below)
- [ ] Fix valid issues found
- [ ] Note false positives
- [ ] Still run QA review (`/bmad.review`) as normal

After Story 3.1.1 completion:
- [ ] Analyze pilot results (compare CodeRabbit vs Quinn findings)
- [ ] Answer pilot analysis questions
- [ ] Make adoption decision (Adopt / Refine / Reject)
- [ ] Update DoD if adopting
- [ ] Update CLAUDE.md with CodeRabbit workflow if adopting

---

## 🔗 References

- **CodeRabbit VS Code Extension Docs**: https://docs.coderabbit.ai/guides/use-vscode
- **CodeRabbit Marketplace**: https://marketplace.visualstudio.com/items?itemName=CodeRabbit.coderabbit-vscode
- **BMad QA Commands**: See `CLAUDE.md` section on BMad QA Commands
- **Quality Gates**: See `.bmad-core/` documentation
- **Story 3.1.1**: `docs/stories/epic-3.1.story-1.md` (not yet created)

---

**Next Steps**:
1. Test CodeRabbit extension (run test review on current code)
2. When ready to start Story 3.1.1, follow "Quick Start Guide" section above
3. Document findings throughout story development
4. Compare with Quinn's QA review at the end
