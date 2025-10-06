# Feature Specification: Profile Redesign with Auto-Extraction

**Feature Name**: Smart Profile Auto-Extraction
**Version**: 1.0
**Date**: 2025-10-03
**Status**: Planning

---

## 1. Overview

### Problem Statement
The current profile system requires manual input of teacher characteristics (subjects, teaching style, etc.). This creates friction and leads to incomplete profiles. Users must navigate complex category structures that are visible in the UI, making the profile feel "administrative" rather than personal.

### Solution
Automatically extract profile characteristics from chat conversations using AI, combined with a frequency-based filtering system. The UI displays a simple, tag-based interface (Gemini Design) while maintaining internal categorization for system intelligence.

### Goals
- Reduce manual profile setup friction
- Build rich, accurate profiles automatically from natural conversations
- Create a delightful, personal profile experience (Gemini Design Language)
- Enable AI to learn about teachers organically over time

### Non-Goals
- Multi-language profile extraction (German only for MVP)
- Real-time profile updates during chat (batch processing)
- User profile sharing/export features

---

## 2. User Stories

### US-1: As a teacher, I want my profile to build automatically so I don't have to fill out forms
**Acceptance Criteria**:
- After 2-3+ message chats, profile characteristics are extracted automatically
- Extraction happens in background without user action
- No forms or manual category selection required

### US-2: As a teacher, I want to see only relevant profile tags so my profile reflects my actual teaching practice
**Acceptance Criteria**:
- Only characteristics mentioned ≥3 times appear in profile
- One-off mentions don't clutter the profile
- Profile tags feel personal and accurate

### US-3: As a teacher, I want to manually add profile tags so I can supplement auto-extracted data
**Acceptance Criteria**:
- "Merkmal hinzufügen +" button allows manual tag entry
- Manually added tags appear immediately in profile
- Manually added tags are auto-categorized on next profile load

### US-4: As a teacher, I want my profile to look beautiful and encouraging (Gemini Design)
**Acceptance Criteria**:
- Profile matches Gemini mockup visual design
- Profile sync indicator shows progress (e.g., "60%")
- Encouraging microcopy motivates engagement
- Orange/teal color scheme applied consistently

---

## 3. Requirements

### Functional Requirements

**FR-1: Automatic Characteristic Extraction**
- After each chat with ≥2-3 messages, extract 2-3 profile characteristics
- Extraction via OpenAI prompt that analyzes chat context
- Extraction focuses on:
  - Subjects taught (e.g., "Mathematik", "SOL")
  - Teaching principles (e.g., "Gruppenarbeit", "Differenzierung")
  - Grade levels (e.g., "Klasse 7", "Sekundarstufe I")
  - School type (e.g., "Gymnasium", "Gesamtschule")
  - Recurring topics/themes
