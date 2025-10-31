# API Contract: Vision Tagging Endpoint

**Feature**: `003-agent-confirmation-ux`
**Endpoint**: `POST /api/vision/tag-image`
**Purpose**: Automatically generate searchable tags for educational images using ChatGPT Vision API

## Overview

This endpoint analyzes an image using OpenAI's GPT-4o vision model and generates 5-10 relevant German-language tags for searchability. Tags focus on educational context (subject, topic, visual elements, perspective).

## Authentication

**Required**: Yes (same auth as existing chat endpoints)
**Method**: Session-based authentication via InstantDB user token

## Request

### HTTP Method
```
POST /api/vision/tag-image
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <instantdb-token>
```

### Request Body

```typescript
interface TagImageRequest {
  /**
   * URL of the image to analyze
   * Must be publicly accessible or InstantDB storage URL
   * @example "https://api.instantdb.com/storage/abc123/image.png"
   */
  imageUrl: string;

  /**
   * Optional context to improve tagging accuracy
   */
  context?: {
    /**
     * Image title from generation prompt
     * @example "Anatomischer Löwe für Biologieunterricht"
     */
    title?: string;

    /**
     * Original generation description
     * @example "Seitenansicht eines Löwen mit sichtbarer Muskulatur"
     */
    description?: string;

    /**
     * Subject area
     * @example "Biologie"
     */
    subject?: string;

    /**
     * Grade/learning group
     * @example "Klasse 8a"
     */
    grade?: string;
  };

  /**
   * Maximum number of tags to generate
   * Default: 10, Max: 15
   */
  maxTags?: number;
}
```

### Example Request

```bash
curl -X POST https://api.example.com/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "imageUrl": "https://api.instantdb.com/storage/xyz789/lion.png",
    "context": {
      "title": "Anatomischer Löwe für Biologieunterricht",
      "description": "Seitenansicht eines Löwen mit Muskeln und Skelett",
      "subject": "Biologie",
      "grade": "Klasse 8a"
    },
    "maxTags": 10
  }'
```

---

## Response

### Success Response (200 OK)

```typescript
interface TagImageResponse {
  /**
   * Status of the tagging operation
   */
  success: true;

  /**
   * Response data
   */
  data: {
    /**
     * Generated tags (lowercase, deduplicated)
     * Sorted by relevance
     * @example ["anatomie", "biologie", "löwe", "seitenansicht", "säugetier", "muskulatur", "skelett"]
     */
    tags: string[];

    /**
     * Confidence level of the tagging
     * Based on Vision API response quality
     */
    confidence: 'high' | 'medium' | 'low';

    /**
     * Model used for tagging
     * @example "gpt-4o"
     */
    model: string;

    /**
     * Processing time in milliseconds
     */
    processingTime: number;
  };
}
```

### Example Success Response

```json
{
  "success": true,
  "data": {
    "tags": [
      "anatomie",
      "biologie",
      "löwe",
      "seitenansicht",
      "säugetier",
      "muskulatur",
      "skelett",
      "raubkatze",
      "wirbeltier",
      "zoologie"
    ],
    "confidence": "high",
    "model": "gpt-4o",
    "processingTime": 1850
  }
}
```

---

### Error Responses

#### 400 Bad Request - Invalid Input

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Example**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_URL",
    "message": "imageUrl is required and must be a valid URL",
    "details": {
      "field": "imageUrl",
      "value": null
    }
  }
}
```

**Possible Error Codes**:
- `INVALID_IMAGE_URL`: Missing or malformed imageUrl
- `INVALID_MAX_TAGS`: maxTags exceeds limit (15)
- `MISSING_AUTH`: No authentication token provided

---

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

#### 404 Not Found - Image Not Accessible

```json
{
  "success": false,
  "error": {
    "code": "IMAGE_NOT_FOUND",
    "message": "Image URL returned 404. Image may have expired or been deleted.",
    "details": {
      "imageUrl": "https://api.instantdb.com/storage/xyz789/lion.png",
      "statusCode": 404
    }
  }
}
```

---

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many tagging requests. Please try again in 60 seconds.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

#### 500 Internal Server Error - Vision API Failure

```json
{
  "success": false,
  "error": {
    "code": "VISION_API_ERROR",
    "message": "Failed to analyze image with Vision API",
    "details": {
      "reason": "OpenAI API timeout",
      "retryable": true
    }
  }
}
```

**Possible Internal Error Codes**:
- `VISION_API_ERROR`: OpenAI API failed
- `VISION_API_TIMEOUT`: Request took >30 seconds
- `INVALID_RESPONSE_FORMAT`: Vision API returned unparseable response
- `INTERNAL_ERROR`: Unexpected server error

---

#### 503 Service Unavailable

```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Vision API is temporarily unavailable. Please try again later."
  }
}
```

---

## Vision API Prompt Template

**Internal Implementation Detail** (for backend developers):

```typescript
const VISION_PROMPT = `
Analysiere dieses Bildungsmaterial und generiere 5-10 relevante Tags auf Deutsch für Suchzwecke.

Berücksichtige:
- Fachgebiet (z.B. Mathematik, Biologie, Geschichte, Physik)
- Thema/Konzept (z.B. Pythagoras, Anatomie, Französische Revolution)
- Visuelle Elemente (z.B. Diagramm, Illustration, Foto, Cartoon)
- Bildungskontext (z.B. Grundschule, Sekundarstufe I, Sekundarstufe II)
- Perspektive/Stil (z.B. Frontalansicht, Seitenansicht, abstrakt, realistisch)
- Objekte/Personen (z.B. Löwe, Lehrer, Gebäude)

Kontext (falls verfügbar):
${context.title ? `Titel: ${context.title}` : ''}
${context.description ? `Beschreibung: ${context.description}` : ''}
${context.subject ? `Fach: ${context.subject}` : ''}
${context.grade ? `Klasse: ${context.grade}` : ''}

WICHTIG:
- Antwort als JSON array: ["tag1", "tag2", "tag3"]
- Maximal ${maxTags} Tags
- Keine Duplikate
- Alles lowercase (kleinschreibung)
- Keine Artikel (der/die/das)
- Nur relevante, durchsuchbare Begriffe
- Fokus auf Bildungsrelevanz

Beispiel gute Antwort: ["anatomie", "biologie", "säugetier", "löwe", "muskulatur", "seitenansicht", "zoologie"]
`;
```

---

## Rate Limiting

**Limits**:
- 100 requests per hour per user
- 10 requests per minute per user

**Headers** (included in all responses):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1697123456
```

