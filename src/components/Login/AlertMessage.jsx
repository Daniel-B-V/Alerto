import { AlertCircle, CheckCircle2 } from 'lucide-react';

const AlertMessage = ({ type, message }) => {
  if (!message) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-50' : 'bg-green-50';
  const borderColor = isError ? 'border-red-200' : 'border-green-200';
  const textColor = isError ? 'text-red-800' : 'text-green-800';
  const iconColor = isError ? 'text-red-600' : 'text-green-600';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div className={`mb-6 p-4 ${bgColor} border ${borderColor} rounded-xl flex items-start gap-3`}>
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${textColor}`}>{message}</p>
    </div>
  );
};

export default AlertMessage;
