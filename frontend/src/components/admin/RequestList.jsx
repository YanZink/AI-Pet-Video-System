import React from 'react';
import { useNavigate } from 'react-router-dom';
import { REQUEST_STATUS } from '../../utils/constants';

const RequestList = ({ requests, onStatusUpdate }) => {
  const navigate = useNavigate();

  const getStatusDisplay = (status) => {
    const statusMap = {
      [REQUEST_STATUS.CREATED]: {
        text: 'Created',
        class: 'badge-created',
      },
      [REQUEST_STATUS.PAID]: {
        text: 'Paid',
        class: 'badge-paid',
      },
      [REQUEST_STATUS.IN_PROGRESS]: {
        text: 'In Progress',
        class: 'badge-in-progress',
      },
      [REQUEST_STATUS.COMPLETED]: {
        text: 'Completed',
        class: 'badge-completed',
      },
      [REQUEST_STATUS.CANCELLED]: {
        text: 'Cancelled',
        class: 'badge-cancelled',
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
    <div className="space-y-4">
      {requests.map((request) => {
        const statusDisplay = getStatusDisplay(request.status);
        return (
          <div
            key={request.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => navigate(`/admin/requests/${request.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-white font-semibold">
                    Request #{request.id.slice(0, 8)}
                  </h3>
                  <span className={`badge ${statusDisplay.class}`}>
                    {statusDisplay.text}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-white/60">User</p>
                    <p className="text-white">
                      {request.user?.first_name ||
                        request.user?.username ||
                        'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Created</p>
                    <p className="text-white">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60">Photos</p>
                    <p className="text-white">{request.photos?.length || 0}</p>
                  </div>
                </div>

                {request.script && (
                  <div className="mt-2">
                    <p className="text-white/60 text-sm">Script</p>
                    <p className="text-white/80 text-sm truncate">
                      {request.script}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 ml-4">
                <button className="text-white/70 hover:text-white transition-colors">
                  <svg
                    className="w-5 h-5"
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
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestList;
