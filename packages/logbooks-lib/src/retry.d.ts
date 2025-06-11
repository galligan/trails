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
/**
 * Common retryable error patterns for database operations
 */
export declare const RETRYABLE_DB_ERRORS: string[];
/**
 * Check if an error is a retryable database error
 */
export declare function isRetryableDbError(error: unknown): boolean;
/**
 * Retry a function with exponential backoff
 *
 * @param fn - The function to retry
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries are exhausted
 */
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Create a retry wrapper with preset options
 * Useful for creating domain-specific retry functions
 */
export declare function createRetryWrapper(defaultOptions: RetryOptions): <T>(fn: () => Promise<T>, overrideOptions?: RetryOptions) => Promise<T>;
/**
 * Retry wrapper specifically for database operations
 */
export declare const retryDb: <T>(fn: () => Promise<T>, overrideOptions?: RetryOptions) => Promise<T>;
/**
 * Retry wrapper for network operations
 */
export declare const retryNetwork: <T>(fn: () => Promise<T>, overrideOptions?: RetryOptions) => Promise<T>;
