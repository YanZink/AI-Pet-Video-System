import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Loader from '../components/common/Loader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { REQUEST_STATUS } from '../utils/constants';

const DashboardPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard');
      }, 3000);
    } else if (paymentStatus === 'cancelled') {
      setTimeout(() => {
        window.history.replaceState({}, '', '/dashboard');
      }, 3000);
    }

    loadRequests();
  }, [isAuthenticated, navigate]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusTexts = {
      [REQUEST_STATUS.CREATED]: t('videos:status_created'),
      [REQUEST_STATUS.PAID]: t('videos:status_paid'),
      [REQUEST_STATUS.IN_PROGRESS]: t('videos:status_in_progress'),
      [REQUEST_STATUS.COMPLETED]: t('videos:status_completed'),
      [REQUEST_STATUS.CANCELLED]: t('videos:status_cancelled'),
    };

    const badgeClasses = {
      [REQUEST_STATUS.CREATED]: 'badge-created',
      [REQUEST_STATUS.PAID]: 'badge-paid',
      [REQUEST_STATUS.IN_PROGRESS]: 'badge-in-progress',
      [REQUEST_STATUS.COMPLETED]: 'badge-completed',
      [REQUEST_STATUS.CANCELLED]: 'badge-cancelled',
    };

    return (
      <span className={`badge ${badgeClasses[status]}`}>
        {statusTexts[status]}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 page-with-header">
        <Header />
        <div className="flex-grow container mx-auto px-4 pt-24 pb-12">
          <Loader />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 page-with-header">
      <Header />

      <div className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {searchParams.get('payment') === 'success' && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-6 py-4 rounded-lg mb-6 animate-fade-in">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <h4 className="font-bold">{t('payments:success')}</h4>
                  <p className="text-sm">{t('videos:status_paid')}</p>
                </div>
              </div>
            </div>
          )}

          {searchParams.get('payment') === 'cancelled' && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-6 py-4 rounded-lg mb-6 animate-fade-in">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-bold">{t('payments:cancelled')}</h4>
                  <p className="text-sm">
                    You can try again when you're ready.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {t('frontend:dashboard.title')}
              </h1>
              <p className="text-white/70">
                {t('common:welcome_back', {
                  name: user?.first_name || user?.username || 'User',
                }).replace(
                  '{name}',
                  user?.first_name || user?.username || 'User'
                )}
              </p>
            </div>
            <Button onClick={() => navigate('/create-request')}>
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('frontend:dashboard.create_new')}
            </Button>
          </div>

          {requests.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t('frontend:dashboard.no_requests')}
                </h3>
                <p className="text-white/70 mb-6">{t('videos:no_requests')}</p>
                <Button onClick={() => navigate('/create-request')}>
                  {t('videos:create_video')}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6">
              {requests.map((request) => (
                <Card
                  key={request.id}
                  className="hover:bg-white/15 transition-all cursor-pointer"
                >
                  <Link to={`/request/${request.id}`}>
                    <div className="flex flex-col">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="w-full md:w-32 h-32 bg-white/5 rounded-lg overflow-hidden">
                            {request.photos && request.photos[0] ? (
                              <img
                                src={`https://ai-pet-video-bucket.s3.amazonaws.com/${request.photos[0]}`}
                                alt="Request thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23555" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23fff" font-size="60"%3E🐾%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">
                                🐾
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-white truncate">
                                {t('frontend:dashboard.request_id')} #
                                {request.id.slice(0, 8)}
                              </h3>
                              <p className="text-white/70 text-sm">
                                {formatDate(request.created_at)}
                              </p>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>

                          {request.script && (
                            <p className="text-white/70 text-sm mb-2 line-clamp-2">
                              {request.script}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <span>
                              📸 {request.photos?.length || 0}{' '}
                              {t(
                                `common:photos.count_${
                                  request.photos?.length === 1 ? 'one' : 'other'
                                }`
                              )}
                            </span>
                            <span>
                              💰 $
                              {request.amount
                                ? parseFloat(request.amount).toFixed(2)
                                : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {request.status === REQUEST_STATUS.COMPLETED &&
                        request.video_url && (
                          <div className="border-t border-white/10 pt-4 mt-2 flex justify-end">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(request.video_url, '_blank');
                              }}
                              className="w-auto"
                            >
                              <span className="mr-2"></span>
                              {t('videos:download')}
                            </Button>
                          </div>
                        )}
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardPage;
