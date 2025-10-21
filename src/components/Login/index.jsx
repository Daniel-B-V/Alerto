import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, CloudRain, Bell, Users, Shield } from 'lucide-react';
import { validateForm, getAuthErrorMessage } from './utils';
import FormInput from './FormInput';
import AlertMessage from './AlertMessage';
import FeatureCard from './FeatureCard';

const FEATURES = [
  {
    icon: Bell,
    title: 'Real-time Alerts',
    description: 'Get instant notifications about weather conditions and potential class suspensions',
    colorClass: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Users,
    title: 'Community Reports',
    description: 'Share and view disaster reports from your local community',
    colorClass: 'bg-indigo-100 text-indigo-600'
  },
  {
    icon: Shield,
    title: 'AI Predictions',
    description: 'Smart class suspension predictions based on weather data analysis',
    colorClass: 'bg-purple-100 text-purple-600'
  }
];

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();

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

    const validationError = validateForm(formData, isSignUp, agreeToTerms);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const authAction = isSignUp
        ? () => register({
            email: formData.email,
            password: formData.password,
            displayName: `${formData.firstName} ${formData.lastName}`
          })
        : () => login({
            email: formData.email,
            password: formData.password
          });

      const result = await authAction();

      if (result.success) {
        setSuccess(`${isSignUp ? 'Account created' : 'Login'} successful! Redirecting...`);
      } else {
        setError(result.error || `${isSignUp ? 'Registration' : 'Login'} failed`);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(getAuthErrorMessage(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
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
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setFormData({ firstName: '', lastName: '', email: '', password: '' });
    setAgreeToTerms(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Section - Branding */}
        <div className="hidden lg:block space-y-8 px-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CloudRain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Alerto</h1>
                <p className="text-sm text-gray-600">Weather Alert & Disaster Reporting</p>
              </div>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              Stay informed with real-time weather monitoring and community-driven disaster reporting for Batangas Province.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>

        {/* Right Section - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 p-8 border border-gray-100">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <CloudRain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Alerto</h1>
            </div>

            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {isSignUp ? 'Sign up to get started with Alerto' : 'Sign in to access your dashboard'}
              </p>
            </div>

            <AlertMessage type="error" message={error} />
            <AlertMessage type="success" message={success} />

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields (Sign Up Only) */}
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="First Name"
                    icon={User}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    disabled={loading}
                  />
                  <FormInput
                    label="Last Name"
                    icon={User}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
              )}

              <FormInput
                label="Email Address"
                icon={Mail}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
              />

              <FormInput
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                showPasswordToggle={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {/* Terms Checkbox (Sign Up Only) */}
              {isSignUp && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                      Terms and Conditions
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Toggle Sign In/Up */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  disabled={loading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Batangas Province Weather Alert System
          </p>
        </div>
      </div>
    </div>
  );
};

export { Login };
export default Login;
