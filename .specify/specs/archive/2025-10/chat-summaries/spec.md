# Feature Specification: Chat Summaries

**Feature Name**: Automatic Chat Summaries
**Version**: 1.0
**Date**: 2025-10-03
**Status**: Planning

---

## 1. Overview

### Problem Statement
Chats in the Library and on the Home screen ("Letzte Chats") currently show no meaningful preview or summary. Users cannot quickly identify what a chat was about without opening it.

### Solution
Automatically generate short, AI-powered summaries (max 20 characters) for each chat. Summaries are displayed in:
- **Home View**: "Letzte Chats" section
- **Library View**: Chat list items

### Goals
- Improve chat discoverability and navigation
- Provide quick context for saved chats
- Enhance user experience with compact, meaningful previews

### Non-Goals
- Multi-language summaries (German only for MVP)
- Updating summaries after generation (static once created)
- User-editable summaries (future consideration)

---

## 2. User Stories

### US-1: As a teacher, I want to see a short summary of my chats so I can quickly find relevant conversations
**Acceptance Criteria**:
- Chat summary is visible in Home "Letzte Chats" section
- Chat summary is visible in Library chat list
- Summary is max 20 characters
- Summary is generated automatically without user action

### US-2: As a teacher, I want summaries to be generated early so I don't have to wait
**Acceptance Criteria**:
- Summary is generated after 3 messages
- If user leaves chat with <3 messages, summary is generated on exit
- Summary remains static after generation

### US-3: As a teacher, I want summaries to be readable on all screen sizes
**Acceptance Criteria**:
- Font size adjusts dynamically based on summary length
- Minimum font size ensures readability
- Text truncates with ellipsis if needed
- Responsive across mobile viewport sizes (320px - 428px)

---

## 3. Requirements

### Functional Requirements

**FR-1: Summary Generation**
- Summary is generated via OpenAI API after:
  - 3 messages have been sent in the chat, OR
  - User navigates away from chat (even if <3 messages)
- Summary must be max 20 characters
- Summary is stored in InstantDB `chats` table as new field `summary: string`

**FR-2: Summary Prompt Design**
- Prompt receives first 3-4 messages of chat as context
- Prompt instructs AI to create a 20-character summary in German
- Summary should capture the main topic/intent of the conversation

**FR-3: Display Logic**
- Summary is displayed in:
  - `HomeView.tsx`: "Letzte Chats" section
  - `LibraryView.tsx`: Chat list items
- If no summary exists yet, show placeholder (e.g., "Neuer Chat")

**FR-4: Responsive Typography**
- Font size scales dynamically:
  - Shorter summaries: larger font (e.g., `text-sm` or `text-base`)
  - Longer summaries: smaller font (e.g., `text-xs`)
- Minimum font size: `text-xs` (0.75rem / 12px)
- Text overflow: ellipsis (`truncate` or `line-clamp-1`)

### Non-Functional Requirements

**NFR-1: Performance**
- Summary generation must not block chat UI
- API call timeout: 10 seconds max
- Retry logic: 1 retry on failure, then fallback to "Zusammenfassung fehlt"

**NFR-2: Data Integrity**
- Summary field is nullable in database (old chats have `null`)
- Summary is immutable after generation (no updates)
- **Note**: Future enhancement to update summaries will be addressed later

**NFR-3: Visual Design**
- Follows Gemini Design Language
- Font: Inter (default `font-sans`)
- Colors: Gray-700 for text (`text-gray-700`)
- Maintains visual hierarchy in chat lists

---

## 4. Success Criteria

1. ✅ **Summary Generation**: 95% of chats have summaries generated within 10 seconds
2. ✅ **Character Limit**: 100% of summaries are ≤20 characters
3. ✅ **Visual Verification**: Playwright screenshots confirm correct display on:
   - iPhone SE (375px), iPhone 12 Pro (390px), Pixel 5 (393px)
   - Home and Library views
4. ✅ **Readability**: Manual QA confirms summaries are meaningful and readable
5. ✅ **No Regressions**: Existing chat functionality remains unaffected

---

## 5. Out of Scope

- Updating summaries after generation (noted as future enhancement)
- User-customizable summaries
- Summary translation to other languages
- Summary generation for existing chats (migration script not included)

---

## 6. Dependencies

- OpenAI API (ChatGPT) for summary generation
- InstantDB schema update (new `summary` field)
- Existing chat service (`chatService.ts`)

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API failure | Summaries not generated | Retry logic + fallback text |
| Summary too long | UI overflow | Enforce 20-char limit in prompt + backend validation |
| Slow generation | Poor UX | Async generation + placeholder text |
| Character limit too restrictive | Summaries unclear | Monitor user feedback, adjust in future iteration |

---

## 8. Open Questions

- ❓ Should we backfill summaries for existing chats? (Decision: No for MVP)
- ❓ What if a chat has only 1 message and user leaves? (Decision: Generate summary anyway)

---

## 9. Approval

- [ ] Product Owner
- [ ] Technical Lead
- [ ] Design Review
