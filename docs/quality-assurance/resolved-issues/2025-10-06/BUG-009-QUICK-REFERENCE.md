# BUG-009: Chat Tagging Quick Reference

## Overview
Chat sessions now support AI-powered tagging for better organization and search. Tags are automatically extracted using OpenAI and stored in InstantDB.

## Files Modified/Created

### Created
- `teacher-assistant/frontend/src/hooks/useChatTags.ts` - Custom hook for tag management

### Modified
- `teacher-assistant/frontend/src/pages/Library/Library.tsx` - Tag display and search
- `teacher-assistant/frontend/src/hooks/index.ts` - Export useChatTags hook

## Quick Usage

### Import the Hook
```typescript
import { useChatTags } from '../../hooks';
```

### Fetch Tags for a Chat
```typescript
const { tags, tagLabels, isLoading, error, extractTags } = useChatTags(chatId);
```

### Display Tags in UI
```tsx
{chat.tags && chat.tags.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {chat.tags.map((tag, idx) => (
      <span
        key={idx}
        className="px-2 py-1 bg-primary-50 text-primary-500 text-xs rounded-full border border-primary-500 cursor-pointer hover:bg-primary-100"
      >
        {tag}
      </span>
    ))}
  </div>
)}
```

### Trigger Tag Extraction
```typescript
// Auto-extract (won't regenerate if tags exist)
await extractTags();

// Force regenerate
await extractTags(true);
```

## API Endpoints

### GET Tags
```
GET /api/chat/:chatId/tags
Response: { success: true, data: { tags: ChatTag[], chatId: string } }
```

### Extract Tags (POST)
```
POST /api/chat/:chatId/tags
Body: { forceRegenerate?: boolean }
Response: { success: true, data: { tags: ChatTag[], tagCount: number } }
```

### Update Tags (PUT)
```
PUT /api/chat/:chatId/tags
Body: { tags: ChatTag[] }
Response: { success: true, data: { tags: ChatTag[], tagCount: number } }
```

### Delete Tags
```
DELETE /api/chat/:chatId/tags
Response: { success: true, data: { chatId: string } }
```

## Tag Structure

### ChatTag Interface
```typescript
interface ChatTag {
  label: string;
  category: 'subject' | 'topic' | 'grade_level' | 'material_type' | 'general';
  confidence?: number;
}
```

### InstantDB Storage
```typescript
// Stored in chat_sessions.tags as JSON string
tags: i.string().optional()

// Example value:
'[{"label":"Mathematik","category":"subject"},{"label":"Klasse 5","category":"grade_level"}]'
```

## Tag Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `subject` | School subject | Mathematik, Deutsch, Englisch |
| `topic` | Specific topic | Bruchrechnung, Simple Past, Photosynthese |
| `grade_level` | Grade/age level | Klasse 5, Oberstufe, Grundschule |
| `material_type` | Type of material | Arbeitsblatt, Quiz, Präsentation |
| `general` | General concepts | Gruppenarbeit, Hausaufgaben, Differenzierung |

## Styling Guide

### Tag Pill Colors
```css
/* Background */
bg-primary-50    /* #FFF4ED - Light orange */

/* Text & Border */
text-primary-500 /* #F97316 - Orange */
border-primary-500

/* Hover */
hover:bg-primary-100 /* #FFEDD5 - Slightly darker orange */
```

### Tag Pill Classes
```
px-2 py-1         /* Padding */
text-xs           /* Small text */
rounded-full      /* Fully rounded */
cursor-pointer    /* Clickable cursor */
```

## Common Patterns

### Pattern 1: Display Tags from InstantDB
```typescript
// Parse tags from chat session
const parsedTags = session.tags
  ? JSON.parse(session.tags).map(tag => tag.label)
  : [];

// Display
{parsedTags.map(tag => (
  <span className="tag-pill">{tag}</span>
))}
```

### Pattern 2: Search with Tags
```typescript
const matchesSearch =
  title.includes(query) ||
  content.includes(query) ||
  tags.some(tag => tag.includes(query));
```

