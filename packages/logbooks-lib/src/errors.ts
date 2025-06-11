/**
 * Base error class for all Logbooks errors
 *
 * This error is thrown for general errors that don't fit into more specific categories.
 * It includes an optional cause property for error chaining.
 */
export class LogbooksError extends Error {
  /**
   * @param message - Human-readable error message
   * @param cause - The underlying cause of the error (optional)
   */
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'LogbooksError';
  }
}

/**
 * Error thrown when input validation fails
 *
 * This error includes detailed validation errors that can be used to provide
 * specific feedback to users about what went wrong.
 */
export class LogbooksValidationError extends LogbooksError {
  /**
   * @param message - Human-readable error message
   * @param errors - Object containing field-specific validation errors
   */
  constructor(
    message: string,
    public errors: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'LogbooksValidationError';
  }
}

/**
 * Error thrown for database-related failures
 *
 * This error type is specifically used for database operations that fail,
 * such as connection issues, query failures, or constraint violations.
 * The retry logic uses this error type to determine if an operation should be retried.
 */
export class LogbooksDbError extends LogbooksError {
  /**
   * @param message - Human-readable error message
   * @param operation - The name of the database operation that failed
   */
  constructor(
    message: string,
    public operation: string,
  ) {
    super(message);
    this.name = 'LogbooksDbError';
  }
}
