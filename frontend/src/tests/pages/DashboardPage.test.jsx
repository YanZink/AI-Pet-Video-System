import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import DashboardPage from '../../pages/DashboardPage';

// Mock API
jest.mock('../../services/api', () => ({
  getUserRequests: jest.fn(),
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { name: 'Test User' },
  }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

import apiService from '../../services/api';

const TestWrapper = ({ children }) => (
  <LanguageProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </LanguageProvider>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    apiService.getUserRequests.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText('frontend:common.loading')).toBeTruthy();
  });

  it('displays dashboard content after loading', async () => {
    const mockRequests = [];
    apiService.getUserRequests.mockResolvedValue({ requests: mockRequests });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('frontend:dashboard.title')).toBeTruthy();
    });

    expect(apiService.getUserRequests).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no requests', async () => {
    const mockRequests = [];
    apiService.getUserRequests.mockResolvedValue({ requests: mockRequests });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('frontend:dashboard.title')).toBeTruthy();
    });

    expect(screen.getByText('frontend:dashboard.no_requests')).toBeTruthy();
  });
});
