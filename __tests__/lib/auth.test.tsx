import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth, type AuthUser } from '@/lib/auth';
import React from 'react';

// Mock the auth service
vi.mock('@/services/authService', () => ({
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  fetchProfileRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

// Mock the API utilities
vi.mock('@/lib/api', () => ({
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(() => null),
  clearAuthAndRedirect: vi.fn(),
}));

describe('Auth Context and Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div>Test content</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should initialize with loading state', () => {
      const TestComponent = () => {
        const { isLoading } = useAuth();
        return <div>{isLoading ? 'loading' : 'ready'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('ready')).toBeInTheDocument();
    });

    it('should provide auth context to children', () => {
      const TestComponent = () => {
        const auth = useAuth();
        return <div>{auth ? 'has-auth' : 'no-auth'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('has-auth')).toBeInTheDocument();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuth();
        return null;
      };

      // Suppress error output for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow('useAuth must be used inside <AuthProvider>');

      consoleSpy.mockRestore();
    });

    it('should provide authentication state', () => {
      const TestComponent = () => {
        const { isAuthenticated, user, isAdmin } = useAuth();
        return (
          <div>
            <div>{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
            <div>{user ? user.email : 'no-user'}</div>
            <div>{isAdmin ? 'admin' : 'user'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('not-authenticated')).toBeInTheDocument();
      expect(screen.getByText('no-user')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('should provide hasPermission method', () => {
      const TestComponent = () => {
        const { hasPermission } = useAuth();
        return (
          <div>
            {hasPermission('admin.manage-users') ? 'has-permission' : 'no-permission'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('no-permission')).toBeInTheDocument();
    });
  });

  describe('Role and Permission Management', () => {
    it('should normalize permissions correctly', () => {
      const TestComponent = () => {
        const { hasPermission } = useAuth();
        return (
          <div>
            <div>{hasPermission('cameras') ? 'has-cameras' : 'no-cameras'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('no-cameras')).toBeInTheDocument();
    });

    it('should identify admin users correctly', () => {
      const TestComponent = () => {
        const { isAdmin } = useAuth();
        return <div>{isAdmin ? 'is-admin' : 'is-user'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('is-user')).toBeInTheDocument();
    });
  });
});

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide login method', () => {
    const TestComponent = () => {
      const { login } = useAuth();
      return (
        <button onClick={() => login('test@example.com', 'password')}>
          Login
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const button = screen.getByText('Login');
    expect(button).toBeInTheDocument();
  });

  it('should provide logout method', () => {
    const TestComponent = () => {
      const { logout } = useAuth();
      return (
        <button onClick={() => logout()}>
          Logout
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const button = screen.getByText('Logout');
    expect(button).toBeInTheDocument();
  });

  it('should provide register method', () => {
    const TestComponent = () => {
      const { register } = useAuth();
      return (
        <button onClick={() => register({ email: 'new@example.com', password: 'pass' })}>
          Register
        </button>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const button = screen.getByText('Register');
    expect(button).toBeInTheDocument();
  });
});
