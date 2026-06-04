import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  className = '',
  placeholder = 'All',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:border-primary/50 dark:hover:border-primary/50 transition-all"
      >
        <span className="font-medium">{label}:</span>
        <span className={selectedOption ? 'text-primary dark:text-primary-light' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg z-20 overflow-hidden">
          <div
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`px-3 py-2 text-sm cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover transition-colors ${
              !value ? 'text-primary dark:text-primary-light font-medium' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover transition-colors ${
                value === opt.value ? 'text-primary dark:text-primary-light font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;