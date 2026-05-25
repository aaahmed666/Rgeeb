import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeApiError,
  ApiError,
  devLog,
  devLogError,
  devLogWarn,
  getErrorMessage,
  isRetryableError,
} from '@/lib/error-handling';

describe('Error Handling Utilities', () => {
  describe('normalizeApiError', () => {
    it('should normalize ApiError instances', () => {
      const apiError = new ApiError(404, 'NOT_FOUND', 'Resource not found', { id: '123' });
      const normalized = normalizeApiError(apiError);

      expect(normalized.statusCode).toBe(404);
      expect(normalized.code).toBe('NOT_FOUND');
      expect(normalized.message).toBe('Resource not found');
      expect(normalized.details).toEqual({ id: '123' });
    });

    it('should normalize Error instances', () => {
      const error = new Error('Something went wrong');
      const normalized = normalizeApiError(error);

      expect(normalized.statusCode).toBe(500);
      expect(normalized.code).toBe('INTERNAL_ERROR');
      expect(normalized.message).toBe('Something went wrong');
    });

    it('should normalize object errors', () => {
      const error = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error occurred',
        statusCode: 400,
        details: { field: 'email' },
      };

      const normalized = normalizeApiError(error);
      expect(normalized).toEqual({
        ...error,
        timestamp: expect.any(String),
      });
    });

    it('should normalize unknown error types', () => {
      const normalized = normalizeApiError('Plain string error');

      expect(normalized.code).toBe('UNKNOWN_ERROR');
      expect(normalized.message).toBe('Plain string error');
      expect(normalized.statusCode).toBe(500);
    });

    it('should handle null errors', () => {
      const normalized = normalizeApiError(null);

      expect(normalized.code).toBe('UNKNOWN_ERROR');
      expect(normalized.statusCode).toBe(500);
    });
  });

  describe('devLog', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should log in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      devLog('TEST', 'Test message', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith('[TEST]', 'Test message', { key: 'value' });

      process.env.NODE_ENV = oldEnv;
      consoleSpy.mockRestore();
    });

    it('should not log in production mode', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      devLog('TEST', 'Test message');

      expect(consoleSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = oldEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('devLogError', () => {
    it('should log errors in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      devLogError('TEST', 'Error occurred', error);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TEST:ERROR]',
        'Error occurred',
        'Test error',
        expect.any(String)
      );

      process.env.NODE_ENV = oldEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('devLogWarn', () => {
    it('should log warnings in development mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      devLogWarn('TEST', 'Warning message', { data: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith('[TEST:WARN]', 'Warning message', { data: 'test' });

      process.env.NODE_ENV = oldEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for known error codes', () => {
      expect(getErrorMessage('UNAUTHORIZED')).toBe('You are not authorized to perform this action');
      expect(getErrorMessage('NOT_FOUND')).toBe('The requested resource was not found');
      expect(getErrorMessage('VALIDATION_ERROR')).toBe('Please check your input and try again');
    });

    it('should return generic message for unknown error codes', () => {
      const message = getErrorMessage('UNKNOWN_CODE');
      expect(message).toBe('An error occurred. Please try again');
    });
  });

  describe('isRetryableError', () => {
    it('should identify 5xx errors as retryable', () => {
      expect(isRetryableError(500)).toBe(true);
      expect(isRetryableError(502)).toBe(true);
      expect(isRetryableError(503)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      expect(isRetryableError(408)).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      expect(isRetryableError(429)).toBe(true);
    });

    it('should not identify 4xx errors (except 408/429) as retryable', () => {
      expect(isRetryableError(400)).toBe(false);
      expect(isRetryableError(401)).toBe(false);
      expect(isRetryableError(403)).toBe(false);
      expect(isRetryableError(404)).toBe(false);
    });

    it('should not identify 2xx/3xx errors as retryable', () => {
      expect(isRetryableError(200)).toBe(false);
      expect(isRetryableError(301)).toBe(false);
    });
  });
});