---

## Performance Expectations

**Typical Response Times**:
- 50th percentile (p50): 1.5 seconds
- 95th percentile (p95): 4 seconds
- 99th percentile (p99): 8 seconds

**Timeout**: 30 seconds (hard limit)

**Cost** (per request):
- OpenAI API: ~$0.01 (GPT-4o vision)
- Total: ~$0.01

---

## Error Handling Strategy

**For Callers** (Frontend/Backend Integration):

1. **Non-Blocking**: Tagging should NOT block image creation
   ```typescript
   // GOOD: Fire and forget
   generateImage().then(imageUrl => {
     saveToLibrary(imageUrl); // Immediate
     tagImage(imageUrl).catch(err => console.error('Tagging failed:', err)); // Async
   });

   // BAD: Blocking
   const imageUrl = await generateImage();
   const tags = await tagImage(imageUrl); // Blocks user workflow
   await saveToLibrary(imageUrl, tags);
   ```

2. **Graceful Degradation**: If tagging fails, save material with empty tags
   ```typescript
   try {
     const { tags } = await tagImage(imageUrl);
     metadata.tags = tags;
   } catch (error) {
     console.error('Tagging failed, continuing without tags:', error);
     metadata.tags = []; // Empty tags, search still works
   }
   ```

3. **Retry Logic** (optional):
   ```typescript
   const tagWithRetry = async (imageUrl: string, maxRetries = 3) => {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await tagImage(imageUrl);
       } catch (error) {
         if (error.code === 'VISION_API_TIMEOUT' && i < maxRetries - 1) {
           await sleep(1000 * (i + 1)); // Exponential backoff
           continue;
         }
         throw error;
       }
     }
   };
   ```

---

## Testing

### Manual Test Cases

**Test 1: Successful Tagging**
```bash
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://api.instantdb.com/storage/test/lion.png",
    "context": {
      "title": "Anatomischer Löwe",
      "subject": "Biologie"
    }
  }'

# Expected: 200 OK with tags array
```

**Test 2: Invalid URL**
```bash
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{ "imageUrl": "not-a-url" }'

# Expected: 400 Bad Request
```

**Test 3: Image Not Found**
```bash
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{ "imageUrl": "https://api.instantdb.com/storage/nonexistent.png" }'

# Expected: 404 Not Found
```

**Test 4: Timeout Simulation**
```bash
# Set Vision API timeout to 1 second (in test environment)
curl -X POST http://localhost:3006/api/vision/tag-image \
  -H "Content-Type: application/json" \
  -d '{ "imageUrl": "https://httpbin.org/delay/5" }'

# Expected: 500 Internal Server Error with VISION_API_TIMEOUT
```

---

## Implementation Checklist

**Backend Tasks**:
- [ ] Create `/api/vision/tag-image` route handler
- [ ] Integrate OpenAI GPT-4o vision API
- [ ] Implement rate limiting (100/hour, 10/min)
- [ ] Add input validation (URL format, maxTags range)
- [ ] Handle image fetch errors (404, timeout)
- [ ] Parse Vision API response → tags array
- [ ] Normalize tags (lowercase, deduplicate)
- [ ] Add logging for all errors
- [ ] Write unit tests for tag normalization
- [ ] Write integration tests for Vision API

**Frontend Tasks**:
- [ ] Create `tagImage()` service function
- [ ] Integrate with image generation workflow (non-blocking)
- [ ] Handle errors gracefully (continue without tags)
- [ ] Update Library search to include tags
- [ ] Add tag display in MaterialPreviewModal (optional)
- [ ] Test with real images from DALL-E

---

## Security Considerations

1. **Authentication**: All requests must include valid InstantDB token
2. **Authorization**: Users can only tag their own materials
3. **Input Validation**: Sanitize imageUrl to prevent SSRF attacks
4. **Rate Limiting**: Prevent abuse and cost overruns
5. **Image URL Validation**: Only allow InstantDB storage URLs or whitelisted domains

---

## Future Enhancements (Out of Scope for MVP)

- Batch tagging endpoint (`POST /api/vision/tag-images-batch`)
- Tag suggestions for manual materials
- Multi-language support (English, French)
- Custom tag taxonomies per subject
- Tag confidence scores in UI
- Tag editing/approval workflow

---

## References

- OpenAI Vision API: https://platform.openai.com/docs/guides/vision
- Rate Limiting: https://www.npmjs.com/package/express-rate-limit
- InstantDB Storage: https://instantdb.com/docs/storage
- Feature Spec: `specs/003-agent-confirmation-ux/spec.md`
- Data Model: `specs/003-agent-confirmation-ux/data-model.md`
