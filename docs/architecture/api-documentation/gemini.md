# Gemini API Integration Documentation

## Overview

The Teacher Assistant application integrates with Google's Gemini 2.5 Flash API for image analysis and editing capabilities. This document provides comprehensive information about the integration, setup, usage, and troubleshooting.

**Status**: Implemented in Story 3.1.1 (Epic 3.1)
**Version**: 1.0.0
**Package**: `@google/generative-ai` v0.24.1
**Model**: `gemini-2.5-flash-002`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [API Key Setup](#api-key-setup)
3. [Service Architecture](#service-architecture)
4. [Usage Examples](#usage-examples)
5. [API Limits & Pricing](#api-limits--pricing)
6. [Error Handling](#error-handling)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Quick Start

### Installation

```bash
cd teacher-assistant/backend
npm install @google/generative-ai
```

### Configuration

Add your Gemini API key to `.env`:

```env
GOOGLE_AI_API_KEY=your_api_key_here
```

### Basic Usage

```typescript
import { GeminiImageService } from './services/geminiImageService';

const geminiService = new GeminiImageService();

const result = await geminiService.editImage({
  imageBase64: 'data:image/png;base64,...',
  instruction: 'Make the image brighter',
  userId: 'user-123',
  imageId: 'image-456',
});

console.log('Edited image:', result.editedImageUrl);
```

---

## API Key Setup

### Step 1: Create Google AI Studio Account

1. Go to [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account
3. Accept the terms of service

### Step 2: Generate API Key

1. Navigate to "Get API Key" in the left sidebar
2. Click "Create API Key"
3. Choose "Create API key in new project" or select an existing project
4. Copy the generated API key

**Security Warning**: Never commit your API key to version control. Use environment variables only.

### Step 3: Add to Environment

In `teacher-assistant/backend/.env`:

```env
# Google AI / Gemini Configuration
GOOGLE_AI_API_KEY=AIzaSy...your_key_here...xyz
```

### Step 4: Verify Setup

Test your API key with a simple curl request:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-002:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Expected response: JSON with model output

### API Key Rotation

To rotate your API key:

1. Generate a new key in Google AI Studio
2. Update `.env` with the new key
3. Restart the backend server
4. Revoke the old key in Google AI Studio

**Frequency**: Rotate keys every 90 days for security best practices.

---

## Service Architecture

### GeminiImageService

**Location**: `teacher-assistant/backend/src/services/geminiImageService.ts`

#### Class Structure

```typescript
export class GeminiImageService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly DAILY_LIMIT = 20;
  private readonly COST_PER_IMAGE = 0.039;
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  private readonly TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  // Public methods
  async editImage(params: EditImageParams): Promise<EditImageResult>
  async checkDailyLimit(userId: string): Promise<UsageLimit>
}
```

#### Type Definitions

```typescript
interface EditImageParams {
  imageBase64: string;      // Base64-encoded image
  instruction: string;      // Edit instruction in German
  userId: string;           // User ID for tracking
  imageId: string;          // Original image ID
}

interface EditImageResult {
  editedImageUrl: string;   // Base64 or URL of edited image
  metadata: {
    originalImageId: string;
    editInstruction: string;
    version: number;        // Version number (1, 2, 3...)
    createdAt: Date;
  };
}

interface UsageLimit {
  used: number;             // Images used today
  limit: number;            // Daily limit (20)
  canEdit: boolean;         // Whether user can edit more
  resetTime: Date;          // When limit resets (midnight)
}
```

#### Error Types

```typescript
export enum GeminiErrorType {
  INVALID_API_KEY,          // API key invalid or missing
  RATE_LIMIT,               // Daily or API rate limit exceeded
  NETWORK_ERROR,            // Network connectivity issues
  TIMEOUT,                  // Request timeout (>30s)
  INVALID_INPUT,            // Invalid parameters
  API_ERROR,                // General API error
  UNSUPPORTED_FORMAT,       // Image format not supported
  FILE_TOO_LARGE,           // Image file > 20 MB
}
```

---

## Usage Examples

### Example 1: Basic Image Edit

```typescript
import { GeminiImageService } from './services/geminiImageService';

const service = new GeminiImageService();

try {
  const result = await service.editImage({
    imageBase64: 'data:image/png;base64,iVBORw0KGgo...',
    instruction: 'Mache das Bild heller und kontrastreicher',
    userId: 'user-abc-123',
    imageId: 'image-xyz-789',
  });

  console.log('✅ Edit successful!');
  console.log('Edited image URL:', result.editedImageUrl);
  console.log('Version:', result.metadata.version);
} catch (error) {
  if (error instanceof GeminiServiceError) {
    console.error('Gemini error:', error.message, error.type);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Example 2: Check Daily Limit Before Editing

```typescript
const usage = await service.checkDailyLimit('user-abc-123');

if (!usage.canEdit) {
  console.log(`Limit reached: ${usage.used}/${usage.limit}`);
  console.log(`Resets at: ${usage.resetTime.toLocaleString()}`);
  return;
}

console.log(`Remaining edits: ${usage.limit - usage.used}`);

// Proceed with edit
const result = await service.editImage({...});
```

### Example 3: Error Handling with Retry

```typescript
async function editImageWithUserFeedback(params: EditImageParams) {
  try {
    const result = await service.editImage(params);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof GeminiServiceError) {
      switch (error.type) {
        case GeminiErrorType.RATE_LIMIT:
          return {
            success: false,
            message: 'Tägliches Limit erreicht. Bitte versuchen Sie es morgen erneut.'
          };

        case GeminiErrorType.INVALID_INPUT:
          return {
            success: false,
            message: 'Ungültige Eingabe. Bitte prüfen Sie das Bildformat.'
          };

        case GeminiErrorType.TIMEOUT:
          return {
            success: false,
            message: 'Die Bearbeitung dauert zu lange. Bitte versuchen Sie es mit einem kleineren Bild.'
          };

        default:
          return {
            success: false,
            message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
          };
      }
    }

    throw error; // Re-throw unexpected errors
  }
}
```

### Example 4: Express Route Integration

```typescript
import express from 'express';
import { GeminiImageService, GeminiServiceError, GeminiErrorType } from './services/geminiImageService';

const router = express.Router();
const geminiService = new GeminiImageService();

router.post('/api/images/edit', async (req, res) => {
  try {
    const { imageBase64, instruction, userId, imageId } = req.body;

    // Validate input
    if (!imageBase64 || !instruction || !userId || !imageId) {
      return res.status(400).json({
        error: 'Missing required parameters'
      });
    }

    // Check daily limit
    const usage = await geminiService.checkDailyLimit(userId);
    if (!usage.canEdit) {
      return res.status(429).json({
        error: 'Daily limit exceeded',
        resetTime: usage.resetTime,
      });
    }

    // Edit image
    const result = await geminiService.editImage({
      imageBase64,
      instruction,
      userId,
      imageId,
    });

    res.json({ success: true, data: result });

  } catch (error) {
    if (error instanceof GeminiServiceError) {
      const statusCode =
        error.type === GeminiErrorType.RATE_LIMIT ? 429 :
        error.type === GeminiErrorType.INVALID_INPUT ? 400 :
        error.type === GeminiErrorType.INVALID_API_KEY ? 500 :
        500;

      return res.status(statusCode).json({
        error: error.message,
        type: error.type,
      });
    }

    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

---

## API Limits & Pricing

### Free Tier Limits (Google AI Studio)

| Resource | Free Tier Limit |
|----------|-----------------|
| Requests per minute (RPM) | 15 |
| Requests per day (RPD) | 1,500 |
| Tokens per day | 1,000,000 |
| Concurrent requests | 15 |
| Cost | $0.00 (Free) |

**Application Limit**: We enforce a 20 images/day limit per user for cost control.

### Paid Tier Pricing (Google Cloud)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|-----------------------|------------------------|
| Gemini 2.5 Flash | $0.15 | $0.60 |
| Gemini 2.5 Pro | $2.50 | $10.00 |

**Note**: Image processing counts as token usage based on image size.

### Cost Estimation

Assuming average image edit:
- Input: ~1000 tokens (image + instruction)
- Output: ~200 tokens (response)
- Total: ~1200 tokens per request

**Cost per image edit**: ~$0.0009 USD (less than 1 cent)

Our internal tracking uses $0.039 per image for budget planning (includes overhead).

### Rate Limit Handling

The service automatically handles rate limits:

```typescript
// Automatic retry with exponential backoff
// Max 3 retries
// Delays: 1s, 2s, 3s

// Rate limit error returns user-friendly message
"API-Ratenlimit erreicht. Bitte versuchen Sie es später erneut."
```

---

## Error Handling

### Error Flow

```
User Request
    ↓
Input Validation (format, size, instruction)
    ↓ [Invalid] → GeminiServiceError (INVALID_INPUT)
Daily Limit Check
    ↓ [Exceeded] → GeminiServiceError (RATE_LIMIT)
API Call (with timeout & retry)
    ↓ [Timeout] → GeminiServiceError (TIMEOUT)
    ↓ [Network Error] → Retry → GeminiServiceError (NETWORK_ERROR)
    ↓ [API Error] → Retry → GeminiServiceError (API_ERROR)
    ↓ [Success]
Return Result
```

### Supported Image Formats

| Format | MIME Type | Supported |
|--------|-----------|-----------|
| PNG | image/png | ✅ |
| JPEG | image/jpeg | ✅ |
| WebP | image/webp | ✅ |
| HEIC | image/heic | ✅ |
| HEIF | image/heif | ✅ |
| GIF | image/gif | ❌ |
| BMP | image/bmp | ❌ |
| TIFF | image/tiff | ❌ |

### File Size Limits

- **Maximum**: 20 MB
- **Recommended**: < 5 MB for faster processing
- **Validation**: Automatic (rejects files > 20 MB)

### Timeout Configuration

- **Hard Limit**: 30 seconds per request
- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 3s)
- **Total Max Time**: ~36 seconds (30s timeout + 6s retry delays)

---

## Testing

### Running Tests

```bash
cd teacher-assistant/backend

# Run all Gemini tests
npm test -- geminiImageService.test.ts

# Run with coverage
npm test -- geminiImageService.test.ts --coverage

# Run specific test
npm test -- geminiImageService.test.ts --testNamePattern="should handle timeout"
```

### Test Coverage

Current coverage: **75.6%** (35/38 tests passing)

| Metric | Coverage |
|--------|----------|
| Statements | 75.6% |
| Branches | 64.78% |
| Functions | 77.77% |
| Lines | 74.56% |

**Critical paths covered**: Input validation, error handling, retry logic, daily limits.

### Test Categories

1. **Constructor Tests** (2 tests)
   - API key validation
   - Successful initialization

2. **Input Validation Tests** (6 tests)
   - Empty instruction
   - Invalid image format
   - Unsupported formats
   - File size limits
   - Supported formats

3. **Daily Limit Tests** (2 tests)
   - Enforce limit
   - Allow under limit

4. **Error Handling Tests** (4 tests)
   - API key errors
   - Rate limit errors
   - Network errors
   - Timeout errors

5. **Retry Logic Tests** (4 tests)
   - Retry on transient failures
   - No retry on permanent errors
   - Max retries

6. **Success Cases** (3 tests)
   - Successful edit
   - Usage tracking
   - Cost tracking

7. **Helper Methods** (3 tests)
   - Build prompt
   - Timeout promise
   - Sleep function

8. **API Integration Tests** (5 tests)
   - Successful response
   - Empty response
   - API errors
   - Quota errors
   - Network errors

9. **Edge Cases** (2 tests)
   - Long instructions
   - Special characters

10. **MIME Detection** (4 tests)
    - PNG, JPEG, WebP formats
    - Unknown formats

---

## Troubleshooting

### Common Issues

#### Issue 1: "GOOGLE_AI_API_KEY is not configured"

**Cause**: Missing or incorrect environment variable

**Solution**:
```bash
# Check if .env file exists
ls teacher-assistant/backend/.env

# Verify variable is set
grep GOOGLE_AI_API_KEY teacher-assistant/backend/.env

# Add if missing
echo "GOOGLE_AI_API_KEY=your_key_here" >> teacher-assistant/backend/.env

# Restart backend
cd teacher-assistant/backend && npm run dev
```

#### Issue 2: "Ungültiger API-Schlüssel" (Invalid API Key)

**Cause**: API key is invalid, expired, or revoked

**Solution**:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Check if key is valid
3. Generate new key if needed
4. Update `.env` file
5. Restart server

#### Issue 3: "API-Ratenlimit erreicht" (Rate Limit Exceeded)

**Cause**: Too many requests in short time

**Solution**:
- **Free tier**: Wait 1 minute (RPM limit: 15)
- **Daily limit**: Wait until midnight UTC (RPD limit: 1500)
- **User limit**: Wait until midnight local time (20/day)

#### Issue 4: "Bildbearbeitung fehlgeschlagen nach 3 Versuchen" (Failed after 3 retries)

**Cause**: Persistent API or network issues

**Solution**:
1. Check internet connection
2. Verify Gemini API status: [status.cloud.google.com](https://status.cloud.google.com/)
3. Check backend logs for specific error
4. Try with smaller image
5. Simplify instruction

#### Issue 5: "Timeout nach 30 Sekunden"

**Cause**: Image too large or complex

**Solution**:
1. Reduce image size (< 5 MB recommended)
2. Compress image before upload
3. Simplify edit instruction
4. Use faster model if available

#### Issue 6: "Nicht unterstütztes Bildformat" (Unsupported Format)

**Cause**: Image format not in supported list

**Solution**:
1. Convert to PNG, JPEG, or WebP
2. Check MIME type: `file --mime-type image.png`
3. Re-encode image: `convert image.gif image.png`

### Debug Mode

Enable debug logging:

```typescript
// In geminiImageService.ts, uncomment console.log statements
console.log('Track usage:', { userId, imageId, instruction });
console.log('Track cost:', { userId, cost: this.COST_PER_IMAGE });
```

### API Testing Tool

Test API directly without backend:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-002' });

const result = await model.generateContent(['Describe this image', {
  inlineData: {
    data: 'base64_image_data_here',
    mimeType: 'image/png'
  }
}]);

console.log(result.response.text());
```

---

## Best Practices

### 1. Always Validate Input

```typescript
// Bad: No validation
const result = await service.editImage(params);

// Good: Validate before calling
if (!isValidBase64(params.imageBase64)) {
  throw new Error('Invalid image format');
}

if (params.instruction.length > 500) {
  throw new Error('Instruction too long');
}

const result = await service.editImage(params);
```

### 2. Check Daily Limit First

```typescript
// Check limit before expensive operations
const usage = await service.checkDailyLimit(userId);

if (!usage.canEdit) {
  return { error: 'Daily limit reached', resetTime: usage.resetTime };
}

// Proceed with edit
const result = await service.editImage(params);
```

### 3. Handle All Error Types

```typescript
try {
  const result = await service.editImage(params);
} catch (error) {
  if (error instanceof GeminiServiceError) {
    switch (error.type) {
      case GeminiErrorType.RATE_LIMIT:
        // Handle rate limit
        break;
      case GeminiErrorType.TIMEOUT:
        // Handle timeout
        break;
      // ... handle all types
    }
  }
}
```

### 4. Optimize Image Size

```typescript
// Bad: Send full-resolution image (10 MB)
const result = await service.editImage({ imageBase64: largeImage });

// Good: Compress before sending (1 MB)
const compressed = await compressImage(originalImage, { maxSizeMB: 1 });
const result = await service.editImage({ imageBase64: compressed });
```

### 5. Use Descriptive Instructions

```typescript
// Bad: Vague instruction
instruction: 'Mach es besser'

// Good: Specific instruction
instruction: 'Erhöhe die Helligkeit um 20% und den Kontrast um 10%. Behalte die Farben bei.'
```

### 6. Monitor Usage and Costs

```typescript
// Track usage per user
const monthlyUsage = await getMonthlyUsage(userId);
if (monthlyUsage > 100) {
  console.warn(`User ${userId} has high usage: ${monthlyUsage} edits`);
}

// Track costs
const monthlyCost = monthlyUsage * 0.039;
console.log(`Monthly cost for ${userId}: $${monthlyCost.toFixed(2)}`);
```

### 7. Implement Caching

```typescript
// Cache edit results to avoid duplicate API calls
const cacheKey = `${imageId}-${instruction}`;
const cached = cache.get(cacheKey);

if (cached) {
  return cached;
}

const result = await service.editImage(params);
cache.set(cacheKey, result, { ttl: 3600 }); // 1 hour TTL
return result;
```

---

## Related Documentation

- **Story**: `docs/stories/epic-3.1.story-1.md`
- **Epic**: `docs/epics/epic-3.1.md`
- **Service Code**: `teacher-assistant/backend/src/services/geminiImageService.ts`
- **Tests**: `teacher-assistant/backend/src/services/geminiImageService.test.ts`
- **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
- **Gemini API Docs**: [https://ai.google.dev/docs](https://ai.google.dev/docs)

---

**Last Updated**: 2025-10-21
**Maintained By**: Dev Agent (Story 3.1.1)
**Version**: 1.0.0
