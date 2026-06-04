import { isValidElement } from 'react'
import { motion } from 'framer-motion';

const colorConfig = {
  primary: { bg: 'bg-primary/10 dark:bg-primary/20', color: 'text-primary dark:text-primary-light' },
  success: { bg: 'bg-secondary/10 dark:bg-secondary/20', color: 'text-secondary' },
  danger: { bg: 'bg-danger/10 dark:bg-danger/20', color: 'text-danger' },
  warning: { bg: 'bg-warning/10 dark:bg-warning/20', color: 'text-warning' },
  info: { bg: 'bg-info/10 dark:bg-info/20', color: 'text-info' },
};

const StatCard = ({
  title,
  value,
  change,
  changeType = 'increase',
  icon: IconProp,
  iconBgColor,
  iconColor,
  color,
  delay = 0,
  isDate = false,
}) => {
  const changeColorClasses = {
    increase: 'text-secondary dark:text-secondary',
    decrease: 'text-danger dark:text-danger',
    neutral: 'text-gray-500 dark:text-gray-400',
  };

  const changeArrow = {
    increase: '↑',
    decrease: '↓',
    neutral: '→',
  };

  // Determine icon background and color from color prop or explicit props
  const resolvedBg = iconBgColor || (color && colorConfig[color]?.bg) || 'bg-primary/10 dark:bg-primary/20';
  const resolvedColor = iconColor || (color && colorConfig[color]?.color) || 'text-primary dark:text-primary-light';

  // Render icon: support both component references and pre-rendered JSX
  const renderIcon = () => {
    if (!IconProp) return null;
    if (isValidElement(IconProp)) return IconProp;
    // Component reference (Lucide forwardRef, function component, etc.)
    return <IconProp className={`w-5 h-5 ${resolvedColor}`} />;
  };

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${resolvedBg}`}>
          {renderIcon()}
        </div>
      </div>
      <div className={`text-2xl font-bold text-gray-900 dark:text-white mb-1 ${isDate ? 'text-lg' : ''}`}>
        {value}
      </div>
      {change && (
        <div className={`text-sm font-medium ${changeColorClasses[changeType]}`}>
          {changeArrow[changeType]} {change}
          <span className="text-gray-400 dark:text-gray-500 ml-1">vs last month</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;