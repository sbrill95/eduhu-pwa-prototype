# Test Design: Epic 3.0, Story 3 - DALL-E Migration to OpenAI SDK

**Story**: [docs/stories/epic-3.0.story-3.md](../../stories/epic-3.0.story-3.md)
**Epic**: [Epic 3.0 - Foundation & Migration](../../epics/epic-3.0.md)
**Risk Assessment**: [epic-3.0.story-3-risk-20251021.md](./epic-3.0.story-3-risk-20251021.md)
**Test Design Date**: 2025-10-21
**Test Architect**: BMad Test Architect (Quinn)
**Status**: 📋 Ready for Execution

---

## Executive Summary

This test design provides a comprehensive testing strategy for migrating DALL-E image generation from LangGraph (842 lines) to OpenAI Agents SDK. The strategy emphasizes **regression prevention** and **100% feature parity** through extensive E2E testing, screenshot comparison, and console error monitoring.

### Test Summary

```yaml
test_summary:
  total: 45
  by_level:
    unit: 22           # Agent methods, prompt enhancement, cost calculation
    integration: 15    # API endpoints, usage limits, artifact creation
    e2e: 8             # Full workflows, Gemini form, regression testing
  by_priority:
    P0: 20             # Critical paths, regression prevention, feature parity
    P1: 18             # Important validation, error handling, integration
    P2: 7              # Edge cases, performance benchmarks, nice-to-have
```

### Test Coverage by Acceptance Criteria

| AC | Description | Unit | Integration | E2E | Total |
|----|-------------|------|-------------|-----|-------|
| AC1 | DALL-E generation works via SDK | 8 | 4 | 2 | 14 |
| AC2 | All existing E2E tests pass | 0 | 2 | 3 | 5 |
| AC3 | Prompt enhancement preserved | 6 | 2 | 1 | 9 |
| AC4 | Image quality matches LangGraph | 2 | 1 | 2 | 5 |
| AC5 | Usage limit enforced (10/month) | 4 | 4 | 0 | 8 |
| **Regression** | Zero regressions | 2 | 2 | 0 | 4 |
| **TOTAL** | | **22** | **15** | **8** | **45** |

### Key Testing Priorities

1. **🔴 Regression Prevention (P0)**: E2E tests baseline comparison - 100% identical results required
2. **🔴 Feature Parity (P0)**: All 10 features from LangGraph verified working in SDK version
3. **🔴 Screenshot Validation (P0)**: Visual comparison of generated images (before/after migration)
4. **🟡 Console Error Monitoring (P1)**: ZERO console errors allowed during E2E test runs
5. **🟡 Test Mode Bypass (P1)**: Verify `VITE_TEST_MODE` works correctly for E2E tests

---

## Test Scenarios by Acceptance Criteria

### AC1: DALL-E 3 Image Generation Works via SDK

#### TEST-001: DALL-E Generation with All Sizes
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-005)
- **Type**: Feature Parity Test

**Given**: ImageGenerationAgent initialized
**When**: Generating images with all supported sizes
**Then**: All size options work correctly

**Test Implementation**:
```typescript
// Test file: backend/src/agents/__tests__/imageGenerationAgent.test.ts
import { ImageGenerationAgent } from '../imageGenerationAgent';

describe('DALL-E Size Support', () => {
  let agent: ImageGenerationAgent;

  beforeEach(() => {
    agent = new ImageGenerationAgent();
    process.env.VITE_TEST_MODE = 'true'; // Use test mode to avoid API calls
  });

  test('Supports 1024x1024 size', async () => {
    const result = await agent.execute({
      prompt: 'Test image',
      size: '1024x1024',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.size).toBe('1024x1024');
  });

  test('Supports 1024x1792 (portrait) size', async () => {
    const result = await agent.execute({
      prompt: 'Test portrait',
      size: '1024x1792',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.size).toBe('1024x1792');
  });

  test('Supports 1792x1024 (landscape) size', async () => {
    const result = await agent.execute({
      prompt: 'Test landscape',
      size: '1792x1024',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.size).toBe('1792x1024');
  });

  test('Defaults to 1024x1024 when size not specified', async () => {
    const result = await agent.execute({
      prompt: 'Test default',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.size).toBe('1024x1024');
  });
});
```

**Acceptance Criteria**:
- ✅ All 3 sizes generate images successfully
- ✅ Default size is 1024x1024 (matches LangGraph)
- ✅ Test mode bypasses real DALL-E calls

