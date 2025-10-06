# BUG-009: Chat Tagging - Testing Guide

## Prerequisites

### Backend Setup
1. **Backend must be running** on `http://localhost:3006`
2. **InstantDB must be configured** with App ID in `.env.development`
3. **OpenAI API key must be set** for tag extraction

### Test Data Requirements
- At least 3 chat sessions in InstantDB
- Chat sessions should have messages (for tag extraction)
- Some chats with tags, some without

## Testing Scenarios

### Test 1: Tag Display on Existing Chats

**Objective**: Verify tags display correctly for chats that already have tags

**Steps**:
1. Navigate to Library page
2. Switch to "Chat-Historie" tab (if not already selected)
3. Look for chat cards

**Expected Result**:
- Chat cards with tags show orange pill-shaped badges below description
- Tags use correct orange color scheme (primary-50 bg, primary-500 text/border)
- Tags are displayed in a flex-wrap layout
- Each tag is clickable with hover effect

**Visual Check**:
```
✅ Orange colored tags
✅ Rounded-full shape
✅ Hover effect changes background color
✅ Tags wrap on multiple lines if needed
✅ Proper spacing (gap-2)
```

### Test 2: Auto-Extraction for Chats Without Tags

**Objective**: Verify automatic tag extraction works

**Steps**:
1. Create a new chat session with some messages
2. Navigate to Library page
3. Open browser DevTools Console
4. Watch for log messages

**Expected Result**:
- Console shows: "Auto-extracting tags for X chats without tags"
- Console shows: "Tags extracted for chat {chatId}: [...]"
- Tags appear on chat card within 2-3 seconds
- No more than 3 chats are processed simultaneously

**Console Output Example**:
```
[Library] Auto-extracting tags for 2 chats without tags
Tags extracted for chat abc123: [
  {label: "Mathematik", category: "subject"},
  {label: "Bruchrechnung", category: "topic"}
]
```

### Test 3: Tag-Based Search

**Objective**: Verify search works with tags

**Setup**: Ensure you have a chat with the tag "Mathematik"

**Steps**:
1. Go to Library page, Chat-Historie tab
2. Type "Mathematik" in search bar
3. Observe filtered results

**Expected Result**:
- Only chats with "Mathematik" in title, content, OR tags are shown
- Chat count updates correctly
- Clearing search shows all chats again

**Test Cases**:
| Search Query | Should Match Chats With |
|--------------|------------------------|
| "Mathematik" | Tag="Mathematik" OR title contains "Mathematik" |
| "Klasse 5" | Tag="Klasse 5" OR content contains "Klasse 5" |
| "quiz" | Tag="Quiz" OR title contains "quiz" |

### Test 4: Click Tag to Filter

**Objective**: Verify clicking a tag filters the list

**Steps**:
1. Find a chat card with tags
2. Click on one of the tags (e.g., "Mathematik")
3. Observe behavior

**Expected Result**:
- Search query is set to the clicked tag
- Chat list is filtered to show only matching chats
- Search input shows the tag name
- Click event doesn't trigger chat selection (e.stopPropagation works)

**Visual Check**:
```
Before Click:
[Search: empty]
10 chats shown

After Clicking "Mathematik" Tag:
[Search: Mathematik]
3 chats shown (only those with Mathematik tag/title/content)
```

### Test 5: No Duplicate Extraction Requests

**Objective**: Verify extraction state tracking prevents duplicates

**Steps**:
1. Clear all tags from InstantDB (or use fresh data)
2. Open Library page
3. Open Network tab in DevTools
4. Filter to show XHR/Fetch requests to `/api/chat/*/tags`

**Expected Result**:
- Only ONE POST request per chat without tags
- Maximum 3 POST requests total (rate limiting)
- No duplicate requests for the same chatId

**Network Tab Check**:
```
POST /api/chat/abc123/tags  → Status: 200
POST /api/chat/def456/tags  → Status: 200
POST /api/chat/ghi789/tags  → Status: 200
(No more requests)
```

### Test 6: Tag Parsing Edge Cases

**Objective**: Test various tag data formats

**Test Cases**:

#### Case 1: Empty Tags
```json
// chat_sessions.tags = "[]"
Expected: No tags displayed, auto-extraction triggered
```

#### Case 2: String Tags (Legacy Format)
```json
// chat_sessions.tags = '["Mathematik", "Quiz"]'
Expected: Tags display as "Mathematik", "Quiz"
```

#### Case 3: ChatTag Object Format
```json
// chat_sessions.tags = '[{"label":"Mathematik","category":"subject"}]'
Expected: Tags display as "Mathematik"
```

#### Case 4: Malformed JSON
```json
// chat_sessions.tags = "invalid json"
Expected: No tags displayed, error logged to console
```

### Test 7: Responsive Design

**Objective**: Verify tags work on different screen sizes

**Steps**:
1. Open Library page on desktop
2. Resize browser to mobile width (375px)
3. Check tag display

**Expected Result**:

**Desktop (1440px)**:
- All tags on single line if space permits
- Wraps to multiple lines if needed
- Proper spacing maintained

**Mobile (375px)**:
- Tags wrap to multiple lines
- No horizontal overflow
- Touch targets are adequate (44px minimum)
- Spacing preserved

### Test 8: Search Placeholder Text

**Objective**: Verify updated placeholder

**Steps**:
1. Go to Library page
2. Click on Chat-Historie tab
3. Check search input placeholder

**Expected Result**:
- Placeholder reads: "Chats durchsuchen (Titel, Inhalt oder Tags)..."
- Not the old placeholder: "Chats durchsuchen..."

**When switching to Materialien tab**:
- Placeholder changes to: "Materialien durchsuchen..."

### Test 9: Performance Testing

