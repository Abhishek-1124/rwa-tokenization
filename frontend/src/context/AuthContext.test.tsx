import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Test component to access context
const TestComponent = () => {
  const { isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</span>
      <button onClick={() => login('admin', 'admin123')} data-testid="login-btn">Login</button>
      <button onClick={() => login('wrong', 'wrong')} data-testid="wrong-login-btn">Wrong Login</button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  describe('AuthProvider', () => {
    it('provides default unauthenticated state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    it('restores authenticated state from session storage', () => {
      (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });
  });

  describe('login', () => {
    it('authenticates with correct credentials', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await user.click(screen.getByTestId('login-btn'));

      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('adminAuthenticated', 'true');
    });

    it('does not authenticate with wrong credentials', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await user.click(screen.getByTestId('wrong-login-btn'));

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(window.sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('returns true for successful login', async () => {
      let loginResult: boolean | undefined;

      const LoginResultComponent = () => {
        const { login } = useAuth();
        return (
          <button
            onClick={() => {
              loginResult = login('admin', 'admin123');
            }}
            data-testid="login-result-btn"
          >
            Login
          </button>
        );
      };

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <LoginResultComponent />
        </AuthProvider>
      );

      await user.click(screen.getByTestId('login-result-btn'));

      expect(loginResult).toBe(true);
    });

    it('returns false for failed login', async () => {
      let loginResult: boolean | undefined;

      const LoginResultComponent = () => {
        const { login } = useAuth();
        return (
          <button
            onClick={() => {
              loginResult = login('wrong', 'credentials');
            }}
            data-testid="login-result-btn"
          >
            Login
          </button>
        );
      };

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <LoginResultComponent />
        </AuthProvider>
      );

      await user.click(screen.getByTestId('login-result-btn'));

      expect(loginResult).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears authentication state', async () => {
      const user = userEvent.setup();
      (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

      // Logout
      await user.click(screen.getByTestId('logout-btn'));

      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('adminAuthenticated');
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('credentials validation', () => {
    it('accepts correct username with wrong password', async () => {
      let loginResult: boolean | undefined;

      const TestCredentials = () => {
        const { login, isAuthenticated } = useAuth();
        return (
          <div>
            <button onClick={() => { loginResult = login('admin', 'wrongpassword'); }}>Test</button>
            <span data-testid="status">{isAuthenticated ? 'yes' : 'no'}</span>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestCredentials />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button'));

      expect(loginResult).toBe(false);
      expect(screen.getByTestId('status')).toHaveTextContent('no');
    });

    it('accepts wrong username with correct password', async () => {
      let loginResult: boolean | undefined;

      const TestCredentials = () => {
        const { login, isAuthenticated } = useAuth();
        return (
          <div>
            <button onClick={() => { loginResult = login('wronguser', 'admin123'); }}>Test</button>
            <span data-testid="status">{isAuthenticated ? 'yes' : 'no'}</span>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestCredentials />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button'));

      expect(loginResult).toBe(false);
      expect(screen.getByTestId('status')).toHaveTextContent('no');
    });

    it('handles empty credentials', async () => {
      let loginResult: boolean | undefined;

      const TestCredentials = () => {
        const { login, isAuthenticated } = useAuth();
        return (
          <div>
            <button onClick={() => { loginResult = login('', ''); }}>Test</button>
            <span data-testid="status">{isAuthenticated ? 'yes' : 'no'}</span>
          </div>
        );
      };

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestCredentials />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button'));

      expect(loginResult).toBe(false);
      expect(screen.getByTestId('status')).toHaveTextContent('no');
    });

    it('is case sensitive for username', async () => {
      let loginResult: boolean | undefined;

      const TestCredentials = () => {
        const { login } = useAuth();
        return (
          <button onClick={() => { loginResult = login('Admin', 'admin123'); }}>Test</button>
        );
      };

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestCredentials />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button'));

      expect(loginResult).toBe(false);
    });

    it('is case sensitive for password', async () => {
      let loginResult: boolean | undefined;

      const TestCredentials = () => {
        const { login } = useAuth();
        return (
          <button onClick={() => { loginResult = login('admin', 'Admin123'); }}>Test</button>
        );
      };

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestCredentials />
        </AuthProvider>
      );

      await user.click(screen.getByRole('button'));

      expect(loginResult).toBe(false);
    });
  });

  describe('session persistence', () => {
    it('checks session storage on mount', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(window.sessionStorage.getItem).toHaveBeenCalledWith('adminAuthenticated');
    });

    it('persists login to session storage', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await user.click(screen.getByTestId('login-btn'));

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith('adminAuthenticated', 'true');
    });

    it('removes from session storage on logout', async () => {
      const user = userEvent.setup();
      (window.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await user.click(screen.getByTestId('logout-btn'));

      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('adminAuthenticated');
    });
  });

  describe('multiple login attempts', () => {
    it('allows login after failed attempt', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First failed attempt
      await user.click(screen.getByTestId('wrong-login-btn'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Successful attempt
      await user.click(screen.getByTestId('login-btn'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    it('allows re-login after logout', async () => {
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login
      await user.click(screen.getByTestId('login-btn'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

      // Logout
      await user.click(screen.getByTestId('logout-btn'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

      // Re-login
      await user.click(screen.getByTestId('login-btn'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });
  });
});