**Linked Risks**: RISK-001 (feature parity), RISK-005 (DALL-E parameters)

---

#### TEST-002: DALL-E Quality and Style Options
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-005)
- **Type**: Feature Parity Test

**Given**: ImageGenerationAgent initialized
**When**: Testing quality and style options
**Then**: All combinations work correctly

**Test Implementation**:
```typescript
describe('DALL-E Quality and Style', () => {
  test('Supports standard quality', async () => {
    const result = await agent.execute({
      prompt: 'Test',
      quality: 'standard',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.quality).toBe('standard');
  });

  test('Supports HD quality', async () => {
    const result = await agent.execute({
      prompt: 'Test',
      quality: 'hd',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.quality).toBe('hd');
  });

  test('Supports natural style', async () => {
    const result = await agent.execute({
      prompt: 'Test',
      style: 'natural',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.style).toBe('natural');
  });

  test('Supports vivid style', async () => {
    const result = await agent.execute({
      prompt: 'Test',
      style: 'vivid',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.artifact.content.style).toBe('vivid');
  });

  test('Defaults to standard quality and natural style', async () => {
    const result = await agent.execute({
      prompt: 'Test defaults',
    }, 'test-user');

    expect(result.data.artifact.content.quality).toBe('standard');
    expect(result.data.artifact.content.style).toBe('natural');
  });
});
```

**Acceptance Criteria**:
- ✅ Both quality options work (standard, hd)
- ✅ Both style options work (natural, vivid)
- ✅ Defaults match LangGraph (standard, natural)

---

#### TEST-003: Test Mode Bypass for E2E Tests
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-007)
- **Type**: Infrastructure Test

**Given**: `VITE_TEST_MODE=true` environment variable set
**When**: Executing image generation
**Then**: Returns mock image URL without calling DALL-E API

**Test Implementation**:
```typescript
describe('Test Mode Support', () => {
  test('Returns mock image in test mode', async () => {
    process.env.VITE_TEST_MODE = 'true';

    const result = await agent.execute({
      prompt: 'Test image',
    }, 'test-user');

    expect(result.success).toBe(true);
    expect(result.data.image_url).toContain('picsum.photos'); // Mock URL
    expect(result.data.artifact.content.image_url).toContain('picsum.photos');
  });

  test('Mock image URL is deterministic (same seed)', async () => {
    process.env.VITE_TEST_MODE = 'true';

    const result1 = await agent.execute({
      prompt: 'Test',
    }, 'test-user');

    const result2 = await agent.execute({
      prompt: 'Test',
    }, 'test-user');

    // Same prompt should give same mock image (for screenshot consistency)
    expect(result1.data.image_url).toBe(result2.data.image_url);
  });

  test('Makes real API call in production mode', async () => {
    process.env.VITE_TEST_MODE = 'false';

    // Mock OpenAI API
    const spy = jest.spyOn(openaiClient.images, 'generate').mockResolvedValue({
      data: [{ url: 'https://dalle-generated-url.com/image.png' }],
    } as any);

    const result = await agent.execute({
      prompt: 'Test',
    }, 'test-user');

    expect(spy).toHaveBeenCalled(); // Real API call made
    expect(result.data.image_url).toContain('dalle-generated-url');
  });
});
```

**Acceptance Criteria**:
- ✅ Test mode returns mock image URL
- ✅ Mock URL deterministic (same prompt = same image)
- ✅ Production mode calls real DALL-E API
- ✅ E2E tests can run without API costs

**FAIL Condition**:
- ❌ Test mode makes real DALL-E calls (expensive!)
- ❌ E2E tests can't run without API key

---

### AC3: Prompt Enhancement Preserved

#### TEST-004: German → English Prompt Enhancement
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-002)
- **Type**: Feature Parity Test

**Given**: German prompt from user
**When**: `enhanceGermanPrompt()` called
**Then**: Returns enhanced English prompt with educational context

