import { z } from 'zod';

/** Maximum length for author ID field */
const MAX_AUTHOR_ID_LENGTH = 255;

/** Maximum length for markdown content */
const MAX_MARKDOWN_LENGTH = 50000;

/**
 * Zod schema for validating entry input
 *
 * Ensures:
 * - authorId is a non-empty string
 * - md (markdown content) is a non-empty string
 * - ts (timestamp) is an optional positive integer
 * - type is an optional valid entry type
 */
export const EntryInputSchema = z.object({
  authorId: z
    .string({
      required_error: 'Author ID is required',
      invalid_type_error: 'Author ID must be a string',
    })
    .min(1, 'Author ID cannot be empty')
    .max(MAX_AUTHOR_ID_LENGTH, `Author ID cannot exceed ${MAX_AUTHOR_ID_LENGTH} characters`),
  md: z
    .string({
      required_error: 'Markdown content is required',
      invalid_type_error: 'Markdown content must be a string',
    })
    .min(1, 'Markdown content cannot be empty')
    .max(
      MAX_MARKDOWN_LENGTH,
      `Markdown content cannot exceed ${MAX_MARKDOWN_LENGTH.toLocaleString()} characters`,
    ),
  ts: z
    .number({
      invalid_type_error: 'Timestamp must be a number',
    })
    .int('Timestamp must be an integer')
    .positive('Timestamp must be a positive number')
    .optional(),
  type: z
    .enum(['update', 'decision', 'error', 'handoff', 'observation', 'task', 'checkpoint'], {
      invalid_type_error: 'Type must be a valid entry type',
    })
    .optional()
    .default('update'),
});

/**
 * Zod schema for validating list options
 *
 * Ensures:
 * - authorId is an optional string
 * - after is an optional positive integer timestamp
 * - before is an optional positive integer timestamp
 * - limit is a positive integer between 1 and 100 (default: 20)
 * - type is an optional valid entry type
 */
export const ListOptionsSchema = z.object({
  authorId: z
    .string({
      invalid_type_error: 'Author ID must be a string',
    })
    .min(1, 'Author ID cannot be empty when provided')
    .max(255, 'Author ID cannot exceed 255 characters')
    .optional(),
  after: z
    .number({
      invalid_type_error: 'After timestamp must be a number',
    })
    .int('After timestamp must be an integer')
    .positive('After timestamp must be a positive number')
    .optional(),
  before: z
    .number({
      invalid_type_error: 'Before timestamp must be a number',
    })
    .int('Before timestamp must be an integer')
    .positive('Before timestamp must be a positive number')
    .optional(),
  limit: z
    .number({
      invalid_type_error: 'Limit must be a number',
    })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  type: z
    .enum(['update', 'decision', 'error', 'handoff', 'observation', 'task', 'checkpoint'], {
      invalid_type_error: 'Type must be a valid entry type',
    })
    .optional(),
});

/**
 * Formats Zod validation errors into user-friendly messages
 *
 * @param error - The ZodError to format
 * @returns A formatted error message string
 */
export function formatValidationError(error: z.ZodError): string {
  const messages = error.errors.map((err) => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });

  return `Validation failed:\n${messages.join('\n')}`;
}

/**
 * Validates input for creating an entry
 *
 * @param input - The input to validate
 * @returns The validated and typed entry input
 * @throws {ZodError} If validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * try {
 *   const validated = validateEntryInput({
 *     authorId: 'my-author',
 *     md: 'Hello world',
 *     ts: Date.now(),
 *     type: 'update'
 *   });
 *   // validated is now typed as EntryInput
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     console.error('Validation failed:', error.errors);
 *   }
 * }
 * ```
 */
export function validateEntryInput(input: unknown): z.infer<typeof EntryInputSchema> {
  return EntryInputSchema.parse(input);
}

/**
 * Validates options for listing entries
 *
 * @param options - The options to validate
 * @returns The validated and typed list options with defaults applied
 * @throws {ZodError} If validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * try {
 *   const validated = validateListOptions({
 *     authorId: 'my-author',
 *     limit: 50,
 *     after: Date.now() - 86400000, // 24 hours ago
 *     type: 'update'
 *   });
 *   // validated.limit is 50
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     console.error('Validation failed:', error.errors);
 *   }
 * }
 * ```
 */
export function validateListOptions(options: unknown): z.infer<typeof ListOptionsSchema> {
  return ListOptionsSchema.parse(options);
}

/**
 * Safely validates input for creating an entry
 *
 * @param input - The input to validate
 * @returns An object with either { success: true, data } or { success: false, error }
 *
 * @example
 * ```typescript
 * const result = safeValidateEntryInput({
 *   authorId: 'my-author',
 *   md: 'Hello world'
 * });
 *
 * if (result.success) {
 *   console.log('Valid input:', result.data);
 * } else {
 *   console.error('Invalid input:', result.error);
 * }
 * ```
 */
export function safeValidateEntryInput(
  input: unknown,
): { success: true; data: z.infer<typeof EntryInputSchema> } | { success: false; error: string } {
  const result = EntryInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: formatValidationError(result.error) };
}

/**
 * Safely validates options for listing entries
 *
 * @param options - The options to validate
 * @returns An object with either { success: true, data } or { success: false, error }
 *
 * @example
 * ```typescript
 * const result = safeValidateListOptions({
 *   limit: 50,
 *   authorId: 'my-author'
 * });
 *
 * if (result.success) {
 *   console.log('Valid options:', result.data);
 * } else {
 *   console.error('Invalid options:', result.error);
 * }
 * ```
 */
export function safeValidateListOptions(
  options: unknown,
): { success: true; data: z.infer<typeof ListOptionsSchema> } | { success: false; error: string } {
  const result = ListOptionsSchema.safeParse(options);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: formatValidationError(result.error) };
}
