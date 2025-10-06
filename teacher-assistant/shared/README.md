# Shared Types - Teacher Assistant

This folder contains **shared TypeScript types** used by both Frontend and Backend.

## Purpose

**Prevent API Mismatches** between Frontend and Backend by using a **Single Source of Truth** for type definitions.

## Structure

```
/teacher-assistant/shared/
├── types/
│   ├── api-contracts.ts      # API Request/Response Types
│   ├── database-schemas.ts   # InstantDB Entity Types
│   └── common.ts             # Common Utility Types
└── README.md                 # This file
```

## Usage

### Backend-Agent (creates types FIRST)

```typescript
// teacher-assistant/backend/src/routes/langGraphAgents.ts
import type { ImageGenerationRequest, ImageGenerationResponse } from '@shared/types/api-contracts';
import { z } from 'zod';

// Validate request against shared type
const ImageGenerationRequestSchema = z.object({
  description: z.string().min(10).max(500),
  imageStyle: z.enum(['realistic', 'cartoon', 'illustrative', 'abstract'])
}) satisfies z.ZodType<ImageGenerationRequest>;

// Type-safe response
const response: ImageGenerationResponse = {
  success: true,
  data: { imageUrl, prompt, generatedAt }
};
```

### Frontend-Agent (imports types)

```typescript
// teacher-assistant/frontend/src/components/AgentFormView.tsx
import type { ImageGenerationRequest } from '@shared/types/api-contracts';

// Form data uses shared type
const [formData, setFormData] = useState<ImageGenerationRequest>({
  description: '',
  imageStyle: 'realistic'
});

// API call is type-safe
const response = await apiClient.post<ImageGenerationResponse>(
  '/api/langgraph/agents/execute',
  formData
);
```

## TypeScript Configuration

Both Frontend and Backend `tsconfig.json` files include:

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../shared/*"]
    }
  }
}
```

This allows imports like:
```typescript
import type { ImageGenerationRequest } from '@shared/types/api-contracts';
```

## Rules

### ✅ DO

1. **Backend-Agent defines types FIRST** in `api-contracts.ts`
2. **Frontend-Agent imports** these types (never duplicate!)
3. **Both sides use SAME field names** (no `imageContent` vs `description`)
4. **Document routes** with JSDoc comments
5. **Add type guards** for runtime validation when needed

### ❌ DON'T

1. **Don't duplicate types** in Frontend/Backend
2. **Don't use different field names** for same data
3. **Don't skip type guards** for external data
4. **Don't hardcode values** - use type literals ('realistic' | 'cartoon')

## Examples

### Good ✅

```typescript
// Backend creates type
export interface ImageGenerationRequest {
  description: string;
  imageStyle: 'realistic' | 'cartoon';
}

// Frontend imports
import type { ImageGenerationRequest } from '@shared/types/api-contracts';
const formData: ImageGenerationRequest = { ... };
```

### Bad ❌

```typescript
// Backend
export interface ImageRequest {
  prompt: string;  // Different field name!
  style: string;
}

// Frontend (separate file)
interface ImageFormData {
  description: string;  // Different field name!
  imageStyle: string;
}

// Result: API Mismatch → 400 Bad Request
```

## Type Categories

### `api-contracts.ts`

**When to use**: API Request/Response interfaces
- Chat endpoints
- Agent execution
- File uploads
- Any Frontend ↔ Backend communication

### `database-schemas.ts`

**When to use**: InstantDB entity types
- Database models
- Query results
- Mutations

### `common.ts`

**When to use**: Shared utility types
- Error handling
- Pagination
- Loading states
- Generic types

## Adding New Types

### Step 1: Backend-Agent creates type

```typescript
// teacher-assistant/shared/types/api-contracts.ts

/**
 * New Feature Request
 * @route POST /api/new-feature
 * @frontend NewFeatureComponent.tsx
 * @backend routes/newFeature.ts
 */
export interface NewFeatureRequest {
  /** Field description */
  fieldName: string;
}

export interface NewFeatureResponse {
  success: boolean;
  data: {
    result: string;
  };
}
```

### Step 2: Backend validates

```typescript
// teacher-assistant/backend/src/routes/newFeature.ts
import type { NewFeatureRequest, NewFeatureResponse } from '@shared/types/api-contracts';
import { z } from 'zod';

const schema = z.object({
  fieldName: z.string().min(1)
}) satisfies z.ZodType<NewFeatureRequest>;

router.post('/new-feature', (req, res) => {
  const data = schema.parse(req.body);
  const response: NewFeatureResponse = { ... };
  res.json(response);
});
```

### Step 3: Frontend imports

```typescript
// teacher-assistant/frontend/src/components/NewFeatureComponent.tsx
import type { NewFeatureRequest, NewFeatureResponse } from '@shared/types/api-contracts';

const formData: NewFeatureRequest = {
  fieldName: 'value'
};

const response = await api.post<NewFeatureResponse>('/api/new-feature', formData);
```

## Benefits

✅ **Type Safety**: Compile-time errors if Frontend/Backend mismatch
✅ **No Duplication**: Single source of truth
✅ **Better IntelliSense**: Auto-completion works perfectly
✅ **Prevents Bugs**: Field name mismatches caught at compile time
✅ **Documentation**: Types serve as API documentation

## Related Documentation

- **Perfect Workflow**: `/docs/guides/PERFECT-WORKFLOW.md`
- **CLAUDE.md**: `/CLAUDE.md` (Section "Phase 2: Shared Types")
- **Quality Analysis**: `/docs/quality-assurance/SPRINT-QUALITY-ANALYSIS-2025-10-05.md`

---

**Last Updated**: 2025-10-05
**Maintained By**: Backend-Agent (creates) + Frontend-Agent (uses)