**Test Implementation**:
```typescript
describe('Prompt Enhancement', () => {
  test('Enhances German prompt to English with educational context', async () => {
    const germanPrompt = 'Erstelle ein Bild zur Photosynthese für Klasse 7';

    const enhanced = await agent.enhanceGermanPrompt(germanPrompt, {
      educationalContext: 'biology',
      targetAgeGroup: '12-13',
      subject: 'science',
    });

    expect(enhanced).toContain('photosynthesis');
    expect(enhanced).toContain('educational');
    expect(enhanced.toLowerCase()).toMatch(/grade\s*7|7th\s*grade/);
    expect(enhanced.length).toBeGreaterThan(germanPrompt.length * 1.5);
  });

  test('Enhancement preserves educational context', async () => {
    const enhanced = await agent.enhanceGermanPrompt(
      'Erstelle ein Arbeitsblatt zur Bruchrechnung',
      { educationalContext: 'worksheet', subject: 'math' }
    );

    expect(enhanced).toContain('worksheet');
    expect(enhanced).toContain('fractions');
    expect(enhanced).toContain('educational');
  });

  test('Detects German language correctly', () => {
    expect(agent.detectLanguage('Erstelle ein Bild')).toBe('de');
    expect(agent.detectLanguage('Create an image')).toBe('en');
    expect(agent.detectLanguage('Photosynthese für Schüler')).toBe('de');
  });

  test('Does not enhance already English prompts', async () => {
    const englishPrompt = 'Create an educational diagram about photosynthesis';

    const result = await agent.enhanceGermanPrompt(englishPrompt, {});

    expect(result).toBe(englishPrompt); // No enhancement needed
  });

  test('Enhancement adds safety constraints', async () => {
    const enhanced = await agent.enhanceGermanPrompt(
      'Erstelle ein Bild für Kinder',
      { targetAgeGroup: '8-10' }
    );

    expect(enhanced.toLowerCase()).toMatch(/age-appropriate|child-safe|suitable for children/);
  });
});
```

**Acceptance Criteria**:
- ✅ German prompts translated to English
- ✅ Educational context added
- ✅ Age-appropriate constraints included
- ✅ Language detection accurate
- ✅ English prompts not enhanced

---

#### TEST-005: Gemini Form Prompt Building
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-013)
- **Type**: Feature Parity Test

**Given**: Gemini form data (`ImageGenerationPrefillData`)
**When**: `buildImagePrompt()` called
**Then**: Returns structured prompt from form fields

**Test Implementation**:
```typescript
describe('Gemini Form Integration', () => {
  test('Builds prompt from complete Gemini form data', () => {
    const formData: ImageGenerationPrefillData = {
      description: 'Photosynthese Prozess',
      imageStyle: 'illustrative',
      learningGroup: 'Klasse 7',
      subject: 'Biologie',
    };

    const prompt = agent.buildImagePrompt(formData);

    expect(prompt).toContain('illustrative');
    expect(prompt).toContain('photosynthesis' || 'Photosynthese');
    expect(prompt).toContain('educational');
    expect(prompt).toContain('biology' || 'Biologie');
  });

  test('Supports all image styles', () => {
    const styles: Array<'realistic' | 'cartoon' | 'illustrative' | 'abstract'> = [
      'realistic', 'cartoon', 'illustrative', 'abstract'
    ];

    styles.forEach(style => {
      const formData: ImageGenerationPrefillData = {
        description: 'Test',
        imageStyle: style,
      };

      const prompt = agent.buildImagePrompt(formData);

      expect(prompt.toLowerCase()).toContain(style);
    });
  });

  test('Handles missing optional fields gracefully', () => {
    const formData: ImageGenerationPrefillData = {
      description: 'Test image',
      imageStyle: 'realistic',
      // learningGroup and subject omitted
    };

    const prompt = agent.buildImagePrompt(formData);

    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(10);
    expect(prompt).toContain('realistic');
  });
});
```

**Acceptance Criteria**:
- ✅ All 4 image styles supported (realistic, cartoon, illustrative, abstract)
- ✅ Optional fields handled gracefully
- ✅ Prompt includes educational context

---

### AC5: Usage Limit Enforced (10 Images/Month)

#### TEST-006: Usage Limit Check (canExecute)
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-004)
- **Type**: Business Logic Test

**Given**: User with varying usage counts
**When**: `canExecute()` called
**Then**: Returns true/false based on monthly limit

