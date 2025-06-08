import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  NoteInputSchema,
  ListOptionsSchema,
  validateNoteInput,
  validateListOptions,
} from '../src/validation';

describe('Validation Schemas', () => {
  describe('NoteInputSchema', () => {
    it('should validate valid note input', () => {
      const validInput = {
        agentId: 'agent-123',
        md: '# Test Note\nThis is a test',
        ts: Date.now(),
      };

      expect(() => NoteInputSchema.parse(validInput)).not.toThrow();
      const result = NoteInputSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it('should validate note input without timestamp', () => {
      const validInput = {
        agentId: 'agent-123',
        md: '# Test Note',
      };

      expect(() => NoteInputSchema.parse(validInput)).not.toThrow();
      const result = NoteInputSchema.parse(validInput);
      expect(result.ts).toBeUndefined();
    });

    it('should reject empty agentId', () => {
      const invalidInput = {
        agentId: '',
        md: 'Test note',
      };

      expect(() => NoteInputSchema.parse(invalidInput)).toThrow(z.ZodError);
      try {
        NoteInputSchema.parse(invalidInput);
      } catch (err) {
        expect(err).toBeInstanceOf(z.ZodError);
        if (err instanceof z.ZodError) {
          expect(err.errors[0].message).toBe('Agent ID is required');
        }
      }
    });

    it('should reject empty markdown content', () => {
      const invalidInput = {
        agentId: 'agent-123',
        md: '',
      };

      expect(() => NoteInputSchema.parse(invalidInput)).toThrow(z.ZodError);
      try {
        NoteInputSchema.parse(invalidInput);
      } catch (err) {
        expect(err).toBeInstanceOf(z.ZodError);
        if (err instanceof z.ZodError) {
          expect(err.errors[0].message).toBe('Markdown content is required');
        }
      }
    });

    it('should reject negative timestamp', () => {
      const invalidInput = {
        agentId: 'agent-123',
        md: 'Test note',
        ts: -1,
      };

      expect(() => NoteInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject non-integer timestamp', () => {
      const invalidInput = {
        agentId: 'agent-123',
        md: 'Test note',
        ts: 1234.56,
      };

      expect(() => NoteInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe('ListOptionsSchema', () => {
    it('should validate valid list options', () => {
      const validOptions = {
        agentId: 'agent-123',
        after: 1000,
        before: 2000,
        limit: 50,
      };

      expect(() => ListOptionsSchema.parse(validOptions)).not.toThrow();
      const result = ListOptionsSchema.parse(validOptions);
      expect(result).toEqual(validOptions);
    });

    it('should provide default limit', () => {
      const options = {};
      const result = ListOptionsSchema.parse(options);
      expect(result.limit).toBe(20);
    });

    it('should accept partial options', () => {
      const options = {
        agentId: 'agent-123',
      };

      const result = ListOptionsSchema.parse(options);
      expect(result.agentId).toBe('agent-123');
      expect(result.limit).toBe(20);
      expect(result.after).toBeUndefined();
      expect(result.before).toBeUndefined();
    });

    it('should reject limit over 100', () => {
      const invalidOptions = {
        limit: 101,
      };

      expect(() => ListOptionsSchema.parse(invalidOptions)).toThrow(z.ZodError);
    });

    it('should reject negative limit', () => {
      const invalidOptions = {
        limit: -1,
      };

      expect(() => ListOptionsSchema.parse(invalidOptions)).toThrow(z.ZodError);
    });

    it('should reject zero limit', () => {
      const invalidOptions = {
        limit: 0,
      };

      expect(() => ListOptionsSchema.parse(invalidOptions)).toThrow(z.ZodError);
    });

    it('should reject negative after timestamp', () => {
      const invalidOptions = {
        after: -1,
      };

      expect(() => ListOptionsSchema.parse(invalidOptions)).toThrow(z.ZodError);
    });

    it('should reject negative before timestamp', () => {
      const invalidOptions = {
        before: -1,
      };

      expect(() => ListOptionsSchema.parse(invalidOptions)).toThrow(z.ZodError);
    });
  });

  describe('Validation Functions', () => {
    describe('validateNoteInput', () => {
      it('should validate and return valid input', () => {
        const input = {
          agentId: 'agent-123',
          md: '# Test',
          ts: Date.now(),
        };

        const result = validateNoteInput(input);
        expect(result).toEqual(input);
      });

      it('should throw on invalid input', () => {
        const input = {
          agentId: '',
          md: 'Test',
        };

        expect(() => validateNoteInput(input)).toThrow(z.ZodError);
      });
    });

    describe('validateListOptions', () => {
      it('should validate and return valid options', () => {
        const options = {
          agentId: 'agent-123',
          limit: 30,
        };

        const result = validateListOptions(options);
        expect(result.agentId).toBe('agent-123');
        expect(result.limit).toBe(30);
      });

      it('should throw on invalid options', () => {
        const options = {
          limit: 200,
        };

        expect(() => validateListOptions(options)).toThrow(z.ZodError);
      });
    });
  });
});
