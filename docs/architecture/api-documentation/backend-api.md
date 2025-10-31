# Teacher Assistant Backend API Documentation

## Overview

The Teacher Assistant backend provides a RESTful API built with Express.js and TypeScript. It integrates with OpenAI's GPT-4 models to provide intelligent chat assistance specifically designed for educators.

**Base URL**: `http://localhost:3001/api` (development)
**Production URL**: `https://your-domain.com/api`

**Version**: 1.0.0
**Last Updated**: 2025-09-26

---

## Authentication

The backend API currently does not require authentication for chat endpoints, as authentication is handled client-side via InstantDB. All endpoints use rate limiting for protection.

### Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Chat Endpoints**: 30 requests per 15 minutes per IP
- **Authentication Endpoints**: 5 requests per 15 minutes per IP

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1640995200
```

---

## Health Check Endpoints

### GET /api/health

Returns the server health status and basic information.

**HTTP Method**: `GET`
**Endpoint**: `/api/health`
**Rate Limit**: General (100/15min)

#### Response

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-09-26T10:30:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 3600
  },
  "message": "Server is running correctly",
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

**Error Response (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": "Health check failed",
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `data.status` | string | Server status ("ok" or "error") |
| `data.timestamp` | string | ISO timestamp of the response |
| `data.version` | string | Server version |
| `data.environment` | string | Current environment (development/production) |
| `data.uptime` | number | Server uptime in seconds |
| `message` | string | Human-readable status message |

#### Example Usage

```bash
curl -X GET http://localhost:3001/api/health
```

```javascript
// Frontend JavaScript
const response = await fetch('/api/health');
const data = await response.json();
console.log('Server status:', data.data.status);
```

---

## Chat Endpoints

### POST /api/chat

Creates a chat completion using OpenAI's GPT models.

**HTTP Method**: `POST`
**Endpoint**: `/api/chat`
**Rate Limit**: Chat-specific (30/15min)
**Content-Type**: `application/json`
**Max Request Size**: 10MB

#### Request Body

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Help me create a lesson plan for 5th grade math"
    }
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `messages` | Array | Yes | - | Array of message objects |
| `messages[].role` | string | Yes | - | Message role: "system", "user", or "assistant" |
| `messages[].content` | string | Yes | - | Message content (max 4000 characters) |
| `model` | string | No | "gpt-4o-mini" | OpenAI model to use |
| `temperature` | number | No | 0.7 | Sampling temperature (0.0-2.0) |
| `max_tokens` | number | No | 1000 | Maximum tokens in response |
| `stream` | boolean | No | false | Enable streaming responses |

#### Validation Rules

- **messages**: Must be array with at least 1 message
- **messages[].role**: Must be "system", "user", or "assistant"
- **messages[].content**: Must be non-empty string, max 4000 characters
- **model**: Must be valid OpenAI model ID
- **temperature**: Must be number between 0.0 and 2.0
- **max_tokens**: Must be positive integer, max 4096
- **stream**: Must be boolean

#### Response

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1640995200,
    "model": "gpt-4o-mini",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "I'd be happy to help you create a 5th grade math lesson plan. Here's a comprehensive lesson on fractions:\n\n## Lesson Title: Introduction to Fractions\n\n### Learning Objectives:\n- Students will understand what fractions represent\n- Students will identify numerator and denominator\n- Students will compare simple fractions\n\n### Materials Needed:\n- Fraction circles or bars\n- Whiteboard and markers\n- Worksheet with practice problems\n- Pizza/pie images for examples\n\n### Lesson Structure (45 minutes):\n\n**Opening (10 minutes)**\n1. Start with a real-world example: \"If we have a pizza cut into 8 slices and eat 3, what part did we eat?\"\n2. Introduce vocabulary: fraction, numerator, denominator\n\n**Main Activity (25 minutes)**\n1. Use visual aids to show different fractions (1/2, 1/4, 3/4)\n2. Have students work with fraction manipulatives\n3. Practice identifying parts of fractions\n4. Compare fractions using visual models\n\n**Closure (10 minutes)**\n1. Review key concepts\n2. Quick assessment with exit ticket\n3. Preview tomorrow's lesson on equivalent fractions\n\n### Assessment:\n- Observe student work with manipulatives\n- Check exit tickets for understanding\n- Review completed worksheets\n\n### Homework:\nComplete practice worksheet with 10 fraction identification problems.\n\nWould you like me to elaborate on any part of this lesson plan or help you adapt it for a specific math curriculum?"
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 20,
      "completion_tokens": 280,
      "total_tokens": 300
    }
  },
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

#### Error Responses

**Validation Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "error_type": "validation",
  "details": [
    {
      "field": "messages",
      "message": "Messages array must contain at least one message"
    }
  ],
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

**Rate Limit Error (429 Too Many Requests)**:
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "error_type": "rate_limit",
  "retry_after": 900,
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

**OpenAI API Error (502 Bad Gateway)**:
```json
{
  "success": false,
  "error": "OpenAI service temporarily unavailable",
  "error_type": "openai_api",
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

**Server Error (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": "An unexpected error occurred while processing your chat request",
  "error_type": "server_error",
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

#### Example Usage

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Help me create a lesson plan for 5th grade math"}
    ]
  }'