**Test Implementation**:
```typescript
describe('Usage Limit Enforcement', () => {
  test('User with 0 images can generate (below limit)', async () => {
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 0,
      limit: 10,
    } as any);

    const canExecute = await agent.canExecute('test-user');

    expect(canExecute).toBe(true);
  });

  test('User with 9 images can generate 10th (at limit)', async () => {
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 9,
      limit: 10,
    } as any);

    const canExecute = await agent.canExecute('test-user');

    expect(canExecute).toBe(true);
  });

  test('User with 10 images blocked from 11th (limit exceeded)', async () => {
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 10,
      limit: 10,
    } as any);

    const canExecute = await agent.canExecute('test-user');

    expect(canExecute).toBe(false);
  });

  test('Premium user can generate 50 images', async () => {
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 49,
      limit: 50,
    } as any);

    const canExecute = await agent.canExecute('premium-user');

    expect(canExecute).toBe(true);
  });

  test('Premium user blocked at 50 images', async () => {
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 50,
      limit: 50,
    } as any);

    const canExecute = await agent.canExecute('premium-user');

    expect(canExecute).toBe(false);
  });
});
```

**Acceptance Criteria**:
- ✅ Free tier limit enforced (10 images/month)
- ✅ Premium tier limit enforced (50 images/month)
- ✅ Users blocked when limit reached
- ✅ Users can generate when below limit

**FAIL Condition**:
- ❌ User can exceed monthly limit
- ❌ Incorrect limit calculation

---

#### TEST-007: Usage Limit Error Message
- **Level**: Integration
- **Priority**: P0 (Critical - RISK-014)
- **Type**: Error Handling Test

**Given**: User at monthly limit
**When**: Attempting to generate image
**Then**: Returns German error message

**Test Implementation**:
```typescript
describe('Usage Limit Error Messages', () => {
  test('Returns German error when limit exceeded', async () => {
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 10,
      limit: 10,
    } as any);

    const result = await agent.execute({
      prompt: 'Test',
    }, 'test-user');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Monatliches Limit für Bildgenerierung erreicht');
  });

  test('Error message is user-friendly German', async () => {
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 10,
      limit: 10,
    } as any);

    const result = await agent.execute({
      prompt: 'Test',
    }, 'test-user');

    expect(result.error).not.toContain('Error:');
    expect(result.error).not.toContain('Exception');
    expect(result.error.length).toBeGreaterThan(10);
  });
});
```

**Acceptance Criteria**:
- ✅ Error message in German
- ✅ User-friendly wording
- ✅ No technical jargon

---

### AC4: Image Quality Matches LangGraph

#### TEST-008: Cost Calculation Accuracy
- **Level**: Unit
- **Priority**: P1 (Important - RISK-010)
- **Type**: Business Logic Test

**Given**: Image generation with different sizes/qualities
**When**: `calculateCost()` called
**Then**: Returns correct cost in cents

**Test Implementation**:
```typescript
describe('Cost Calculation', () => {
  test('Standard 1024x1024 costs 4 cents ($0.04)', () => {
    const cost = agent.calculateCost('1024x1024', 'standard');
    expect(cost).toBe(4);
  });

  test('Standard 1024x1792 costs 8 cents ($0.08)', () => {
    const cost = agent.calculateCost('1024x1792', 'standard');
    expect(cost).toBe(8);
  });

  test('Standard 1792x1024 costs 8 cents ($0.08)', () => {
    const cost = agent.calculateCost('1792x1024', 'standard');
    expect(cost).toBe(8);
  });

  test('HD 1024x1024 costs 8 cents ($0.08)', () => {
    const cost = agent.calculateCost('1024x1024', 'hd');
    expect(cost).toBe(8);
  });

  test('HD 1024x1792 costs 12 cents ($0.12)', () => {
    const cost = agent.calculateCost('1024x1792', 'hd');
    expect(cost).toBe(12);
  });

  test('HD 1792x1024 costs 12 cents ($0.12)', () => {
    const cost = agent.calculateCost('1792x1024', 'hd');
    expect(cost).toBe(12);
  });

  test('Cost included in artifact metadata', async () => {
    process.env.VITE_TEST_MODE = 'true';

    const result = await agent.execute({
      prompt: 'Test',
      size: '1024x1792',
      quality: 'hd',
    }, 'test-user');

    expect(result.data.artifact.content.cost).toBe(12);
  });
});
```

**Acceptance Criteria**:
- ✅ All 6 cost combinations correct
- ✅ Costs match DALL-E pricing
- ✅ Cost stored in artifact metadata

---

#### TEST-009: Title and Tag Generation
- **Level**: Unit
- **Priority**: P0 (Critical - RISK-003)
- **Type**: Feature Parity Test

