import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import apiService from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Loader from '../../components/common/Loader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import PhotoGallery from '../../components/forms/PhotoGallery';
import { REQUEST_STATUS } from '../../utils/constants';
import styles from './AdminRequestDetail.module.css';

const AdminRequestDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadRequest();
  }, [isAdmin, navigate, id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllRequests();
      const foundRequest = response.requests.find((r) => r.id === id);

      if (!foundRequest) {
        navigate('/admin/requests');
        return;
      }

      setRequest(foundRequest);
      setNewStatus(foundRequest.status);
      setVideoUrl(foundRequest.video_url || '');
      setAdminNotes(foundRequest.admin_notes || '');
    } catch (error) {
      console.error('Failed to load request:', error);
      navigate('/admin/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const updateData = {
        status: newStatus,
        admin_notes: adminNotes || undefined,
      };

      if (newStatus === REQUEST_STATUS.COMPLETED && videoUrl) {
        updateData.video_url = videoUrl;
      }

      await apiService.updateRequestStatus(id, updateData);
      setShowStatusModal(false);
      await loadRequest();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(t('errors:something_wrong'));
    } finally {
      setUpdating(false);
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

  const getStatusDisplayName = (status) => {
    const statusNames = {
      [REQUEST_STATUS.CREATED]: t('frontend:admin.admin_filter_created'),
      [REQUEST_STATUS.PAID]: t('frontend:admin.admin_filter_paid'),
      [REQUEST_STATUS.IN_PROGRESS]: t(
        'frontend:admin.admin_filter_in_progress'
      ),
      [REQUEST_STATUS.COMPLETED]: t('frontend:admin.admin_filter_completed'),
      [REQUEST_STATUS.CANCELLED]: t('videos:status_cancelled'),
    };
    return statusNames[status] || status;
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

  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex admin-page">
      <AdminSidebar />

      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <Button
            variant="secondary"
            size="medium"
            onClick={() => navigate('/admin/requests')}
            className="mb-4"
          >
            <div className={styles.backIcon}></div>
            {t('frontend:common.back')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {t('frontend:admin.admin_request_detail_title', {
                  id: request.id.slice(0, 8),
                })}
              </h1>
              <p className="text-white/70">
                {t('frontend:admin.admin_request_detail_by', {
                  name: request.user?.first_name || request.user?.username,
                })}
              </p>
            </div>
            <Button onClick={() => setShowStatusModal(true)}>
              {t('frontend:admin.admin_request_detail_update_status')}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:dashboard.status')}
              </h3>
              {getStatusBadge(request.status)}
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:request_detail.photos_title')} (
                {request.photos?.length || 0})
              </h3>
              <PhotoGallery photos={request.photos} />
            </div>

            {request.script && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {t('frontend:request_detail.script_title')}
                </h3>
                <p className="text-white/80 whitespace-pre-wrap">
                  {request.script}
                </p>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:admin.admin_notes_title')}
              </h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={4}
                placeholder={t('frontend:admin.admin_notes_placeholder')}
              />
              <Button
                size="medium"
                className="mt-3 min-w-[120px]"
                onClick={handleUpdateStatus}
                loading={updating}
              >
                {t('frontend:common.save')}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:admin.admin_user_info_title')}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white/60">
                    {t('frontend:admin.admin_user_info_name')}
                  </p>
                  <p className="text-white">
                    {request.user?.first_name} {request.user?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">
                    {t('frontend:admin.admin_user_info_email')}
                  </p>
                  <p className="text-white">{request.user?.email}</p>
                </div>
                {request.user?.telegram_id && (
                  <div>
                    <p className="text-white/60">
                      {t('frontend:admin.admin_user_info_telegram')}
                    </p>
                    <p className="text-white font-mono">
                      {request.user.telegram_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:admin.admin_payment_title')}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white/60">
                    {t('frontend:request_detail.amount_label')}
                  </p>
                  <p className="text-white text-2xl font-bold">
                    ${parseFloat(request.amount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">
                    {t('frontend:request_detail.payment_status_label')}
                  </p>
                  <p className="text-white capitalize">
                    {request.payment_status}
                  </p>
                </div>
                {request.payment_id && (
                  <div>
                    <p className="text-white/60">
                      {t('frontend:admin.admin_payment_id')}
                    </p>
                    <p className="text-white font-mono text-xs break-all">
                      {request.payment_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                {t('frontend:admin.admin_timeline_title')}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white/60">
                    {t('frontend:dashboard.created_at')}
                  </p>
                  <p className="text-white">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                {request.processing_started_at && (
                  <div>
                    <p className="text-white/60">
                      {t('frontend:admin.admin_timeline_processing_started')}
                    </p>
                    <p className="text-white">
                      {new Date(request.processing_started_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {request.completed_at && (
                  <div>
                    <p className="text-white/60">
                      {t('frontend:admin.admin_timeline_completed')}
                    </p>
                    <p className="text-white">
                      {new Date(request.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title={t('frontend:admin.admin_modal_update_title')}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowStatusModal(false)}
              >
                {t('frontend:common.cancel')}
              </Button>
              <Button onClick={handleUpdateStatus} loading={updating}>
                {t('frontend:admin.admin_request_detail_update_status')}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-medium">
                {t('frontend:dashboard.status')}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {Object.values(REQUEST_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {getStatusDisplayName(status)}
                  </option>
                ))}
              </select>
            </div>

            {newStatus === REQUEST_STATUS.COMPLETED && (
              <Input
                label={t('frontend:admin.admin_modal_video_url')}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            )}

            <div>
              <label className="block text-white mb-2 font-medium">
                {t('frontend:admin.admin_modal_notes_label')}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={4}
                placeholder={t('frontend:admin.admin_modal_notes_placeholder')}
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminRequestDetail;
