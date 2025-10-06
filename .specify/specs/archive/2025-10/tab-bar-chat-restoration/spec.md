# Tab-Bar & Chat Restoration - Specification

**Status**: `approved`
**Created**: 2025-10-03
**Author**: QA-Integration-Reviewer Agent
**Stakeholders**: Frontend-Agent, Backend-Agent, Product Owner

---

## 1. Problem Statement

### Current Situation
During the "Gemini Polish" implementation sessions on 2025-10-02, **unauthorized changes** were made to the Tab-Bar navigation and ChatView component that deviated from the approved Visual Redesign Gemini specification:

1. **Tab-Bar changed from 3 tabs to 4 tabs**:
   - Original (approved): Home / Chat / Library
   - Current (unauthorized): Home / Generieren / Automatisieren / Profil

2. **ChatView heavily modified with inline styles**:
   - Large blocks of inline styles replacing Tailwind classes
   - Inconsistent with codebase styling standards
   - Difficult to maintain and update

3. **No SpecKit documentation** existed for these changes

### Pain Points
- **Navigation Confusion**: Users expect 3 tabs (Home/Chat/Library), not 4 tabs
- **Code Quality Degradation**: Inline styles make the codebase harder to maintain
- **Inconsistent Workflow**: Changes made without proper SpecKit planning violate project standards
- **Developer Confusion**: "Where is the Chat tab?" → It's now called "Generieren"
- **Lost Functionality**: Library tab disappeared from prominent position

### Opportunity
Restore the **original, approved 3-tab navigation** while keeping the **Gemini Design Language improvements** (Orange colors, Teal backgrounds, improved aesthetics).

---

## 2. Goals & Objectives

### Primary Goal
**Restore the original 3-tab navigation (Home/Chat/Library) with Gemini Design Language styling**

### Secondary Goals
- Replace inline styles with Tailwind classes in ChatView
- Move Profil to a floating button (top-right corner)
- Ensure all changes are properly documented in SpecKit
- Fix scroll issues in ChatView (padding-bottom: 80px for tab-bar clearance)

### Success Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Tab-Bar Structure | 3 tabs (Home/Chat/Library) | Visual inspection + Playwright screenshot |
| Inline Styles Removed | 0 inline styles in ChatView | Code review |
| Gemini Colors Preserved | Orange/Teal/Yellow intact | Visual inspection |
| Profil Accessible | Floating button visible | Playwright test |

---

## 3. User Stories

### Primary User Stories

#### Story 1: Restore 3-Tab Navigation
**Als** Teacher using the app
**möchte ich** die gewohnte 3-Tab-Navigation (Home/Chat/Library) haben
**damit** ich meine Materialien und Chats schnell finden kann