**Given**: Generated image with description
**When**: `generateTitleAndTags()` called
**Then**: Returns German title and 3-5 tags

**Test Implementation**:
```typescript
describe('Title and Tag Generation', () => {
  test('Generates German title from English description', async () => {
    const result = await agent.generateTitleAndTags(
      'An educational diagram showing the photosynthesis process',
      'Erstelle ein Bild zur Photosynthese'
    );

    expect(result.title).toBeTruthy();
    expect(result.title.length).toBeGreaterThan(5);
    expect(result.title).toMatch(/Photosynthese/i);
  });

  test('Generates 3-5 German tags', async () => {
    const result = await agent.generateTitleAndTags(
      'Math worksheet about fractions',
      'Arbeitsblatt zur Bruchrechnung'
    );

    expect(result.tags).toBeDefined();
    expect(result.tags.length).toBeGreaterThanOrEqual(3);
    expect(result.tags.length).toBeLessThanOrEqual(5);
    expect(result.tags.some(tag => /mathematik|mathe|bruch/i.test(tag))).toBe(true);
  });

  test('Fallback title when ChatGPT fails', async () => {
    jest.spyOn(openaiClient.chat.completions, 'create').mockRejectedValue(
      new Error('API error')
    );

    const result = await agent.generateTitleAndTags(
      'Test image',
      'Test prompt'
    );

    expect(result.title).toBe('Generiertes Bild'); // Fallback title
    expect(result.tags).toContain('Bild'); // Fallback tag
  });

  test('Fallback tags when ChatGPT fails', async () => {
    jest.spyOn(openaiClient.chat.completions, 'create').mockRejectedValue(
      new Error('API error')
    );

    const result = await agent.generateTitleAndTags(
      'Test image',
      'Test prompt'
    );

    expect(result.tags).toHaveLength(greaterThanOrEqual(3));
    expect(result.tags).toContain('Material');
  });
});
```

**Acceptance Criteria**:
- ✅ Title generated in German
- ✅ 3-5 tags generated per image
- ✅ Fallback title/tags when ChatGPT unavailable
- ✅ Tags relevant to image content

---

### Regression Tests (CRITICAL - ZERO TOLERANCE)

#### TEST-010: E2E Tests Baseline Comparison
- **Level**: E2E
- **Priority**: P0 (Critical - RISK-006)
- **Type**: Regression Test

**Given**: Baseline E2E test results from LangGraph implementation
**When**: Running same E2E tests against SDK implementation
**Then**: Results 100% identical (same tests pass/fail)

**Test Implementation**:
```bash
# PRE-MIGRATION: Establish baseline
cd teacher-assistant/frontend
npx playwright test > baseline-e2e-results.txt

# POST-MIGRATION: Compare results
npx playwright test > after-sdk-e2e-results.txt

# MUST: No functional differences
diff baseline-e2e-results.txt after-sdk-e2e-results.txt
# Acceptable: Log text changes, timestamps
# FAIL: Any test that passed now fails
```

**Manual Verification**:
```bash
# Critical E2E tests that MUST pass:
npx playwright test image-generation-complete-workflow.spec.ts
npx playwright test agent-confirmation-visibility.spec.ts
npx playwright test library-navigation-after-generation.spec.ts
npx playwright test storage-verification.spec.ts
```

**Acceptance Criteria**:
- ✅ 100% of baseline tests still pass
- ✅ No new test failures
- ✅ Pass/fail status identical

**FAIL Condition**:
- ❌ ANY test that passed before now fails
- ❌ New console errors detected
- ❌ Different test count (tests missing)

---

#### TEST-011: Screenshot Visual Comparison
- **Level**: E2E
- **Priority**: P0 (Critical - RISK-006)
- **Type**: Visual Regression Test

**Given**: Screenshots from LangGraph implementation
**When**: Capturing same screenshots from SDK implementation
**Then**: Screenshots functionally identical

