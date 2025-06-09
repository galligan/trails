import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  EntryInputSchema,
  ListOptionsSchema,
  validateEntryInput,
  validateListOptions,
} from '../src/validation';

describe('Validation Schemas', () => {
  describe('EntryInputSchema', () => {
    it('should validate valid entry input', () => {
      const validInput = {
        authorId: 'author-123',
        md: '# Test Entry\nThis is a test',
        ts: Date.now(),
        type: 'update',
      };

      expect(() => EntryInputSchema.parse(validInput)).not.toThrow();
      const result = EntryInputSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it('should validate entry input without timestamp', () => {
      const validInput = {
        authorId: 'author-123',
        md: '# Test Entry',
      };

      expect(() => EntryInputSchema.parse(validInput)).not.toThrow();
      const result = EntryInputSchema.parse(validInput);
      expect(result.ts).toBeUndefined();
    });

    it('should reject empty authorId', () => {
      const invalidInput = {
        authorId: '',
        md: 'Test entry',
      };

      expect(() => EntryInputSchema.parse(invalidInput)).toThrow(z.ZodError);
      try {
        EntryInputSchema.parse(invalidInput);
      } catch (err) {
        expect(err).toBeInstanceOf(z.ZodError);
        if (err instanceof z.ZodError) {
          expect(err.errors[0].message).toBe('Author ID cannot be empty');
        }
      }
    });

    it('should reject empty markdown content', () => {
      const invalidInput = {
        authorId: 'author-123',
        md: '',
      };

      expect(() => EntryInputSchema.parse(invalidInput)).toThrow(z.ZodError);
      try {
        EntryInputSchema.parse(invalidInput);
      } catch (err) {
        expect(err).toBeInstanceOf(z.ZodError);
        if (err instanceof z.ZodError) {
          expect(err.errors[0].message).toBe('Markdown content cannot be empty');
        }
      }
    });

    it('should reject negative timestamp', () => {
      const invalidInput = {
        authorId: 'author-123',
        md: 'Test entry',
        ts: -1,
      };

      expect(() => EntryInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });

    it('should reject non-integer timestamp', () => {
      const invalidInput = {
        authorId: 'author-123',
        md: 'Test entry',
        ts: 1234.56,
      };

      expect(() => EntryInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe('ListOptionsSchema', () => {
    it('should validate valid list options', () => {
      const validOptions = {
        authorId: 'author-123',
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
        authorId: 'author-123',
      };

      const result = ListOptionsSchema.parse(options);
      expect(result.authorId).toBe('author-123');
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
    describe('validateEntryInput', () => {
      it('should validate and return valid input', () => {
        const input = {
          authorId: 'author-123',
          md: '# Test',
          ts: Date.now(),
          type: 'update' as const,
        };

        const result = validateEntryInput(input);
        expect(result).toEqual(input);
      });

      it('should throw on invalid input', () => {
        const input = {
          authorId: '',
          md: 'Test',
        };

        expect(() => validateEntryInput(input)).toThrow(z.ZodError);
      });
    });

    describe('validateListOptions', () => {
      it('should validate and return valid options', () => {
        const options = {
          authorId: 'author-123',
          limit: 30,
        };

        const result = validateListOptions(options);
        expect(result.authorId).toBe('author-123');
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
