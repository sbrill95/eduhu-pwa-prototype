# BUG-027: Diagnostic Logging Patch

**Purpose**: Add comprehensive logging to identify where the execute API call fails
**Target Files**: 3 files to patch
**Estimated Time**: 5 minutes to apply

---

## Patch 1: Frontend API Client Logging

**File**: `teacher-assistant/frontend/src/lib/api.ts`

**Location**: Line 451 (executeAgent method)

**REPLACE:**
```typescript
async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResponse> {
  const response = await this.request<{
    success: boolean;
    data: AgentExecutionResponse;
  }>('/langgraph/agents/execute', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.data;
}
```

**WITH:**
```typescript
async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResponse> {
  const endpoint = '/langgraph/agents/execute';
  const fullUrl = `${this.baseUrl}${endpoint}`;

  console.log('[ApiClient] 🚀 executeAgent REQUEST', {
    timestamp: new Date().toISOString(),
    endpoint,
    fullUrl,
    agentId: request.agentId,
    hasInput: !!request.input,
    inputType: typeof request.input,
    inputKeys: request.input && typeof request.input === 'object' ? Object.keys(request.input) : [],
    userId: request.userId,
    sessionId: request.sessionId,
    confirmExecution: request.confirmExecution
  });

  try {
    const response = await this.request<{
      success: boolean;
      data: AgentExecutionResponse;
    }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    console.log('[ApiClient] ✅ executeAgent RESPONSE', {
      timestamp: new Date().toISOString(),
      success: !!response.data,
      hasImageUrl: !!(response.data as any)?.image_url,
      responseKeys: response.data ? Object.keys(response.data) : [],
      dataType: typeof response.data
    });

    return response.data;
  } catch (error) {
    console.error('[ApiClient] ❌ executeAgent ERROR', {
      timestamp: new Date().toISOString(),
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStatus: (error as any)?.status,
      errorCode: (error as any)?.errorCode,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined
    });
    throw error;
  }
}
```

---

## Patch 2: AgentContext Error Logging

**File**: `teacher-assistant/frontend/src/lib/AgentContext.tsx`

**Location**: Line 258 (catch block in submitForm)

**REPLACE:**
```typescript
} catch (error) {
  console.error('[AgentContext] Submit failed', error);
  setState(prev => ({
    ...prev,
    error: error instanceof Error ? error.message : 'Fehler beim Starten des Agents',
    phase: 'form'
  }));
}
```

**WITH:**
```typescript
} catch (error) {
  console.error('[AgentContext] ❌ Submit failed - DETAILED ERROR', {
    timestamp: new Date().toISOString(),
    error,
    errorType: error?.constructor?.name,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStatus: (error as any)?.status,
    errorCode: (error as any)?.errorCode,
    agentType: state.agentType,
    hasFormData: !!formData,
    formDataKeys: formData ? Object.keys(formData) : [],
    userId: user?.id,
    sessionId: state.sessionId,
    stack: error instanceof Error ? error.stack : undefined
  });

  // Show error in UI
  const errorMessage = error instanceof Error ? error.message : 'Fehler beim Starten des Agents';
  console.error('[AgentContext] 🔴 Displaying error to user:', errorMessage);

  setState(prev => ({
    ...prev,
    error: errorMessage,
    phase: 'form'  // Return to form with error message
  }));
}
```

---

## Patch 3: Backend Route Entry Logging

**File**: `teacher-assistant/backend/src/routes/imageGeneration.ts`

**Location**: Line 41 (first line of execute endpoint)

**ADD THIS IMMEDIATELY AFTER `router.post('/agents/execute', async (req: Request, res: Response) => {`:**

```typescript
router.post('/agents/execute', async (req: Request, res: Response) => {
  // 🔍 DIAGNOSTIC LOGGING (BUG-027)
  console.log('[ImageGen] 🎯 ROUTE HIT - /agents/execute', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    contentType: req.get('Content-Type'),
    headers: {
      origin: req.get('Origin'),
      referer: req.get('Referer')
    }
  });

  try {
    // ... existing code from line 43 onwards
```

---

## Patch 4: Backend Server Startup Verification

**File**: `teacher-assistant/backend/src/index.ts` (or server.ts)

**ADD THIS to verify server is running:**

```typescript
app.listen(PORT, () => {
  console.log('\n===========================================');
  console.log(`🚀 Backend Server RUNNING`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Image Gen: http://localhost:${PORT}/api/langgraph/agents/execute`);
  console.log('===========================================\n');

  // Test route registration
  console.log('[Server] Registered routes:');
  app._router.stack
    .filter((r: any) => r.route || r.name === 'router')
    .forEach((r: any) => {
      if (r.route) {
        console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
      } else if (r.name === 'router' && r.handle.stack) {
        console.log(`  ROUTER mounted at: ${r.regexp.source.replace('\\/?(?=\\/|$)', '')}`);
      }
    });
});
```

---

## How to Apply Patches

1. **Copy each patch** to the corresponding file
2. **Save all files**
3. **Restart backend server** (to apply logging)
4. **Re-run E2E test** with console monitoring
5. **Capture logs** from both frontend and backend

---

## Expected Log Output (If Working)

### Frontend Console:
```
[ApiClient] 🚀 executeAgent REQUEST { ... }
[AgentContext] ✅ Agent execution response received { ... }
[ApiClient] ✅ executeAgent RESPONSE { ... }
```

### Backend Console:
```
[ImageGen] 🎯 ROUTE HIT - /agents/execute { ... }
[ImageGen] Request received { ... }
[ImageGen] Calling DALL-E 3 { ... }
[ImageGen] Image generated successfully { ... }
```

---

## Expected Log Output (If Broken)

### Scenario 1: Backend Not Running
```
Frontend:
[ApiClient] 🚀 executeAgent REQUEST { ... }
[ApiClient] ❌ executeAgent ERROR { errorType: 'TypeError', errorMessage: 'Failed to fetch' }
[AgentContext] ❌ Submit failed { ... }

Backend:
(NO LOGS - server not started)
```

### Scenario 2: Route Not Found (404)
```
Frontend:
[ApiClient] 🚀 executeAgent REQUEST { ... }
[ApiClient] ❌ executeAgent ERROR { errorStatus: 404, errorMessage: 'HTTP 404: Not Found' }
[AgentContext] ❌ Submit failed { ... }

Backend:
(NO [ImageGen] logs - route never hit)
```

### Scenario 3: Request Format Error (400)
```
Frontend:
[ApiClient] 🚀 executeAgent REQUEST { ... }
[ApiClient] ❌ executeAgent ERROR { errorStatus: 400, errorMessage: 'Missing required parameter: theme' }
[AgentContext] ❌ Submit failed { ... }

Backend:
[ImageGen] 🎯 ROUTE HIT - /agents/execute { ... }
[ImageGen] Request received { ... }
(Error returned before DALL-E call)
```

---

## Next Steps After Applying Patches

1. ✅ Apply all 4 patches
2. ✅ Restart backend server
3. ✅ Run E2E test: `npm test -- image-generation-complete-workflow.spec.ts`
4. ✅ Capture console output from BOTH frontend and backend
5. ✅ Analyze logs to determine exact failure point
6. ✅ Apply targeted fix based on log analysis

---

## Success Criteria

After applying these patches, you will have:

1. **Full visibility** into the request flow
2. **Exact error location** identified
3. **Request/response data** captured
4. **Clear path to fix** the root cause

This diagnostic logging will reveal the exact point of failure and guide the final fix.
