const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    secondary: 'badge-primary',
    outline: 'bg-transparent border border-light-border dark:border-dark-border text-gray-600 dark:text-gray-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotColorClasses = {
    default: 'bg-gray-500',
    success: 'bg-secondary',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
    secondary: 'bg-primary',
    outline: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColorClasses[variant]}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;