# Research Findings: Bug Fixes 2025-10-11

## RT-001: Ionic Tab Navigation

**Decision**: Use React state management with custom tab navigation instead of useIonRouter

**Rationale**: The current implementation in App.tsx (lines 116-369) already uses React state (`activeTab`) with direct button handlers. This is simpler and more reliable than useIonRouter for tab switching in this architecture, as useIonRouter is designed for route-based navigation with React Router, which this app doesn't use for tabs.

**Implementation**:
- Current approach: Direct state updates via `setActiveTab('chat')`
- Tab buttons call memoized handlers (`handleChatClick`, `handleHomeClick`, etc.)
- No page reload - pure React state changes
- Already implemented with proper memoization to prevent re-renders

**Code Example** (from App.tsx):
```typescript
const handleTabChange = useCallback((tab: ActiveTab) => {
  setActiveTab(tab);
}, []);

// Usage in component
handleTabChange('chat'); // Programmatic navigation
```

**Alternatives Considered**:
- **useIonRouter.push()**: Rejected - requires React Router integration, adds complexity
- **IonTabs with routing**: Rejected - current architecture uses state-based tabs

---

## RT-002: InstantDB Schema Migration

**Decision**: Use InstantDB CLI for adding fields, use Dashboard/Explorer for dropping fields

**Rationale**: InstantDB's CLI (`npx instant-cli push`) handles field creation automatically but doesn't support deletion/renaming yet. The Dashboard provides a UI for manual schema modifications.

**Implementation**:
- **Adding fields**: Update `instant.schema.ts`, run `npx instant-cli push`
- **Dropping fields**: Use InstantDB Dashboard/Explorer (manual deletion)
- **No transactions needed**: InstantDB handles schema changes automatically
- **Current schema**: Already defined in `instant.schema.ts` with proper types

**Migration Pattern**:
```typescript
// instant.schema.ts - Adding new field
const _schema = i.schema({
  entities: {
    messages: i.entity({
      // existing fields...
      metadata: i.string().optional(), // ✅ Can add via CLI
    })
  }
});

// To drop a field: Use Dashboard (CLI doesn't support yet)
```

**Key Limitations**:
- CLI doesn't support dropping/renaming attributes yet
- Data migration: Handle manually in application code
- Caching: InstantDB auto-syncs schema changes

**Alternatives Considered**:
- **Manual SQL migrations**: Not applicable - InstantDB manages schema internally
- **Third-party tools**: Not needed - official CLI + Dashboard sufficient

---

## RT-003: Metadata JSON Validation with Zod

**Decision**: Use Zod schemas with `.transform()` for sanitization and `.refine()` for custom validation

**Rationale**: Project already uses Zod (see `langGraphAgents.ts` lines 22-54). Zod provides type-safe runtime validation with excellent TypeScript integration, automatic type inference, and built-in sanitization.

**Implementation**:
- Create Zod schema for metadata structure
- Use `.min()`, `.max()` for string length validation
- Use `.transform()` for sanitization (trim, lowercase, etc.)
- Use `.refine()` for complex validation rules
- All fields required by default (use `.optional()` explicitly)

**Code Example**:
```typescript
import { z } from 'zod';

// Metadata validation schema
const MessageMetadataSchema = z.object({
  type: z.enum(['text', 'image', 'agent_result']),
  image_url: z.string().url().optional(),
  library_id: z.string().uuid().optional(),
  title: z.string()
    .min(1, 'Title required')
    .max(200, 'Title too long')
    .transform(str => str.trim()), // Sanitization
  originalParams: z.record(z.unknown()).optional(),
}).strict(); // Reject unknown fields

// Usage
const result = MessageMetadataSchema.safeParse(metadata);
if (!result.success) {
  console.error(result.error.errors); // Detailed error messages
}
```

**Size Limits**:
- Strings: Use `.max(N)` for character limits
- JSON: Use `.refine()` for byte size validation
- Example: `.refine(val => JSON.stringify(val).length < 10000, 'JSON too large')`

**Error Handling Pattern**:
```typescript
const validationResult = schema.safeParse(data);
if (!validationResult.success) {
  const errors = validationResult.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
  // Return structured error response
}
```

**Alternatives Considered**:
- **Manual validation**: Rejected - error-prone, no type safety
- **Joi/Yup**: Rejected - Zod already integrated, better TypeScript support

---

## RT-004: React Debouncing Patterns

**Decision**: Use `useMemo` with `lodash.debounce` for button click debouncing

**Rationale**: `useMemo` is superior to `useCallback` for debouncing because it preserves the same debounced function instance across re-renders. `useCallback` would create a new debounced function on each render, breaking the debounce behavior.

**Implementation**:
- Install: `npm install lodash.debounce @types/lodash.debounce`
- Use `useMemo` to create stable debounced function
- 300ms delay prevents duplicate clicks
- Include cleanup to cancel pending invocations on unmount

**Code Example**:
```typescript
import { useMemo } from 'react';
import debounce from 'lodash.debounce';

const MyComponent = () => {
  // ✅ CORRECT: useMemo preserves function instance
  const debouncedClick = useMemo(
    () => debounce((tab: string) => {
      setActiveTab(tab);
    }, 300, { leading: true, trailing: false }), // Immediate first click
    [] // Empty deps - function never recreated
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedClick.cancel();
    };
  }, [debouncedClick]);

  return <button onClick={() => debouncedClick('chat')}>Chat</button>;
};
```

