import { renderHook, act } from '@testing-library/react';
import { useRequests } from '../../hooks/useRequests';

// Mock API service
jest.mock('../../services/api', () => ({
  getUserRequests: jest.fn(),
  createRequest: jest.fn(),
}));

import apiService from '../../services/api';

describe('useRequests Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads requests on mount', async () => {
    const mockRequests = [{ id: '1', status: 'created' }];
    apiService.getUserRequests.mockResolvedValue({ requests: mockRequests });

    const { result } = renderHook(() => useRequests());

    expect(result.current.loading).toBe(true);

    // Wait for async operation
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.requests).toEqual(mockRequests);
    expect(result.current.loading).toBe(false);
  });

  it('handles request creation', async () => {
    const mockRequestData = { photos: ['photo1'], script: 'test' };
    const mockResponse = { request: { id: '1', ...mockRequestData } };

    apiService.createRequest.mockResolvedValue(mockResponse);
    apiService.getUserRequests.mockResolvedValue({ requests: [] });

    const { result } = renderHook(() => useRequests(false));

    await act(async () => {
      await result.current.createRequest(mockRequestData);
    });

    expect(apiService.createRequest).toHaveBeenCalledWith(mockRequestData);
  });

  it('handles errors', async () => {
    const errorMessage = 'Failed to load';
    apiService.getUserRequests.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useRequests());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe(errorMessage);
  });
});
