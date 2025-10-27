import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import LanguageSwitcher from '../../../components/common/LanguageSwitcher';

// Mock for i18n
const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders language buttons', () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );

    expect(screen.getByText('EN')).toBeTruthy();
    expect(screen.getByText('RU')).toBeTruthy();
  });

  it('handles language switch clicks', async () => {
    render(
      <TestWrapper>
        <LanguageSwitcher />
      </TestWrapper>
    );

    const ruButton = screen.getByText('RU');

    await act(async () => {
      fireEvent.click(ruButton);
      await Promise.resolve();
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith('ru');
  });
});
