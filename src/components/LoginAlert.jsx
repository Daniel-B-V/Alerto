import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const LoginAlert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const variants = {
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      Icon: AlertCircle
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      Icon: CheckCircle2
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      Icon: AlertTriangle
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      Icon: Info
    }
  };

  const variant = variants[type] || variants.info;
  const { bgColor, borderColor, textColor, iconColor, Icon } = variant;

  return (
    <div
      className={`p-4 ${bgColor} border ${borderColor} rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-200`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1">
        <p className={`text-sm ${textColor}`}>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`${iconColor} hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded p-0.5`}
          aria-label="Close alert"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export { LoginAlert };
export default LoginAlert;