**Test Implementation**:
```typescript
// Test file: frontend/e2e-tests/sdk-visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression: SDK vs LangGraph', () => {
  test('Image generation workflow screenshots match baseline', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    // Step 1: Chat input
    const chatInput = page.locator('ion-input').first();
    await chatInput.fill('Erstelle ein Bild zur Photosynthese für Klasse 7');

    await page.screenshot({
      path: 'docs/testing/screenshots/sdk-migration/01-chat-input.png',
      fullPage: true,
    });

    // Step 2: Agent confirmation
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="agent-confirmation-card"]');

    await page.screenshot({
      path: 'docs/testing/screenshots/sdk-migration/02-confirmation.png',
      fullPage: true,
    });

    // Step 3: Gemini form
    await page.click('[data-testid="confirm-agent-button"]');
    await page.waitForSelector('ion-modal.agent-modal-gemini');

    await page.screenshot({
      path: 'docs/testing/screenshots/sdk-migration/03-gemini-form.png',
      fullPage: true,
    });

    // Step 4: Image result
    await page.click('[data-testid="generate-image-button"]');
    await page.waitForSelector('[data-testid="image-result"]', { timeout: 65000 });

    await page.screenshot({
      path: 'docs/testing/screenshots/sdk-migration/04-image-result.png',
      fullPage: true,
    });

    // Step 5: Library
    await page.click('[data-testid="tab-library"]');
    await page.waitForSelector('[data-testid="material-card"]');

    await page.screenshot({
      path: 'docs/testing/screenshots/sdk-migration/05-library.png',
      fullPage: true,
    });

    // Compare with baseline screenshots (manual review)
    // MUST: Functionally identical (UI might have minor differences)
  });
});
```

**Manual Comparison Checklist**:
```markdown
# Screenshot Comparison Checklist

Compare baseline vs SDK screenshots:

## 01-chat-input.png
- [ ] Chat input box visible
- [ ] Prompt text identical
- [ ] UI layout unchanged

## 02-confirmation.png
- [ ] Agent confirmation card displayed
- [ ] Confirmation text in German
- [ ] Buttons present (Ja/Nein)

## 03-gemini-form.png
- [ ] Gemini form modal open
- [ ] All form fields visible
- [ ] Description pre-filled

## 04-image-result.png
- [ ] Generated image displayed
- [ ] Image quality comparable
- [ ] Preview buttons present

## 05-library.png
- [ ] Material card in library
- [ ] Title and tags visible
- [ ] Thumbnail displayed
```

**Acceptance Criteria**:
- ✅ All screenshots captured successfully
- ✅ Screenshots functionally identical to baseline
- ✅ No visual regressions detected

**FAIL Condition**:
- ❌ Screenshots show broken UI
- ❌ Missing elements from baseline
- ❌ Image quality significantly worse

---

#### TEST-012: Console Error Monitoring
- **Level**: E2E
- **Priority**: P0 (Critical)
- **Type**: Regression Test

**Given**: E2E tests running against SDK implementation
**When**: Monitoring console output during tests
**Then**: ZERO console errors detected

**Test Implementation**:
```typescript
// Test file: frontend/e2e-tests/console-error-monitoring.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Console Error Monitoring (SDK Migration)', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for unhandled exceptions
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });
  });

  test('Image generation workflow has ZERO console errors', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Full workflow
    await page.fill('[data-testid="chat-input"]', 'Erstelle ein Bild');
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="agent-confirmation-card"]');
    await page.click('[data-testid="confirm-agent-button"]');
    await page.waitForSelector('ion-modal.agent-modal-gemini');
    await page.click('[data-testid="generate-image-button"]');
    await page.waitForSelector('[data-testid="image-result"]', { timeout: 65000 });

    // MUST: ZERO console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Library navigation has ZERO console errors', async ({ page }) => {
    await page.goto('http://localhost:5174');

    // Navigate to library
    await page.click('[data-testid="tab-library"]');
    await page.waitForSelector('[data-testid="library-view"]');

    // Open material preview
    await page.click('[data-testid="material-card"]').first();
    await page.waitForSelector('[data-testid="material-preview"]');

    // MUST: ZERO console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test.afterEach(() => {
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
    }
  });
});
```

**Acceptance Criteria**:
- ✅ ZERO console errors during image generation
- ✅ ZERO console errors during library navigation
- ✅ No unhandled promise rejections
- ✅ No React errors

**FAIL Condition**:
- ❌ ANY console error detected
- ❌ Unhandled exceptions
- ❌ React warnings about state updates

---

### Integration Tests

#### TEST-013: API Endpoint POST /api/agents-sdk/image/generate
- **Level**: Integration
- **Priority**: P0 (Critical)
- **Type**: API Test

**Given**: Backend server running
**When**: POST to SDK image endpoint
**Then**: Returns generated image artifact

