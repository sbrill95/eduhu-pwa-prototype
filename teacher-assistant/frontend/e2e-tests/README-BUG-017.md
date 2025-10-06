# BUG-017 E2E Test - Library Chat Continuation Context

## Purpose
This E2E test verifies that BUG-017 has been fixed: Chat context is now properly maintained when continuing a conversation from the Library.

## Test File
`bug-017-library-chat-continuation.spec.ts`

## What It Tests

### Test 1: Library Chat Continuation (Main Test)
**Purpose**: Verify that loaded chats from Library have full context

**Steps**:
1. Create new chat about "Photosynthese"
2. Navigate to Library and reload the chat
3. Send contextual follow-up: "Kannst du das noch erweitern?"
4. Verify AI response shows understanding of context
5. Check console logs for `[BUG-017 FIX]` confirmation

**Expected Result**:
- AI responds with content about Photosynthese
- Console log shows `dbMessages > 0`
- No "Was soll ich erweitern?" response

### Test 2: New Chats Regression Test
**Purpose**: Ensure new chats still work correctly after the fix

**Steps**:
1. Start a new chat (not from Library)
2. Send multiple messages
3. Verify context is maintained

**Expected Result**:
- New chats function normally
- Context is maintained across messages
- No breaking changes

### Test 3: Long Chat History
**Purpose**: Verify long conversations load correctly

**Steps**:
1. Create chat with 4+ message exchanges
2. Load from Library
3. Send contextual follow-up
4. Verify AI has context from all previous messages

**Expected Result**:
- All messages visible in UI
- Console log shows `dbMessages >= 8`
- AI response is contextual

## Running the Tests

### Prerequisites
1. Frontend dev server running: `npm run dev`
2. Backend server running
3. User is logged in to the app

### Run All BUG-017 Tests
```bash
cd teacher-assistant/frontend
npm run test:e2e -- bug-017-library-chat-continuation.spec.ts
```

### Run Specific Test
```bash
# Main test only
npm run test:e2e -- bug-017-library-chat-continuation.spec.ts -g "should maintain chat context"

# Regression test only
npm run test:e2e -- bug-017-library-chat-continuation.spec.ts -g "should work correctly with new chats"

# Long history test only
npm run test:e2e -- bug-017-library-chat-continuation.spec.ts -g "should handle long chat history"
```

### Run in UI Mode (Debugging)
```bash
npm run test:e2e -- --ui bug-017-library-chat-continuation.spec.ts
```

## Expected Console Logs

### When Loading Library Chat
```javascript
[BUG-017 FIX] Context for API: {
  totalMessages: 5,
  previousMessages: 4,
  dbMessages: 4,        // ✅ Should be > 0
  localMessages: 1      // New message
}
```

### When Using New Chat
```javascript
[BUG-017 FIX] Context for API: {
  totalMessages: 3,
  previousMessages: 2,
  dbMessages: 0,        // ✅ OK for new chat
  localMessages: 3      // All messages local
}
```

## Test Assertions

### Main Assertions
- ✅ Previous messages visible in UI after loading from Library
- ✅ AI response contains context-related keywords (Photosynthese, etc.)
- ✅ Console logs show `dbMessages > 0` for loaded chats
- ✅ No duplicate messages in conversation
- ✅ Messages in chronological order

### Edge Cases
- ✅ Empty library (no crash)
- ✅ Very long chat history (10+ messages)
- ✅ Multiple chat loads (context switch)
- ✅ Mixed new and loaded chats in same session

## Debugging Failed Tests

### Test Fails: AI Response Has No Context

**Check**:
1. Console logs for `[BUG-017 FIX]`
2. `dbMessages` should be > 0
3. Network tab: API request should include old messages

**Common Causes**:
- DB query not loading messages
- `stableMessages` is empty
- Code fix not applied correctly

### Test Fails: Console Log Not Found

**Check**:
1. Frontend dev server is running
2. Browser console is accessible
3. Page has finished loading

**Solution**:
- Increase timeout for log detection
- Check browser console manually

### Test Fails: Messages Not Visible in UI

**Check**:
1. InstantDB connection is working
2. User is authenticated
3. Database has messages

**Solution**:
- Verify InstantDB schema
- Check authentication state
- Manually verify DB has data

## Test Data Cleanup

**Note**: Tests create real chat sessions in the database.

### Manual Cleanup
Navigate to Library and delete test chats created during test runs.

### Automated Cleanup (Future Enhancement)
Consider implementing test data cleanup in `afterEach` hook:
```typescript
afterEach(async ({ page }) => {
  // Delete test chat sessions
  // TODO: Implement cleanup
});
```

## Related Files

- **Fix Implementation**: `src/hooks/useChat.ts` (Line 868-893)
- **Session Log**: `docs/development-logs/sessions/2025-10-04/session-01-bug-017-chat-context-fix.md`
- **Bug Report**: `docs/quality-assurance/bug-tracking.md` (BUG-017)
- **Manual Test Guide**: `MANUAL-TEST-BUG-017.md`

## Success Criteria

**BUG-017 is RESOLVED when**:
- ✅ All 3 E2E tests pass
- ✅ Manual testing confirms context preservation
- ✅ Console logs show correct `dbMessages` count
- ✅ No regression in new chat functionality
- ✅ User can continue conversations from Library seamlessly

## Maintenance

### When to Update This Test
- When chat loading logic changes
- When InstantDB schema changes
- When message display logic changes
- When adding new chat features

### Test Health Check
Run this test:
- ✅ Before each deployment
- ✅ After changing chat-related code
- ✅ Weekly as part of regression suite
- ✅ After InstantDB updates

## Questions?

**Contact**: react-frontend-developer agent
**Documentation**: See `BUG-017-FIX-SUMMARY.md` in project root
