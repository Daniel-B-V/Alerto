import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Label } from './ui/label';
import { Input } from './ui/input';

const PasswordInput = ({
  label = "Password",
  name = "password",
  value,
  onChange,
  placeholder = "••••••••",
  disabled = false,
  error = null,
  showToggle = true
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      )}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          id={name}
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-300 focus:ring-red-500' : ''
          }`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};

export { PasswordInput };
export default PasswordInput;