```

```javascript
// Frontend JavaScript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Help me create a lesson plan for 5th grade math' }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.7
  })
});

const data = await response.json();
if (data.success) {
  console.log('AI Response:', data.data.choices[0].message.content);
} else {
  console.error('Error:', data.error);
}
```

### GET /api/chat/models

Returns available OpenAI models for chat completions.

**HTTP Method**: `GET`
**Endpoint**: `/api/chat/models`
**Rate Limit**: General (100/15min)

#### Response

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gpt-4o-mini",
        "name": "GPT-4o Mini",
        "description": "Fast and cost-effective model, great for most teacher assistant tasks",
        "max_tokens": 4096,
        "recommended": true
      },
      {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "description": "Most capable model, best for complex educational content creation",
        "max_tokens": 4096,
        "recommended": false
      },
      {
        "id": "gpt-4",
        "name": "GPT-4",
        "description": "High-quality model for detailed educational planning",
        "max_tokens": 4096,
        "recommended": false
      },
      {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5 Turbo",
        "description": "Fast and efficient for simple tasks",
        "max_tokens": 4096,
        "recommended": false
      }
    ],
    "default_model": "gpt-4o-mini"
  },
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

#### Example Usage

```bash
curl -X GET http://localhost:3001/api/chat/models
```

```javascript
// Frontend JavaScript
const response = await fetch('/api/chat/models');
const data = await response.json();
console.log('Available models:', data.data.models);
console.log('Default model:', data.data.default_model);
```

### GET /api/chat/health

Checks the health and availability of the chat service and OpenAI API connection.

**HTTP Method**: `GET`
**Endpoint**: `/api/chat/health`
**Rate Limit**: General (100/15min)

#### Response

**Healthy Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "openai_connection": true,
    "service_available": true
  },
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

**Unhealthy Response (503 Service Unavailable)**:
```json
{
  "success": false,
  "error": "Chat service health check failed",
  "data": {
    "status": "unhealthy",
    "openai_connection": false,
    "service_available": false
  },
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

#### Example Usage

```bash
curl -X GET http://localhost:3001/api/chat/health
```

```javascript
// Frontend JavaScript
const response = await fetch('/api/chat/health');
const data = await response.json();
if (data.success && data.data.status === 'healthy') {
  console.log('Chat service is operational');
} else {
  console.warn('Chat service is experiencing issues');
}
```

---

## Error Handling

### Error Response Format

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "error_type": "error_category",
  "timestamp": "2025-09-26T10:30:00.000Z"
}
```

### Error Types

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| `validation` | 400 | Request validation failed |
| `rate_limit` | 429 | Rate limit exceeded |
| `openai_api` | 502 | OpenAI API error or timeout |
| `server_error` | 500 | Unexpected server error |

### Common Error Scenarios

#### Missing Required Fields
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "error_type": "validation",
  "details": [
    {
      "field": "messages",
      "message": "Messages field is required"
    }
  ]
}
```

#### OpenAI API Key Issues
```json
{
  "success": false,
  "error": "OpenAI API authentication failed",
  "error_type": "openai_api"
}
```

