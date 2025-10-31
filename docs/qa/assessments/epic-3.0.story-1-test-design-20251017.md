# Test Design: Epic 3.0, Story 1 - OpenAI Agents SDK Setup

**Story**: [docs/stories/epic-3.0.story-1.md](../../stories/epic-3.0.story-1.md)
**Epic**: [Epic 3.0 - Foundation & Migration](../../epics/epic-3.0.md)
**Risk Assessment**: [epic-3.0.story-1-risk-20251017.md](./epic-3.0.story-1-risk-20251017.md)
**Test Design Date**: 2025-10-17
**Test Architect**: BMad Test Architect (Quinn)
**Status**: 📋 Ready for Implementation

---

## Executive Summary

This test design provides a comprehensive testing strategy for installing and configuring the OpenAI Agents SDK in a **brownfield codebase** with existing LangGraph functionality. The strategy emphasizes **regression testing** to ensure existing features remain intact while introducing new infrastructure.

### Test Summary

```yaml
test_summary:
  total: 32
  by_level:
    unit: 18        # Pure logic, SDK initialization, agent execution
    integration: 11  # API endpoints, service interactions
    e2e: 3          # Regression testing, end-to-end workflows
  by_priority:
    P0: 14          # Critical paths, regression testing
    P1: 13          # Important validation, integration
    P2: 5           # Edge cases, nice-to-have
```

### Test Coverage by Acceptance Criteria

| AC | Description | Unit | Integration | E2E | Total |
|----|-------------|------|-------------|-----|-------|
| AC1 | SDK package installed | 2 | 1 | 0 | 3 |
| AC2 | SDK initialized with API key | 5 | 2 | 0 | 7 |
| AC3 | Basic agent executes task | 6 | 4 | 1 | 11 |
| AC4 | Tracing enabled | 3 | 2 | 0 | 5 |
| AC5 | Documentation added | 2 | 0 | 0 | 2 |
| **Regression** | Existing features unaffected | 0 | 2 | 2 | 4 |
| **TOTAL** | | **18** | **11** | **3** | **32** |

### Key Testing Priorities

1. **🔴 Regression Testing (P0)**: Verify existing LangGraph agent and E2E tests pass
2. **🔴 Security Testing (P0)**: API key handling, input validation, PII in traces
3. **🟡 Integration Testing (P1)**: API endpoints, error handling, service interactions
4. **🟢 Edge Cases (P2)**: Timeout scenarios, malformed inputs, performance

---

## Test Scenarios by Acceptance Criteria

### AC1: OpenAI Agents SDK npm Package Installed

#### TEST-001: Package Installation Succeeds
- **Level**: Integration
- **Priority**: P0 (Critical - RISK-001)
- **Type**: Installation Test

**Given**: Backend project with existing dependencies
**When**: Developer runs `npm install @openai/agents-sdk`
**Then**:
- Package appears in `package.json` dependencies
- Package-lock.json updated
- No peer dependency conflicts
- `npm ls` shows no errors

**Test Implementation**:
```bash
# Test file: backend/package.json (manual verification)
# Automated check in CI/CD:
npm ls @openai/agents-sdk
echo $? # Should be 0 (success)
```

**Acceptance Criteria**:
- ✅ SDK package installed successfully
- ✅ No npm warnings or errors
- ✅ package-lock.json committed

**Linked Risks**: RISK-001 (SDK availability), RISK-016 (dependency conflicts)

---

#### TEST-002: Package Version Pinned
- **Level**: Unit
- **Priority**: P1 (Important for stability)
- **Type**: Configuration Test

**Given**: SDK installed in project
**When**: Reviewing `package.json`
**Then**: SDK version is pinned exactly (no `^` or `~`)

**Test Implementation**:
```typescript
// Test file: backend/src/__tests__/config/package.test.ts
describe('Package Configuration', () => {
  test('OpenAI Agents SDK version is pinned exactly', () => {
    const packageJson = require('../../../package.json');
    const sdkVersion = packageJson.dependencies['@openai/agents-sdk'];

    expect(sdkVersion).toBeDefined();
    expect(sdkVersion).not.toMatch(/[\^~]/); // No caret or tilde
    expect(sdkVersion).toMatch(/^\d+\.\d+\.\d+$/); // Exact version format
  });
});
```

**Acceptance Criteria**:
- ✅ SDK version in package.json is exact (e.g., "1.0.0", not "^1.0.0")

**Linked Risks**: RISK-001 (SDK stability)

---

#### TEST-003: Existing Dependencies Unaffected
- **Level**: Integration
- **Priority**: P0 (Critical - RISK-005, RISK-016)
- **Type**: Regression Test

**Given**: SDK installed alongside existing OpenAI SDK 5.23.0
**When**: Running `npm ls` and checking dependencies
**Then**:
- No dependency conflicts
- Existing OpenAI SDK 5.23.0 still present
- No breaking changes to existing packages

**Test Implementation**:
```bash
# CI/CD verification script
npm ls openai@5.23.0
npm ls @openai/agents-sdk
npm audit
```

**Acceptance Criteria**:
- ✅ Both OpenAI packages coexist without conflicts
- ✅ No security vulnerabilities introduced
- ✅ All existing dependencies unchanged

**Linked Risks**: RISK-005 (SDK conflict), RISK-016 (version conflicts)

---

### AC2: SDK Initialized with OpenAI API Key

#### TEST-004: SDK Initialization Succeeds
- **Level**: Unit
- **Priority**: P0 (Critical)
- **Type**: Configuration Test

**Given**: Valid `OPENAI_API_KEY` in environment
**When**: SDK config file initializes SDK client
**Then**: SDK client instance created successfully

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/agentsSdk.test.ts
import { agentsSdkClient, initializeAgentsSdk } from '../agentsSdk';

describe('Agents SDK Configuration', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'sk-test-key-1234567890';
  });

  test('SDK initializes with valid API key', () => {
    const client = initializeAgentsSdk();

    expect(client).toBeDefined();
    expect(client).toHaveProperty('agents'); // Or relevant SDK property
  });

  test('SDK client is singleton', () => {
    const client1 = agentsSdkClient;
    const client2 = agentsSdkClient;

    expect(client1).toBe(client2); // Same instance
  });
});
```

**Acceptance Criteria**:
- ✅ SDK client created with API key
- ✅ Singleton pattern implemented (single instance)

**Linked Risks**: RISK-002 (TypeScript types), RISK-003 (serverless compatibility)

---

#### TEST-005: SDK Fails Without API Key
- **Level**: Unit
- **Priority**: P1 (Error handling)
- **Type**: Negative Test

**Given**: `OPENAI_API_KEY` not set in environment
**When**: Attempting to initialize SDK
**Then**: Throws descriptive error

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/agentsSdk.test.ts
describe('Agents SDK Error Handling', () => {
  test('SDK throws error when API key missing', () => {
    delete process.env.OPENAI_API_KEY;

    expect(() => {
      initializeAgentsSdk();
    }).toThrow(/API key/i);
  });

  test('SDK throws error for invalid API key format', () => {
    process.env.OPENAI_API_KEY = 'invalid-key';

    expect(() => {
      initializeAgentsSdk();
    }).toThrow(/API key format/i);
  });
});
```

