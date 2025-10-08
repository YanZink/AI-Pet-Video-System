import { useState, useEffect } from 'react';
import apiService from '../services/api';

export const useRequests = (autoLoad = true) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getUserRequests();
      setRequests(response.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.createRequest(requestData);
      await loadRequests(); // Reload after creation
      return { success: true, data: response };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to create request';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadRequests();
    }
  }, [autoLoad]);

  return {
    requests,
    loading,
    error,
    loadRequests,
    createRequest,
  };
};
