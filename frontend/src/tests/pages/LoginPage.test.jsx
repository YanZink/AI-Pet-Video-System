import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';

// Mock contexts
const mockAuth = {
  login: jest.fn(),
  register: jest.fn(),
  loading: false,
};

const mockLanguage = {
  t: (key) => key,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => mockLanguage,
}));

describe('LoginPage', () => {
  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByRole('button', { name: /nav.login/i })).toBeTruthy();
    expect(screen.getByText(/login.no_account/i)).toBeTruthy();
  });

  it('handles form input changes', () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByPlaceholderText(/email_placeholder/i);
    const passwordInput = screen.getByPlaceholderText(/password_placeholder/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
