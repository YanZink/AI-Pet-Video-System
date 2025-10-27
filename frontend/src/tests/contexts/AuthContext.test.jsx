import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock services
jest.mock('../../services/auth', () => ({
  getUser: jest.fn(),
  setAuth: jest.fn(),
  clearAuth: jest.fn(),
  getToken: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  login: jest.fn(),
  register: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
}));

import authService from '../../services/auth';

// Test component
const TestComponent = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? 'hasUser' : 'noUser'}</span>
      <span data-testid="isAuthenticated">{isAuthenticated.toString()}</span>
      <span data-testid="isAdmin">{isAdmin.toString()}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial auth state', () => {
    authService.getUser.mockReturnValue(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user').textContent).toBe('noUser');
    expect(getByTestId('isAuthenticated').textContent).toBe('false');
    expect(getByTestId('isAdmin').textContent).toBe('false');
  });

  it('provides user data when authenticated', () => {
    const mockUser = { id: '1', email: 'test@test.com', role: 'user' };
    authService.getUser.mockReturnValue(mockUser);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user').textContent).toBe('hasUser');
    expect(getByTestId('isAuthenticated').textContent).toBe('true');
  });
});
