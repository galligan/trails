import { describe, it, expect } from 'vitest';
import { TrailsError, TrailsValidationError, TrailsDbError } from '../src/errors';

describe('Error Classes', () => {
  describe('TrailsError', () => {
    it('should create error with message', () => {
      const error = new TrailsError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TrailsError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('TrailsError');
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new TrailsError('Wrapped error', cause);
      expect(error.message).toBe('Wrapped error');
      expect(error.cause).toBe(cause);
    });

    it('should create error without cause', () => {
      const error = new TrailsError('Test error');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('TrailsValidationError', () => {
    it('should create validation error with errors object', () => {
      const errors = {
        field1: 'Invalid value',
        field2: ['Error 1', 'Error 2'],
      };
      const error = new TrailsValidationError('Validation failed', errors);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TrailsError);
      expect(error).toBeInstanceOf(TrailsValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('TrailsValidationError');
      expect(error.errors).toEqual(errors);
    });

    it('should handle empty errors object', () => {
      const error = new TrailsValidationError('Validation failed', {});
      expect(error.errors).toEqual({});
    });
  });

  describe('TrailsDbError', () => {
    it('should create database error with operation', () => {
      const error = new TrailsDbError('Database operation failed', 'INSERT');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TrailsError);
      expect(error).toBeInstanceOf(TrailsDbError);
      expect(error.message).toBe('Database operation failed');
      expect(error.name).toBe('TrailsDbError');
      expect(error.operation).toBe('INSERT');
    });

    it('should handle different operation types', () => {
      const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MIGRATE'];

      operations.forEach((op) => {
        const error = new TrailsDbError(`Failed to ${op}`, op);
        expect(error.operation).toBe(op);
      });
    });
  });

  describe('Error Hierarchy', () => {
    it('should maintain proper inheritance chain', () => {
      const baseError = new TrailsError('Base error');
      const validationError = new TrailsValidationError('Validation error', {});
      const dbError = new TrailsDbError('DB error', 'SELECT');

      // All should be instances of Error
      expect(baseError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);
      expect(dbError).toBeInstanceOf(Error);

      // All should be instances of TrailsError
      expect(baseError).toBeInstanceOf(TrailsError);
      expect(validationError).toBeInstanceOf(TrailsError);
      expect(dbError).toBeInstanceOf(TrailsError);

      // Specific instances
      expect(validationError).toBeInstanceOf(TrailsValidationError);
      expect(dbError).toBeInstanceOf(TrailsDbError);

      // Should not cross-contaminate
      expect(baseError).not.toBeInstanceOf(TrailsValidationError);
      expect(baseError).not.toBeInstanceOf(TrailsDbError);
      expect(validationError).not.toBeInstanceOf(TrailsDbError);
      expect(dbError).not.toBeInstanceOf(TrailsValidationError);
    });
  });
});
