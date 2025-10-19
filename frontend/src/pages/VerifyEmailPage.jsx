import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const VerifyEmailPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification, loading } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying, success, error, resend
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      handleVerification(token);
    } else {
      setStatus('resend');
    }
  }, [searchParams]);

  const handleVerification = async (token) => {
    try {
      const result = await verifyEmail(token);

      if (result.success) {
        setStatus('success');
        setMessage(result.message);

        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Verification failed');
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage(t('frontend:errors.email_required'));
      return;
    }

    const result = await resendVerification(email);

    if (result.success) {
      setStatus('success');
      setMessage(result.message);
    } else {
      setStatus('error');
      setMessage(result.error);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">
              {t('frontend:verify_email.verifying')}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {t('frontend:verify_email.success_title')}
            </h3>
            <p className="text-white/80 mb-6">{message}</p>
            <p className="text-white/60 text-sm">
              {t('frontend:verify_email.redirecting')}
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {t('frontend:verify_email.error_title')}
            </h3>
            <p className="text-white/80 mb-6">{message}</p>

            <div className="space-y-4">
              <Button onClick={() => setStatus('resend')} className="w-full">
                {t('frontend:verify_email.resend_button')}
              </Button>
              <Link
                to="/login"
                className="block text-center text-pink-400 hover:text-pink-300 transition-colors"
              >
                {t('frontend:verify_email.back_to_login')}
              </Link>
            </div>
          </div>
        );

      case 'resend':
        return (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t('frontend:verify_email.resend_title')}
            </h3>
            <p className="text-white/80 mb-6">
              {t('frontend:verify_email.resend_description')}
            </p>

            <form onSubmit={handleResendVerification} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('frontend:login.email_placeholder')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                {t('frontend:verify_email.resend_button')}
              </Button>
            </form>

            <div className="mt-6">
              <Link
                to="/login"
                className="text-pink-400 hover:text-pink-300 transition-colors"
              >
                {t('frontend:verify_email.back_to_login')}
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center"></div>
          </Link>
        </div>

        {message && status === 'error' && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {renderContent()}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