**Acceptance Criteria**:
- ✅ Descriptive error when API key missing
- ✅ Validation for API key format (starts with `sk-`)

**Linked Risks**: RISK-006 (API key exposure)

---

#### TEST-006: API Key Read from Environment Only
- **Level**: Unit
- **Priority**: P0 (Security - RISK-006)
- **Type**: Security Test

**Given**: Config file implementation
**When**: Reviewing source code
**Then**: No hardcoded API keys

**Test Implementation**:
```bash
# Static analysis test (run in CI/CD)
# Test file: .github/workflows/security-scan.yml

# Scan for hardcoded secrets
grep -r "sk-" backend/src/config/ && exit 1 || exit 0
grep -r "OPENAI_API_KEY.*=.*sk-" backend/src/ && exit 1 || exit 0

# Use git-secrets or similar tool
git secrets --scan
```

**Acceptance Criteria**:
- ✅ No hardcoded API keys in source code
- ✅ API key only read from `process.env.OPENAI_API_KEY`

**Linked Risks**: RISK-006 (API key exposure)

---

#### TEST-007: SDK Configuration Follows Existing Pattern
- **Level**: Unit
- **Priority**: P1 (Code quality)
- **Type**: Structure Test

**Given**: Existing `openai.ts` config file
**When**: Comparing with new `agentsSdk.ts` config
**Then**: Similar structure and patterns

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/configPatterns.test.ts
import * as openaiConfig from '../openai';
import * as agentsSdkConfig from '../agentsSdk';

describe('Configuration Consistency', () => {
  test('Both configs export client instance', () => {
    expect(openaiConfig).toHaveProperty('openaiClient');
    expect(agentsSdkConfig).toHaveProperty('agentsSdkClient');
  });

  test('Both configs follow same naming pattern', () => {
    expect(typeof openaiConfig.openaiClient).toBe('object');
    expect(typeof agentsSdkConfig.agentsSdkClient).toBe('object');
  });
});
```

**Acceptance Criteria**:
- ✅ Config file structure matches `openai.ts` pattern
- ✅ Exports consistent naming (`agentsSdkClient`)

**Linked Risks**: None (code quality best practice)

---

#### TEST-008: TypeScript Types Complete
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-002)
- **Type**: Type Safety Test

**Given**: SDK config file with TypeScript
**When**: Running `npm run type-check`
**Then**: Zero TypeScript errors

**Test Implementation**:
```bash
# CI/CD test
npm run type-check
# Must exit with code 0

# Verify no 'any' types used
grep -r ": any" backend/src/config/agentsSdk.ts && exit 1 || exit 0
```

**Acceptance Criteria**:
- ✅ Zero TypeScript errors in config file
- ✅ No `any` types used (strict mode compliance)
- ✅ All SDK interfaces properly typed

**Linked Risks**: RISK-002 (incomplete TypeScript types), RISK-020 (build failures)

---

#### TEST-009: Cold Start Performance Acceptable
- **Level**: Integration
- **Priority**: P1 (Performance - RISK-004)
- **Type**: Performance Test

**Given**: Serverless environment (Vercel dev)
**When**: First request initializes SDK
**Then**: Initialization completes within 500ms

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/performance.test.ts
describe('SDK Performance', () => {
  test('SDK initialization completes within 500ms', async () => {
    const startTime = Date.now();

    const client = initializeAgentsSdk();

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });

  test('Subsequent SDK calls reuse cached instance', () => {
    const startTime = Date.now();

    const client1 = agentsSdkClient;
    const client2 = agentsSdkClient;

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10); // Should be nearly instant
    expect(client1).toBe(client2);
  });
});
```

**Acceptance Criteria**:
- ✅ SDK initialization ≤ 500ms
- ✅ Subsequent calls use cached instance (≤10ms)

**Linked Risks**: RISK-004 (cold start performance), RISK-010 (SDK initialization overhead)

---

#### TEST-010: Vercel Serverless Compatibility
- **Level**: Integration
- **Priority**: P0 (Critical - RISK-003)
- **Type**: Deployment Test

**Given**: Backend running in `vercel dev` environment
**When**: Making request to SDK-using endpoint
**Then**: Responds successfully without timeout

**Test Implementation**:
```bash
# Manual test (run locally)
cd teacher-assistant/backend
vercel dev

# In another terminal:
curl -X POST http://localhost:3000/api/agents-sdk/test \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' \
  --max-time 10

# Should respond in <2 seconds
```

**Acceptance Criteria**:
- ✅ Endpoint responds in <2 seconds
- ✅ No serverless timeout errors
- ✅ SDK works in Vercel environment

**Linked Risks**: RISK-003 (Vercel incompatibility)

---

### AC3: Basic Agent Executes Simple Task Successfully

#### TEST-011: Test Agent Initialization
- **Level**: Unit
- **Priority**: P0 (Critical)
- **Type**: Agent Test

**Given**: Test agent class defined
**When**: Creating agent instance
**Then**: Agent initializes with correct properties

**Test Implementation**:
```typescript
// Test file: backend/src/agents/__tests__/testAgent.test.ts
import { TestAgent } from '../testAgent';

describe('Test Agent Initialization', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  test('Agent has correct ID', () => {
    expect(agent.id).toBe('test-agent');
  });

  test('Agent has descriptive name', () => {
    expect(agent.name).toBeTruthy();
    expect(typeof agent.name).toBe('string');
  });

  test('Agent is enabled', () => {
    expect(agent.enabled).toBe(true);
  });
});
```

**Acceptance Criteria**:
- ✅ Agent has unique ID
- ✅ Agent has name and description
- ✅ Agent enabled by default

**Linked Risks**: None (basic validation)

---

#### TEST-012: Test Agent Executes Successfully
- **Level**: Unit
- **Priority**: P0 (Critical)
- **Type**: Agent Execution Test

**Given**: Initialized test agent
**When**: Calling agent's execute method
**Then**: Returns expected "Hello from OpenAI Agents SDK" message

**Test Implementation**:
```typescript
// Test file: backend/src/agents/__tests__/testAgent.test.ts
describe('Test Agent Execution', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  test('Agent executes and returns hello message', async () => {
    const result = await agent.execute({});

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('message');
    expect(result.data.message).toBe('Hello from OpenAI Agents SDK');
  });

  test('Agent execution completes within 1 second', async () => {
    const startTime = Date.now();

    await agent.execute({});

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });
});
```

