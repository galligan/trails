import { describe, it, expect } from 'vitest';
import { FieldbooksError, FieldbooksValidationError, FieldbooksDbError } from '../src/errors';

describe('Error Classes', () => {
  describe('FieldbooksError', () => {
    it('should create error with message', () => {
      const error = new FieldbooksError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FieldbooksError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('FieldbooksError');
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new FieldbooksError('Wrapped error', cause);
      expect(error.message).toBe('Wrapped error');
      expect(error.cause).toBe(cause);
    });

    it('should create error without cause', () => {
      const error = new FieldbooksError('Test error');
      expect(error.cause).toBeUndefined();
    });
  });

  describe('FieldbooksValidationError', () => {
    it('should create validation error with errors object', () => {
      const errors = {
        field1: 'Invalid value',
        field2: ['Error 1', 'Error 2'],
      };
      const error = new FieldbooksValidationError('Validation failed', errors);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FieldbooksError);
      expect(error).toBeInstanceOf(FieldbooksValidationError);
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('FieldbooksValidationError');
      expect(error.errors).toEqual(errors);
    });

    it('should handle empty errors object', () => {
      const error = new FieldbooksValidationError('Validation failed', {});
      expect(error.errors).toEqual({});
    });
  });

  describe('FieldbooksDbError', () => {
    it('should create database error with operation', () => {
      const error = new FieldbooksDbError('Database operation failed', 'INSERT');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FieldbooksError);
      expect(error).toBeInstanceOf(FieldbooksDbError);
      expect(error.message).toBe('Database operation failed');
      expect(error.name).toBe('FieldbooksDbError');
      expect(error.operation).toBe('INSERT');
    });

    it('should handle different operation types', () => {
      const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MIGRATE'];

      operations.forEach((op) => {
        const error = new FieldbooksDbError(`Failed to ${op}`, op);
        expect(error.operation).toBe(op);
      });
    });
  });

  describe('Error Hierarchy', () => {
    it('should maintain proper inheritance chain', () => {
      const baseError = new FieldbooksError('Base error');
      const validationError = new FieldbooksValidationError('Validation error', {});
      const dbError = new FieldbooksDbError('DB error', 'SELECT');

      // All should be instances of Error
      expect(baseError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);
      expect(dbError).toBeInstanceOf(Error);

      // All should be instances of FieldbooksError
      expect(baseError).toBeInstanceOf(FieldbooksError);
      expect(validationError).toBeInstanceOf(FieldbooksError);
      expect(dbError).toBeInstanceOf(FieldbooksError);

      // Specific instances
      expect(validationError).toBeInstanceOf(FieldbooksValidationError);
      expect(dbError).toBeInstanceOf(FieldbooksDbError);

      // Should not cross-contaminate
      expect(baseError).not.toBeInstanceOf(FieldbooksValidationError);
      expect(baseError).not.toBeInstanceOf(FieldbooksDbError);
      expect(validationError).not.toBeInstanceOf(FieldbooksDbError);
      expect(dbError).not.toBeInstanceOf(FieldbooksValidationError);
    });
  });
});
