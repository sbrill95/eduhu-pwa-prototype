# ChatGPT Vision API Integration

**Feature**: ChatGPT can analyze generated images and answer questions about them
**Implementation Date**: 2025-10-05
**Related Task**: TASK-016

---

## Overview

The backend automatically detects when conversation messages contain images (generated via DALL-E) and includes them in the ChatGPT context using GPT-4 Vision API. This enables ChatGPT to "see" images and answer questions about their content.

---

## How It Works

### 1. Image Detection

Messages stored in InstantDB can have a `metadata` field containing image information:

```json
{
  "type": "image",
  "image_url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "library_id": "abc-123-xyz"
}
```

### 2. Automatic Formatting

When building the conversation context for ChatGPT, the backend automatically:
1. Detects messages with image metadata
2. Formats them as multimodal content for Vision API
3. Selects the appropriate Vision-capable model

**Input** (from InstantDB):
```typescript
{
  role: 'assistant',
  content: 'Ich habe ein Bild für dich erstellt.',
  metadata: '{"type":"image","image_url":"https://..."}'
}
```

**Output** (sent to OpenAI):
```typescript
{
  role: 'assistant',
  content: [
    { type: 'text', text: 'Ich habe ein Bild für dich erstellt.' },
    {
      type: 'image_url',
      image_url: {
        url: 'https://...',
        detail: 'auto'
      }
    }
  ]
}
```

### 3. Model Selection

- **With Images**: Uses `gpt-4o` (Vision-capable model)
- **Without Images**: Uses `gpt-4o-mini` (standard text model)

This selection happens automatically based on message content.

---

## API Usage

### Endpoint

```
POST /api/chat
```

### Request Format

The Vision integration is **automatic**. No special parameters needed.

**Standard Request** (text-only):
```json
{
  "messages": [
    { "role": "user", "content": "Was ist 2+2?" }
  ],
  "userId": "user-123"
}
```

**With Image Metadata** (Vision-enabled):
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Erstelle ein Bild von einem Löwen"
    },
    {
      "role": "assistant",
      "content": "Ich habe ein Bild für dich erstellt.",
      "metadata": "{\"type\":\"image\",\"image_url\":\"https://...\"}"
    },
    {
      "role": "user",
      "content": "Was siehst du auf dem Bild?"
    }
  ],
  "userId": "user-123"
}
```

### Response Format

Same as standard chat response:

```json
{
  "success": true,
  "data": {
    "message": "Auf dem Bild sehe ich einen majestätischen Löwen in der Savanne...",
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 50,
      "total_tokens": 200
    },
    "model": "gpt-4o",
    "finish_reason": "stop"
  },
  "timestamp": "2025-10-05T12:00:00.000Z"
}
```

---

## Cost Implications

### Vision API Pricing

- **GPT-4o with Vision**: ~$0.01 per image (1024x1024)
- **Regular GPT-4o**: ~$0.03 per 1K tokens
- **GPT-4o Mini**: ~$0.001 per 1K tokens

**Example Cost Calculation**:
- Generate image: $0.02 (DALL-E)
- Ask 3 questions about image: 3 × $0.01 = $0.03 (Vision API)
- Total: $0.05 per image + questions

### User Approval

Users have approved Vision integration in user feedback (Question 5).

### Optimization

To minimize costs:
1. Images are only included when present in conversation
2. Model automatically switches to cheaper `gpt-4o-mini` for text-only
3. Detail level is set to `auto` (GPT decides optimal resolution)

---

## Image URL Requirements

### Supported Formats

- PNG, JPEG, WEBP, non-animated GIF
- Max size: 20MB (DALL-E images are ~2-5MB)

### URL Expiration

**IMPORTANT**: DALL-E images expire after 1 hour!

**Best Practice**:
- Save images to library immediately after generation
- Use library URLs for long-term Vision access
- Backend logs when images are included for debugging

### Example URLs

**DALL-E Temporary** (expires in 1 hour):
```
https://oaidalleapiprodscus.blob.core.windows.net/private/...
```

**Library Permanent** (recommended for Vision):
```
https://your-storage.com/images/abc-123.png
```

---

## Error Handling

### Vision API Failures

If Vision API fails, the backend automatically:
1. Logs the error
2. Retries without images (text-only mode)
3. Uses standard model (`gpt-4o-mini`)

**User Impact**: Conversation continues, but ChatGPT can't see the image.

### Invalid Metadata

If message metadata is malformed:
- Error is logged
- Message is treated as regular text
- Conversation continues normally

### No Crashes

The Vision integration is designed for **graceful degradation**:
- Invalid JSON → Ignored, treated as text
- Missing `image_url` → Ignored
- Network error → Fallback to text-only

---

## Logging

### Vision Activation Logs

```
[info]: [chatService] Including image in conversation context
{
  "imageUrl": "https://oaidalleapiprodscus.blob.core.wi...",
  "role": "assistant",
  "hasLibraryId": true
}