**Acceptance Criteria**:
- ✅ Agent returns success response
- ✅ Response contains expected message
- ✅ Execution completes quickly (<1s)

**Linked Risks**: None (basic functionality)

---

#### TEST-013: Test Agent Handles Empty Input
- **Level**: Unit
- **Priority**: P1 (Error handling)
- **Type**: Negative Test

**Given**: Test agent initialized
**When**: Calling execute with empty/null input
**Then**: Handles gracefully without errors

**Test Implementation**:
```typescript
// Test file: backend/src/agents/__tests__/testAgent.test.ts
describe('Test Agent Input Validation', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  test('Agent handles empty input object', async () => {
    const result = await agent.execute({});

    expect(result.success).toBe(true);
  });

  test('Agent handles null input gracefully', async () => {
    const result = await agent.execute(null as any);

    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });
});
```

**Acceptance Criteria**:
- ✅ No errors with empty input
- ✅ Graceful handling of null input

**Linked Risks**: RISK-009 (input validation)

---

#### TEST-014: Test Agent Error Handling
- **Level**: Unit
- **Priority**: P1 (Error handling)
- **Type**: Error Test

**Given**: Test agent execution encounters error
**When**: Simulating error condition
**Then**: Returns error response in consistent format

**Test Implementation**:
```typescript
// Test file: backend/src/agents/__tests__/testAgent.test.ts
describe('Test Agent Error Handling', () => {
  test('Agent returns error response on failure', async () => {
    // Mock SDK to throw error
    jest.spyOn(agentsSdkClient, 'execute').mockRejectedValue(
      new Error('SDK error')
    );

    const agent = new TestAgent();
    const result = await agent.execute({});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });

  test('Agent error messages are user-friendly', async () => {
    jest.spyOn(agentsSdkClient, 'execute').mockRejectedValue(
      new Error('Network timeout')
    );

    const agent = new TestAgent();
    const result = await agent.execute({});

    expect(result.error).not.toContain('undefined');
    expect(result.error.length).toBeGreaterThan(10);
  });
});
```

**Acceptance Criteria**:
- ✅ Errors return consistent response format
- ✅ Error messages are descriptive

**Linked Risks**: RISK-015 (error handling patterns)

---

#### TEST-015: API Endpoint Returns Test Agent Response
- **Level**: Integration
- **Priority**: P0 (Critical)
- **Type**: API Test

**Given**: Backend server running
**When**: POST to `/api/agents-sdk/test`
**Then**: Returns test agent's hello message

**Test Implementation**:
```typescript
// Test file: backend/src/routes/__tests__/agentsSdk.test.ts
import request from 'supertest';
import app from '../../app';

describe('POST /api/agents-sdk/test', () => {
  test('Endpoint returns test agent response', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send({})
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('message');
    expect(response.body.data.message).toBe('Hello from OpenAI Agents SDK');
  });

  test('Endpoint includes timestamp in response', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send({})
      .expect(200);

    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('number');
  });
});
```

**Acceptance Criteria**:
- ✅ Endpoint returns 200 OK
- ✅ Response contains test agent message
- ✅ Response includes timestamp

**Linked Risks**: None (basic functionality)

---

#### TEST-016: API Endpoint Validates Input
- **Level**: Integration
- **Priority**: P0 (Security - RISK-009)
- **Type**: Security Test

**Given**: API endpoint with input validation
**When**: Sending malformed or invalid requests
**Then**: Returns 400 Bad Request with error message

**Test Implementation**:
```typescript
// Test file: backend/src/routes/__tests__/agentsSdk.test.ts
describe('POST /api/agents-sdk/test - Input Validation', () => {
  test('Rejects malformed JSON', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send('invalid json')
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  test('Rejects oversized payloads', async () => {
    const largePayload = { data: 'x'.repeat(20000) }; // 20KB

    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send(largePayload)
      .expect(413); // Payload Too Large
  });

  test('Validates Content-Type header', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send('plain text')
      .set('Content-Type', 'text/plain')
      .expect(400);
  });
});
```

**Acceptance Criteria**:
- ✅ Malformed JSON returns 400
- ✅ Oversized payloads rejected (413)
- ✅ Invalid Content-Type rejected

**Linked Risks**: RISK-009 (input validation missing)

---

#### TEST-017: API Endpoint Error Handling
- **Level**: Integration
- **Priority**: P1 (Error handling - RISK-015)
- **Type**: Error Test

**Given**: API endpoint encounters internal error
**When**: Agent execution fails
**Then**: Returns 500 with user-friendly error message

**Test Implementation**:
```typescript
// Test file: backend/src/routes/__tests__/agentsSdk.test.ts
describe('POST /api/agents-sdk/test - Error Handling', () => {
  test('Returns 500 on internal error', async () => {
    // Mock agent to throw error
    jest.spyOn(TestAgent.prototype, 'execute').mockRejectedValue(
      new Error('Internal error')
    );

    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send({})
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  test('Error response follows consistent format', async () => {
    jest.spyOn(TestAgent.prototype, 'execute').mockRejectedValue(
      new Error('Test error')
    );

    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send({});

    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('error');
    expect(response.body.success).toBe(false);
  });
});
```

**Acceptance Criteria**:
- ✅ Internal errors return 500
- ✅ Error response has consistent format
- ✅ Error messages are descriptive

**Linked Risks**: RISK-015 (different error handling patterns)

---

#### TEST-018: Route Registration
- **Level**: Integration
- **Priority**: P1 (Integration)
- **Type**: Configuration Test

**Given**: New routes file created
**When**: Server starts
**Then**: New routes registered under `/api/agents-sdk/*`

**Test Implementation**:
```typescript
// Test file: backend/src/routes/__tests__/routeRegistration.test.ts
import request from 'supertest';
import app from '../../app';

describe('Route Registration', () => {
  test('Agents SDK routes registered', async () => {
    // Test that route exists
    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send({});

    expect(response.status).not.toBe(404);
  });

  test('Routes use /api/agents-sdk prefix', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/test')
      .send({});

    expect(response.status).toBeLessThan(500);
  });
});
```

**Acceptance Criteria**:
- ✅ Routes registered successfully
- ✅ Routes use correct prefix (`/api/agents-sdk/`)

**Linked Risks**: RISK-014 (existing API endpoints break)

---

#### TEST-019: E2E Test Agent Execution
- **Level**: E2E
- **Priority**: P0 (Critical)
- **Type**: End-to-End Test

**Given**: Backend server running
**When**: Making real HTTP request to test endpoint
**Then**: Complete workflow succeeds

