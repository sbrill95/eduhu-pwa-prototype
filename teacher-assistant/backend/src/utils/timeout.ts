/**
 * Timeout Utilities
 *
 * Wraps external service calls with timeout protection and fallback strategies.
 * Eliminates hanging API calls (saved 6-8 hours in past incidents).
 *
 * Usage:
 *   const result = await withTimeout(
 *     someExternalCall(),
 *     5000,
 *     fallbackValue
 *   );
 */

/**
 * Wrap a promise with a timeout
 *
 * @param promise - The promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param fallback - Optional fallback value if timeout occurs
 * @returns The promise result or fallback
 * @throws TimeoutError if timeout occurs and no fallback provided
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback?: T
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (error instanceof TimeoutError && fallback !== undefined) {
      console.warn(`⚠️  Timeout occurred (${timeoutMs}ms), using fallback`, {
        timeoutMs,
        hasFallback: true,
      });
      return fallback;
    }
    throw error;
  }
}

/**
 * Timeout Error class
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wrap an external service call with timeout + retry logic
 *
 * @param fn - Function that returns a promise
 * @param options - Configuration options
 * @returns The result or fallback
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: {
    timeoutMs: number;
    maxRetries?: number;
    retryDelayMs?: number;
    fallback?: T;
    serviceName?: string;
  }
): Promise<T> {
  const {
    timeoutMs,
    maxRetries = 3,
    retryDelayMs = 1000,
    fallback,
    serviceName = 'External Service',
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${serviceName} call (attempt ${attempt}/${maxRetries})`);

      const result = await withTimeout(fn(), timeoutMs, fallback);

      if (attempt > 1) {
        console.log(`✅ ${serviceName} succeeded on attempt ${attempt}`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        console.warn(
          `⚠️  ${serviceName} failed (attempt ${attempt}/${maxRetries}): ${lastError.message}`
        );
        console.log(`  Retrying in ${retryDelayMs}ms...`);

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  // All retries exhausted
  if (fallback !== undefined) {
    console.error(
      `❌ ${serviceName} failed after ${maxRetries} attempts, using fallback`,
      { error: lastError?.message }
    );
    return fallback;
  }

  throw new Error(
    `${serviceName} failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Example: InstantDB query with timeout
 */
export async function instantDBQueryWithTimeout<T>(
  queryFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  return withTimeout(
    queryFn(),
    5000, // 5 second timeout
    fallback
  );
}

/**
 * Example: OpenAI/Gemini API call with timeout + retry
 */
export async function aiAPICallWithTimeout<T>(
  apiFn: () => Promise<T>,
  serviceName: string = 'AI API'
): Promise<T> {
  return withTimeoutAndRetry(apiFn, {
    timeoutMs: 30000, // 30 seconds
    maxRetries: 3,
    retryDelayMs: 2000,
    serviceName,
  });
}
