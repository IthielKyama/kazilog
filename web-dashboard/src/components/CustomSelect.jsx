import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export function CustomSelect({
  inputId,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(current => !current);
    }
  };

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={inputId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg flex items-center justify-between text-left bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className={`absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 ${menuClassName}`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors text-left"
            >
              <span className={value === option.value ? 'font-medium text-brand' : 'text-slate-700'}>
                {option.label}
              </span>
              {value === option.value ? <Check size={16} className="text-brand" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StyledDateInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      type="date"
      className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all ${className}`}
    />
  );
}