**Test Implementation**:
```typescript
// Test file: backend/e2e/__tests__/agentsSdk.e2e.test.ts
describe('E2E: Test Agent Execution', () => {
  test('Complete test agent workflow', async () => {
    // Real HTTP request (no mocking)
    const response = await fetch('http://localhost:3000/api/agents-sdk/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.message).toBe('Hello from OpenAI Agents SDK');
  });
});
```

**Acceptance Criteria**:
- ✅ Real HTTP request succeeds
- ✅ Response format correct
- ✅ No console errors

**Linked Risks**: None (E2E validation)

---

#### TEST-020: SDK and OpenAI SDK Coexist
- **Level**: Integration
- **Priority**: P0 (Critical - RISK-005)
- **Type**: Integration Test

**Given**: Both OpenAI SDK and Agents SDK installed
**When**: Using both in same codebase
**Then**: No conflicts, both work correctly

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/sdkCoexistence.test.ts
import { openaiClient } from '../openai';
import { agentsSdkClient } from '../agentsSdk';

describe('SDK Coexistence', () => {
  test('Both SDK clients initialize', () => {
    expect(openaiClient).toBeDefined();
    expect(agentsSdkClient).toBeDefined();
  });

  test('OpenAI client still works for GPT-4', async () => {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10
    });

    expect(completion.choices).toBeDefined();
    expect(completion.choices.length).toBeGreaterThan(0);
  });

  test('Agents SDK client works for test agent', async () => {
    // Test that Agents SDK works independently
    expect(agentsSdkClient).toHaveProperty('execute'); // or relevant method
  });
});
```

**Acceptance Criteria**:
- ✅ Both SDKs initialize without conflicts
- ✅ Existing OpenAI SDK calls still work
- ✅ No TypeScript import conflicts

**Linked Risks**: RISK-005 (SDK conflict with existing OpenAI SDK)

---

#### TEST-021: Test Agent Uses SDK (Not Mock)
- **Level**: Unit
- **Priority**: P2 (Validation)
- **Type**: Integration Validation

**Given**: Test agent implementation
**When**: Executing agent
**Then**: Actually calls OpenAI Agents SDK (not mock)

**Test Implementation**:
```typescript
// Test file: backend/src/agents/__tests__/testAgent.integration.test.ts
describe('Test Agent SDK Integration', () => {
  test('Agent calls real SDK (no mocks)', async () => {
    // Spy on SDK method to ensure it's called
    const sdkSpy = jest.spyOn(agentsSdkClient, 'execute');

    const agent = new TestAgent();
    await agent.execute({});

    expect(sdkSpy).toHaveBeenCalled();
  });
});
```

**Acceptance Criteria**:
- ✅ Agent uses real SDK, not hardcoded response

**Linked Risks**: None (validation)

---

### AC4: SDK Tracing Enabled

#### TEST-022: Tracing Configuration
- **Level**: Unit
- **Priority**: P1 (Feature validation)
- **Type**: Configuration Test

**Given**: SDK config with tracing enabled
**When**: Reviewing tracing configuration
**Then**: Tracing endpoint set to OpenAI platform

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/agentsSdk.test.ts
describe('SDK Tracing Configuration', () => {
  test('Tracing endpoint configured', () => {
    const config = getAgentsSdkConfig();

    expect(config.tracing).toBeDefined();
    expect(config.tracing.endpoint).toBe('https://platform.openai.com/traces');
  });

  test('Tracing can be disabled via environment variable', () => {
    process.env.ENABLE_TRACING = 'false';

    const config = getAgentsSdkConfig();

    expect(config.tracing.enabled).toBe(false);
  });
});
```

**Acceptance Criteria**:
- ✅ Tracing endpoint configured
- ✅ Tracing can be disabled via env var

**Linked Risks**: RISK-007 (tracing data contains PII), RISK-021 (GDPR trace retention)

---

#### TEST-023: Tracing Disabled by Default
- **Level**: Unit
- **Priority**: P0 (Security - RISK-021)
- **Type**: Security Test

**Given**: Production environment (no ENABLE_TRACING set)
**When**: Initializing SDK
**Then**: Tracing is DISABLED

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/agentsSdk.test.ts
describe('Tracing Security', () => {
  beforeEach(() => {
    delete process.env.ENABLE_TRACING;
  });

  test('Tracing disabled by default', () => {
    const config = getAgentsSdkConfig();

    expect(config.tracing.enabled).toBe(false);
  });

  test('Tracing requires explicit opt-in', () => {
    const config = getAgentsSdkConfig();

    // Default: disabled
    expect(config.tracing.enabled).toBe(false);

    // Enable explicitly
    process.env.ENABLE_TRACING = 'true';
    const configEnabled = getAgentsSdkConfig();
    expect(configEnabled.tracing.enabled).toBe(true);
  });
});
```

**Acceptance Criteria**:
- ✅ Tracing disabled by default (GDPR compliance)
- ✅ Explicit opt-in required (`ENABLE_TRACING=true`)

**Linked Risks**: RISK-007 (PII in traces), RISK-021 (GDPR compliance)

---

#### TEST-024: Tracing Data Sanitization
- **Level**: Integration
- **Priority**: P0 (Security - RISK-007)
- **Type**: Privacy Test

**Given**: Tracing enabled
**When**: Agent execution includes user data
**Then**: PII is sanitized before sending to traces

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/tracingSanitization.test.ts
describe('Tracing Data Sanitization', () => {
  test('User IDs are anonymized in traces', async () => {
    const mockTraceData = {
      userId: 'user-123',
      sessionId: 'session-456',
      prompt: 'Teacher Anna from Berlin School'
    };

    const sanitized = sanitizeTraceData(mockTraceData);

    // User ID should be hashed
    expect(sanitized.userId).not.toBe('user-123');
    expect(sanitized.userId).toMatch(/^anon-[a-f0-9]{8}$/);

    // Session ID anonymized
    expect(sanitized.sessionId).not.toBe('session-456');
  });

  test('PII removed from prompts in traces', () => {
    const prompt = 'Create image for Teacher Anna, student Max from Berlin School, Grade 5';

    const sanitized = sanitizePII(prompt);

    // Names should be redacted
    expect(sanitized).not.toContain('Anna');
    expect(sanitized).not.toContain('Max');
    expect(sanitized).toContain('[REDACTED]');
  });
});
```

**Acceptance Criteria**:
- ✅ User IDs hashed/anonymized
- ✅ PII removed from prompts
- ✅ School/class info redacted

**Linked Risks**: RISK-007 (tracing data contains PII)

---

#### TEST-025: Tracing Doesn't Block Execution
- **Level**: Integration
- **Priority**: P1 (Performance - RISK-011)
- **Type**: Performance Test