### Pattern 3: Click Tag to Filter
```tsx
<span
  onClick={(e) => {
    e.stopPropagation(); // Don't trigger parent click
    setSearchQuery(tag);
  }}
>
  {tag}
</span>
```

### Pattern 4: Auto-Extract on Load
```typescript
useEffect(() => {
  const chatsWithoutTags = chats
    .filter(chat => !chat.tags || chat.tags === '[]')
    .slice(0, 3); // Limit to 3

  chatsWithoutTags.forEach(chat => {
    autoExtractTags(chat.id);
  });
}, [chats]);
```

## Performance Tips

1. **Fetch from InstantDB**: Don't make separate API calls for each chat
2. **Limit Extractions**: Only extract tags for first 3 chats per load
3. **Track State**: Use Set to prevent duplicate extraction requests
4. **Client-Side Filter**: Don't hit backend for search/filter operations

## Error Handling

### Parsing Errors
```typescript
try {
  const tags = JSON.parse(session.tags);
} catch (err) {
  console.error('Tag parse error:', err);
  // Fallback to empty array
  return [];
}
```

### Fetch Errors
```typescript
try {
  const response = await fetch(`/api/chat/${chatId}/tags`);
  if (!response.ok) throw new Error(response.statusText);
  // ... handle response
} catch (err) {
  console.error('Tag fetch error:', err);
  // Don't block UI, just log error
}
```

## Debugging

### Check Tags in Console
```javascript
// In browser console
const chatData = await db.useQuery({ chat_sessions: {} });
console.log(chatData.chat_sessions[0].tags);
```

### Monitor Tag Extraction
```javascript
// In Library component
console.log('Auto-extracting tags for', chatsWithoutTags.length, 'chats');
```

### Network Tab Filters
```
Filter: /tags
Show: XHR/Fetch
```

## Testing Commands

### Start Frontend
```bash
cd teacher-assistant/frontend
npm run dev
```

### Start Backend
```bash
cd teacher-assistant/backend
npm run dev
```

### Run Type Check
```bash
npm run build
```

## Common Issues & Solutions

### Issue: Tags Not Displaying
**Solution**: Check if `session.tags` is populated in InstantDB

### Issue: Auto-Extraction Not Working
**Solution**: Ensure backend is running on `http://localhost:3006`

### Issue: Tags Parse Error
**Solution**: Check tag format in InstantDB - should be valid JSON array

### Issue: Duplicate Requests
**Solution**: Check `extractingTags` Set is properly tracking state

## Migration Notes

### From Old Format (if applicable)
```typescript
// Old: Array of strings
tags: ["Mathematik", "Quiz"]

// New: Array of ChatTag objects
tags: [
  { label: "Mathematik", category: "subject" },
  { label: "Quiz", category: "material_type" }
]

// Parsing handles both formats
parsedTags = tags.map(tag =>
  typeof tag === 'string' ? tag : tag.label
)
```

## Related Documentation

- [InstantDB Schema](teacher-assistant/backend/src/schemas/instantdb.ts)
- [Chat Tag Service](teacher-assistant/backend/src/services/chatTagService.ts)
- [Chat Tags Routes](teacher-assistant/backend/src/routes/chatTags.ts)
- [Library Component](teacher-assistant/frontend/src/pages/Library/Library.tsx)

## Future Enhancements

1. **Manual Tag Editing**: UI to add/remove tags manually
2. **Tag Filtering UI**: Dedicated filter chips like material filters
3. **Tag Statistics**: Show most common tags across all chats
4. **Tag Suggestions**: Auto-suggest tags as user types
5. **Batch Operations**: Extract tags for all chats at once
6. **Tag Categories Display**: Group tags by category with icons

## Support

For questions or issues:
1. Check this Quick Reference
2. Review Implementation Report (BUG-009-IMPLEMENTATION-REPORT.md)
3. Check Testing Guide (BUG-009-TESTING-GUIDE.md)
4. Review Visual Examples (BUG-009-VISUAL-EXAMPLE.md)
