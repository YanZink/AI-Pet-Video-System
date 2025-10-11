import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { REQUEST_STATUS } from '../../utils/constants';
import styles from './RequestList.module.css';

const RequestList = ({ requests, onStatusUpdate }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getStatusDisplay = (status) => {
    const statusMap = {
      [REQUEST_STATUS.CREATED]: {
        text: t('videos:status_created'),
        class: styles.badgeCreated,
      },
      [REQUEST_STATUS.PAID]: {
        text: t('videos:status_paid'),
        class: styles.badgePaid,
      },
      [REQUEST_STATUS.IN_PROGRESS]: {
        text: t('videos:status_in_progress'),
        class: styles.badgeInProgress,
      },
      [REQUEST_STATUS.COMPLETED]: {
        text: t('videos:status_completed'),
        class: styles.badgeCompleted,
      },
      [REQUEST_STATUS.CANCELLED]: {
        text: t('videos:status_cancelled'),
        class: styles.badgeCancelled,
      },
    };
    return statusMap[status] || statusMap[REQUEST_STATUS.CREATED];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      {requests.map((request) => {
        const statusDisplay = getStatusDisplay(request.status);
        return (
          <div
            key={request.id}
            className={styles.requestItem}
            onClick={() => navigate(`/admin/requests/${request.id}`)}
          >
            <div className={styles.content}>
              <div className={styles.info}>
                <div className={styles.header}>
                  <h3 className={styles.requestId}>
                    {t('frontend:admin.admin_request_detail_title', {
                      id: request.id.slice(0, 8),
                    })}
                  </h3>
                  <span className={`${styles.badge} ${statusDisplay.class}`}>
                    {statusDisplay.text}
                  </span>
                </div>

                <div className={styles.details}>
                  <div className={styles.detail}>
                    <p className={styles.detailLabel}>
                      {t('frontend:admin.admin_request_user')}
                    </p>
                    <p className={styles.detailValue}>
                      {request.user?.first_name ||
                        request.user?.username ||
                        t('frontend:admin.admin_request_unknown_user')}
                    </p>
                  </div>
                  <div className={styles.detail}>
                    <p className={styles.detailLabel}>
                      {t('frontend:admin.admin_request_created')}
                    </p>
                    <p className={styles.detailValue}>
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                  <div className={styles.detail}>
                    <p className={styles.detailLabel}>
                      {t('frontend:admin.admin_request_photos')}
                    </p>
                    <p className={styles.detailValue}>
                      {request.photos?.length || 0}
                    </p>
                  </div>
                </div>

                {request.script && (
                  <div className={styles.script}>
                    <p className={styles.scriptLabel}>
                      {t('frontend:admin.admin_request_script')}
                    </p>
                    <p className={styles.scriptText}>{request.script}</p>
                  </div>
                )}
              </div>

              <div className={styles.arrow}>
                <div className={styles.arrowIcon}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestList;