**Test Implementation**:
```typescript
// Test file: backend/src/routes/__tests__/agentsSdkImageGeneration.test.ts
import request from 'supertest';
import app from '../../app';

describe('POST /api/agents-sdk/image/generate', () => {
  beforeEach(() => {
    process.env.VITE_TEST_MODE = 'true'; // Use test mode
  });

  test('Generates image with valid request', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/image/generate')
      .send({
        prompt: 'Test image',
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('image_url');
    expect(response.body.data).toHaveProperty('artifact');
  });

  test('Enforces usage limit', async () => {
    // Mock user at limit
    jest.spyOn(agentExecutionService, 'getUserUsage').mockResolvedValue({
      usage_count: 10,
      limit: 10,
    } as any);

    const response = await request(app)
      .post('/api/agents-sdk/image/generate')
      .send({
        prompt: 'Test',
      })
      .expect(200); // Success response but with error

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Limit');
  });

  test('Returns German error messages', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/image/generate')
      .send({
        prompt: '', // Empty prompt
      })
      .expect(200);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Prompt ist erforderlich');
  });

  test('Supports Gemini form input', async () => {
    const response = await request(app)
      .post('/api/agents-sdk/image/generate')
      .send({
        description: 'Photosynthese',
        imageStyle: 'illustrative',
        learningGroup: 'Klasse 7',
        subject: 'Biologie',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.artifact).toBeDefined();
  });
});
```

**Acceptance Criteria**:
- ✅ Endpoint returns 200 OK
- ✅ Image artifact created
- ✅ Usage limits enforced
- ✅ German error messages
- ✅ Gemini form support

---

## Test Execution Strategy

### Phase 1: Pre-Migration Baseline (CRITICAL)

```bash
# BEFORE any SDK migration code is written

# 1. Run ALL E2E tests and save results
cd teacher-assistant/frontend
npx playwright test > baseline-e2e-results.txt

# 2. Capture baseline screenshots
npx playwright test image-generation-complete-workflow.spec.ts
# Screenshots saved to: docs/testing/screenshots/baseline/

# 3. Document baseline console errors (should be 0)
npx playwright test 2>&1 | grep -i "console error" > baseline-console.txt

# 4. Test LangGraph agent manually
# - Generate 10 images with test user
# - Verify 11th blocked
# - Test Gemini form
# - Verify title/tags generated

# 5. Commit baseline
git add baseline-*.txt
git add docs/testing/screenshots/baseline/
git commit -m "Baseline before DALL-E SDK migration (Story 3.0.3)"
```

### Phase 2: Unit Tests (Development)

```bash
# During SDK implementation

# Run unit tests frequently
cd teacher-assistant/backend
npm test -- imageGenerationAgent.test.ts

# Coverage check (target: 90%)
npm test -- imageGenerationAgent.test.ts --coverage
```

### Phase 3: Integration Tests

```bash
# After unit tests pass

# Run integration tests
npm test -- routes/__tests__/agentsSdkImageGeneration.test.ts

# Test API endpoint manually
curl -X POST http://localhost:3000/api/agents-sdk/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test image"}'
```

### Phase 4: E2E Tests (Post-Migration)

```bash
# After integration tests pass

# Run full E2E suite
cd teacher-assistant/frontend
npx playwright test > after-sdk-e2e-results.txt

# Compare with baseline
diff baseline-e2e-results.txt after-sdk-e2e-results.txt
# EXPECT: 0 functional differences

# Capture screenshots
npx playwright test image-generation-complete-workflow.spec.ts
# Screenshots saved to: docs/testing/screenshots/sdk-migration/

# Monitor console errors
npx playwright test console-error-monitoring.spec.ts
# EXPECT: 0 console errors
```

### Phase 5: Manual Verification

```bash
# Final manual checks

# 1. Start dev server
cd teacher-assistant/frontend
npm run dev

# 2. Test in browser
# - Navigate to http://localhost:5174
# - Generate image via chat
# - Verify Gemini form works
# - Check library for saved artifact
# - Verify title and tags present
# - Test regeneration feature

# 3. Test usage limit
# - Generate 10 images with test user
# - Verify 11th blocked with German error

# 4. Compare image quality
# - Generate same prompt with LangGraph
# - Generate same prompt with SDK
# - Visually compare images
# - EXPECT: Comparable quality
```

---

## Success Metrics

### Definition of Done (Testing)

