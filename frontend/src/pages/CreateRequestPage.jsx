import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import apiService from '../services/api';
import Header from '../components/common/Header';
import PhotoUploader from '../components/forms/PhotoUploader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const CreateRequestPage = () => {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (photos.length === 0) {
      setError(t('errors:no_photos'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create request
      const response = await apiService.createRequest({
        photos,
        script: script.trim() || null,
      });

      // Step 2: Handle payment based on selected method
      if (paymentMethod === 'stripe') {
        // Stripe Checkout flow
        const checkoutResponse = await apiService.createStripeCheckout(
          response.request.id
        );

        // Redirect to Stripe Checkout
        window.location.href = checkoutResponse.checkout_url;
      } else if (paymentMethod === 'telegram') {
        // Telegram Stars flow
        setError('Telegram Stars payment not yet implemented');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('errors:request_failed'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 page-with-header">
      <Header />

      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <h1 className="text-3xl font-bold text-white mb-6">
              {t('frontend:create_request.title')}
            </h1>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-lg font-medium mb-4">
                  {t('frontend:create_request.upload_photos')}
                </label>
                <PhotoUploader onPhotosUploaded={setPhotos} maxPhotos={10} />
              </div>

              <div>
                <label className="block text-white text-lg font-medium mb-2">
                  {t('frontend:create_request.script_label')}
                </label>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={t('frontend:create_request.script_placeholder')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-white/50 text-sm mt-2">
                  {script.length}/1000{' '}
                  {t('frontend:create_request.characters_count')
                    .replace('{count}', script.length)
                    .replace(`${script.length}/1000 `, '')}
                </p>
                <p className="text-white/60 text-sm mt-1">
                  {t('frontend:create_request.script_hint')}
                </p>
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-white text-lg font-medium mb-4">
                  {t('frontend:create_request.payment_method')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setPaymentMethod('stripe')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"></div>
                      <div>
                        <div className="text-white font-medium">
                          {t('frontend:create_request.credit_card')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex justify-between text-white mb-2">
                  <span>{t('frontend:create_request.price_label')}</span>
                  <span className="font-bold">
                    {t('frontend:create_request.price_value')}
                  </span>
                </div>
                <div className="flex justify-between text-white/70 text-sm">
                  <span>
                    {t('frontend:create_request.processing_time_label')}
                  </span>
                  <span>
                    {t('frontend:create_request.processing_time_value')}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  {t('frontend:common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={loading}
                  disabled={loading || photos.length === 0}
                >
                  {paymentMethod === 'stripe'
                    ? t('frontend:create_request.pay_with_stripe')
                    : t('frontend:create_request.submit')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;
