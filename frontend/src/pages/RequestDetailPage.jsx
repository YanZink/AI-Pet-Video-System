import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Loader from '../components/common/Loader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { REQUEST_STATUS } from '../utils/constants';

const RequestDetailPage = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const requests = await apiService.getUserRequests();
      const foundRequest = requests.requests.find((r) => r.id === id);

      if (!foundRequest) {
        setError(t('errors:not_found'));
        return;
      }

      setRequest(foundRequest);
    } catch (err) {
      setError(err.response?.data?.message || t('errors:api_error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      [REQUEST_STATUS.CREATED]: {
        text: t('videos:status_created'),
        class: 'badge-created',
      },
      [REQUEST_STATUS.PAID]: {
        text: t('videos:status_paid'),
        class: 'badge-paid',
      },
      [REQUEST_STATUS.IN_PROGRESS]: {
        text: t('videos:status_in_progress'),
        class: 'badge-in-progress',
      },
      [REQUEST_STATUS.COMPLETED]: {
        text: t('videos:status_completed'),
        class: 'badge-completed',
      },
      [REQUEST_STATUS.CANCELLED]: {
        text: t('videos:status_cancelled'),
        class: 'badge-cancelled',
      },
    };

    const badge = badges[status] || badges[REQUEST_STATUS.CREATED];
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 page-with-header">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-12">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 page-with-header">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-12">
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                {error || t('errors:not_found')}
              </h2>
              <Button onClick={() => navigate('/dashboard')}>
                {t('frontend:common.back')}
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 page-with-header">
      <Header />

      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/dashboard"
              className="text-pink-400 hover:text-pink-300 inline-flex items-center mb-4"
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
              {t('frontend:common.back')}
            </Link>
            <h1 className="text-3xl font-bold text-white">
              {t('frontend:dashboard.view_details')}
            </h1>
          </div>

          {/* Status Card */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm mb-1">
                  {t('frontend:dashboard.status')}
                </p>
                {getStatusBadge(request.status)}
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm mb-1">
                  {t('frontend:dashboard.request_id')}
                </p>
                <p className="text-white font-mono text-sm">{request.id}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-white/70 text-sm mb-1">
                  {t('frontend:dashboard.created_at')}
                </p>
                <p className="text-white">{formatDate(request.created_at)}</p>
              </div>
              {request.completed_at && (
                <div>
                  <p className="text-white/70 text-sm mb-1">Completed</p>
                  <p className="text-white">
                    {formatDate(request.completed_at)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Photos */}
          <Card className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {t('frontend:request_detail.photos_title')} (
              {request.photos?.length || 0})
            </h3>
            {/* ... */}
          </Card>

          {/* Script */}
          {request.script && (
            <Card className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:request_detail.script_title')}
              </h3>
              {/* ... */}
            </Card>
          )}

          {/* Payment Info */}
          <Card className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {t('frontend:request_detail.payment_info_title')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-white/70 text-sm mb-1">
                  {t('frontend:request_detail.amount_label')}
                </p>
                <p className="text-white text-2xl font-bold">
                  {request.currency} $
                  {parseFloat(request.amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">
                  {t('frontend:request_detail.payment_status_label')}
                </p>
                <p className="text-white capitalize">
                  {t(`payments:status.${request.payment_status}`, {
                    defaultValue: request.payment_status,
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Video Download */}
          {request.status === REQUEST_STATUS.COMPLETED && request.video_url && (
            <Card>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t('frontend:request_detail.completed_title')}
                </h3>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => window.open(request.video_url, '_blank')}
                  className="mx-auto"
                >
                  <span className="mr-2"></span>
                  {t('videos:download')}
                </Button>
              </div>
            </Card>
          )}

          {/* Processing Status */}
          {request.status === REQUEST_STATUS.IN_PROGRESS && (
            <Card>
              <div className="text-center py-8">
                <div className="text-6xl mb-4 animate-pulse">⚙️</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t('frontend:request_detail.processing_title')}
                </h3>
                <p className="text-white/70 mb-4">
                  {t('videos:status_in_progress')}
                </p>
                <Button variant="secondary" onClick={loadRequest}>
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {t('frontend:request_detail.refresh_button')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RequestDetailPage;
