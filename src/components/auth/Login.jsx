import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateLoginForm, getAuthErrorMessage } from './LoginUtils';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
    if (!agreedToTerms) {
      setError('Please agree to the Privacy Policy and Terms of Service');
      return;
    }

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#eff6ff',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '48px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <img
              src="/assets/logo.png"
              alt="Alerto Logo"
              style={{ height: '48px', objectFit: 'contain' }}
            />
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1a202c',
              marginBottom: '8px'
            }}>
              Welcome back
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#718096'
            }}>
              Please enter your details to sign in
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div style={{
              backgroundColor: '#fed7d7',
              border: '1px solid #fc8181',
              color: '#c53030',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              backgroundColor: '#c6f6d5',
              border: '1px solid #68d391',
              color: '#2f855a',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'text'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'text'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{ marginTop: '8px', textAlign: 'left' }}>
                <a href="/forgot-password" style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#3b82f6',
                  textDecoration: 'none'
                }}>
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              style={{
                width: '100%',
                backgroundColor: (loading || !agreedToTerms) ? '#93c5fd' : '#3b82f6',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px',
                padding: '14px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: (loading || !agreedToTerms) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '8px',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                if (!loading && agreedToTerms) e.target.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                if (!loading && agreedToTerms) e.target.style.backgroundColor = '#3b82f6';
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Privacy Consent Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginTop: '16px'
            }}>
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
                style={{
                  width: '16px',
                  height: '16px',
                  marginTop: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  accentColor: '#3b82f6',
                  flexShrink: 0
                }}
              />
              <label
                htmlFor="terms-checkbox"
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                By signing in, I agree to the data collection practices and consent to the processing of my information in accordance with the{' '}
                <a
                  href="/privacy-policy"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                >
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a
                  href="/terms-of-service"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
                >
                  Terms of Service
                </a>
                .
              </label>
            </div>
          </form>

          {/* Divider */}
          <div style={{
            position: 'relative',
            margin: '24px 0'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '100%',
                borderTop: '1px solid #d1d5db'
              }}></div>
            </div>
            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              <span style={{
                padding: '0 8px',
                background: 'white',
                color: '#6b7280'
              }}>
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || !agreedToTerms}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              color: '#374151',
              fontWeight: '500',
              fontSize: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: (loading || !agreedToTerms) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: (loading || !agreedToTerms) ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && agreedToTerms) e.target.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              if (!loading && agreedToTerms) e.target.style.backgroundColor = 'white';
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          {/* Sign Up Link */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#6b7280',
            marginTop: '24px'
          }}>
            Don't have an account?{' '}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { path: '/signup' } }))}
              style={{
                fontWeight: '600',
                color: '#3b82f6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Sign up for free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export { Login };
export default Login;
