import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import apiService from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StatsCard from '../../components/admin/StatsCard';
import RequestList from '../../components/admin/RequestList';
import Loader from '../../components/common/Loader';
import Button from '../../components/ui/Button';
import { REQUEST_STATUS } from '../../utils/constants';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadDashboardData();
  }, [isAdmin, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, requestsResponse] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getAllRequests({ limit: 5 }),
      ]);

      setStats(statsResponse);
      setRecentRequests(requestsResponse.requests || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatsCardClick = (status) => {
    navigate(`/admin/requests?status=${status}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex admin-page">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex admin-page">
      <AdminSidebar />

      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/70">Welcome to Admin Panel</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              {t('frontend:nav.dashboard')}
            </Button>
            <Button variant="ghost" onClick={logout}>
              {t('frontend:nav.logout')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div
            onClick={() => handleStatsCardClick('all')}
            className="cursor-pointer"
          >
            <StatsCard
              title="Total Requests"
              value={
                stats?.summary?.total_requests || stats?.total_requests || 0
              }
              icon="📊"
              color="blue"
            />
          </div>
          <div
            onClick={() => handleStatsCardClick(REQUEST_STATUS.CREATED)}
            className="cursor-pointer"
          >
            <StatsCard
              title="Created"
              value={stats?.summary?.created_requests || stats?.created || 0}
              icon="📝"
              color="purple"
            />
          </div>
          <div
            onClick={() => handleStatsCardClick(REQUEST_STATUS.IN_PROGRESS)}
            className="cursor-pointer"
          >
            <StatsCard
              title="In Progress"
              value={stats?.summary?.in_progress || stats?.in_progress || 0}
              icon="⚙️"
              color="orange"
            />
          </div>
          <div
            onClick={() => handleStatsCardClick(REQUEST_STATUS.PAID)}
            className="cursor-pointer"
          >
            <StatsCard
              title="Paid Requests"
              value={stats?.summary?.paid_requests || stats?.paid_requests || 0}
              icon="💳"
              color="green"
            />
          </div>
          <div
            onClick={() => handleStatsCardClick(REQUEST_STATUS.COMPLETED)}
            className="cursor-pointer"
          >
            <StatsCard
              title="Completed"
              value={
                stats?.summary?.completed_requests || stats?.completed || 0
              }
              icon="✅"
              color="green"
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Requests</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/requests')}
            >
              View All
            </Button>
          </div>
          <RequestList requests={recentRequests} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
