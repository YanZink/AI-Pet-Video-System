import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Loader from '../components/common/Loader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PhotoGallery from '../components/forms/PhotoGallery';
import styles from './RequestDetailPage.module.css';
import { REQUEST_STATUS } from '../utils/constants';

const RequestDetailPage = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

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

  const handleRetryPayment = async () => {
    if (!request) return;

    setProcessingPayment(true);
    try {
      const checkoutResponse = await apiService.createStripeCheckout(
        request.id
      );
      window.location.href = checkoutResponse.checkout_url;
    } catch (err) {
      setError(err.response?.data?.message || t('errors:payment_failed'));
      setProcessingPayment(false);
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
        <div className="container mx-auto px-4 pt-12 pb-12">
          <Loader />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 page-with-header">
        <Header />
        <div className="container mx-auto px-4 pt-12 pb-12">
          <Card>
            <div className="text-center py-12">
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

      <div className="container mx-auto px-4 pt-12 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="secondary"
              size="medium"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <div className={styles.backIcon}></div>
              {t('frontend:common.back')}
            </Button>
            <h1 className="text-3xl font-bold text-white">
              {t('frontend:dashboard.view_details')}
            </h1>
          </div>

          {request.status === REQUEST_STATUS.CREATED && (
            <Card className="mb-6 border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={styles.warningIcon}></div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-200">
                      {t('frontend:request_detail.payment_required')}
                    </h3>
                    <p className="text-yellow-100/70 text-sm">
                      {t('frontend:request_detail.payment_required_desc')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleRetryPayment}
                  loading={processingPayment}
                  disabled={processingPayment}
                >
                  {t('frontend:request_detail.retry_payment')}
                </Button>
              </div>
            </Card>
          )}

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
                  <p className="text-white/70 text-sm mb-1">
                    {t('frontend:request_detail.completed_label')}
                  </p>
                  <p className="text-white">
                    {formatDate(request.completed_at)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {t('frontend:request_detail.photos_title')} (
              {request.photos?.length || 0})
            </h3>
            <PhotoGallery photos={request.photos} />
          </Card>

          {request.script && (
            <Card className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:request_detail.script_title')}
              </h3>
              <p className="text-white/80 whitespace-pre-wrap">
                {request.script}
              </p>
            </Card>
          )}

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
                  ${parseFloat(request.amount || 0).toFixed(2)}
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

          {request.status === REQUEST_STATUS.COMPLETED && request.video_url && (
            <Card>
              <div className="text-center py-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t('frontend:request_detail.completed_title')}
                </h3>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => window.open(request.video_url, '_blank')}
                >
                  <div className={styles.downloadIcon}></div>
                  {t('videos:download')}
                </Button>
              </div>
            </Card>
          )}

          {request.status === REQUEST_STATUS.IN_PROGRESS && (
            <Card>
              <div className="text-center py-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t('frontend:request_detail.processing_title')}
                </h3>
                <p className="text-white/70 mb-4">
                  {t('videos:status_in_progress')}
                </p>
                <Button variant="secondary" onClick={loadRequest}>
                  <div className={styles.refreshIcon}></div>
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
