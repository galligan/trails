import { describe, it, expect } from 'vitest';
import { LogbooksError, LogbooksValidationError, LogbooksDbError } from '../src/errors';

describe('Error Classes', () => {
  describe('LogbooksError', () => {
    it('should create error with message', () => {
      const error = new LogbooksError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogbooksError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('LogbooksError');
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new LogbooksError('Wrapped error', cause);
      expect(error.message).toBe('Wrapped error');
      expect(error.cause).toBe(cause);
    });

    it('should create error without cause', () => {
      const error = new LogbooksError('Test error');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('LogbooksValidationError', () => {
    it('should create validation error with errors object', () => {
      const errors = {
        field1: 'Invalid value',
        field2: ['Error 1', 'Error 2'],
      };
      const error = new LogbooksValidationError('Validation failed', errors);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogbooksError);
      expect(error).toBeInstanceOf(LogbooksValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('LogbooksValidationError');
      expect(error.errors).toEqual(errors);
    });

    it('should handle empty errors object', () => {
      const error = new LogbooksValidationError('Validation failed', {});
      expect(error.errors).toEqual({});
    });
  });

  describe('LogbooksDbError', () => {
    it('should create database error with operation', () => {
      const error = new LogbooksDbError('Database operation failed', 'INSERT');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogbooksError);
      expect(error).toBeInstanceOf(LogbooksDbError);
      expect(error.message).toBe('Database operation failed');
      expect(error.name).toBe('LogbooksDbError');
      expect(error.operation).toBe('INSERT');
    });

    it('should handle different operation types', () => {
      const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MIGRATE'];

      operations.forEach((op) => {
        const error = new LogbooksDbError(`Failed to ${op}`, op);
        expect(error.operation).toBe(op);
      });
    });
  });

  describe('Error Hierarchy', () => {
    it('should maintain proper inheritance chain', () => {
      const baseError = new LogbooksError('Base error');
      const validationError = new LogbooksValidationError('Validation error', {});
      const dbError = new LogbooksDbError('DB error', 'SELECT');

      // All should be instances of Error
      expect(baseError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);
      expect(dbError).toBeInstanceOf(Error);

      // All should be instances of LogbooksError
      expect(baseError).toBeInstanceOf(LogbooksError);
      expect(validationError).toBeInstanceOf(LogbooksError);
      expect(dbError).toBeInstanceOf(LogbooksError);

      // Specific instances
      expect(validationError).toBeInstanceOf(LogbooksValidationError);
      expect(dbError).toBeInstanceOf(LogbooksDbError);

      // Should not cross-contaminate
      expect(baseError).not.toBeInstanceOf(LogbooksValidationError);
      expect(baseError).not.toBeInstanceOf(LogbooksDbError);
      expect(validationError).not.toBeInstanceOf(LogbooksDbError);
      expect(dbError).not.toBeInstanceOf(LogbooksValidationError);
    });
  });
});
