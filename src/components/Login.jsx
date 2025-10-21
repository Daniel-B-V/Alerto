import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CloudRain, Mail } from 'lucide-react';
import { validateLoginForm, getAuthErrorMessage } from './LoginUtils';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { PasswordInput } from './PasswordInput';
import { SocialLoginButton } from './SocialLoginButton';
import { LoginAlert } from './LoginAlert';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-violet-50 to-purple-50 p-6">

      {/* Login Card */}
      <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl px-12 py-14 border border-gray-100">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <CloudRain className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Branding */}
        <h1 className="text-3xl font-bold text-gray-900 mb-1 text-center">Alerto</h1>
        <p className="text-sm text-gray-600 mb-8 text-center">Weather Alert & Disaster Reporting</p>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Login</h2>
        <p className="text-gray-600 mb-8 text-center">Welcome back</p>

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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full pl-11 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                showToggle={true}
                label={null}
              />
            </div>
          </div>

          {/* Show Password Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Label htmlFor="showPassword" className="text-sm text-gray-600 cursor-pointer">
              Show password
            </Label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or login with</span>
          </div>
        </div>

        {/* Google Sign-in */}
        <SocialLoginButton
          provider="google"
          onClick={handleGoogleSignIn}
          disabled={loading}
          loading={loading}
        />

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors focus:outline-none focus:underline"
            >
              Sign up
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Batangas Province Weather Alert System
        </p>
      </div>
    </div>
  );
};

export { Login };
export default Login;
