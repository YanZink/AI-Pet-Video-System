import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import apiService from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import RequestList from '../../components/admin/RequestList';
import Loader from '../../components/common/Loader';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { REQUEST_STATUS } from '../../utils/constants';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && statusFromUrl !== filterStatus) {
      setFilterStatus(statusFromUrl);
      return; // Не загружаем данные здесь, они загрузятся при изменении filterStatus
    }

    loadRequests();
  }, [isAdmin, navigate, searchParams, filterStatus]);

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
    {
      value: 'all',
      label: t('frontend:admin.admin_filter_all'),
      icon: '📋',
    },
    {
      value: REQUEST_STATUS.CREATED,
      label: t('frontend:admin.admin_filter_created'),
      icon: '📝',
    },
    {
      value: REQUEST_STATUS.PAID,
      label: t('frontend:admin.admin_filter_paid'),
      icon: '💳',
    },
    {
      value: REQUEST_STATUS.IN_PROGRESS,
      label: t('frontend:admin.admin_filter_in_progress'),
      icon: '⚙️',
    },
    {
      value: REQUEST_STATUS.COMPLETED,
      label: t('frontend:admin.admin_filter_completed'),
      icon: '✅',
    },
  ];

  const getPageTitle = () => {
    switch (filterStatus) {
      case 'all':
        return t('frontend:admin.admin_page_title_all');
      case REQUEST_STATUS.CREATED:
        return t('frontend:admin.admin_page_title_created');
      case REQUEST_STATUS.PAID:
        return t('frontend:admin.admin_page_title_paid');
      case REQUEST_STATUS.IN_PROGRESS:
        return t('frontend:admin.admin_page_title_in_progress');
      case REQUEST_STATUS.COMPLETED:
        return t('frontend:admin.admin_page_title_completed');
      default:
        return t('frontend:admin.admin_page_title_default');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex admin-page">
      <AdminSidebar />

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
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
              {t('frontend:admin.admin_dashboard_back')}
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setFilterStatus(filter.value);
                navigate(`/admin/requests?status=${filter.value}`, {
                  replace: true,
                });
              }}
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

        {loading ? (
          <Loader />
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="mb-4 text-white/70">
              {requests.length === 1
                ? t('frontend:admin.admin_requests_found', {
                    count: requests.length,
                  })
                : t('frontend:admin.admin_requests_found_plural', {
                    count: requests.length,
                  })}
            </div>
            <RequestList requests={requests} onStatusUpdate={loadRequests} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
