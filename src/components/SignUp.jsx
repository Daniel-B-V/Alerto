import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Cloud, Bell } from 'lucide-react';
import { validateSignUpForm, getAuthErrorMessage } from './LoginUtils';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { LoginAlert } from './LoginAlert';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate form
    const validationError = validateSignUpForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        setSuccess('Account created successfully! Redirecting...');
      } else {
        setError(result.error || 'Sign up failed. Please try again');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError(getAuthErrorMessage(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await loginWithGoogle();
      if (result.success) {
        setSuccess('Sign up successful! Redirecting...');
      } else {
        setError(result.error || 'Google sign-up failed');
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError(getAuthErrorMessage(err.code) || 'Google sign-up failed. Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white p-6">

      {/* SignUp Card */}
      <div className="w-full max-w-md">

        {/* Logo/Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <Cloud className="w-10 h-10 text-blue-500" />
            <Bell className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">ALERTO</h1>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">Create an account</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">Start monitoring weather alerts in Batangas.</p>

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

        {/* SignUp Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-900 leading-normal">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="name"
            />
          </div>

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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="new-password"
            />
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900 leading-normal">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="new-password"
            />
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-black border border-gray-300 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Creating account...' : 'Get started'}
          </button>
        </form>

        {/* Google Sign-up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 leading-relaxed">
            Already have an account?{' '}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/login' } }))}
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline bg-transparent border-0 cursor-pointer"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export { SignUp };
export default SignUp;