- Avoid one-off mentions (e.g., don't extract "Arbeitsblatt" just because one was generated)

**FR-2: Frequency-Based Display Logic**
- Each extracted characteristic has a `count` field in database
- Characteristic appears in profile UI only if `count >= 3`
- When characteristic extracted again, increment count
- Database stores all characteristics (even count <3), but UI filters

**FR-3: Internal Categorization**
- Characteristics are categorized internally:
  - `subjects`: Subject areas (Mathematik, Englisch, SOL, etc.)
  - `gradeLevel`: Grade levels (Klasse 5, Klasse 7-9, etc.)
  - `teachingStyle`: Teaching methods (Gruppenarbeit, Frontalunterricht, etc.)
  - `schoolType`: School type (Gymnasium, Realschule, etc.)
  - `topics`: Recurring topics (Bruchrechnung, Photosynthese, etc.)
  - `uncategorized`: Fallback for unclassifiable tags
- Categories are NOT visible in UI
- Tags are displayed grouped by category (visual grouping without labels)

**FR-4: Manual Tag Addition**
- User clicks "Merkmal hinzufügen +" button
- Input field appears for free-text entry
- User enters tag (e.g., "Projektbasiertes Lernen")
- Tag appears immediately at end of tag list with `count: 1`
- On next profile load, tag is auto-categorized via OpenAI
- If user enters same tag again later, count increments

**FR-5: Profile Display (Gemini Design)**
- Header: "Dein Profil" + subtitle
- Profile sync indicator: Circle with percentage (e.g., "60%") + "Lernt dich kennen"
- Encouraging microcopy: "Je mehr du mit eduhu interagierst, desto besser werden die Vorschläge."
- Section: "Gelernte Merkmale"
- Tags displayed as chips with orange star icon + text + X (remove icon)
- Tags grouped by internal category (no category labels shown)
- "Merkmal hinzufügen +" button (orange, full-width)
- General info section below: Email, Name (if available)

**FR-6: Existing Profile Data Migration**
- Existing manually created profile categories/data can be preserved
- Migration: Convert old structured data to new tag-based system
- All old data gets `count: 3` (threshold met) to appear immediately

### Non-Functional Requirements

**NFR-1: Performance**
- Extraction happens asynchronously after chat ends
- Extraction must not block chat UI
- Extraction timeout: 15 seconds max
- Profile display loads in <2 seconds

**NFR-2: AI Quality**
- Extraction accuracy: ≥85% (verified via manual QA)
- Categorization accuracy: ≥80% (verified via manual QA)
- Prompt design emphasizes "recurring themes" not one-offs

**NFR-3: Visual Design**
- Follows Gemini Design Language
- Colors: Orange (#FB6542), Teal (#D3E4E6)
- Font: Inter (font-sans)
- Matches mockup pixel-perfect (verified via Playwright screenshots)

---

## 4. Success Criteria

1. ✅ **Automatic Extraction**: 90% of chats (≥3 messages) successfully extract 2-3 characteristics
2. ✅ **Frequency Filtering**: Only tags with `count >= 3` appear in profile UI
3. ✅ **Visual Match**: Playwright screenshots confirm pixel-perfect match to Gemini mockup
4. ✅ **Manual Tags**: Users can add tags manually, auto-categorized on next load
5. ✅ **No Regressions**: Existing profile data preserved (if user had manual entries)
6. ✅ **User Satisfaction**: QA testing confirms profile feels "personal" and accurate

---

## 5. Out of Scope

- Multi-language support (German only)
- Profile export/sharing
- Profile editing (removing tags manually) - Phase 2
- Profile sync percentage calculation (hardcoded to 60% for MVP)
- Profile history/timeline

---

## 6. Dependencies

- OpenAI API (ChatGPT) for extraction and categorization
- InstantDB schema update (new `profile_characteristics` table)
- Existing chat service integration
- Gemini Design System tokens

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI extracts irrelevant characteristics | Poor UX | Frequency threshold (count >= 3) filters noise |
| Extraction too slow | User frustration | Async processing + timeout |
| Categorization inaccurate | Poor grouping | Manual QA + prompt refinement |
| Mockup design too complex | Implementation delay | Break into subtasks, iterative screenshots |
| Existing profile data lost | User anger | Migration script with fallback |

---

## 8. Open Questions

- ❓ How is profile sync percentage calculated? (Decision: Hardcoded to 60% for MVP, real calculation in Phase 2)
- ❓ Can users delete tags manually? (Decision: No for MVP, Phase 2 feature)
- ❓ Should we show category labels in UI? (Decision: No, only visual grouping)
- ❓ What if user adds a tag that already exists? (Decision: Increment count, don't duplicate)

---

## 9. Design Reference

**Mockup Location**: `.specify/specs/Profil.png`

**Key Visual Elements**:
- Header: "Dein Profil" (orange, bold)
- Subtitle: "Passe an, wie eduhu dich unterstützt."
- Sync indicator: Circle with "60%" + confetti dots + "DEIN PROFIL-SYNC" label
- Microcopy: Encouraging, friendly tone
- Tag chips: Orange star icon + text + gray X icon
- "Merkmal hinzufügen +" button: Orange, rounded

---

## 10. Approval

- [ ] Product Owner
- [ ] Technical Lead
- [ ] Design Review
- [ ] UX Review