**Given**: Tracing enabled
**When**: Agent executes
**Then**: Tracing happens asynchronously, doesn't delay response

**Test Implementation**:
```typescript
// Test file: backend/src/config/__tests__/tracingPerformance.test.ts
describe('Tracing Performance', () => {
  test('Tracing is asynchronous (fire-and-forget)', async () => {
    process.env.ENABLE_TRACING = 'true';

    const startTime = Date.now();

    const agent = new TestAgent();
    await agent.execute({});

    const duration = Date.now() - startTime;

    // Execution should complete quickly
    // Tracing sent asynchronously
    expect(duration).toBeLessThan(200);
  });

  test('Tracing failure does not crash agent', async () => {
    // Mock tracing to fail
    jest.spyOn(tracingService, 'sendTrace').mockRejectedValue(
      new Error('Trace endpoint unavailable')
    );

    const agent = new TestAgent();
    const result = await agent.execute({});

    // Agent still succeeds
    expect(result.success).toBe(true);
  });
});
```

**Acceptance Criteria**:
- ✅ Tracing adds <100ms overhead
- ✅ Tracing failures don't crash agent

**Linked Risks**: RISK-011 (tracing overhead slows responses)

---

#### TEST-026: Manual Tracing Verification
- **Level**: Integration
- **Priority**: P2 (Manual validation)
- **Type**: Manual Test

**Given**: Tracing enabled, test agent executed
**When**: Checking OpenAI traces dashboard
**Then**: Trace appears in dashboard

**Test Implementation**:
```markdown
# Manual Test Checklist

1. Set environment variable:
   export ENABLE_TRACING=true

2. Start backend:
   npm run dev

3. Execute test agent:
   curl -X POST http://localhost:3000/api/agents-sdk/test -H "Content-Type: application/json" -d '{}'

4. Open OpenAI dashboard:
   https://platform.openai.com/traces

5. Verify:
   - [ ] Trace appears in dashboard
   - [ ] Trace has correct timestamp
   - [ ] Trace shows agent execution
   - [ ] No PII visible in trace data
```

**Acceptance Criteria**:
- ✅ Traces visible in OpenAI dashboard
- ✅ Trace data sanitized (no PII)

**Linked Risks**: None (manual verification)

---

### AC5: Documentation Added

#### TEST-027: Documentation File Exists
- **Level**: Unit
- **Priority**: P1 (Validation)
- **Type**: Documentation Test

**Given**: Documentation task completed
**When**: Checking docs directory
**Then**: SDK documentation file exists at correct path

**Test Implementation**:
```typescript
// Test file: backend/__tests__/documentation.test.ts
import fs from 'fs';
import path from 'path';

describe('Documentation Requirements', () => {
  test('SDK documentation file exists', () => {
    const docsPath = path.join(
      __dirname,
      '../../docs/architecture/api-documentation/openai-agents-sdk.md'
    );

    expect(fs.existsSync(docsPath)).toBe(true);
  });

  test('Documentation contains required sections', () => {
    const docsPath = path.join(
      __dirname,
      '../../docs/architecture/api-documentation/openai-agents-sdk.md'
    );

    const content = fs.readFileSync(docsPath, 'utf-8');

    expect(content).toContain('# OpenAI Agents SDK');
    expect(content).toContain('## Installation');
    expect(content).toContain('## Configuration');
    expect(content).toContain('## Usage');
    expect(content).toContain('## Tracing');
  });
});
```

**Acceptance Criteria**:
- ✅ Documentation file exists at correct path
- ✅ Contains required sections

**Linked Risks**: None (documentation requirement)

---

#### TEST-028: Documentation Code Examples Valid
- **Level**: Unit
- **Priority**: P2 (Code quality)
- **Type**: Documentation Test

**Given**: Documentation contains code examples
**When**: Extracting code snippets
**Then**: Code snippets are syntactically valid

