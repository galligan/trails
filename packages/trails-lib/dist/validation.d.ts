import { z } from 'zod';
export declare const NoteInputSchema: z.ZodObject<{
    agentId: z.ZodString;
    md: z.ZodString;
    ts: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    agentId: string;
    md: string;
    ts?: number | undefined;
}, {
    agentId: string;
    md: string;
    ts?: number | undefined;
}>;
export declare const ListOptionsSchema: z.ZodObject<{
    agentId: z.ZodOptional<z.ZodString>;
    after: z.ZodOptional<z.ZodNumber>;
    before: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    agentId?: string | undefined;
    after?: number | undefined;
    before?: number | undefined;
}, {
    agentId?: string | undefined;
    after?: number | undefined;
    before?: number | undefined;
    limit?: number | undefined;
}>;
export declare function validateNoteInput(input: unknown): {
    agentId: string;
    md: string;
    ts?: number | undefined;
};
export declare function validateListOptions(options: unknown): {
    limit: number;
    agentId?: string | undefined;
    after?: number | undefined;
    before?: number | undefined;
};