**Acceptance Criteria**:
- [ ] Tab-Bar hat genau 3 Tabs: Home, Chat, Library
- [ ] Tab icons sind konsistent: homeOutline, chatbubbleOutline, folderOutline
- [ ] Active state ist Orange (#FB6542) gemäß Gemini Design
- [ ] Inactive state ist Gray (#9ca3af)
- [ ] Tab-Bar ist fixed bottom mit 60px Höhe

#### Story 2: Clean Code with Tailwind Classes
**Als** Frontend Developer
**möchte ich** Tailwind-Klassen statt inline Styles verwenden
**damit** der Code wartbar und konsistent bleibt

**Acceptance Criteria**:
- [ ] Keine inline `style={{...}}` Attribute in ChatView
- [ ] Alle Styles via Tailwind classes (className="...")
- [ ] CSS Variables nur für Gemini Colors (`--color-primary`, etc.)
- [ ] Consistent spacing mit Tailwind scale (p-4, gap-3, etc.)

#### Story 3: Profil Button Accessible
**Als** Teacher
**möchte ich** mein Profil über einen floating Button erreichen
**damit** ich meine Einstellungen jederzeit anpassen kann

**Acceptance Criteria**:
- [ ] Profil Button ist top-right, fixed position
- [ ] Icon: personOutline (Ionic Icons)
- [ ] Gemini Orange background (#FB6542)
- [ ] Rounded-full (Tailwind)
- [ ] z-index: 1000 (above content)
- [ ] Min touch target: 44x44px (iOS guidelines)

### Secondary User Stories
- **Story 4**: ChatView scrolls correctly without overlapping tab-bar (padding-bottom: 80px)
- **Story 5**: All navigation transitions are smooth (no jarring tab switches)

---

## 4. Functional Requirements

### Must Have (P0)
- [ ] **REQ-001**: Tab-Bar has exactly 3 tabs: Home, Chat, Library
- [ ] **REQ-002**: ActiveTab type is `'home' | 'chat' | 'library'` (TypeScript)
- [ ] **REQ-003**: Tab icons use Ionic Icons: homeOutline, chatbubbleOutline, folderOutline
- [ ] **REQ-004**: Active tab color is Orange (#FB6542), inactive is Gray (#9ca3af)
- [ ] **REQ-005**: ChatView uses Tailwind classes exclusively (no inline styles)
- [ ] **REQ-006**: Profil is accessible via floating button (top-right corner)
- [ ] **REQ-007**: Tab-Bar is fixed bottom with white background and top border

### Should Have (P1)
- [ ] **REQ-008**: ChatView has padding-bottom: 80px to clear tab-bar
- [ ] **REQ-009**: All tab click handlers are stable useCallback hooks
- [ ] **REQ-010**: renderActiveContent uses useMemo for performance
- [ ] **REQ-011**: Tab-Bar has shadow effect (box-shadow: 0 -2px 8px rgba(0,0,0,0.1))

### Nice to Have (P2)
- [ ] **REQ-012**: Tab transitions use Framer Motion (fade in/out)
- [ ] **REQ-013**: Profil button has tooltip on hover

---

## 5. Non-Functional Requirements

### Performance
- [ ] Tab switching must be instant (<100ms perceived delay)
- [ ] No render loops (fixed in previous bug fixes)
- [ ] Tab-Bar does not re-render unnecessarily

### Security
- [ ] No security changes (navigation only)

### Usability
- [ ] Tab-Bar labels are in German (Home, Chat, Bibliothek)
- [ ] Touch targets are at least 44x44px (iOS guidelines)
- [ ] Color contrast meets WCAG AA standards

### Accessibility
- [ ] Tab buttons have semantic HTML (role="button")
- [ ] Active tab has aria-selected="true"
- [ ] Keyboard navigation works (Tab key, Enter to select)

### Compatibility
- [ ] Works on iOS Safari, Chrome Mobile, Desktop Chrome
- [ ] Fixed positioning works correctly on all devices

---

## 6. User Experience

### User Flows
```
Flow 1: Navigate to Chat
1. User taps "Chat" tab in bottom navigation
2. System highlights "Chat" tab in Orange
3. System renders ChatView component
4. User sees chat interface with Gemini styling

Flow 2: Access Profile
1. User taps floating Profil button (top-right)
2. System shows EnhancedProfileView modal/page
3. User edits profile settings
4. User closes modal → returns to previous tab
```

### UI/UX Considerations
- **Consistency**: 3-tab navigation matches industry standards (most apps have 3-5 tabs)
- **Discoverability**: Profil in top-right is standard pattern (many apps do this)
- **Clarity**: "Chat" is clearer than "Generieren" for teachers
- **Simplicity**: Library tab should be prominent (teachers use it frequently)

### Wireframes/Mockups
Reference: `.specify/specs/visual-redesign-gemini/` - Original approved design
- Tab-Bar: 3 tabs with Gemini Orange active state
- ChatView: Gemini Teal message bubbles, Orange user messages
- Profil: Floating button top-right

---

## 7. Scope & Boundaries

### In Scope
- Restore 3-tab navigation (Home/Chat/Library)
- Replace Tab-Bar inline styles with Tailwind classes
- Replace ChatView inline styles with Tailwind classes
- Add floating Profil button (top-right)
- Update ActiveTab TypeScript type
- Fix scroll issues (padding-bottom: 80px)
- Update all renderActiveContent switch cases

### Out of Scope
- Home View changes (keep existing Gemini improvements - they're good!)
- Library View changes (keep existing improvements)
- AgentModal changes (already correct)
- Gemini Design Language colors (already implemented correctly)
- Framer Motion animations (Phase 3.2 - not now)
- New features for Profil page (just make it accessible)

### Dependencies
- **Design Tokens**: Already exist in `teacher-assistant/frontend/src/lib/design-tokens.ts`
- **Gemini Colors**: Already configured in Tailwind (keep them)
- **Ionic Components**: No changes needed to Ionic itself

---

## 8. Risks & Assumptions

### Risks
| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| Breaking existing functionality | Low | High | Use Playwright E2E tests before/after |
| Users confused by tab change | Medium | Low | Change is actually reverting to original |
| CSS conflicts with Ionic | Low | Medium | Use Tailwind's important flag if needed |

### Assumptions
- Gemini Design Language colors are correct and should be kept
- Home View improvements from polish sessions are good (keep them)
- Teachers prefer "Chat" label over "Generieren" label
- 3-tab navigation is more intuitive than 4-tab

### Open Questions
- [x] Should Profil be a modal or separate page? → **Modal** (using EnhancedProfileView)
- [x] Should we keep "Automatisieren" anywhere? → **No** (not in Phase 3.1 scope)
- [x] What about the "Generieren" functionality? → **Rename back to "Chat"**

---

## 9. Timeline & Resources

### Estimated Timeline
- **Spec Review**: 30 minutes (2025-10-03)
- **Planning**: 1 hour (create plan.md, tasks.md)
- **Implementation**: 3-4 hours
  - TASK-001 to TASK-005: 2 hours (Tab-Bar changes)
  - TASK-006 to TASK-008: 1.5 hours (ChatView cleanup)
  - TASK-009: 30 minutes (Testing)
- **Testing & QA**: 1 hour (Playwright + Manual)
- **Deployment**: Immediate (no backend changes)

**Total**: ~6 hours (1 day)

### Required Resources
- **Agents**: Frontend-Agent (implementation), QA-Agent (testing)
- **External Services**: None
- **Infrastructure**: None (frontend-only changes)

---

## 10. Success Criteria

### Launch Criteria
- [ ] All P0 Requirements implemented (REQ-001 to REQ-007)
- [ ] All Playwright E2E tests passing
- [ ] Visual verification screenshots match expected design
- [ ] No inline styles in ChatView.tsx
- [ ] No console errors or warnings
- [ ] Session log completed with screenshots

### Post-Launch Monitoring
- User feedback on 3-tab navigation (vs. 4-tab)
- Developer feedback on code maintainability (Tailwind vs. inline)
- Check for any CSS regression issues

---

## Approval

### Reviewers
- [x] Product Owner (implicit - restoring approved design)
- [x] Tech Lead (QA-Integration-Reviewer creating this spec)
- [x] UX Designer (original Gemini design already approved)

### Approval Date
2025-10-03

### Change Log
| Date | Author | Changes |
|------|--------|---------|
| 2025-10-03 | QA-Integration-Reviewer | Initial draft |
| 2025-10-03 | QA-Integration-Reviewer | Approved (critical fix) |

---

## Next Steps
1. [x] Spec Review completed
2. [ ] Create `plan.md` (technical implementation details)
3. [ ] Create `tasks.md` (detailed task breakdown)
4. [ ] Frontend-Agent implements changes
5. [ ] QA-Agent verifies with Playwright tests
6. [ ] Session log created with before/after screenshots
