import { z } from 'zod';
/**
 * Zod schema for validating entry input
 *
 * Ensures:
 * - authorId is a non-empty string
 * - md (markdown content) is a non-empty string
 * - ts (timestamp) is an optional positive integer
 * - type is an optional valid entry type
 */
export declare const EntryInputSchema: z.ZodObject<{
    authorId: z.ZodString;
    md: z.ZodString;
    ts: z.ZodOptional<z.ZodNumber>;
    type: z.ZodDefault<z.ZodOptional<z.ZodEnum<["update", "decision", "error", "handoff", "observation", "task", "checkpoint"]>>>;
}, "strip", z.ZodTypeAny, {
    type: "update" | "decision" | "error" | "handoff" | "observation" | "task" | "checkpoint";
    authorId: string;
    md: string;
    ts?: number | undefined;
}, {
    authorId: string;
    md: string;
    type?: "update" | "decision" | "error" | "handoff" | "observation" | "task" | "checkpoint" | undefined;
    ts?: number | undefined;
}>;
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
export declare const ListOptionsSchema: z.ZodObject<{
    authorId: z.ZodOptional<z.ZodString>;
    after: z.ZodOptional<z.ZodNumber>;
    before: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["update", "decision", "error", "handoff", "observation", "task", "checkpoint"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    type?: "update" | "decision" | "error" | "handoff" | "observation" | "task" | "checkpoint" | undefined;
    authorId?: string | undefined;
    after?: number | undefined;
    before?: number | undefined;
}, {
    type?: "update" | "decision" | "error" | "handoff" | "observation" | "task" | "checkpoint" | undefined;
    authorId?: string | undefined;
    limit?: number | undefined;
    after?: number | undefined;
    before?: number | undefined;
}>;
/**
 * Formats Zod validation errors into user-friendly messages
 *
 * @param error - The ZodError to format
 * @returns A formatted error message string
 */
export declare function formatValidationError(error: z.ZodError): string;
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
export declare function validateEntryInput(input: unknown): z.infer<typeof EntryInputSchema>;
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
export declare function validateListOptions(options: unknown): z.infer<typeof ListOptionsSchema>;
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
export declare function safeValidateEntryInput(input: unknown): {
    success: true;
    data: z.infer<typeof EntryInputSchema>;
} | {
    success: false;
    error: string;
};
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
export declare function safeValidateListOptions(options: unknown): {
    success: true;
    data: z.infer<typeof ListOptionsSchema>;
} | {
    success: false;
    error: string;
};
