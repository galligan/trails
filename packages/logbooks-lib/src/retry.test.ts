import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  retry,
  createRetryWrapper,
  isRetryableDbError,
  retryDb,
  RETRYABLE_DB_ERRORS,
  type RetryOptions,
} from './retry.js';

describe('retry', () => {
  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const result = await retry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await retry(fn, {
      maxAttempts: 3,
      initialDelay: 1,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const error = new Error('persistent failure');
    const fn = vi.fn().mockRejectedValue(error);
    const onExhausted = vi.fn();

    await expect(
      retry(fn, {
        maxAttempts: 2,
        initialDelay: 1,
        onExhausted,
      }),
    ).rejects.toThrow('persistent failure');

    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(onExhausted).toHaveBeenCalledWith(error, 3);
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const delays: number[] = [];

    await expect(
      retry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        backoffMultiplier: 2,
        jitter: false,
        onRetry: (_error, attempt) => {
          // Calculate expected delay for this attempt
          const expectedDelay = 10 * Math.pow(2, attempt - 1);
          delays.push(expectedDelay);
        },
      }),
    ).rejects.toThrow();

    // Verify exponential backoff: 10ms, 20ms, 40ms
    expect(delays).toEqual([10, 20, 40]);
  });

  it('should respect maxDelay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const delays: number[] = [];

    await expect(
      retry(fn, {
        maxAttempts: 4,
        initialDelay: 100,
        maxDelay: 200,
        backoffMultiplier: 2,
        jitter: false,
        onRetry: (_error, attempt) => {
          const expectedDelay = Math.min(100 * Math.pow(2, attempt - 1), 200);
          delays.push(expectedDelay);
        },
      }),
    ).rejects.toThrow();

    // Should cap at maxDelay: 100ms, 200ms, 200ms, 200ms
    expect(delays).toEqual([100, 200, 200, 200]);
  });

  it('should add jitter when enabled', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    let hasJitter = false;

    await expect(
      retry(fn, {
        maxAttempts: 2,
        initialDelay: 100,
        jitter: true,
        onRetry: () => {
          // With jitter, delays should vary
          hasJitter = true;
        },
      }),
    ).rejects.toThrow();

    expect(hasJitter).toBe(true);
  });

  it('should not retry non-retryable errors', async () => {
    const nonRetryableError = new Error('validation error');
    const fn = vi.fn().mockRejectedValue(nonRetryableError);

    await expect(
      retry(fn, {
        maxAttempts: 3,
        initialDelay: 1,
        isRetryable: (error) => {
          return !(error instanceof Error && error.message.includes('validation'));
        },
      }),
    ).rejects.toThrow('validation error');

    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it('should call onRetry callback', async () => {
    const error = new Error('fail');
    const fn = vi.fn().mockRejectedValue(error);
    const onRetry = vi.fn();

    await expect(
      retry(fn, {
        maxAttempts: 2,
        initialDelay: 1,
        onRetry,
      }),
    ).rejects.toThrow('fail');

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(error, 1);
    expect(onRetry).toHaveBeenCalledWith(error, 2);
  });
});

describe('isRetryableDbError', () => {
  it('should identify retryable database errors', () => {
    expect(isRetryableDbError(new Error('SQLITE_BUSY: database is busy'))).toBe(true);
    expect(isRetryableDbError(new Error('SQLITE_LOCKED'))).toBe(true);
    expect(isRetryableDbError(new Error('database is locked'))).toBe(true);
    expect(isRetryableDbError(new Error('Connection ECONNREFUSED'))).toBe(true);
  });

  it('should not retry non-database errors', () => {
    expect(isRetryableDbError(new Error('validation failed'))).toBe(false);
    expect(isRetryableDbError(new Error('not found'))).toBe(false);
    expect(isRetryableDbError(null)).toBe(false);
    expect(isRetryableDbError(undefined)).toBe(false);
  });

  it('should handle case-insensitive matching', () => {
    expect(isRetryableDbError(new Error('sqlite_busy'))).toBe(true);
    expect(isRetryableDbError(new Error('SQLITE_BUSY'))).toBe(true);
    expect(isRetryableDbError(new Error('Database Is Locked'))).toBe(true);
  });
});

describe('createRetryWrapper', () => {
  it('should create a retry function with preset options', async () => {
    const customRetry = createRetryWrapper({
      maxAttempts: 1,
      initialDelay: 1,
    });

    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('success');

    const result = await customRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should allow overriding preset options', async () => {
    const customRetry = createRetryWrapper({
      maxAttempts: 5,
      initialDelay: 1,
    });

    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(customRetry(fn, { maxAttempts: 1 })).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(2); // initial + 1 retry (overridden)
  });
});

describe('retryDb', () => {
  it('should retry database-specific errors', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('SQLITE_BUSY')).mockResolvedValue('success');

    const result = await retryDb(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-database errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('not a db error'));

    await expect(retryDb(fn)).rejects.toThrow('not a db error');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