[info]: [chatService] Vision API integration active
{
  "totalMessages": 5,
  "messagesWithImages": 2
}

[info]: [chatService] Building messages for OpenAI API
{
  "totalMessages": 5,
  "hasImages": true,
  "selectedModel": "gpt-4o",
  "needsVisionModel": true
}
```

### Error Logs

```
[error]: [chatService] Vision API error - retrying without images
{
  "error": "Image URL expired",
  "model": "gpt-4o",
  "fallbackModel": "gpt-4o-mini"
}
```

---

## Testing

### Manual Test Flow

1. **Generate Image**:
   ```
   User: "Erstelle ein Bild von einem Löwen in der Savanne"
   Assistant: [Generates image, saves with metadata]
   ```

2. **Ask About Image**:
   ```
   User: "Was siehst du auf dem Bild?"
   Assistant: "Auf dem Bild sehe ich einen majestätischen Löwen..."
   ```

3. **Verify Logs**:
   - Check for "Including image in conversation context"
   - Check for "Vision API integration active"
   - Verify model is `gpt-4o`

### Automated Tests

See: `teacher-assistant/backend/src/services/chatService.vision.test.ts`

- 6 unit tests covering all scenarios
- 100% test coverage for `processMessagesForVision()`

---

## Frontend Integration (Required)

**Current Status**: Backend ready, frontend needs update

### What Frontend Must Do

**Update**: `teacher-assistant/frontend/src/hooks/useChat.ts`

When sending messages to `/api/chat`, include the `metadata` field:

```typescript
const apiMessages = messages.map(msg => ({
  role: msg.role,
  content: msg.content,
  metadata: msg.metadata // ADD THIS LINE
}));
```

**Fetch from InstantDB**:
```typescript
const { data } = db.useQuery({
  messages: {
    $: {
      where: { session_id: sessionId }
    },
    // Ensure metadata is included in query
  }
});
```

---

## Future Enhancements

### Phase 1 (Optional)

1. **Image Caching**:
   - Save DALL-E images to permanent storage before 1-hour expiration
   - Use library copies for Vision API

2. **Detail Level Control**:
   - Allow users to select `low`, `high`, or `auto` detail
   - Lower detail = cheaper, faster
   - Higher detail = better analysis, more expensive

### Phase 2 (Optional)

1. **Cost Tracking**:
   - Track Vision API usage separately
   - Alert when costs exceed threshold
   - Show cost breakdown in user dashboard

2. **Vision Model Preferences**:
   - Let users opt-out of Vision (cost savings)
   - Configure auto-Vision threshold (e.g., only for last 3 images)

---

## Related Documentation

- **Implementation**: `chatService.ts` Lines 763-868
- **Tests**: `chatService.vision.test.ts`
- **Session Log**: `/docs/development-logs/sessions/2025-10-05/session-01-chatgpt-vision-integration.md`
- **SpecKit**: `.specify/specs/image-generation-ux-v2/`

---

**Last Updated**: 2025-10-05
**Status**: ✅ Backend Implementation Complete
**Next Step**: Frontend Integration Required
