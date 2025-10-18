import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const LoginPage = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowVerificationMessage(false);

    const result = isLogin
      ? await login({ email: formData.email, password: formData.password })
      : await register(formData);

    if (result.success) {
      // Check if email verification is required
      if (result.requiresEmailVerification) {
        setShowVerificationMessage(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || t('frontend:errors.login_failed'));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center p-4 page-with-header">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl">🐾</span>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin
              ? t('frontend:login.title')
              : t('frontend:login.create_account')}
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showVerificationMessage && (
          <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">
              {t('frontend:verify_email.registration_success')}
            </p>
            <p className="text-sm mt-1">
              {t('frontend:verify_email.check_email')}
            </p>
            <button
              onClick={() => setShowVerificationMessage(false)}
              className="text-blue-300 hover:text-blue-200 text-sm mt-2"
            >
              {t('frontend:common.close')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-white mb-2">
                  {t('frontend:login.first_name')}
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder={t('frontend:login.first_name_placeholder')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-white mb-2">
                  {t('frontend:login.last_name')}
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder={t('frontend:login.last_name_placeholder')}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-white mb-2">
              {t('frontend:login.email_label')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('frontend:login.email_placeholder')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">
              {t('frontend:login.password_label')}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('frontend:login.password_placeholder')}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {isLogin
              ? t('frontend:nav.login')
              : t('frontend:login.create_account')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-pink-400 hover:text-pink-300 transition-colors"
          >
            {isLogin
              ? t('frontend:login.no_account')
              : t('frontend:login.have_account')}
          </button>
        </div>

        <div className="mt-6">
          <Link
            to="/"
            className="block text-center text-white/70 hover:text-white transition-colors"
          >
            ← {t('frontend:common.back')}
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
