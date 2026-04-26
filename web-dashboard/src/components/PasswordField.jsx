import { useId, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

export default function PasswordField({
  label,
  value,
  onChange,
  name,
  minLength,
  required = false,
  autoComplete,
  className = '',
  showLabel = true,
}) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {showLabel ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <div className="mt-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <KeyRound size={16} />
        </div>
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`appearance-none block w-full pl-10 pr-12 px-4 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand sm:text-sm transition-all ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible(current => !current)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 focus:outline-none focus:text-slate-700"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
