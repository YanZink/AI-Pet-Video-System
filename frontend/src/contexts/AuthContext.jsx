import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getUser());
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await apiService.login(credentials);
      authService.setAuth(response.token, response.user);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await apiService.register(userData);
      authService.setAuth(response.token, response.user);
      setUser(response.user);

      return {
        success: true,
        requiresEmailVerification: response.requiresEmailVerification,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    setLoading(true);
    try {
      const response = await apiService.verifyEmail(token);

      // Update user data if verification successful
      if (response.user) {
        authService.setAuth(authService.getToken(), response.user);
        setUser(response.user);
      }

      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email) => {
    setLoading(true);
    try {
      const response = await apiService.resendVerification(email);
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to resend verification',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.clearAuth();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