Story testing is complete when:

#### Unit Tests ✅
- ✅ 22 unit tests pass (100%)
- ✅ Coverage ≥ 90% for image agent
- ✅ All 10 features tested

#### Integration Tests ✅
- ✅ 15 integration tests pass (100%)
- ✅ API endpoint works
- ✅ Usage limits enforced
- ✅ German error messages

#### E2E Tests ✅
- ✅ 8 E2E tests pass (100%)
- ✅ Baseline comparison shows 0 regressions
- ✅ Screenshots functionally identical
- ✅ ZERO console errors

#### Feature Parity Checklist ✅
- ✅ DALL-E generation (all sizes/quality/style)
- ✅ Prompt enhancement (German → English)
- ✅ Gemini form integration
- ✅ Title generation (ChatGPT)
- ✅ Tag generation (3-5 tags)
- ✅ Usage limit enforcement (10/month)
- ✅ Cost calculation (accurate)
- ✅ Artifact creation (InstantDB)
- ✅ Error handling (German messages)
- ✅ Test mode bypass (for E2E tests)

#### Quality Standards ✅
- ✅ Build succeeds (0 TypeScript errors)
- ✅ No console errors
- ✅ Visual regressions = 0
- ✅ Image quality comparable

---

## Test Data & Mocks

### Test Prompts

```typescript
// German prompts for testing enhancement
const testPrompts = {
  biology: 'Erstelle ein Bild zur Photosynthese für Klasse 7',
  math: 'Erstelle ein Arbeitsblatt zur Bruchrechnung',
  history: 'Erstelle ein Diagramm zum Mittelalter',
  geography: 'Erstelle eine Karte von Europa',
};

// English prompts (should not be enhanced)
const englishPrompts = {
  biology: 'Create an educational diagram about photosynthesis',
  math: 'Create a worksheet about fractions',
};

// Gemini form test data
const geminiFormData: ImageGenerationPrefillData = {
  description: 'Photosynthese Prozess',
  imageStyle: 'illustrative',
  learningGroup: 'Klasse 7',
  subject: 'Biologie',
};
```

### Mock Strategies

```typescript
// Mock agentExecutionService for usage limit tests
jest.mock('../services/agentExecutionService', () => ({
  getUserUsage: jest.fn().mockResolvedValue({
    usage_count: 0,
    limit: 10,
  }),
}));

// Mock OpenAI client for unit tests
jest.mock('../config/openai', () => ({
  openaiClient: {
    images: {
      generate: jest.fn().mockResolvedValue({
        data: [{ url: 'https://test-image-url.com/image.png' }],
      }),
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Enhanced prompt with educational context',
            },
          }],
        }),
      },
    },
  },
}));
```

---

## Rollback Testing

### If Migration Fails

```bash
# Revert to LangGraph endpoint
# 1. Update route to use LangGraph agent
# 2. Run E2E tests
npx playwright test
# EXPECT: Baseline tests pass

# 3. Verify rollback successful
curl http://localhost:3000/api/langgraph/image/generate \
  -H "Content-Type: application/json" \
  -d '{"agentId": "langgraph-image-generation", "params": {"prompt": "Test"}}'

# EXPECT: 200 OK, image generated
```

---

## Conclusion

### Test Design Summary

This comprehensive test design ensures:

1. **✅ Zero Regressions**: Baseline comparison catches any breaking changes
2. **✅ 100% Feature Parity**: All 10 features from LangGraph verified working
3. **✅ Quality Assurance**: Screenshots, console monitoring, visual comparison
4. **✅ STRICT Quality Gates**: FAIL if ANY regression detected

### Key Success Factors

- **Baseline Testing**: E2E tests BEFORE migration establish comparison point
- **Feature Checklist**: 10 features explicitly tested
- **Screenshot Comparison**: Visual regression detection
- **Console Monitoring**: ZERO errors tolerated
- **Test Mode Support**: E2E tests run without API costs

### Ready for Execution

This test design provides clear guidance:
- ✅ What to test (45 test scenarios)
- ✅ How to test (implementation examples)
- ✅ When to test (execution strategy)
- ✅ What success looks like (acceptance criteria)

---

**Test Design Complete**
**Generated**: 2025-10-21
**Test Architect**: BMad Test Architect (Quinn)
**Status**: 📋 Ready for Execution
**Next Step**: Establish baseline (run E2E tests BEFORE migration)