**Test Implementation**:
```typescript
// Test file: backend/__tests__/documentation.test.ts
describe('Documentation Code Quality', () => {
  test('Code examples in docs are valid TypeScript', () => {
    const docsPath = path.join(
      __dirname,
      '../../docs/architecture/api-documentation/openai-agents-sdk.md'
    );

    const content = fs.readFileSync(docsPath, 'utf-8');

    // Extract code blocks
    const codeBlocks = content.match(/```typescript([\s\S]*?)```/g);

    expect(codeBlocks).toBeTruthy();
    expect(codeBlocks!.length).toBeGreaterThan(0);

    // Each code block should have valid syntax
    codeBlocks!.forEach(block => {
      const code = block.replace(/```typescript\n?/, '').replace(/```/, '');

      // Basic validation: no obvious syntax errors
      expect(code).not.toContain('undefined');
      expect(code.trim().length).toBeGreaterThan(10);
    });
  });
});
```

**Acceptance Criteria**:
- ✅ Code examples syntactically valid
- ✅ Examples match actual implementation

**Linked Risks**: None (documentation quality)

---

### Regression Tests (CRITICAL)

#### TEST-029: Existing LangGraph Agent Still Works
- **Level**: Integration
- **Priority**: P0 (Critical - RISK-013)
- **Type**: Regression Test

**Given**: SDK installed, existing LangGraph agent unchanged
**When**: Executing LangGraph image generation agent
**Then**: Agent works exactly as before

**Test Implementation**:
```typescript
// Test file: backend/src/agents/__tests__/langGraphRegression.test.ts
import { langGraphImageGenerationAgent } from '../langGraphImageGenerationAgent';

describe('Regression: LangGraph Agent', () => {
  test('LangGraph agent still initializes', () => {
    expect(langGraphImageGenerationAgent).toBeDefined();
    expect(langGraphImageGenerationAgent.id).toBe('langgraph-image-generation');
  });

  test('LangGraph agent can execute', async () => {
    const result = await langGraphImageGenerationAgent.execute({
      prompt: 'Test image for regression test',
      userId: 'test-user',
      sessionId: 'test-session'
    }, 'test-user');

    // In test mode, should return mock image
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('LangGraph agent monthly limit still enforced', async () => {
    // Mock user who has reached limit
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 10,
      limit: 10
    } as any);

    const canExecute = await langGraphImageGenerationAgent.canExecute('test-user');

    expect(canExecute).toBe(false);
  });
});
```

**Acceptance Criteria**:
- ✅ LangGraph agent initializes
- ✅ LangGraph agent executes successfully
- ✅ Monthly limit enforcement works

**Linked Risks**: RISK-013 (LangGraph agent breaks)

---

#### TEST-030: Existing API Endpoints Unchanged
- **Level**: Integration
- **Priority**: P0 (Critical - RISK-014)
- **Type**: Regression Test

**Given**: New SDK routes added
**When**: Testing existing API endpoints
**Then**: All existing endpoints work unchanged

**Test Implementation**:
```typescript
// Test file: backend/src/routes/__tests__/regression.test.ts
import request from 'supertest';
import app from '../../app';

describe('Regression: Existing API Endpoints', () => {
  test('GET /api/health still works', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });

  test('GET /api/langgraph-agents/list still works', async () => {
    const response = await request(app)
      .get('/api/langgraph-agents/list')
      .expect(200);

    expect(response.body).toHaveProperty('agents');
    expect(Array.isArray(response.body.agents)).toBe(true);
  });

  test('POST /api/langgraph-agents/execute still works', async () => {
    const response = await request(app)
      .post('/api/langgraph-agents/execute')
      .send({
        agentId: 'langgraph-image-generation',
        params: { prompt: 'test' },
        userId: 'test-user'
      })
      .expect(200);

    expect(response.body).toHaveProperty('success');
  });

  test('POST /api/chat/generate still works', async () => {
    const response = await request(app)
      .post('/api/chat/generate')
      .send({
        message: 'Hello',
        sessionId: 'test-session'
      });

    expect(response.status).toBeLessThan(500);
  });
});
```

**Acceptance Criteria**:
- ✅ All existing endpoints return expected status codes
- ✅ Response formats unchanged
- ✅ No route conflicts

**Linked Risks**: RISK-014 (existing API endpoints break)

---

#### TEST-031: E2E Tests Pass (Baseline)
- **Level**: E2E
- **Priority**: P0 (Critical - RISK-017)
- **Type**: Regression Test

**Given**: All existing E2E tests
**When**: Running full Playwright test suite
**Then**: 100% pass rate (same as before SDK installation)

**Test Implementation**:
```bash
# Run BEFORE SDK installation (establish baseline)
cd teacher-assistant/frontend
npx playwright test > baseline-e2e-results.txt

# Run AFTER SDK installation (verify no regression)
npx playwright test > after-sdk-e2e-results.txt

# Compare results
diff baseline-e2e-results.txt after-sdk-e2e-results.txt
# Should show: 0 differences
```

**Manual Verification**:
```bash
# Key E2E tests that MUST pass:
npx playwright test e2e-tests/image-generation-complete-workflow.spec.ts
npx playwright test e2e-tests/storage-verification.spec.ts
npx playwright test e2e-tests/chat-basic.spec.ts
```

**Acceptance Criteria**:
- ✅ All E2E tests pass (100%)
- ✅ Same pass rate as baseline
- ✅ No new console errors

**Linked Risks**: RISK-017 (E2E tests fail after SDK installation)

---

#### TEST-032: E2E Image Generation Workflow
- **Level**: E2E
- **Priority**: P0 (Critical - RISK-013)
- **Type**: Regression Test

**Given**: Full application running
**When**: User generates image via UI
**Then**: Image generation workflow completes successfully

**Test Implementation**:
```typescript
// Test file: teacher-assistant/frontend/e2e-tests/regression-image-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Regression: Image Generation Workflow', () => {
  test('Complete image generation workflow still works', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3006');

    // Wait for app to load
    await page.waitForSelector('[data-testid="chat-input"]');

    // Type image generation prompt
    await page.fill('[data-testid="chat-input"]', 'Erstelle ein Bild: Test');
    await page.click('[data-testid="send-button"]');

    // Wait for agent confirmation modal
    await page.waitForSelector('[data-testid="agent-modal"]', { timeout: 5000 });

    // Confirm agent
    await page.click('[data-testid="confirm-agent-button"]');

    // Wait for image result (up to 60 seconds)
    await page.waitForSelector('[data-testid="image-result"]', { timeout: 60000 });

    // Verify image displayed
    const imageElement = await page.$('[data-testid="generated-image"]');
    expect(imageElement).toBeTruthy();

    // Verify save to library button present
    const saveButton = await page.$('[data-testid="save-to-library"]');
    expect(saveButton).toBeTruthy();
  });
});
```

**Acceptance Criteria**:
- ✅ Image generation completes successfully
- ✅ Image displays in chat
- ✅ Save to library works

**Linked Risks**: RISK-013 (LangGraph agent breaks)

---

## Test Data & Mocks

### Test Data Requirements

#### Environment Variables (All Tests)
```bash
# Required for all tests
OPENAI_API_KEY=sk-test-1234567890abcdef
NODE_ENV=test

# Optional (tracing tests only)
ENABLE_TRACING=false  # Default: disabled
```

#### Test User Data
```typescript
// Test user for usage limit tests
const testUser = {
  id: 'test-user-001',
  email: 'test@example.com',
  monthlyImageCount: 0,
  imageLimit: 10
};
```

#### Test Agent Parameters
```typescript
// Valid test agent request
const validTestRequest = {};

// Invalid test requests
const invalidRequests = [
  null,
  undefined,
  'not-an-object',
  { oversized: 'x'.repeat(20000) }
];
```

### Mock Strategies

#### Mock OpenAI Agents SDK (Unit Tests)
```typescript
// Mock file: backend/src/__mocks__/agentsSdk.ts
export const mockAgentsSdkClient = {
  execute: jest.fn().mockResolvedValue({
    success: true,
    data: { message: 'Hello from OpenAI Agents SDK' }
  }),
  configure: jest.fn(),
  enableTracing: jest.fn()
};

// Usage in tests
jest.mock('../config/agentsSdk', () => ({
  agentsSdkClient: mockAgentsSdkClient
}));
```

#### Mock Tracing Service (Tracing Tests)
```typescript
// Mock file: backend/src/__mocks__/tracingService.ts
export const mockTracingService = {
  sendTrace: jest.fn().mockResolvedValue(undefined),
  sanitizeTraceData: jest.fn(data => ({
    ...data,
    userId: `anon-${data.userId.substring(0, 8)}`
  }))
};
```

#### Mock Express App (Integration Tests)
```typescript
// Test setup file: backend/src/__tests__/setup.ts
import express from 'express';
import agentsSdkRoutes from '../routes/agentsSdk';

export const createTestApp = () => {
  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use('/api/agents-sdk', agentsSdkRoutes);
  return app;
};
```

### Test Database Setup

**Not Required**: This story doesn't involve database operations. Existing InstantDB setup remains unchanged.

### API Mocking (E2E Tests)

**Not Required**: E2E tests for this story don't need API mocking. Tests verify actual backend implementation.

---

## Execution Strategy

### Test Running Order

#### Phase 1: Pre-Installation Baseline (CRITICAL)
```bash
# Establish baseline BEFORE installing SDK
cd teacher-assistant/backend
npm test > baseline-unit-tests.txt
npm run type-check > baseline-type-check.txt

cd ../frontend
npx playwright test > baseline-e2e-tests.txt

# Save baselines
git add baseline-*.txt
git commit -m "Baseline tests before SDK installation"
```

#### Phase 2: Installation & Configuration Tests
```bash
# After installing SDK package
npm test -- config/agentsSdk.test.ts
npm run type-check

# Verify no regressions
npm test -- langGraphRegression.test.ts
```

#### Phase 3: Unit Tests
```bash
# Test agent implementation
npm test -- agents/testAgent.test.ts

# Test configuration
npm test -- config/agentsSdk.test.ts
npm test -- config/sdkCoexistence.test.ts
```

#### Phase 4: Integration Tests
```bash
# Test API endpoints
npm test -- routes/agentsSdk.test.ts

# Test error handling
npm test -- routes/regression.test.ts
```

#### Phase 5: E2E Tests
```bash
# Run full E2E suite
cd teacher-assistant/frontend
npx playwright test

# Compare with baseline
diff baseline-e2e-tests.txt current-e2e-tests.txt
# MUST show: 0 differences
```

#### Phase 6: Regression Verification (CRITICAL)
```bash
# Manual regression test
cd teacher-assistant/frontend
npm run dev

# In browser:
# 1. Generate image via UI
# 2. Verify artifact saved to library
# 3. Check no console errors

# Test existing API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/langgraph-agents/list
curl -X POST http://localhost:3000/api/langgraph-agents/execute \
  -H "Content-Type: application/json" \
  -d '{"agentId": "langgraph-image-generation", "params": {"prompt": "test"}, "userId": "test-user"}'
```

### CI/CD Integration

#### GitHub Actions Workflow
```yaml
# .github/workflows/test-agents-sdk.yml
name: Agents SDK Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd teacher-assistant/backend
          npm ci

      - name: Run type check
        run: |
          cd teacher-assistant/backend
          npm run type-check

      - name: Run unit tests
        run: |
          cd teacher-assistant/backend
          npm test

      - name: Run integration tests
        run: |
          cd teacher-assistant/backend
          npm test -- routes/

      - name: Build backend
        run: |
          cd teacher-assistant/backend
          npm run build

      - name: Run E2E tests
        run: |
          cd teacher-assistant/frontend
          npm ci
          npx playwright install
          npx playwright test
```

### Parallel Execution

#### Unit Tests (Fast - Run in Parallel)
```json
// jest.config.js
{
  "maxWorkers": 4,
  "testMatch": ["**/__tests__/**/*.test.ts"]
}
```

#### Integration Tests (Medium - Run in Parallel)
```bash
npm test -- --maxWorkers=2 routes/
```

#### E2E Tests (Slow - Run Sequentially)
```bash
# E2E tests run sequentially to avoid port conflicts
npx playwright test --workers=1
```

### Performance Benchmarks

#### Target Performance Metrics

| Metric | Target | Test |
|--------|--------|------|
| SDK Initialization | ≤ 500ms | TEST-009 |
| Test Agent Execution | ≤ 1s | TEST-012 |
| API Endpoint Response | ≤ 2s | TEST-015 |
| Cold Start (Vercel) | ≤ 2s | TEST-010 |
| Tracing Overhead | ≤ 100ms | TEST-025 |
| Unit Test Suite | ≤ 30s | All unit tests |
| Integration Test Suite | ≤ 2min | All integration tests |
| E2E Test Suite | ≤ 10min | All E2E tests |

---

## Test Coverage Requirements

### Coverage Targets

```yaml
coverage_requirements:
  overall: 90%          # Total code coverage
  by_level:
    unit: 95%           # Pure logic should be highly covered
    integration: 85%    # Integration tests cover key paths
    e2e: 70%            # E2E covers critical user journeys

  by_file_type:
    config: 100%        # Configuration files fully tested
    agents: 95%         # Agent logic highly tested
    routes: 90%         # API endpoints well tested
    utils: 85%          # Utility functions tested
```

### Critical Files Requiring 100% Coverage

1. `backend/src/config/agentsSdk.ts` - SDK initialization (RISK-002, RISK-006)
2. `backend/src/agents/testAgent.ts` - Test agent implementation (AC3)
3. `backend/src/routes/agentsSdk.ts` - API endpoints (RISK-009, RISK-015)

### Coverage Gaps Acceptable

- Documentation validation tests (TEST-027, TEST-028): Coverage not applicable
- Manual tracing verification (TEST-026): Cannot be automated
- Performance benchmarks: Measured separately from coverage

---

## Success Metrics

### Definition of Done (Testing)

Story testing is complete when:

#### Unit Tests
- ✅ All 18 unit tests pass (100%)
- ✅ Coverage ≥ 95% for agent and config files
- ✅ Zero TypeScript errors (`npm run type-check`)
- ✅ No `any` types used

#### Integration Tests
- ✅ All 11 integration tests pass (100%)
- ✅ API endpoints return expected responses
- ✅ Error handling tested (4xx, 5xx scenarios)
- ✅ Input validation works

#### E2E Tests
- ✅ All 3 E2E tests pass (100%)
- ✅ Baseline comparison shows 0 regressions
- ✅ Existing image generation workflow works
- ✅ No console errors during E2E runs

#### Regression Verification
- ✅ LangGraph agent still works (TEST-029)
- ✅ Existing API endpoints unchanged (TEST-030)
- ✅ E2E baseline matches current (TEST-031)
- ✅ Manual image generation test passed (TEST-032)

#### Security & Privacy
- ✅ No hardcoded API keys (TEST-006)
- ✅ Tracing disabled by default (TEST-023)
- ✅ PII sanitization implemented (TEST-024)
- ✅ Input validation on all endpoints (TEST-016)

#### Performance
- ✅ SDK initialization ≤ 500ms (TEST-009)
- ✅ Test agent execution ≤ 1s (TEST-012)
- ✅ API response time ≤ 2s (TEST-015)
- ✅ Tracing overhead ≤ 100ms (TEST-025)

---

## Risk-Based Test Prioritization

### P0 Tests (Must Have - Critical)

**Total**: 14 tests

These tests are linked to **HIGH and MEDIUM risks** (score ≥ 6) and **critical functionality**.

| Test ID | Test Name | Linked Risk | Risk Score |
|---------|-----------|-------------|------------|
| TEST-001 | Package installation succeeds | RISK-001 | 6 |
| TEST-003 | Existing dependencies unaffected | RISK-005, RISK-016 | 4, 4 |
| TEST-004 | SDK initialization succeeds | RISK-002 | 4 |
| TEST-006 | API key read from environment only | RISK-006 | 3 |
| TEST-008 | TypeScript types complete | RISK-002, RISK-020 | 4, 4 |
| TEST-010 | Vercel serverless compatibility | RISK-003 | 6 |
| TEST-015 | API endpoint returns test agent response | AC3 | - |
| TEST-016 | API endpoint validates input | RISK-009 | 4 |
| TEST-020 | SDK and OpenAI SDK coexist | RISK-005 | 4 |
| TEST-023 | Tracing disabled by default | RISK-021 | 6 |
| TEST-024 | Tracing data sanitization | RISK-007 | 6 |
| TEST-029 | Existing LangGraph agent still works | RISK-013 | 6 |
| TEST-030 | Existing API endpoints unchanged | RISK-014 | 3 |
| TEST-031 | E2E tests pass (baseline) | RISK-017 | 6 |

### P1 Tests (Should Have - Important)

**Total**: 13 tests

These tests cover **important functionality and medium risks** (score 4-6).

| Test ID | Test Name | Why P1 |
|---------|-----------|--------|
| TEST-002 | Package version pinned | Stability |
| TEST-005 | SDK fails without API key | Error handling |
| TEST-007 | SDK configuration follows pattern | Code quality |
| TEST-009 | Cold start performance acceptable | RISK-004 |
| TEST-011 | Test agent initialization | Core functionality |
| TEST-012 | Test agent executes successfully | Core functionality |
| TEST-013 | Test agent handles empty input | Error handling |
| TEST-014 | Test agent error handling | RISK-015 |
| TEST-017 | API endpoint error handling | RISK-015 |
| TEST-018 | Route registration | Integration |
| TEST-022 | Tracing configuration | Feature validation |
| TEST-025 | Tracing doesn't block execution | RISK-011 |
| TEST-027 | Documentation file exists | AC5 requirement |

### P2 Tests (Nice to Have - Edge Cases)

**Total**: 5 tests

These tests cover **edge cases and low-priority validation**.

| Test ID | Test Name | Why P2 |
|---------|-----------|--------|
| TEST-019 | E2E test agent execution | Additional E2E validation |
| TEST-021 | Test agent uses SDK (not mock) | Implementation detail |
| TEST-026 | Manual tracing verification | Manual check |
| TEST-028 | Documentation code examples valid | Documentation quality |
| TEST-032 | E2E image generation workflow | Duplicate of TEST-031 |

---

## Testing Timeline

### Estimated Test Development Time

| Phase | Duration | Tests | Priority |
|-------|----------|-------|----------|
| **Pre-Installation Baseline** | 15 min | Baseline capture | P0 |
| **Unit Tests** | 2 hours | 18 tests | P0, P1, P2 |
| **Integration Tests** | 1.5 hours | 11 tests | P0, P1 |
| **E2E Tests** | 1 hour | 3 tests | P0 |
| **Manual Verification** | 30 min | Manual checks | P0 |
| **Total** | **5 hours 15 min** | **32 tests** | |

### Test Execution Time

| Test Level | Count | Estimated Time | Parallel | Actual Time |
|------------|-------|----------------|----------|-------------|
| Unit | 18 | 30 seconds | Yes (4 workers) | ~8 seconds |
| Integration | 11 | 2 minutes | Yes (2 workers) | ~1 minute |
| E2E | 3 | 10 minutes | No (sequential) | ~10 minutes |
| **Total** | **32** | **12.5 minutes** | | **~11 minutes** |

---

## Continuous Testing Strategy

### Pre-Commit Tests (Fast - Must Pass)
```bash
# Run before every commit
npm run type-check          # ≤ 10s
npm test -- --onlyChanged   # ≤ 30s
npm run lint                # ≤ 5s
```

### Pre-Push Tests (Medium - Must Pass)
```bash
# Run before pushing to remote
npm test                    # ≤ 1min
npm run build              # ≤ 30s
```

### CI/CD Pipeline (Full - Must Pass)
```bash
# Run on every PR
npm run type-check         # ≤ 10s
npm test                   # ≤ 1min
npm run build             # ≤ 30s
npx playwright test       # ≤ 10min
```

### Nightly Regression Suite
```bash
# Run every night (comprehensive)
npm test -- --coverage
npx playwright test --repeat-each=3
Performance benchmark suite
Security vulnerability scan
```

---

## Rollback Testing

### Rollback Verification Tests

If SDK installation fails, verify rollback successful:

```bash
# After rollback
npm run build                    # Must succeed
npm test                         # All tests pass
npx playwright test              # E2E tests pass

# Verify specific functionality
curl http://localhost:3000/api/langgraph-agents/list
curl http://localhost:3000/api/health
```

**Rollback Success Criteria**:
- ✅ Build succeeds with 0 errors
- ✅ All tests pass (100%)
- ✅ Existing image generation works
- ✅ No console errors

---

## Test Maintenance

### Keeping Tests Up-to-Date

1. **When SDK Updates**:
   - Re-run TEST-002 (version pinning)
   - Re-run TEST-008 (TypeScript types)
   - Review TEST-004 (initialization changes)

2. **When OpenAI API Changes**:
   - Re-run TEST-020 (SDK coexistence)
   - Re-run TEST-029 (LangGraph regression)

3. **When Adding New Agents**:
   - Copy TEST-011 to TEST-014 pattern
   - Add integration tests for new endpoints

4. **When Modifying Tracing**:
   - Re-run TEST-022 to TEST-026 (tracing suite)
   - Update TEST-024 (sanitization logic)

---

## Conclusion

### Test Design Summary

This comprehensive test design ensures:

1. **✅ Zero Regressions**: Existing functionality remains intact (RISK-013, RISK-017)
2. **✅ Security First**: API keys, PII, and input validation thoroughly tested (RISK-006, RISK-007, RISK-009)
3. **✅ Privacy Compliance**: Tracing disabled by default, PII sanitization (RISK-021)
4. **✅ Quality Gates**: 90% coverage, zero TypeScript errors, all tests pass

### Key Success Factors

- **Regression Focus**: 4 dedicated regression tests (TEST-029 to TEST-032)
- **Risk-Based Prioritization**: 14 P0 tests covering critical risks
- **Comprehensive Coverage**: 32 tests across unit, integration, and E2E levels
- **Performance Benchmarks**: Clear targets for SDK initialization and execution

### Ready for Implementation

This test design provides clear guidance for developers:
- ✅ What to test (32 test scenarios)
- ✅ How to test (implementation examples)
- ✅ When to test (execution strategy)
- ✅ What success looks like (acceptance criteria)

---

**Test Design Complete**
**Generated**: 2025-10-17
**Test Architect**: BMad Test Architect (Quinn)
**Status**: 📋 Ready for Implementation
**Next Step**: Begin development with TEST-001 (package installation)
