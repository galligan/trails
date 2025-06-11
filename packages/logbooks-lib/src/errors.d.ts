/**
 * Base error class for all Logbooks errors
 *
 * This error is thrown for general errors that don't fit into more specific categories.
 * It includes an optional cause property for error chaining.
 */
export declare class LogbooksError extends Error {
    cause?: unknown | undefined;
    /**
     * @param message - Human-readable error message
     * @param cause - The underlying cause of the error (optional)
     */
    constructor(message: string, cause?: unknown | undefined);
}
/**
 * Error thrown when input validation fails
 *
 * This error includes detailed validation errors that can be used to provide
 * specific feedback to users about what went wrong.
 */
export declare class LogbooksValidationError extends LogbooksError {
    errors: Record<string, unknown>;
    /**
     * @param message - Human-readable error message
     * @param errors - Object containing field-specific validation errors
     */
    constructor(message: string, errors: Record<string, unknown>);
}
/**
 * Error thrown for database-related failures
 *
 * This error type is specifically used for database operations that fail,
 * such as connection issues, query failures, or constraint violations.
 * The retry logic uses this error type to determine if an operation should be retried.
 */
export declare class LogbooksDbError extends LogbooksError {
    operation: string;
    /**
     * @param message - Human-readable error message
     * @param operation - The name of the database operation that failed
     */
    constructor(message: string, operation: string);
}
