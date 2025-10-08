import { useState } from 'react';
import apiService from '../services/api';

export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAllRequests = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllRequests(params);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to load requests';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, statusData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.updateRequestStatus(
        requestId,
        statusData
      );
      return { success: true, data: response };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to update status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDashboardStats();
      return { success: true, data: response };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to load stats';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAllRequests,
    updateRequestStatus,
    getDashboardStats,
  };
};