**Objective**: Ensure no performance degradation

**Steps**:
1. Create 50+ chat sessions
2. Navigate to Library page
3. Monitor performance

**Expected Result**:
- Page loads within 1-2 seconds
- No UI freezing or lag
- Smooth scrolling
- Tags render without delay

**Performance Metrics**:
- Initial render: < 500ms
- Tag extraction: 1-3 seconds (async, non-blocking)
- Search filtering: < 100ms

### Test 10: Error Handling

**Objective**: Verify graceful error handling

**Test Scenarios**:

#### Scenario 1: Backend Offline
```
1. Stop backend server
2. Open Library page
3. Expected: Tags don't display, but page works
4. Console shows fetch error, not a crash
```

#### Scenario 2: Invalid API Response
```
1. Mock API to return invalid JSON
2. Expected: Tags don't display, error logged
3. No UI crash or blank page
```

#### Scenario 3: Rate Limit Hit
```
1. Trigger many tag extraction requests
2. Expected: Some fail gracefully
3. User sees console errors but UI works
```

## Manual Testing Checklist

Copy this checklist and mark completed tests:

```
[ ] Test 1: Tag Display on Existing Chats
    [ ] Orange color scheme correct
    [ ] Rounded-full shape
    [ ] Hover effect works
    [ ] Tags wrap properly

[ ] Test 2: Auto-Extraction for Chats Without Tags
    [ ] Console logs show extraction
    [ ] Tags appear within 2-3 seconds
    [ ] Max 3 concurrent extractions

[ ] Test 3: Tag-Based Search
    [ ] Search by tag name works
    [ ] Chat count updates
    [ ] Clear search works

[ ] Test 4: Click Tag to Filter
    [ ] Tag click sets search query
    [ ] List filters correctly
    [ ] No chat selection triggered

[ ] Test 5: No Duplicate Extraction
    [ ] Only one request per chat
    [ ] Max 3 requests total
    [ ] No duplicates in network tab

[ ] Test 6: Tag Parsing Edge Cases
    [ ] Empty tags handled
    [ ] String tags work
    [ ] ChatTag objects work
    [ ] Malformed JSON handled

[ ] Test 7: Responsive Design
    [ ] Desktop layout correct
    [ ] Mobile layout correct
    [ ] Tags wrap on small screens

[ ] Test 8: Search Placeholder
    [ ] Correct placeholder on Chat tab
    [ ] Correct placeholder on Materials tab

[ ] Test 9: Performance
    [ ] Fast initial load
    [ ] Smooth scrolling
    [ ] No lag with many chats

[ ] Test 10: Error Handling
    [ ] Backend offline handled
    [ ] Invalid responses handled
    [ ] Rate limits handled
```

## Debugging Tips

### Issue: Tags Not Displaying

**Check**:
1. InstantDB query returning data? Check `chatData?.chat_sessions`
2. Tags field populated? Check `session.tags` in console
3. JSON parsing working? Check console for parse errors

### Issue: Auto-Extraction Not Triggering

**Check**:
1. Backend running? Check `http://localhost:3006/api/health`
2. Chat has messages? Empty chats can't extract tags
3. Already has tags? Check `session.tags` isn't already set

### Issue: Search Not Working

**Check**:
1. Search query state updating? Log `searchQuery` value
2. Filter logic correct? Check `filteredItems` array
3. Tags parsed correctly? Check `chat.tags` array

### Issue: Duplicate Requests

**Check**:
1. `extractingTags` Set working? Log state updates
2. useEffect dependencies correct? Check dependency array
3. Multiple renders? Use React DevTools Profiler

## Browser DevTools Setup

### Console Filters
```
Filter: "Tags extracted"  → See extraction results
Filter: "Error"           → See parsing/fetch errors
Filter: "Auto-extracting" → See auto-extraction triggers
```

### Network Tab
```
Filter: /tags             → Show tag API requests
Show: XHR/Fetch          → Filter to AJAX only
Preserve log: ✓          → Keep requests across navigation
```

### React DevTools
```
Component: Library
Props: chatData, materials
State: searchQuery, extractingTags
```

## Automated Testing (Future)

### Unit Tests to Add
```typescript
// useChatTags.test.ts
test('fetches tags for chatId', async () => { ... })
test('handles fetch errors gracefully', async () => { ... })
test('prevents duplicate extractions', async () => { ... })

// Library.test.tsx
test('displays tags under chat cards', () => { ... })
test('filters by tag on click', () => { ... })
test('searches by tag name', () => { ... })
```

### Integration Tests to Add
```typescript
// Library.integration.test.tsx
test('auto-extracts tags on first load', async () => { ... })
test('tags sync from InstantDB real-time', async () => { ... })
test('search works with title, content, and tags', async () => { ... })
```

## Success Criteria

The implementation is considered successful when:

✅ All 10 manual tests pass
✅ No console errors during normal operation
✅ Tags display with correct styling
✅ Auto-extraction works for chats without tags
✅ Search includes tag matching
✅ Click-to-filter works smoothly
✅ No duplicate API requests
✅ Responsive on mobile and desktop
✅ Performance is acceptable (< 2s page load)
✅ Error handling is graceful

## Reporting Issues

If you find a bug, report with:

1. **Test Number**: Which test failed
2. **Steps**: Exact steps to reproduce
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Console Logs**: Any errors or warnings
6. **Network Tab**: Relevant API requests
7. **Browser**: Chrome/Firefox/Safari version
8. **Screen Size**: Desktop/Mobile dimensions

## Next Steps After Testing

Once all tests pass:
1. Document any issues found
2. Create automated tests for critical paths
3. Update user documentation
4. Deploy to staging environment
5. Conduct user acceptance testing
