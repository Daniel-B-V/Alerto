import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Cloud, Bell, Shield, X } from 'lucide-react';
import { validateLoginForm, getAuthErrorMessage } from './LoginUtils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { LoginAlert } from './LoginAlert';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const { login, loginWithGoogle } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    const validationError = validateLoginForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check privacy consent
    if (!privacyConsent) {
      setError('Please accept the Privacy Policy and Terms of Service to continue');
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        setSuccess('Login successful! Redirecting...');
      } else {
        setError(result.error || 'Login failed. Please try again');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(getAuthErrorMessage(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');

    // Check privacy consent
    if (!privacyConsent) {
      setError('Please accept the Privacy Policy and Terms of Service to continue');
      return;
    }

    setLoading(true);

    try {
      const result = await loginWithGoogle();
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
      } else {
        setError(result.error || 'Google sign-in failed');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(getAuthErrorMessage(err.code) || 'Google sign-in failed. Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white p-6">

      {/* Login Card Container */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] px-12 py-12">

        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <img
            src="/assets/logo.png"
            alt="Alerto Logo"
            className="h-16 object-contain"
          />
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">Welcome back</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">Welcome back! Please enter your details.</p>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6">
            <LoginAlert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-6">
            <LoginAlert type="success" message={success} />
          </div>
        )}

        {/* Login Form - Centered Container */}
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-900 leading-normal">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-900 leading-normal">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Privacy Consent Checkbox */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="privacyConsent"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer flex-shrink-0"
                />
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <label htmlFor="privacyConsent" className="flex-1 text-sm text-gray-700 cursor-pointer">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Terms of Service
                  </button>
                </label>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Forgot password
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-black border border-gray-300 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 leading-relaxed">
              Don't have an account?{' '}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/signup' } }))}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-0 cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowPrivacyPolicy(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Sticky */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Privacy Policy & Terms</h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 110px)' }}>
              <div className="space-y-4 text-sm text-gray-700">
                {/* Privacy Policy Section */}
                <section>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Privacy Policy</h3>
                  <div className="space-y-2">
                    <p>
                      <strong>Last Updated:</strong> January 2025
                    </p>
                    <p>
                      Alerto is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our disaster reporting and weather monitoring platform.
                    </p>

                    <h4 className="font-semibold text-gray-900 mt-3">Information We Collect</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                      <li>Account information (email, name, profile photo)</li>
                      <li>Location data for disaster reporting and weather alerts</li>
                      <li>Disaster reports and uploaded media (photos, videos)</li>
                      <li>Device information and usage analytics</li>
                      <li>Communication preferences and notification settings</li>
                    </ul>

                    <h4 className="font-semibold text-gray-900 mt-3">How We Use Your Information</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                      <li>Provide real-time disaster alerts and weather monitoring</li>
                      <li>Enable community reporting and emergency response coordination</li>
                      <li>Improve our services and develop new features</li>
                      <li>Send important notifications and safety alerts</li>
                      <li>Comply with legal obligations and protect user safety</li>
                    </ul>

                    <h4 className="font-semibold text-gray-900 mt-3">Data Security</h4>
                    <p className="text-xs">
                      We implement industry-standard security measures to protect your data, including encryption, secure authentication, and regular security audits. Your disaster reports may be shared with authorized emergency responders.
                    </p>

                    <h4 className="font-semibold text-gray-900 mt-3">Your Rights</h4>
                    <p className="text-xs">
                      You have the right to access, modify, or delete your personal data at any time. You can also control your notification preferences and location sharing settings in your account.
                    </p>
                  </div>
                </section>

                {/* Terms of Service Section */}
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Terms of Service</h3>
                  <div className="space-y-2">
                    <p>
                      By using Alerto, you agree to the following terms and conditions:
                    </p>

                    <h4 className="font-semibold text-gray-900 mt-3">Acceptable Use</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
                      <li>You must provide accurate and truthful disaster reports</li>
                      <li>Do not submit false, misleading, or malicious reports</li>
                      <li>Respect the privacy and safety of other community members</li>
                      <li>Use the platform responsibly during emergency situations</li>
                      <li>Do not spam, harass, or abuse other users</li>
                    </ul>

                    <h4 className="font-semibold text-gray-900 mt-3">Content Responsibility</h4>
                    <p className="text-xs">
                      Users are responsible for the content they submit. Alerto reserves the right to remove reports that violate our community guidelines or contain inappropriate content.
                    </p>

                    <h4 className="font-semibold text-gray-900 mt-3">Disclaimer</h4>
                    <p className="text-xs">
                      Alerto provides information for general awareness and community coordination. For official emergency instructions, always follow guidance from local authorities (PAGASA, NDRRMC, local government units). We are not liable for decisions made based on information from our platform.
                    </p>

                    <h4 className="font-semibold text-gray-900 mt-3">Service Availability</h4>
                    <p className="text-xs">
                      While we strive for 24/7 availability, we cannot guarantee uninterrupted service. The platform may be temporarily unavailable for maintenance or due to technical issues.
                    </p>

                    <h4 className="font-semibold text-gray-900 mt-3">Contact Us</h4>
                    <p className="text-xs">
                      For questions about this Privacy Policy or Terms of Service, please contact us at:{' '}
                      <a href="mailto:support@alerto.com" className="text-blue-600 hover:underline font-semibold">
                        support@alerto.com
                      </a>
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { Login };
export default Login;
