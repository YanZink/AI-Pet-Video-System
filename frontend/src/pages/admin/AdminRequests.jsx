import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import RequestList from '../../components/admin/RequestList';
import Loader from '../../components/common/Loader';
import { REQUEST_STATUS } from '../../utils/constants';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Check for status from query params
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setFilterStatus(statusFromUrl);
    }

    loadRequests();
  }, [isAdmin, navigate, filterStatus]);

  useEffect(() => {
    // Update filter when URL params change
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && statusFromUrl !== filterStatus) {
      setFilterStatus(statusFromUrl);
    }
  }, [searchParams]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await apiService.getAllRequests(params);
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusFilters = [
    { value: 'all', label: 'All Requests', icon: '📋' },
    { value: REQUEST_STATUS.CREATED, label: 'Created', icon: '📝' },
    { value: REQUEST_STATUS.PAID, label: 'Paid', icon: '💳' },
    {
      value: REQUEST_STATUS.IN_PROGRESS,
      label: 'In Progress',
      icon: '⚙️',
    },
    {
      value: REQUEST_STATUS.COMPLETED,
      label: 'Completed',
      icon: '✅',
    },
  ];

  const getPageTitle = () => {
    switch (filterStatus) {
      case 'all':
        return 'All Requests';
      case REQUEST_STATUS.CREATED:
        return 'Created Requests';
      case REQUEST_STATUS.PAID:
        return 'Paid Requests';
      case REQUEST_STATUS.IN_PROGRESS:
        return 'In Progress Requests';
      case REQUEST_STATUS.COMPLETED:
        return 'Completed Requests';
      default:
        return 'Requests';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex admin-page">
      <AdminSidebar />

      <div className="flex-1 p-8 overflow-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-white/70">Manage video creation requests</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                filterStatus === filter.value
                  ? 'bg-pink-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <span className="mr-2">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="mb-4 text-white/70">
              Found {requests.length} request{requests.length !== 1 ? 's' : ''}
              {filterStatus !== 'all' && ` with status: ${filterStatus}`}
            </div>
            <RequestList requests={requests} onStatusUpdate={loadRequests} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
