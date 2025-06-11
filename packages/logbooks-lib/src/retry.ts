/**
 * :A: tldr - Retry utility with exponential backoff and configurable error handling
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (excluding the initial attempt)
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds before the first retry
   * @default 100
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 5000
   */
  maxDelay?: number;

  /**
   * Backoff multiplier for exponential backoff
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Whether to add jitter to the delay to prevent thundering herd
   * @default true
   */
  jitter?: boolean;

  /**
   * Function to determine if an error is retryable
   * @default Retries on all errors
   */
  isRetryable?: (error: unknown) => boolean;

  /**
   * Callback function called on each retry attempt
   */
  onRetry?: (error: unknown, attempt: number) => void;

  /**
   * Callback function called when all retries are exhausted
   */
  onExhausted?: (error: unknown, attempts: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: () => true,
  onRetry: () => {},
  onExhausted: () => {},
};

/**
 * Common retryable error patterns for database operations
 */
export const RETRYABLE_DB_ERRORS = [
  'SQLITE_BUSY',
  'SQLITE_LOCKED',
  'database is locked',
  'database table is locked',
  'cannot commit - no transaction is active',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
];

/**
 * Check if an error is a retryable database error
 */
export function isRetryableDbError(error: unknown): boolean {
  if (error === null || error === undefined) return false;

  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = JSON.stringify(error);
  }
  const errorString = errorMessage.toLowerCase();

  return RETRYABLE_DB_ERRORS.some((pattern) => errorString.includes(pattern.toLowerCase()));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  jitter: boolean,
): number {
  const baseDelay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);

  if (!jitter) {
    return baseDelay;
  }

  // Add jitter: random value between 0 and 50% of base delay
  const jitterAmount = baseDelay * 0.5 * Math.random();
  return Math.floor(baseDelay + jitterAmount);
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The function to retry
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries are exhausted
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.isRetryable(error)) {
        if (attempt === opts.maxAttempts) {
          opts.onExhausted(error, attempt + 1);
        }
        throw error;
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(
        attempt + 1,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier,
        opts.jitter,
      );

      // Call retry callback
      opts.onRetry(error, attempt + 1);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retry wrapper with preset options
 * Useful for creating domain-specific retry functions
 */
export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(fn: () => Promise<T>, overrideOptions?: RetryOptions): Promise<T> => {
    return retry(fn, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Retry wrapper specifically for database operations
 */
export const retryDb = createRetryWrapper({
  maxAttempts: 5,
  initialDelay: 50,
  maxDelay: 2000,
  isRetryable: isRetryableDbError,
  onRetry: (error, attempt) => {
    console.warn(`Database operation failed (attempt ${attempt}):`, error);
  },
});

/**
 * Retry wrapper for network operations
 */
export const retryNetwork = createRetryWrapper({
  maxAttempts: 3,
  initialDelay: 200,
  maxDelay: 10000,
  isRetryable: (error) => {
    if (error === null || error === undefined) return false;
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }
    const errorString = errorMessage.toLowerCase();

    return ['econnrefused', 'etimedout', 'enotfound', 'econnreset', 'epipe', 'fetch failed'].some(
      (pattern) => errorString.includes(pattern),
    );
  },
});