#### Rate Limiting
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "error_type": "rate_limit",
  "retry_after": 900
}
```

---

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (development)
- `http://localhost:5173` (Vite dev server)
- Production frontend domains (configured via environment)

### CORS Headers

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Request/Response Examples

### Complete Chat Conversation Example

```javascript
// Multi-turn conversation
const conversationHistory = [
  { role: 'user', content: 'I need help planning a science lesson on photosynthesis' },
  {
    role: 'assistant',
    content: 'I\'d be happy to help you plan a photosynthesis lesson! What grade level are you teaching?'
  },
  { role: 'user', content: '6th grade students' }
];

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: conversationHistory,
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000
  })
});

const result = await response.json();
console.log('AI Response:', result.data.choices[0].message.content);
```

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Help me with lesson planning' }]
    })
  });

  const data = await response.json();

  if (!data.success) {
    switch (data.error_type) {
      case 'rate_limit':
        console.log(`Rate limit exceeded. Try again in ${data.retry_after} seconds`);
        break;
      case 'validation':
        console.log('Request validation failed:', data.details);
        break;
      case 'openai_api':
        console.log('OpenAI service unavailable, please try again later');
        break;
      default:
        console.log('Unexpected error:', data.error);
    }
    return;
  }

  // Handle successful response
  console.log('AI Response:', data.data.choices[0].message.content);

} catch (error) {
  console.error('Network error:', error);
}
```

---

## Development and Testing

### Environment Variables

Required environment variables for backend:

```bash
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
```

### Testing the API

#### Using curl

```bash
# Test server health
curl -X GET http://localhost:3001/api/health

# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test with all parameters
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Create a math lesson plan"}
    ],
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 1500
  }'
```

#### Using Postman

1. **Create Collection**: "Teacher Assistant API"
2. **Health Check Request**:
   - Method: GET
   - URL: `http://localhost:3001/api/health`
3. **Chat Request**:
   - Method: POST
   - URL: `http://localhost:3001/api/chat`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "messages": [
         {"role": "user", "content": "Help me create a lesson plan"}
       ]
     }
     ```

### API Testing Suite

The backend includes comprehensive API tests:

```bash
# Run all API tests
cd backend && npm test

# Run specific test files
npm test -- routes/chat.test.ts
npm test -- routes/health.test.ts

# Run tests with coverage
npm run test:coverage
```

---

## Production Considerations

### Performance

- **Response Times**: Typically < 2 seconds for chat completions
- **Rate Limiting**: Protects against abuse and controls costs
- **Caching**: Consider implementing response caching for repeated queries
- **Connection Pooling**: OpenAI client uses connection pooling for efficiency

### Security

- **Rate Limiting**: Multiple tiers based on endpoint sensitivity
- **Input Validation**: Comprehensive request validation
- **Error Handling**: No sensitive information in error responses
- **CORS**: Restrictive CORS policy for production
- **API Keys**: Secure environment variable handling

### Monitoring

- **Health Checks**: Multiple health check endpoints for monitoring
- **Structured Logging**: Winston logging with JSON format for production
- **Error Tracking**: Comprehensive error categorization and logging
- **Metrics**: Track API usage, response times, and error rates

### Scaling

- **Stateless Design**: Easy horizontal scaling
- **Load Balancing**: Multiple instances behind load balancer
- **Database**: Consider adding persistent storage for chat history
- **Caching**: Redis for session management and response caching

---

## Storage Proxy Endpoints

### GET /api/storage-proxy

Proxies InstantDB S3 image requests through the backend to bypass CORS restrictions.

**HTTP Method**: `GET`
**Endpoint**: `/api/storage-proxy`
**Rate Limit**: General (100/15min)
**Added**: 2025-10-13 (BUG-042 fix)

#### Purpose

InstantDB S3 storage URLs return CORS errors when accessed directly from the browser. This endpoint fetches images server-side and returns them with proper CORS headers, solving the browser CORS policy restrictions.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The InstantDB S3 URL to proxy (must contain `instant-storage.s3.amazonaws.com`) |

#### Validation Rules

- **url**: Required, must be non-empty string
- **url**: Must contain `instant-storage.s3.amazonaws.com` (security measure)
- Only InstantDB S3 URLs are accepted, other URLs return 400

#### Response

**Success Response (200 OK)**:
- Returns the image file as binary data
- Headers:
  ```
  Content-Type: image/png (or original content type)
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=86400
  ```

**Validation Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Missing url parameter",
  "timestamp": "2025-10-13T09:00:00.000Z"
}
```

