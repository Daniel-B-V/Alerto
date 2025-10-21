import { Button } from './ui/button';

const SocialLoginButton = ({
  provider = 'google',
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => {
  const providers = {
    google: {
      name: 'Google',
      icon: 'https://www.svgrepo.com/show/355037/google.svg',
      text: 'Sign in with Google'
    },
    facebook: {
      name: 'Facebook',
      icon: 'https://www.svgrepo.com/show/475647/facebook-color.svg',
      text: 'Sign in with Facebook'
    },
    apple: {
      name: 'Apple',
      icon: 'https://www.svgrepo.com/show/69341/apple.svg',
      text: 'Sign in with Apple'
    }
  };

  const config = providers[provider] || providers.google;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      aria-label={config.text}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <img src={config.icon} alt={`${config.name} logo`} className="w-5 h-5" />
          <span>{config.text}</span>
        </>
      )}
    </button>
  );
};

export { SocialLoginButton };
export default SocialLoginButton;