**Options Configuration**:
- `leading: true`: Execute on first click immediately
- `trailing: false`: Don't execute after delay
- `maxWait: 300`: Force execution if held longer

**Common Pitfalls**:
- ❌ Don't use `useCallback` - creates new debounced instance each render
- ❌ Don't forget cleanup - causes memory leaks
- ❌ Don't use state in debounced function - use parameters instead

**Testing Pattern**:
```typescript
// For testing, use jest.useFakeTimers()
jest.useFakeTimers();
fireEvent.click(button);
fireEvent.click(button); // Second click ignored
jest.advanceTimersByTime(300);
expect(handler).toHaveBeenCalledTimes(1);
```

**Alternatives Considered**:
- **useCallback + debounce**: Rejected - breaks debounce functionality
- **Custom hook**: Not needed for single use case
- **use-debounce library**: Considered but lodash.debounce is more flexible

---

## RT-005: Browser Console Logging Best Practices

**Decision**: Use structured logging with appropriate log levels and conditional production filtering

**Rationale**: Current codebase uses extensive console logging (see App.tsx lines 117-123, 139). Need consistent approach for debugging without performance impact in production.

**Implementation**:
- **Error logs**: `console.error()` for exceptions, failures (red background)
- **Navigation events**: `console.log()` for user actions, state changes
- **Warnings**: `console.warn()` for non-critical issues (yellow background)
- **Debug traces**: `console.trace()` for call stack analysis (development only)
- **Structured format**: Include timestamp, context object

**Logging Pattern**:
```typescript
// Structured logging format
const logNavigation = (event: string, context: Record<string, any>) => {
  console.log(`🔄 [Navigation.${event}]`, {
    timestamp: new Date().toISOString(),
    ...context
  });
};

// Error logging
const logError = (message: string, error: Error, context?: Record<string, any>) => {
  console.error(`❌ [Error] ${message}`, {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    ...context
  });
};

// Usage
logNavigation('TabChange', { from: 'home', to: 'chat' });
logError('Failed to save', error, { userId, sessionId });
```

**Production Filtering**:
```typescript
// Create logger wrapper
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: isDev ? console.log : () => {},
  trace: isDev ? console.trace : () => {},
  log: console.log,     // Always show user actions
  warn: console.warn,   // Always show warnings
  error: console.error  // Always show errors
};

// Usage
logger.debug('Detailed state:', state); // Only in development
logger.log('User clicked tab');         // Always logged
```

**Console Prefixes** (for filtering):
- `[App.*]` - Application lifecycle
- `[Navigation.*]` - Tab/route changes
- `[Agent.*]` - Agent execution
- `[DB.*]` - Database operations
- Use browser console filters: `-/[App]/` to hide, `/[Agent]/` to show only

**Performance Considerations**:
- Avoid logging in tight loops
- Don't log large objects - use selective properties
- Remove `console.trace()` calls before production
- Consider log level based on `NODE_ENV`

**Alternatives Considered**:
- **Winston/Pino**: Rejected - overkill for frontend, backend already has custom logger
- **Log aggregation service**: Future consideration for production monitoring
- **console.debug()**: Not used - browser support inconsistent

---

## Summary of Key Decisions

| Research Task | Decision | Primary Tool/Pattern |
|--------------|----------|---------------------|
| RT-001 | State-based navigation | `setActiveTab()` with memoized handlers |
| RT-002 | Hybrid schema migration | CLI for add, Dashboard for drop |
| RT-003 | Runtime validation | Zod with `.transform()` + `.refine()` |
| RT-004 | Click debouncing | `useMemo` + `lodash.debounce` (300ms) |
| RT-005 | Logging strategy | Structured logs with `.error`/`.log`/`.warn` + filtering |

## Implementation Priority

1. **RT-004 (Debouncing)**: Immediate - prevents duplicate clicks (300ms window)
2. **RT-003 (Validation)**: High - ensures data integrity for metadata
3. **RT-005 (Logging)**: Medium - improves debugging without breaking changes
4. **RT-001 (Navigation)**: Low - already implemented correctly
5. **RT-002 (Schema)**: As-needed - only when schema changes required

## Dependencies Required

```bash
# RT-004: Debouncing
npm install lodash.debounce @types/lodash.debounce

# RT-003: Validation (already installed)
# zod is already in package.json
```

## Testing Considerations

- **RT-001**: E2E tests for tab navigation (already exists in Playwright)
- **RT-003**: Unit tests for Zod schema validation with edge cases
- **RT-004**: Timer-based tests with `jest.useFakeTimers()`
- **RT-005**: Manual verification - check console output in dev/prod

## References

- [Ionic React Navigation](https://ionicframework.com/docs/react/navigation)
- [InstantDB Schema Docs](https://www.instantdb.com/docs/modeling-data)
- [Zod Documentation](https://zod.dev/)
- [React Debouncing Patterns](https://www.developerway.com/posts/debouncing-in-react)
- [Browser Console Best Practices](https://betterstack.com/community/guides/logging/nodejs-logging-best-practices/)