```json
{
  "success": false,
  "error": "Invalid storage URL - must be InstantDB S3 URL",
  "timestamp": "2025-10-13T09:00:00.000Z"
}
```

**Fetch Error (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": "Failed to fetch image from storage",
  "timestamp": "2025-10-13T09:00:00.000Z"
}
```

#### Example Usage

**Direct URL (for images)**:
```html
<!-- Frontend HTML - Image tag -->
<img src="/api/storage-proxy?url=https%3A%2F%2Finstant-storage.s3.amazonaws.com%2Fabc123%2Fimage.png" alt="Image" />
```

**JavaScript fetch**:
```javascript
// Frontend JavaScript
const s3Url = 'https://instant-storage.s3.amazonaws.com/abc123/image.png';
const proxiedUrl = `/api/storage-proxy?url=${encodeURIComponent(s3Url)}`;

const response = await fetch(proxiedUrl);
if (response.ok) {
  const imageBlob = await response.blob();
  const imageUrl = URL.createObjectURL(imageBlob);
  document.querySelector('img').src = imageUrl;
}
```

**Using the imageProxy utility (recommended)**:
```javascript
// Frontend - Recommended approach
import { getProxiedImageUrl } from '../lib/imageProxy';

const s3Url = 'https://instant-storage.s3.amazonaws.com/abc123/image.png';
const proxiedUrl = getProxiedImageUrl(s3Url);

// Use proxiedUrl in img src
<img src={proxiedUrl} alt="Image" />
```

#### Testing

```bash
# Test with valid InstantDB S3 URL
curl -X GET "http://localhost:3006/api/storage-proxy?url=https%3A%2F%2Finstant-storage.s3.amazonaws.com%2Ftest%2Fimage.png"

# Test missing URL parameter (should return 400)
curl -X GET "http://localhost:3006/api/storage-proxy"

# Test invalid URL (should return 400)
curl -X GET "http://localhost:3006/api/storage-proxy?url=https%3A%2F%2Fexample.com%2Fimage.png"
```

#### Technical Notes

**Performance**:
- 24-hour cache headers improve performance for repeated requests
- Server-side fetch adds ~50-100ms latency
- Browser caches images normally after first load

**Security**:
- Only InstantDB S3 URLs are accepted (validation enforced)
- Other URL types are rejected with 400 error
- No credentials or API keys exposed

**Limitations**:
- Expired S3 URLs (>7 days old) cannot be recovered
- Proxy only works for InstantDB storage URLs
- Production deployment needs proper CORS or CDN configuration

**Related**:
- Frontend utility: `teacher-assistant/frontend/src/lib/imageProxy.ts`
- Used by: `AgentResultView`, `ChatView`, `Library`, `MaterialPreviewModal`
- Bug fix: BUG-042 (2025-10-13)

---

## Changelog

### Version 1.0.1 (2025-10-13)
- **Added**: Storage proxy endpoint (`GET /api/storage-proxy`)
  - Proxies InstantDB S3 images to bypass CORS restrictions
  - URL validation (InstantDB S3 only)
  - 24-hour cache headers for performance
  - Resolves BUG-042

### Version 1.0.0 (2025-09-26)
- Initial API release
- Chat completion endpoints with OpenAI integration
- Health check endpoints
- Comprehensive rate limiting
- Full request validation
- Structured error handling
- Production-ready logging

---

## Support

For API questions or issues:

1. **Documentation**: Check this API documentation
2. **Testing**: Use the included test suite for reference
3. **Development**: See the backend source code in `/backend/src/`
4. **Logs**: Check Winston logs in development mode for debugging

**API Version**: 1.0.0
**Last Updated**: September 26, 2025
**Status**: Production Ready ✅