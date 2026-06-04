import { motion } from 'framer-motion';

const StatusToggle = ({
  isActive,
  onToggle,
  disabled = false,
  size = 'md',
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}) => {
  const sizeConfig = {
    sm: { width: 'w-8', height: 'h-4', dot: 'w-3 h-3', translate: 'translate-x-4', text: 'text-xs' },
    md: { width: 'w-11', height: 'h-6', dot: 'w-4 h-4', translate: 'translate-x-5', text: 'text-sm' },
    lg: { width: 'w-14', height: 'h-7', dot: 'w-5 h-5', translate: 'translate-x-7', text: 'text-base' },
  };

  const config = sizeConfig[size];

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} group`}
    >
      <div
        className={`relative ${config.width} ${config.height} rounded-full transition-colors duration-200 ${
          isActive
            ? 'bg-secondary group-hover:bg-emerald-600'
            : 'bg-gray-300 dark:bg-dark-hover group-hover:bg-gray-400 dark:group-hover:bg-gray-500'
        }`}
      >
        <motion.div
          className={`absolute top-0.5 left-0.5 ${config.dot} rounded-full bg-white shadow-sm`}
          animate={{ x: isActive ? config.translate : 'translate-x-0' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      <span className={`${config.text} font-medium ${
        isActive ? 'text-secondary dark:text-secondary' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {isActive ? activeLabel : inactiveLabel}
      </span>
    </button>
  );
};

export default StatusToggle;