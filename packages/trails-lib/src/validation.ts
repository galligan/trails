import { z } from 'zod';

export const NoteInputSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  md: z.string().min(1, 'Markdown content is required'),
  ts: z.number().int().positive().optional()
});

export const ListOptionsSchema = z.object({
  agentId: z.string().optional(),
  after: z.number().int().positive().optional(),
  before: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).default(20)
});

export function validateNoteInput(input: unknown) {
  return NoteInputSchema.parse(input);
}

export function validateListOptions(options: unknown) {
  return ListOptionsSchema.parse(options);
}