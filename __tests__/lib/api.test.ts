import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getAuthToken, setAuthToken, clearAuthAndRedirect, api, ApiError } from '@/lib/api';

describe('API Token Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthToken', () => {
    it('should return null when no token is stored', () => {
      (window.localStorage.getItem as any).mockReturnValue(null);
      const token = getAuthToken();
      expect(token).toBeNull();
    });

    it('should return stored token from localStorage', () => {
      (window.localStorage.getItem as any).mockReturnValue('test-token-123');
      const token = getAuthToken();
      expect(token).toBe('test-token-123');
    });

    it('should return null when localStorage throws error', () => {
      (window.localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });
      const token = getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('setAuthToken', () => {
    it('should store token in localStorage', () => {
      setAuthToken('new-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('app.auth.token', 'new-token');
    });

    it('should remove token when null is passed', () => {
      setAuthToken(null);
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('app.auth.token');
    });
  });

  describe('clearAuthAndRedirect', () => {
    it('should clear auth state and redirect to login', () => {
      const replaceSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { replace: replaceSpy },
        writable: true,
      });

      clearAuthAndRedirect();

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('app.auth.token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('app.auth.user');
      expect(replaceSpy).toHaveBeenCalledWith('/login');
    });
  });
});

describe('ApiError', () => {
  it('should create ApiError with correct properties', () => {
    const error = new ApiError(401, 'Unauthorized', { detail: 'Invalid token' });
    expect(error.status).toBe(401);
    expect(error.message).toBe('Unauthorized');
    expect(error.body).toEqual({ detail: 'Invalid token' });
    expect(error.isAuthError).toBe(true);
  });

  it('should mark non-401 errors as non-auth errors', () => {
    const error = new ApiError(500, 'Server Error');
    expect(error.isAuthError).toBe(false);
  });
});

describe('API HTTP Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.localStorage.getItem as any).mockReturnValue(null);
  });

  it('should construct correct GET request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: 'test' }),
      status: 200,
    });

    const result = await api.get('/test-endpoint');
    expect(result).toEqual({ data: 'test' });
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should construct correct POST request with body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
      status: 200,
    });

    const body = { name: 'test' };
    const result = await api.post('/create', body);

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/create'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Bad request', errors: { name: ['Required'] } }),
    });

    await expect(api.get('/error')).rejects.toThrow();
  });

  it('should include accept header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '{}',
      status: 200,
    });

    await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      })
    );
  });

  it('should handle PUT requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ updated: true }),
      status: 200,
    });

    const result = await api.put('/resource/1', { name: 'updated' });
    expect(result).toEqual({ updated: true });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('should handle PATCH requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ patched: true }),
      status: 200,
    });

    const result = await api.patch('/resource/1', { status: 'active' });
    expect(result).toEqual({ patched: true });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('should handle DELETE requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ deleted: true }),
      status: 200,
    });

    const result = await api.delete('/resource/1');
    expect(result).toEqual({ deleted: true });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
